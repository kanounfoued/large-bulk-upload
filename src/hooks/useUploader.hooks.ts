import { ChangeEvent, useEffect, useState } from "react";
import { Chunk } from "../model/chunk.model";
import { v4 as uuidv4 } from "uuid";
import { chunkFile } from "../utils/file.util";
import {
  useCreateChunks,
  useDeleteByFileId,
  useGetChunksByStatus,
  useUpdateChunkById,
} from "../queries/chunk.query";
import {
  getFileById,
  useCreateFile,
  useDeleteById,
  useUpdateFileById,
} from "../queries/uploadFile.query";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import useUploadRequestQueue from "./uploadRequestQueue.hook";
import { MAX_REQUEST_CONNECTIONS, getRequests } from "../queries/request.query";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

type Props = {
  type: string;
};

export default function useUploader({ type }: Props) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [isProcessing, setProcessing] = useState<boolean>(false);

  const { dequeue, queue, requests } = useUploadRequestQueue();

  //   const [isUploading, setUploading] = useState(false);
  //   const [paused, setPaused] = useState(false);

  const { createChunks } = useCreateChunks();
  const { createFile } = useCreateFile();
  const { removeChunks } = useDeleteByFileId();
  const { removeFile } = useDeleteById();
  const { updateFile } = useUpdateFileById();
  const { updateChunk } = useUpdateChunkById();

  const on_pending_chunks = useGetChunksByStatus("pending") ?? [];

  useEffect(() => {
    if (!requests) return;
    if (on_pending_chunks.length === 0) return;
    if (requests.length >= MAX_REQUEST_CONNECTIONS) return;

    async function handlingUploadRequestQueue() {
      const pending_chunk = on_pending_chunks[0];

      await queue([{ ...pending_chunk, status: "progress" }]);

      await updateChunk(pending_chunk.id, {
        ...pending_chunk,
        status: "progress",
      });
    }

    handlingUploadRequestQueue();
  }, [on_pending_chunks, requests]);

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
      await createFile([
        {
          id: file_id,
          content: file,
          number_of_chunks: 1,
          status: "pending",
          timestamp,
          type,
        },
      ]);

      await createChunks([
        {
          id: uuidv4(),
          file_name: file.name,
          chunk_index: 0,
          content: file,
          file_id,
          status: "pending",
          number_of_retry: 0,
          timestamp,
        },
      ]);

      return;
    }

    // large => split it to chunks and store it in the index DB.
    const file_chunks = chunkFile(file, MAX_CHUNK_SIZE);

    const chunks: Chunk[] = file_chunks.map((chunk, chunk_index) => ({
      id: uuidv4(),
      file_name: file.name,
      chunk_index,
      content: chunk,
      file_id,
      status: "pending",
      number_of_retry: 0,
      timestamp,
    }));

    // store the file in files table in indexDB
    await createFile([
      {
        id: file_id,
        content: file,
        number_of_chunks: chunks.length,
        status: "pending",
        timestamp,
        type,
      },
    ]);

    await createChunks(chunks);

    return;
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
    const requests = await getRequests();

    if (!requests || requests.length === 0) {
      // trigger notification
      console.log("No chunk to upload");
      return;
    }

    try {
      // start the upload
      const chunk = await dequeue();
      if (!chunk) return;

      const file = await getFileById(chunk.file_id);
      if (!file) {
        // trigger notification error
        return;
      }

      const { number_of_chunks } = file;

      await uploadChunk(
        chunk.file_name,
        chunk.content,
        chunk.chunk_index,
        async () => {
          // update the status of the uploaded chunk.
          await updateChunk(chunk.id, {
            ...chunk,
            status: "success",
          });

          if (chunk.chunk_index + 1 === number_of_chunks) {
            await updateFile(chunk.file_id, {
              ...file,
              status: "success",
            });

            await finalizeUpload(chunk.file_name, number_of_chunks);

            // remove all chunks.
            await removeChunks(chunk.file_id);

            // remove the file.
            await removeFile(chunk.file_id);
          }

          onUpload();
        }
      );
    } catch (error) {
      console.log("error", error);
      // trigger notification
    }
  }

  return {
    onUpload,
    uploadChunk,
    onChange,
    files,
    isProcessing,
    requests,
  };
}
