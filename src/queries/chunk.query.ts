import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { Chunk } from "../model/chunk.model";

export const useGetChunks = () => {
  return useLiveQuery(() => db.chunks.orderBy("chunk_index").toArray());
};

export const useGetChunk = (chunkId: string) => {
  return useLiveQuery(() => {
    return db.chunks.where("chunk_id").equals(chunkId).toArray();
  }, [chunkId]);
};

export const useGetChunksByFileId = (fileId: string) => {
  return useLiveQuery(() => {
    return db.chunks.where("file_id").equals(fileId).sortBy("chunk_index");
  }, [fileId]);
};

export const useCreateChunk = () => {
  async function createChunk(chunk: Chunk) {
    const key = await db.chunks.add(chunk, chunk.chunk_id);
    return key;
  }

  return { createChunk };
};

export const useUpdateChunk = () => {
  async function updateChunk(id: string, chunk: Chunk) {
    return await db.chunks.put(chunk, id);
  }

  return { updateChunk };
};

export const useDeleteChunk = () => {
  async function deleteChunk(id: string) {
    return await db.chunks.delete(id);
  }

  return { deleteChunk };
};

export const useDeleteByFileId = () => {
  async function deleteChunks(fileId: string) {
    return await db.chunks.where("file_id").equals(fileId).delete();
  }

  return { deleteChunks };
};

export async function getChunks(type: string) {
  return await db.chunks.where("type").equals(type).sortBy("timestamp");
}

export const getChunksByFileId = (fileId: string) => {
  return db.chunks.where("file_id").equals(fileId).sortBy("chunk_index");
};
