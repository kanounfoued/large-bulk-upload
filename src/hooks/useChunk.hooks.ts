import { UploadFile } from "./../model/uploadFile.model";
import { Chunk } from "../model/chunk.model";
import { useCreateChunk } from "../queries/chunk.query";
import { v4 as uuidv4 } from "uuid";

type Props = {
  type: string;
};

export default function useChunk({ type }: Props) {
  const { createChunk } = useCreateChunk();

  const onProcessChunks = (
    file: UploadFile,
    chunks: Blob[],
    timestamp: number
  ) => {
    chunks.map(async (chunk_blob, chunk_index) => {
      const chunk: Chunk = {
        chunk_id: uuidv4(),
        file_name: file.file_name,
        chunk_index,
        content: chunk_blob,
        file_id: file.file_id,
        status: "pending",
        number_of_retry: 0,
        timestamp,
        type,
      };

      await createChunk(chunk);
    });
  };

  return { onProcessChunks };
}
