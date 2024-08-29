import { useEffect, useRef } from "react";
import {
  getChunks,
  getChunksByFileId,
  useCreateChunk,
  useDeleteChunk,
} from "../queries/chunk.query";
import { getFile, useDeleteFile } from "../queries/uploadFile.query";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { Chunk } from "../model/chunk.model";

export const MAX_REQUEST_CONNECTIONS = 6;

type Props = {
  type: string;
  isProcessing: boolean;
  autoUploadOnPageLoading: boolean;
  autoUploadOnFileLoading: boolean;
  onUploadEnd: () => void;
};

export default function useUploadRequestQueue({
  type,
  isProcessing,
  autoUploadOnPageLoading,
  onUploadEnd,
}: Props) {
  const active_requests = useRef(0);

  const { deleteChunk } = useDeleteChunk();
  const { deleteFile } = useDeleteFile();
  const { createChunk } = useCreateChunk();

  const enqueue = async (chunk: Chunk) => {
    await createChunk(chunk);

    // auto upload whenever the user load the docs.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnFileLoading = true | false
  };

  useEffect(() => {
    if (isProcessing) return;

    // auto upload whenever the user load the page.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnPageLoading = true | false
    if (autoUploadOnPageLoading) {
      dequeue();
    }
  }, [isProcessing, autoUploadOnPageLoading]);

  const dequeue = async () => {
    const chunks = await getChunks(type);

    if (!chunks || chunks.length === 0) {
      onUploadEnd();
      return;
    }

    if (active_requests.current < MAX_REQUEST_CONNECTIONS) {
      const { file_name, content, chunk_index, chunk_id, file_id } =
        chunks.slice(0, 1)[0];

      active_requests.current += 1;

      uploadChunk(file_name, content, chunk_index)
        .then(async () => {
          await deleteChunk(chunk_id);
          const file = await getFile(file_id);

          const chunks = await getChunksByFileId(file_id);

          if (chunks.length === 0) {
            await finalizeUpload(file_name, file?.number_of_chunks ?? 1);
            await deleteFile(file_id);
          }
        })
        .catch(async (error) => {
          // TODO: handle this better.
          console.log("error", error);
          await deleteChunk(chunk_id);
          await deleteFile(file_id);
        })
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
