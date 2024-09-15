import { ChangeEvent, useEffect, useLayoutEffect, useState } from "react";
import { getFiles, useDeleteFile } from "../queries/uploadFile.query";
import useQueue, { MAX_REQUEST_CONNECTIONS } from "./useQueue.hook";
import {
  getChunks,
  useDeleteByFileId,
  useDeleteChunk,
} from "../queries/chunk.query";
import useResume from "./useResume";
import useUploadState from "./useUploadState.hooks";
import useAutoUpload from "./useAutoUpload.hooks";
import useFile from "./useFile.hooks";
import useFileCorrupted from "./useFileCorrupted.hooks";
import useChunk from "./useChunk.hooks";
import { UploadFile } from "../model/uploadFile.model";

type Props = {
  type: string;
};

export default function useUploader({ type }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { isFileCorrupted } = useFileCorrupted();
  const { deleteChunk } = useDeleteChunk();
  const { deleteChunks: deleteChunksByFileId } = useDeleteByFileId();
  const { deleteFile } = useDeleteFile();

  const { isUploading, handleUploadingState } = useUploadState();
  const {
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
  } = useAutoUpload();

  const { dequeue, enqueue, resetQueue } = useQueue();

  const { isFileProcessing, onProcessing, handleFileProcessingState } = useFile(
    { type }
  );
  const { onProcessChunks } = useChunk({ type, enqueue });

  const {
    isResumable,
    isSkipResumable,
    isResumeLoading,
    uploadFiles,
    handleIsResumable,
    handleIsSkipResumable,
    onResumeProcessing,
  } = useResume({
    type,
    isFileProcessing,
    enqueue,
  });

  // resume uploads automatically.
  // this affect took place whenever the user:
  // reload the page, mount the component ...
  useLayoutEffect(() => {
    (async function () {
      const files = await getFiles(type);
      const chunks = await getChunks(type);

      for (const file of files) {
        const isCorrupted = await isFileCorrupted(file);

        if (isCorrupted) {
          await deleteFile(file.file_id);
          await deleteChunksByFileId(file.file_id);
        }
      }

      if (isFileProcessing) return;
      if (!files || !chunks) return;
      if (files.length === 0) return;
      if (chunks.length === 0) return;

      handleIsResumable(true);
    })();
  }, []);

  // reset the state of the uploader automatically.
  // this affect took place whenever :
  // the files table inside the index db is empty.
  useEffect(() => {
    if (uploadFiles?.length === 0) {
      onReset();
    }
  }, [uploadFiles]);

  useEffect(() => {
    if (isFileProcessing) return;

    // auto upload whenever the user load the page.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnPageLoading = true | false
    if (autoUploadOnPageLoading) {
      dequeuePerMaxRequests();
    }
  }, [isFileProcessing, autoUploadOnPageLoading]);

  /**
   *
   * @function onChange
   *
   * @returns undefined
   */
  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFileProcessingState(true);
    const { files } = e.target;

    if (!files) {
      // TODO: trigger a notification error
      return;
    }

    const _files: File[] = [];

    for (const file of files) _files.push(file);
    e.target.files = null;
    e.target.value = "";

    const processedFiles = await onProcessing(_files);

    const current = [];
    for (const processedFile of processedFiles) {
      const { file, chunks } = await processedFile;
      current.push(file);
      await onProcessChunks(file, chunks);
    }

    setFiles(current);
    handleFileProcessingState(false);
  }

  /**
   *
   * @function onResume
   *
   * @returns undefined
   */
  async function onResume() {
    handleIsResumable(false);
    await onResumeProcessing();
    onUpload();
  }

  /**
   *
   * @function onReset
   *
   * @returns undefined
   */
  function onReset() {
    handleIsResumable(false);
    handleUploadingState(false);
    setFiles([]);
    resetQueue();
  }

  /**
   * @function onUpload
   *
   * @description trigger the uploading API manually.
   *
   * @returns undefined
   */
  async function onUpload() {
    if (!isUploading) {
      handleUploadingState(true);
      dequeuePerMaxRequests();
    }
  }

  /**
   * @function dequeuePerMaxRequests
   * @returns undefined
   */
  async function dequeuePerMaxRequests() {
    for (let i = 0; i < MAX_REQUEST_CONNECTIONS; i++) {
      dequeue()
        .then((res) => {
          if (!res) return;

          const { chunk, fnCallName, ...args } = res;

          deleteChunk(chunk.chunk_id);

          if (fnCallName === "finalizeUpload") {
            deleteFile(chunk.file_id);
            setFiles((prevFiles) =>
              prevFiles.filter((file) => file.file_id !== chunk.file_id)
            );
          }

          dequeuePerMaxRequests();

          return Promise.resolve({ ...args, fnCallName });
        })
        .catch((error) => {
          /** TODO: handle error
           *
           * if it fails on level of uploadFile
           * if it fails on level of finalizeUpload
           *
           */
          return Promise.reject(error);
        });
    }
  }

  return {
    onUpload,
    onResume,
    onChange,
    handleIsResumable,
    handleIsSkipResumable,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
    onReset,
    handleFileProcessingState,
    handleUploadingState,

    isResumable,
    isSkipResumable,
    isUploading,
    isProcessing:
      (isFileProcessing && Boolean(uploadFiles?.length)) || isResumeLoading,
    files,
    uploadFiles,
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
  };
}
