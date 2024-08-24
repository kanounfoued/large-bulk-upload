import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { Chunk, ChunkStatus } from "../model/chunk.model";

export const useGetChunks = () => {
  return useLiveQuery(() => db.chunks.toArray());
};

export const useGetChunkById = (chunkId: string) => {
  useLiveQuery(async () => {
    return await db.chunks.where("id").equals(chunkId).toArray();
  }, [chunkId]);
};

export const useGetChunksByFileName = (fileName: string) => {
  useLiveQuery(async () => {
    return await db.chunks.where("file_name").equals(fileName).toArray();
  }, [fileName]);
};

export const useGetChunksByFileId = (fileId: string) => {
  return useLiveQuery(async () => {
    return await db.chunks.where("file_id").equals(fileId).toArray();
  }, [fileId]);
};

export const useGetChunksByStatus = (status: ChunkStatus) => {
  useLiveQuery(async () => {
    return await db.chunks.where("status").equals(status).toArray();
  }, [status]);
};

export const useCreateChunks = () => {
  function createChunk(chunks: Chunk[]) {
    const keys = chunks.map((chunk) => chunk.id);
    return db.chunks.bulkAdd(chunks, keys, { allKeys: true });
  }

  return { createChunk };
};

export const useUpdateChunkById = () => {
  function updateChunk(id: string, chunk: Chunk) {
    return db.chunks.put(chunk, id);
  }

  return { updateChunk };
};

export const useDeleteById = () => {
  function removeChunk(id: string) {
    return db.chunks.delete(id);
  }

  return { removeChunk };
};
