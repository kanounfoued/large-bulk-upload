export type ChunkStatus =
  | "pending"
  | "success"
  | "error"
  | "progress"
  | "paused";

export interface Chunk {
  id: string;
  file_name: string;
  file_id: string;
  chunk_index: number;
  status: ChunkStatus;
  number_of_retry: number;
}
