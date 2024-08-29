import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { Chunk, ChunkStatus } from "../model/chunk.model";

// export const useGetRequests = () => {
//   return useLiveQuery(() =>
//     db.requests.orderBy("chunk_index").sortBy("chunk_index")
//   );
// };

// export const useGetRequestById = (requestId: string) => {
//   return useLiveQuery(async () => {
//     return await db.requests.where("chunk_id").equals(requestId).toArray();
//   }, [requestId]);
// };

// export const useGetRequestByFileName = (fileName: string) => {
//   return useLiveQuery(() => {
//     return db.requests.where("file_name").equals(fileName).toArray();
//   }, [fileName]);
// };

// export const useGetRequestsByFileId = (fileId: string) => {
//   return useLiveQuery(() => {
//     return db.requests.where("file_id").equals(fileId).toArray();
//   }, [fileId]);
// };

// export const useGetRequestsByStatus = (status: ChunkStatus) => {
//   return useLiveQuery(() => {
//     return db.requests.where("status").equals(status).sortBy("chunk_index");
//   }, [status]);
// };

// export const useCreateRequests = () => {
//   async function createRequests(requests: Chunk[]) {
//     const keys = requests.map((request) => request.chunk_id);
//     return await db.requests.bulkAdd(requests, keys, { allKeys: true });
//   }

//   return { createRequests };
// };

// export const useUpdateRequestById = () => {
//   async function updateRequest(id: string, request: Chunk) {
//     return await db.requests.put(request, id);
//   }

//   return { updateRequest };
// };

// export const useDeleteById = () => {
//   async function removeRequest(id: string) {
//     return await db.requests.delete(id);
//   }

//   return { removeRequest };
// };

// export const useDeleteByFileId = () => {
//   async function removeRequests(fileId: string) {
//     return await db.requests.where("file_id").equals(fileId).delete();
//   }

//   return { removeRequests };
// };

// export async function getRequests() {
//   return await db.requests.orderBy("chunk_index").sortBy("chunk_index");
// }

// export async function getRequest(id: string) {
//   return await db.requests.where("chunk_id").equals(id).first();
// }
