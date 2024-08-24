import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../config/dexie.config";
import { UploadFile, UploadFileStatus } from "../model/uploadFile.model";

export const useGetFiles = () => {
  return useLiveQuery(() => db.files.toArray());
};

export const useGetFileById = (fileId: string) => {
  useLiveQuery(async () => {
    return await db.files.where("id").equals(fileId).toArray();
  }, [fileId]);
};

export const useGetFilesByStatus = (status: UploadFileStatus) => {
  useLiveQuery(async () => {
    return await db.files.where("status").equals(status).toArray();
  }, [status]);
};

export const useCreateFile = () => {
  function createFile(files: UploadFile[]) {
    const keys = files.map((file) => file.id);
    return db.files.bulkAdd(files, keys, { allKeys: true });
  }

  return { createFile };
};

export const useUpdateFileById = () => {
  function updateFile(id: string, file: UploadFile) {
    return db.files.put(file, id);
  }

  return { updateFile };
};

export const useDeleteById = () => {
  function removeFile(id: string) {
    return db.files.delete(id);
  }

  return { removeFile };
};
