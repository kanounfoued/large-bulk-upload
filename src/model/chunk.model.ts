export type ChunkStatus =
  | "pending"
  | "success"
  | "error"
  | "progress"
  | "paused";

export type Chunk = {
  chunk_id: string;
  content: Blob;
  file_name: string;
  file_id: string;
  chunk_index: number;
  status: ChunkStatus;
  type: string;
  number_of_retry: number;
  timestamp: number;
};
