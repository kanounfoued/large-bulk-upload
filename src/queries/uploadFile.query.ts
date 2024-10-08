import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { UploadFile } from "../model/uploadFile.model";

export const useGetFiles = ({ type }: { type: string }) => {
  return useLiveQuery(() =>
    db.files.where("type").equals(type).sortBy("timestamp")
  );
};

export const useGetFileById = (fileId: string) => {
  return useLiveQuery(() => {
    return db.files.where("file_id").equals(fileId).first();
  }, [fileId]);
};

export const useCreateFile = () => {
  async function createFile(file: UploadFile) {
    return await db.files.add(file, file.file_id);
  }

  return { createFile };
};

export const useUpdateFile = () => {
  async function updateFile(id: string, file: UploadFile) {
    return await db.files.put(file, id);
  }

  return { updateFile };
};

export const useDeleteFile = () => {
  async function deleteFile(id: string) {
    return await db.files.delete(id);
  }

  return { deleteFile };
};

export async function getFiles(type: string) {
  return await db.files.where("type").equals(type).sortBy("timestamp");
}

export async function getFile(id: string) {
  return await db.files.where("file_id").equals(id).first();
}
