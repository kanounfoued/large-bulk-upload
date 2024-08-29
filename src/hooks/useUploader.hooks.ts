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

  const { isUploading, handleUploadingState } = useUploadState();

  const {
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
  } = useAutoUpload();

  const { onFileProcessing, isProcessing } = useFile({ type });

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

  const { dequeue } = useUploadRequestQueue({
    type,
    isProcessing,
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
    onUploadEnd: onReset,
  });

  function onChange(e: ChangeEvent<HTMLInputElement>) {
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

    onFileProcessing(file_list);
  }

  function onReset() {
    onResumeUploads(false);
    handleUploadingState(false);
    setFiles(null);
  }

  // trigger the uploading API manually.
  async function onUpload() {
    handleUploadingState(true);
    if (!isUploading) await dequeue();
  }

  return {
    onUpload,
    onResumeUploads: onUpload,
    onChange,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
    onReset,

    isResumable,
    isUploading,
    isProcessing,
    files,
    indexed_files,
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
  };
}
