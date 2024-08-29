import { v4 as uuidv4 } from "uuid";
import { useCreateFile } from "../queries/uploadFile.query";
import { chunkFile } from "../utils/file.util";
import { UploadFile } from "../model/uploadFile.model";
import { useState } from "react";
import useChunk from "./useChunk.hooks";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
};

export default function useFile({ type }: Props) {
  const [isProcessing, setProcessing] = useState<boolean>(false);

  const { createFile } = useCreateFile();
  const { onProcessChunks } = useChunk({ type });

  const handleProcessingState = (isProcessing: boolean) => {
    setProcessing(isProcessing);
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
    };

    // small => store it in the index DB
    if (file.size <= MAX_CHUNK_SIZE) {
      // store the file in files table in indexDB
      await createFile(uploadFile);
      const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);

      return { file: uploadFile, chunks: file_chunks, timestamp };
    }

    // large => split it to chunks and store it in the index DB.
    const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);
    uploadFile.number_of_chunks = file_chunks.length;

    // store the file in files table in indexDB
    await createFile(uploadFile);

    return {
      file: uploadFile,
      chunks: file_chunks,
      timestamp,
    };
  }

  const onProcessFiles = async (files: File[]) =>
    files.sort((a, b) => a.size - b.size).map((f) => onProcessFile(f));

  /**
   * Start uploading the given files.
   * If the files array contains more than one file,
   * the function will upload the files one by one.
   * If the array contains only one file, the function
   * will upload the file directly.
   * @param files the files to be uploaded
   */
  async function onFileProcessing(files: File[]) {
    handleProcessingState(true);

    if (files.length === 1) {
      const { file, chunks, timestamp } = await onProcessFile(files[0]);
      await onProcessChunks(file, chunks, timestamp);
    } else {
      (await onProcessFiles(files)).map(async (uploadFile) => {
        const { file, chunks, timestamp } = await uploadFile;
        await onProcessChunks(file, chunks, timestamp);
      });
    }

    handleProcessingState(false);
  }

  return {
    onFileProcessing,
    isProcessing,
  };
}
