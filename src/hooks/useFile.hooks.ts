import { v4 as uuidv4 } from "uuid";
import { useCreateFile } from "../queries/uploadFile.query";
import { chunkFile } from "../utils/file.util";
import { UploadFile } from "../model/uploadFile.model";
import { useState } from "react";

export const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
};

export default function useFile({ type }: Props) {
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);

  const { createFile } = useCreateFile();

  const handleFileProcessingState = (isProcessing: boolean) => {
    setIsFileProcessing(isProcessing);
  };

  /**
   *
   * @function onProcessFile
   * @param file UploadFile
   * @returns { file, chunks } @type { file: UploadFile, chunks: Chunk[] }
   */
  async function onProcessFile(file: File) {
    const _file: UploadFile = {
      file_id: uuidv4(),
      file_name: file.name,
      content: file,
      number_of_chunks: Math.ceil(file.size / MAX_CHUNK_SIZE),
      status: "pending",
      timestamp: new Date().getTime(),
      type,
      is_processed: false,
    };

    await createFile(_file);
    const chunks = chunkFile(file, MAX_CHUNK_SIZE);

    return {
      file: _file,
      chunks,
    };
  }

  /**
   *
   * @function onProcessing
   * @description
   *  onProcessing function:
   *    Sorting files by the smallest one.
   *    process each file individually by returning the file and its chunks.
   *    for each file's chunks it start store them into the index db
   *
   * @param files the files to be uploaded
   * @returns undefined
   */
  async function onProcessing(files: File[]) {
    const sortedFiles = files.sort((a, b) => a.size - b.size);
    const processedFiles = [];

    for (const sFile of sortedFiles) {
      processedFiles.push(await onProcessFile(sFile));
    }

    return processedFiles;
  }

  return {
    isFileProcessing,
    onProcessing,
    handleFileProcessingState,
  };
}
