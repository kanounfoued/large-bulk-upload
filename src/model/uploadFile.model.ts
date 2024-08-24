export type UploadFileStatus =
  | "pending"
  | "success"
  | "error"
  | "progress"
  | "paused";

export interface UploadFile {
  id: string;
  content: File;
  number_of_chunks: number;
  status: UploadFileStatus;
}
