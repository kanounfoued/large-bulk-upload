import { ChangeEvent, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { chunkFile } from "../utils/file.util";
import {
  useCreateChunks,
  useDeleteByFileId,
  useUpdateChunkById,
} from "../queries/chunk.query";
import {
  useCreateFile,
  useDeleteById,
  useUpdateFileById,
} from "../queries/uploadFile.query";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import useUploadRequestQueue from "./uploadRequestQueue.hook";
import { Chunk } from "../model/chunk.model";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
};

export default function useUploader({ type }: Props) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [isProcessing, setProcessing] = useState<boolean>(false);

  const { dequeue, enqueue } = useUploadRequestQueue();

  const { createChunk } = useCreateChunks();
  const { createFile } = useCreateFile();
  const { removeChunks } = useDeleteByFileId();
  const { removeFile } = useDeleteById();
  const { updateFile } = useUpdateFileById();
  const { updateChunk } = useUpdateChunkById();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    if (!files) {
      // TODO: trigger a notification error
      return;
    }

    const file_list: File[] = [];

    for (const file of files) file_list.push(file);

    setFiles(file_list);
    onUploadStart(file_list);
  };

  async function onUploadStartHandleFile(file: File) {
    const file_id = uuidv4();
    const timestamp = new Date().getTime();

    // small => store it in the index DB
    if (file.size <= MAX_CHUNK_SIZE) {
      // store the file in files table in indexDB
      await createFile({
        file_id,
        content: file,
        number_of_chunks: 1,
        status: "pending",
        timestamp,
        type,
      });

      const chunk: Chunk = {
        chunk_id: uuidv4(),
        file_name: file.name,
        chunk_index: 0,
        content: file,
        file_id,
        status: "pending",
        number_of_retry: 0,
        timestamp,
        type,
      };

      await enqueue(chunk);

      return;
    }

    // large => split it to chunks and store it in the index DB.
    const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);

    // store the file in files table in indexDB
    await createFile({
      file_id,
      content: file,
      number_of_chunks: file_chunks.length,
      status: "pending",
      timestamp,
      type,
    });

    file_chunks.map(async (chunk_blob, chunk_index) => {
      const chunk: Chunk = {
        chunk_id: uuidv4(),
        file_name: file.name,
        chunk_index,
        content: chunk_blob,
        file_id,
        status: "pending",
        number_of_retry: 0,
        timestamp,
        type,
      };

      await enqueue(chunk);
    });
  }

  async function onUploadStartHandleFiles(files: File[]) {
    // sort the files based on their size, from small to large
    const sort_files = files.sort((a, b) => a.size - b.size);

    // for each file, check if the file is large or small
    // small => store it in the index DB
    // large => split it to chunks and store it in the indexDB.
    for (let i = 0; i < sort_files.length; i++) {
      const file = sort_files[i];
      await onUploadStartHandleFile(file);
    }

    return;
  }

  async function onUploadStart(files: File[]) {
    setProcessing(true);

    if (files.length === 1) {
      await onUploadStartHandleFile(files[0]);
    } else {
      await onUploadStartHandleFiles(files);
    }

    setProcessing(false);
  }

  async function onUpload() {
    // const requests = await getRequests();
    await dequeue();
    // if (!requests || requests.length === 0) {
    //   // trigger notification
    //   console.log("No chunk to upload");
    //   return;
    // }
    // try {
    //   // start the upload
    //   const chunk = await dequeue();
    //   if (!chunk) return;
    //   console.log("chunk", chunk.chunk_index);
    //   const file = await getFileById(chunk.file_id);
    //   if (!file) {
    //     // trigger notification error
    //     return;
    //   }
    //   const { number_of_chunks } = file;
    //   await uploadChunk(
    //     chunk.file_name,
    //     chunk.content,
    //     chunk.chunk_index,
    //     async () => {
    //       // update the status of the uploaded chunk.
    //       await updateChunk(chunk.chunk_id, {
    //         ...chunk,
    //         status: "success",
    //       });
    //       if (chunk.chunk_index + 1 === number_of_chunks) {
    //         await updateFile(chunk.file_id, {
    //           ...file,
    //           status: "success",
    //         });
    //         await finalizeUpload(chunk.file_name, number_of_chunks);
    //         // remove all chunks.
    //         await removeChunks(chunk.file_id);
    //         // remove the file.
    //         await removeFile(chunk.file_id);
    //         // console.log("time", performance.now());
    //       }
    //       const chunks = await getChunks("dataset");
    //       if (chunks.length === 0) {
    //         onUpload();
    //         return;
    //       }
    //       const chnk = chunks[0];
    //       queueMicrotask(() => queue(chnk));
    //       onUpload();
    //     }
    //   );
    // } catch (error) {
    //   console.log("error", error);
    //   // trigger notification
    // }
  }

  return {
    onUpload,
    uploadChunk,
    onChange,
    files,
    isProcessing,
  };
}
