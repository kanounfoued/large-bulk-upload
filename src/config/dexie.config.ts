import Dexie, { type EntityTable } from "dexie";
import { Chunk } from "../model/chunk.model";
import { UploadFile } from "../model/uploadFile.model";

const db = new Dexie("upload_db") as Dexie & {
  files: EntityTable<UploadFile, "id">;
  chunks: EntityTable<Chunk, "id">;
};

// Schema declaration:
db.version(1).stores({
  files: ", content, status, number_of_chunks",
  chunks: ", file_name, chunk_index, file_id, status, number_of_retry",
});

export { db };
