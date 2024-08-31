import { ChangeEvent, useEffect, useState } from "react";
import { useGetFiles } from "../queries/uploadFile.query";
import useUploadRequestQueue from "./useUploadRequestQueue.hook";
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

  const { isResumable, onResumeUploads } = useResumeUploads();

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
  // this affect took place whenever the user :
  // reload the page, mount the component ...
  useEffect(() => {
    (async function () {
      const chunks = await getChunks(type);
      if (chunks.length > 0) onResumeUploads(true);
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

  const { dequeuePerMax, enqueue, resetQueue } = useUploadRequestQueue({
    isProcessing,
    autoUploadOnPageLoading,
  });

  const { onProcessing } = useFile({ type, enqueue, isProcessing });

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

  // useEffect(() => {
  //   if (!files || files.length === 0) return;
  //   if (!isProcessing) return;

  //   async function onProcessing() {
  //     if (isProcessing) {
  //       // await new Promise(async () => {
  //       // });

  //       await onFileProcessing(files ?? []);

  //       handleProcessingState(false);
  //     }
  //   }

  //   onProcessing();
  // }, [isProcessing, files?.length]);

  function onReset() {
    onResumeUploads(false);
    handleUploadingState(false);
    setFiles(null);
    resetQueue();
  }

  // trigger the uploading API manually.
  async function onUpload() {
    handleUploadingState(true);

    // prevent the user from clicking if there is already a current uploading
    if (!isUploading) {
      dequeuePerMax();
    }
  }

  return {
    onUpload,
    onResumeUploads: onUpload,
    onChange,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
    onReset,
    handleProcessingState,
    handleUploadingState,

    isResumable,
    isUploading,
    isProcessing: isProcessing && Boolean(indexed_files?.length),
    files,
    indexed_files,
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
  };
}
