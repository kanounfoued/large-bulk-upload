import { useEffect, useRef } from "react";
import {
  getChunks,
  getChunksByFileId,
  useCreateChunks,
  useDeleteById as useDeleteChunkById,
} from "../queries/chunk.query";
import {
  getFileById,
  useDeleteById as useDeleteFileById,
} from "../queries/uploadFile.query";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { Chunk } from "../model/chunk.model";

export const MAX_REQUEST_CONNECTIONS = 6;

type Props = {
  isProcessing: boolean;
  autoUploadOnLoad: boolean;
  autoUploadOnChange: boolean;
  onUploadEnd: () => void;
};

export default function useUploadRequestQueue({
  isProcessing,
  autoUploadOnLoad,
  onUploadEnd,
}: // autoUploadOnChange,
Props) {
  const active_requests = useRef(0);

  const { removeChunk } = useDeleteChunkById();
  const { removeFile } = useDeleteFileById();
  const { createChunk } = useCreateChunks();

  const enqueue = async (chunk: Chunk) => {
    await createChunk(chunk);

    // auto upload whenever the user load the docs.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnChange = true | false
  };

  useEffect(() => {
    if (isProcessing) return;

    // auto upload whenever the user load the page.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnLoad = true | false
    if (autoUploadOnLoad) {
      dequeue();
    }
  }, [isProcessing, autoUploadOnLoad]);

  const dequeue = async () => {
    const chunks = await getChunks("dataset");

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
          await removeChunk(chunk_id);
          const file = await getFileById(file_id);

          const chunks = await getChunksByFileId(file_id);

          if (chunks.length === 0) {
            await finalizeUpload(file_name, file?.number_of_chunks ?? 1);
            await removeFile(file_id);
          }
        })
        .catch(async (error) => {
          // TODO: handle this better.
          console.log("error", error);
          await removeChunk(chunk_id);
          await removeFile(file_id);
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
