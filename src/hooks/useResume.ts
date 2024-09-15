import { useState } from "react";
import { getFiles, useGetFiles } from "../queries/uploadFile.query";
import { getChunks, useDeleteByFileId } from "../queries/chunk.query";
import { UploadFile } from "../model/uploadFile.model";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { QueueFn, QueueFnArgs } from "../model/queue.model";

type Props = {
  type: string;
  isFileProcessing: boolean;
  enqueue: (fnCall: QueueFn, args: QueueFnArgs) => void;
};

export default function useResume({ type, isFileProcessing, enqueue }: Props) {
  // this state is used to determine if there are resumable files in the index db.
  // it will be updated after checking the corrupted files.
  const [isResumable, setIsResumable] = useState<boolean>(false);
  const [isSkipResumable, setIsSkipResumable] = useState<boolean>(false);

  // this is the loading state, whenever the user resume files.
  const [isResumeLoading, setIsResumeLoading] = useState<boolean>(false);

  const uploadFiles = useGetFiles({ type });

  const { deleteChunks } = useDeleteByFileId();

  /**
   * @function onResumeProcessing
   * @description
   *  after checking the status of all files that are not corrupted
   *  prepare and load the chunks into the queue
   *  so they will be ready for the uploading process.
   * @returns undefined
   */
  async function onResumeProcessing() {
    if (isFileProcessing) return;

    handleReusmeLoading(true);

    const files = await getFiles(type);
    if (!files || files.length === 0) return;

    const chunks = await getChunks(type);
    if (!chunks || chunks.length === 0) return;

    const mapFiles: Record<string, UploadFile> = files.reduce((acc, next) => {
      return {
        ...acc,
        [next.file_id]: next,
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

      if (chunk.chunk_index === mapFiles[chunk.file_id].number_of_chunks - 1) {
        enqueue(finalizeUpload, {
          chunk,
          file: mapFiles[chunk.file_id],
        });
      }
    }

    handleReusmeLoading(false);
  }

  const handleIsResumable = (isResumable: boolean) => {
    setIsResumable(isResumable);
  };

  const handleIsSkipResumable = (isSkipResumable: boolean) => {
    setIsSkipResumable(isSkipResumable);
  };

  const handleReusmeLoading = (isResumeLoading: boolean) => {
    setIsResumeLoading(isResumeLoading);
  };

  return {
    isResumable,
    isSkipResumable,
    isResumeLoading,
    uploadFiles,
    onResumeProcessing,
    handleIsResumable,
    handleReusmeLoading,
    handleIsSkipResumable,
  };
}
