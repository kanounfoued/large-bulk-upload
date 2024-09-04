import { v4 as uuidv4 } from "uuid";
import { useCreateFile } from "../queries/uploadFile.query";
import { chunkFile } from "../utils/file.util";
import { UploadFile } from "../model/uploadFile.model";
import useChunk from "./useChunk.hooks";
import { QueueFn, QueueFnArgs } from "../model/queue.model";
import { useState } from "react";

// const MAX_CHUNK_SIZE = 5 * 1024 * 1024 * 1024 * 1024; // 5MB chunk size
export const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enqueue: (fnCall: QueueFn, args: QueueFnArgs) => any;
};

export default function useFile({ type, enqueue }: Props) {
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);

  const { createFile } = useCreateFile();
  const { onProcessChunks } = useChunk({ type, enqueue });

  const handleFileProcessingState = (isProcessing: boolean) => {
    setIsFileProcessing(isProcessing);
  };

  async function onProcessFile(file: File) {
    const file_id = uuidv4();
    const timestamp = new Date().getTime();

    const uploadFile: UploadFile = {
      file_id,
      file_name: file.name,
      content: file,
      number_of_chunks: 1,
      status: "pending",
      timestamp,
      type,
      is_processed: false,
    };

    // small => store it in the index DB
    if (file.size <= MAX_CHUNK_SIZE) {
      // store the file in files table in indexDB
      await createFile(uploadFile);
      const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);

      return { file: uploadFile, chunks: file_chunks };
    }

    // large => split it to chunks and store it in the index DB.
    const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);
    uploadFile.number_of_chunks = file_chunks.length;

    // store the file in files table in indexDB
    await createFile(uploadFile);

    return {
      file: uploadFile,
      chunks: file_chunks,
    };
  }

  const onProcessFiles = async (files: File[]) => {
    const sortedFiles = files.sort((a, b) => a.size - b.size);

    const processedFiles = [];
    for (const sFile of sortedFiles) {
      processedFiles.push(await onProcessFile(sFile));
    }

    return processedFiles;
  };

  /**
   * Start uploading the given files.
   * If the files array contains more than one file,
   * the function will upload the files one by one.
   * If the array contains only one file, the function
   * will upload the file directly.
   * @param files the files to be uploaded
   */
  async function onProcessing(files: File[]) {
    if (files.length === 1) {
      const { file, chunks } = await onProcessFile(files[0]);
      await onProcessChunks(file, chunks);
    } else {
      const processedFiles = await onProcessFiles(files);

      for (let i = 0; i < processedFiles.length; i++) {
        const { file, chunks } = await processedFiles[i];
        await onProcessChunks(file, chunks);
      }
    }
  }

  return {
    isFileProcessing,
    onProcessing,
    handleFileProcessingState,
  };
}
