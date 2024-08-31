import { UploadFile } from "./../model/uploadFile.model";
import { Chunk } from "../model/chunk.model";
import { useCreateChunk } from "../queries/chunk.query";
import { v4 as uuidv4 } from "uuid";
import { FnCall, FnCallArgs } from "./useUploadRequestQueue.hook";
import { finalizeUpload, uploadChunk } from "../api/upload.api";

type Props = {
  type: string;
  enqueue: (
    fnCall: FnCall,
    args: FnCallArgs
  ) => Promise<{ chunk: Chunk; file: UploadFile }>;
};

export default function useChunk({ type, enqueue }: Props) {
  const { createChunk } = useCreateChunk();

  const onProcessChunks = (file: UploadFile, chunks: Blob[]) => {
    chunks.map(async (chunk_blob, chunk_index) => {
      const chunk: Chunk = {
        chunk_id: uuidv4(),
        file_name: file.file_name,
        chunk_index,
        content: chunk_blob,
        file_id: file.file_id,
        status: "pending",
        number_of_retry: 0,
        timestamp: new Date().getTime(),
        type,
      };

      await createChunk(chunk);

      enqueue(uploadChunk, { chunk, file });

      if (chunk.chunk_index === file.number_of_chunks - 1) {
        enqueue(finalizeUpload, { chunk, file });
      }
    });
  };

  return { onProcessChunks };
}
