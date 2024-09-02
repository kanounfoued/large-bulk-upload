import { UploadFile } from "./../model/uploadFile.model";
import { Chunk } from "../model/chunk.model";
import { useCreateChunk } from "../queries/chunk.query";
import { v4 as uuidv4 } from "uuid";
import { finalizeUpload, uploadChunk } from "../api/upload.api";
import { QueueFn, QueueFnArgs } from "../model/queue.model";

type Props = {
  type: string;
  enqueue: (
    fnCall: QueueFn,
    args: QueueFnArgs
  ) => { chunk: Chunk; file: UploadFile };
};

export default function useChunk({ type, enqueue }: Props) {
  const { createChunk } = useCreateChunk();

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

      await createChunk(chunk);

      enqueue(uploadChunk, { chunk, file });

      if (chunk.chunk_index === file.number_of_chunks - 1)
        enqueue(finalizeUpload, { chunk, file });

      i++;
    }
  };

  return { onProcessChunks };
}
