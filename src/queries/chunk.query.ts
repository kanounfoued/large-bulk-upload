import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { Chunk, ChunkStatus } from "../model/chunk.model";

export const useGetChunks = () => {
  return useLiveQuery(() => db.chunks.orderBy("chunk_index").toArray());
};

export const useGetChunkById = (chunkId: string) => {
  return useLiveQuery(() => {
    return db.chunks.where("chunk_id").equals(chunkId).toArray();
  }, [chunkId]);
};

export const useGetChunksByFileName = (fileName: string) => {
  return useLiveQuery(() => {
    return db.chunks.where("file_name").equals(fileName).sortBy("chunk_index");
  }, [fileName]);
};

export const useGetChunksByFileId = (fileId: string) => {
  return useLiveQuery(() => {
    return db.chunks.where("file_id").equals(fileId).sortBy("chunk_index");
  }, [fileId]);
};

export const useGetChunksByStatus = (status: ChunkStatus) => {
  return useLiveQuery(() => {
    return db.chunks.where("status").equals(status).sortBy("chunk_index");
  }, [status]);
};

export const useCreateChunks = () => {
  async function createChunk(chunk: Chunk) {
    const key = await db.chunks.add(chunk, chunk.chunk_id);
    return key;
  }

  return { createChunk };
};

export const useUpdateChunkById = () => {
  async function updateChunk(id: string, chunk: Chunk) {
    return await db.chunks.put(chunk, id);
  }

  return { updateChunk };
};

export const useUpdateChunks = () => {
  async function updateChunks(chunks: Chunk[]) {
    const keys = chunks.map((chunk) => chunk.chunk_id);

    return await db.chunks.bulkPut(chunks, keys, { allKeys: true });
  }

  return { updateChunks };
};

export const useDeleteById = () => {
  async function removeChunk(id: string) {
    return await db.chunks.delete(id);
  }

  return { removeChunk };
};

export const useDeleteByFileId = () => {
  async function removeChunks(fileId: string) {
    return await db.chunks.where("file_id").equals(fileId).delete();
  }

  return { removeChunks };
};

export async function getChunks(type: string) {
  return await db.chunks.where("type").equals(type).sortBy("timestamp");
}

export const getChunksByFileId = (fileId: string) => {
  return db.chunks.where("file_id").equals(fileId).sortBy("chunk_index");
};
