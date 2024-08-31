import Dexie, { type EntityTable } from "dexie";
import { Chunk } from "../model/chunk.model";
import { UploadFile } from "../model/uploadFile.model";

const db = new Dexie("upload_db") as Dexie & {
  files: EntityTable<UploadFile, "file_id">;
  chunks: EntityTable<Chunk, "chunk_id">;
};

// Schema declaration:
db.version(1).stores({
  files:
    "file_id, file_name, content, status, number_of_chunks, type, timestamp, [file_id]",
  chunks:
    "chunk_id, file_name, chunk_index, file_id, status, number_of_retry, timestamp, type, progress, [chunk_id], [type]",
});

export { db };
