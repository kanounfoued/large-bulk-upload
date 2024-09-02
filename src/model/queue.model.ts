import { Chunk } from "./chunk.model";
import { UploadFile } from "./uploadFile.model";

export type QueueFnArgs = { chunk: Chunk; file: UploadFile };

export type QueueFn = (
  props: QueueFnArgs
) => Promise<{ chunk: Chunk; file: UploadFile }>;
