import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { UploadFile, UploadFileStatus } from "../model/uploadFile.model";

export const useGetFiles = ({ type }: { type: string }) => {
  return useLiveQuery(() =>
    db.files.where("type").equals(type).sortBy("timestamp")
  );
};

export const useGetFileById = (fileId: string) => {
  return useLiveQuery(() => {
    return db.files.where("id").equals(fileId).toArray();
  }, [fileId]);
};

export const useGetFilesByStatus = (type: string, status: UploadFileStatus) => {
  return useLiveQuery(() => {
    return db.files.where(["type", "status"]).equals([type, status]).toArray();
  }, [status]);
};

export const useCreateFile = () => {
  async function createFile(files: UploadFile[]) {
    const keys = files.map((file) => file.id);
    return await db.files.bulkAdd(files, keys, { allKeys: true });
  }

  return { createFile };
};

export const useUpdateFileById = () => {
  async function updateFile(id: string, file: UploadFile) {
    return await db.files.put(file, id);
  }

  return { updateFile };
};

export const useDeleteById = () => {
  async function removeFile(id: string) {
    return await db.files.delete(id);
  }

  return { removeFile };
};

export async function getFiles(type: string) {
  return await db.files.where("type").equals(type).sortBy("timestamp");
}

export async function getFileById(id: string) {
  //   return db.files.get({ id });
  return await db.files.filter((obj) => obj.id === id).first();
}
