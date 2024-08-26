import Dexie, { type EntityTable } from "dexie";
import { Chunk } from "../model/chunk.model";
import { UploadFile } from "../model/uploadFile.model";

const db = new Dexie("upload_db") as Dexie & {
  files: EntityTable<UploadFile, "id">;
  chunks: EntityTable<Chunk, "id">;
  requests: EntityTable<Chunk, "id">;
};

// Schema declaration:
db.version(1).stores({
  files: ", content, status, number_of_chunks, type, timestamp",
  chunks:
    ", file_name, chunk_index, file_id, status, number_of_retry, timestamp",
  requests:
    ", file_name, chunk_index, file_id, status, number_of_retry, timestamp",
});

export { db };
