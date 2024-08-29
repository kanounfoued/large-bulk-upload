import { useRef } from "react";
import {
  getChunks,
  useCreateChunks,
  useDeleteById as useDeleteChunkById,
  // useGetChunks,
} from "../queries/chunk.query";
import { useDeleteById as useDeleteFileById } from "../queries/uploadFile.query";
import { uploadChunk } from "../api/upload.api";
import { Chunk } from "../model/chunk.model";

export const MAX_REQUEST_CONNECTIONS = 6;

export default function useUploadRequestQueue() {
  // const chunks = useGetChunks();
  const active_requests = useRef(0);

  const { removeChunk } = useDeleteChunkById();
  const { removeFile } = useDeleteFileById();
  const { createChunk } = useCreateChunks();

  const enqueue = async (chunk: Chunk) => {
    await createChunk(chunk);
    dequeue();
  };

  const dequeue = async () => {
    const chunks = await getChunks("dataset");

    if (!chunks || chunks.length === 0) return;
    if (active_requests.current < MAX_REQUEST_CONNECTIONS) {
      const { file_name, content, chunk_index, chunk_id, file_id } =
        chunks.slice(0, 1)[0];

      active_requests.current += 1;

      uploadChunk(file_name, content, chunk_index)
        .then(async () => {
          await removeChunk(chunk_id);
          await removeFile(file_id);
        })
        .catch((error) => console.log("error", error))
        .finally(() => {
          active_requests.current -= 1;
          dequeue();
        });
    }
  };

  return {
    enqueue,
    dequeue,
  };
}
