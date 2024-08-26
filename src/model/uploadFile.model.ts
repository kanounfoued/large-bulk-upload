export type UploadFileStatus =
  | "pending"
  | "success"
  | "error"
  | "progress"
  | "paused";

export type UploadFile = {
  id: string;
  content: File;
  number_of_chunks: number;
  status: UploadFileStatus;
  timestamp: number;
  type: string;
};
