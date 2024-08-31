import { v4 as uuidv4 } from "uuid";
import { getFiles, useCreateFile } from "../queries/uploadFile.query";
import { chunkFile } from "../utils/file.util";
import { UploadFile } from "../model/uploadFile.model";
import useChunk from "./useChunk.hooks";
import { FnCall, FnCallArgs } from "./useUploadRequestQueue.hook";
import { useEffect } from "react";
import { getChunks } from "../queries/chunk.query";
import { finalizeUpload, uploadChunk } from "../api/upload.api";

// const MAX_CHUNK_SIZE = 5 * 1024 * 1024 * 1024 * 1024; // 5MB chunk size
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
  enqueue: (fnCall: FnCall, args: FnCallArgs) => Promise<any>;
  isProcessing: boolean;
};

export default function useFile({ type, enqueue, isProcessing }: Props) {
  const { createFile } = useCreateFile();
  const { onProcessChunks } = useChunk({ type, enqueue });

  //   useEffect(() => {
  //     async function fillQueue(isProcessing: boolean) {
  //       if (isProcessing) {
  //         return;
  //       }

  //       const files = await getFiles(type);

  //       if (!files || files.length === 0) return;
  //       const mapFiles: Record<string, UploadFile> = files.reduce((a, b) => {
  //         return {
  //           ...a,
  //           [b.file_id]: b,
  //         };
  //       }, {});

  //       const chunks = await getChunks(type);

  //       if (!chunks || chunks.length === 0) return;

  //       chunks.map(async (chunk) => {
  //         await enqueue(uploadChunk, {
  //           chunk,
  //           file: mapFiles[chunk.file_id],
  //         });

  //         if (
  //           chunk.chunk_index ===
  //           mapFiles[chunk.file_id].number_of_chunks - 1
  //         ) {
  //           enqueue(finalizeUpload, {
  //             chunk,
  //             file: mapFiles[chunk.file_id],
  //           });
  //         }
  //       });
  //     }

  //     fillQueue(isProcessing);
  //   }, [isProcessing]);

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

  const onProcessFiles = async (files: File[]) =>
    await files
      .sort((a, b) => a.size - b.size)
      .map(async (f) => await onProcessFile(f));

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
    onProcessing,
  };
}
