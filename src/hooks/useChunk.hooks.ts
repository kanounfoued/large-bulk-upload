import { UploadFile } from "./../model/uploadFile.model";
import { Chunk } from "../model/chunk.model";
import { useCreateChunk } from "../queries/chunk.query";
import { v4 as uuidv4 } from "uuid";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { QueueFn, QueueFnArgs } from "../model/queue.model";
import { useUpdateFile } from "../queries/uploadFile.query";

type Props = {
  type: string;
  enqueue: (fnCall: QueueFn, args: QueueFnArgs) => void;
};

/**
 * TODO: to make this version better, I can avoid storing the chunks into the db and rely only on their index to create the content that needs to be uploaded the next time.
 */

export default function useChunk({ type, enqueue }: Props) {
  const { createChunk } = useCreateChunk();
  const { updateFile } = useUpdateFile();

  const onProcessChunks = async (file: UploadFile, chunks: Blob[]) => {
    let i = 0;
    for (const chnk of chunks) {
      const chunk: Chunk = {
        chunk_id: uuidv4(),
        file_name: file.file_name,
        chunk_index: i,
        content: chnk,
        file_id: file.file_id,
        status: "pending",
        number_of_retry: 0,
        timestamp: new Date().getTime(),
        type,
      };

      enqueue(uploadChunk, { chunk, file });
      await createChunk(chunk);

      if (chunk.chunk_index === file.number_of_chunks - 1) {
        enqueue(finalizeUpload, { chunk, file });
        await updateFile(file.file_id, { ...file, is_processed: true });
      }

      i++;
    }
  };

  return { onProcessChunks };
}
