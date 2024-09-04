import { useEffect, useState } from "react";
import { getFiles } from "../queries/uploadFile.query";
import { getChunks, useDeleteByFileId } from "../queries/chunk.query";
import { UploadFile } from "../model/uploadFile.model";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { QueueFn, QueueFnArgs } from "../model/queue.model";

// NOTE
// We can make the queueing when the user clicks on resumable button and then we start the uploading process.

type Props = {
  type: string;
  isFileProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enqueue: (fnCall: QueueFn, args: QueueFnArgs) => any;
};

export default function useResumeUploads({
  type,
  isFileProcessing,
  enqueue,
}: Props) {
  const [isResumable, setIsResumable] = useState<boolean>(false);
  const [isResumeProcessing, setIsResumeProcessing] = useState<boolean>(false);
  const { deleteChunks } = useDeleteByFileId();

  /**
   * this useEffect will be triggered when there are some files and chunks inside index DB while the user has already entered the page.
   * it loads the data from index db and put it into queue.
   */
  useEffect(() => {
    if (isFileProcessing) return;
    if (!isResumable) return;

    async function resumeProcessing() {
      const files = await getFiles(type);
      const chunks = await getChunks(type);

      if (!files || files.length === 0) return;
      if (!chunks || chunks.length === 0) return;

      handleReusmeProcessing(true);

      const mapFiles: Record<string, UploadFile> = files.reduce((a, b) => {
        return {
          ...a,
          [b.file_id]: b,
        };
      }, {});

      for (const chunk of chunks) {
        if (!mapFiles[chunk.file_id]) {
          deleteChunks(chunk.file_id);
          continue;
        }

        enqueue(uploadChunk, {
          chunk,
          file: mapFiles[chunk.file_id],
        });

        if (
          chunk.chunk_index ===
          mapFiles[chunk.file_id].number_of_chunks - 1
        ) {
          enqueue(finalizeUpload, {
            chunk,
            file: mapFiles[chunk.file_id],
          });
        }
      }

      handleReusmeProcessing(false);
    }

    resumeProcessing();
  }, [isFileProcessing, isResumable]);

  // TODO: integrate index db or local storage for long term usage of the user's response.
  function onResumeUploads(isQueueFull: boolean) {
    setIsResumable(isQueueFull);
  }

  const handleReusmeProcessing = (isResumeProcessing: boolean) => {
    setIsResumeProcessing(isResumeProcessing);
  };

  return {
    isResumable,
    isResumeProcessing,
    onResumeUploads,
    handleReusmeProcessing,
  };
}
