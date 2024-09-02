import { ChangeEvent, useEffect, useState } from "react";
import { getFiles, useGetFiles } from "../queries/uploadFile.query";
import useQueue from "./useQueue.hook";
import { getChunks } from "../queries/chunk.query";
import useResumeUploads from "./useResumeUploads.hooks";
import useUploadState from "./useUploadState.hooks";
import useAutoUpload from "./useAutoUpload.hooks";
import useFile from "./useFile.hooks";

type Props = {
  type: string;
};

export default function useUploader({ type }: Props) {
  const [files, setFiles] = useState<File[] | null>(null);
  const indexed_files = useGetFiles({ type });

  const { dequeuePerMax, enqueue, resetQueue } = useQueue();

  const {
    isUploading,
    isProcessing,
    handleUploadingState,
    handleProcessingState,
  } = useUploadState();

  const {
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
  } = useAutoUpload();

  // resume uploads automatically.
  // this affect took place whenever the user:
  // reload the page, mount the component ...
  useEffect(() => {
    (async function () {
      const files = await getFiles(type);
      const chunks = await getChunks(type);

      if (isProcessing) return;
      if (!files || !chunks) return;
      if (files.length === 0) return;
      if (chunks.length === 0) return;

      onResumeUploads(true);
    })();
  }, []);

  // reset the state of the uploader automatically.
  // this affect took place whenever whenever :
  // the files table inside the index db is empty.
  useEffect(() => {
    if (indexed_files?.length === 0) {
      onReset();
    }
  }, [indexed_files]);

  useEffect(() => {
    if (isProcessing) return;

    // auto upload whenever the user load the page.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnPageLoading = true | false
    if (autoUploadOnPageLoading) {
      dequeuePerMax();
    }
  }, [isProcessing, autoUploadOnPageLoading]);

  const { onProcessing } = useFile({
    type,
    enqueue,
  });

  const { isResumable, onResumeUploads, isResumeProcessing } = useResumeUploads(
    {
      type,
      isProcessing,
      enqueue,
    }
  );

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleProcessingState(true);
    const { files } = e.target;

    if (!files) {
      // TODO: trigger a notification error
      return;
    }

    const file_list: File[] = [];

    for (const file of files) file_list.push(file);
    e.target.files = null;
    e.target.value = "";
    setFiles(file_list);

    await onProcessing(file_list);
    handleProcessingState(false);
  }

  function onResume() {
    onResumeUploads(false);
    onUpload();
  }

  function onReset() {
    onResumeUploads(false);
    handleUploadingState(false);
    setFiles(null);
    resetQueue();
  }

  // trigger the uploading API manually.
  async function onUpload() {
    // prevent the user from clicking if there is already a current uploading
    if (!isUploading) {
      handleUploadingState(true);
      dequeuePerMax();
    }
  }

  return {
    onUpload,
    onResume,
    onChange,
    onResumeUploads,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
    onReset,
    handleProcessingState,
    handleUploadingState,

    isResumable,
    isUploading,
    isEmpty: indexed_files?.length === 0,
    isProcessing:
      (isProcessing && Boolean(indexed_files?.length)) || isResumeProcessing,
    files,
    indexed_files,
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
  };
}
