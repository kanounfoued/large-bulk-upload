import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { Chunk, ChunkStatus } from "../model/chunk.model";

export const MAX_REQUEST_CONNECTIONS = 6;

export const useGetRequests = () => {
  return useLiveQuery(() =>
    db.requests.where({ status: "progress" }).sortBy("chunk_index")
  );
};

export const useGetRequestById = (requestId: string) => {
  return useLiveQuery(async () => {
    return await db.requests.where("id").equals(requestId).toArray();
  }, [requestId]);
};

export const useGetRequestByFileName = (fileName: string) => {
  return useLiveQuery(() => {
    return db.requests.where("file_name").equals(fileName).toArray();
  }, [fileName]);
};

export const useGetRequestsByFileId = (fileId: string) => {
  return useLiveQuery(() => {
    return db.requests.where("file_id").equals(fileId).toArray();
  }, [fileId]);
};

export const useGetRequestsByStatus = (status: ChunkStatus) => {
  return useLiveQuery(() => {
    return db.requests.where("status").equals(status).sortBy("chunk_index");
  }, [status]);
};

export const useCreateRequests = () => {
  async function createRequests(requests: Chunk[]) {
    const keys = requests.map((request) => request.id);
    return await db.requests.bulkAdd(requests, keys, { allKeys: true });
  }

  return { createRequests };
};

export const useUpdateRequestById = () => {
  async function updateRequest(id: string, request: Chunk) {
    return await db.requests.put(request, id);
  }

  return { updateRequest };
};

export const useDeleteById = () => {
  async function removeRequest(id: string) {
    return await db.requests.delete(id);
  }

  return { removeRequest };
};

export const useDeleteByFileId = () => {
  async function removeRequests(fileId: string) {
    return await db.requests.where("file_id").equals(fileId).delete();
  }

  return { removeRequests };
};

export const useQueueRequest = () => {
  async function queue(reqs: Chunk[]) {
    const requests = await getRequests();

    if (requests.length >= MAX_REQUEST_CONNECTIONS) return 0;

    const keys = reqs.map((request) => request.id);

    const request = await requests.filter((obj) => obj.id === keys[0]);
    if (request.length > 0) return 0;

    await db.requests.bulkAdd(reqs, keys, { allKeys: true });
    return 1;
  }

  return { queue };
};

export const useDequeueRequest = () => {
  const { removeRequest } = useDeleteById();

  async function dequeue() {
    const requests = await getRequests();

    if (requests.length === 0) return undefined;

    const request = { ...requests[0] };
    await removeRequest(request.id);
    return request;
  }

  return { dequeue };
};

export async function getRequests() {
  return await db.requests.orderBy("chunk_index").sortBy("chunk_index");
}

export async function popRequest() {
  const requests = await await db.requests
    .orderBy("chunk_index")
    .sortBy("chunk_index");

  if (requests.length > 0) return requests[0];
  return undefined;
}
