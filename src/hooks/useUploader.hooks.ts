import { ChangeEvent, useState } from "react";
import { Chunk } from "../model/chunk.model";
import { v4 as uuidv4 } from "uuid";
import { chunkFile } from "../utils/file.util";
import { useCreateChunks } from "../queries/chunk.query";
import { useCreateFile } from "../queries/uploadFile.query";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size
const MAX_REQUEST_CONNECTIONS = 6;

export default function useUploader() {
  const [files, setFiles] = useState<File[] | null>(null);

  const { createChunk } = useCreateChunks();
  const { createFile } = useCreateFile();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    if (!files) {
      // TODO: trigger a notification error
      return;
    }

    const file_list: File[] = [];

    for (const file of files) file_list.push(file);

    setFiles(file_list);
  };

  // Function to finalize the upload and start file reassembly
  async function onFinalizeUpload(fileName: string, totalChunks: number) {
    const data = { fileName, totalChunks };

    const response = await fetch("http://localhost:3000/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("File reassembled successfully on server.");
    } else {
      console.error("Failed to finalize the upload:", await response.text());
    }
  }

  // Function to upload a single chunk
  async function uploadChunk(fileName: string, chunk: Blob, index: number) {
    const formData = new FormData();
    formData.append("fileChunk", chunk);
    formData.append("chunkIndex", `${index}`);
    formData.append("fileName", fileName);

    // Update this URL to your upload endpoint
    const uploadUrl = "http://localhost:3000/upload";

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      return response.ok;
    } catch (error) {
      console.error("Upload failed for chunk " + index, error);
      throw error; // Rethrow so we can catch it later
    }
  }

  // Main function to handle the file upload
  async function onUpload(file: File) {
    const chunks: Blob[] = chunkFile(file, MAX_CHUNK_SIZE);

    const file_id = uuidv4();

    const db_chunks = chunks.map((_, index) => {
      const id = uuidv4();

      return {
        id,
        file_id,
        file_name: file.name,
        chunk_index: index,
        status: "pending",
        number_of_retry: 0,
      } as Chunk;
    });

    createFile([
      {
        id: file_id,
        content: file,
        number_of_chunks: chunks.length,
        status: "pending",
      },
    ]);

    createChunk(db_chunks);

    for (let index = 0; index < chunks.length; index++) {
      try {
        await uploadChunk(
          file.name,
          chunks[index],
          index
          //       (progress) =>
          //   updateProgress(index, progress)
        );
        console.log(
          `Chunk ${index + 1} of ${chunks.length} uploaded successfully`
        );
      } catch (error) {
        console.error(`Error uploading chunk ${index + 1}:`, error);
        return; // Exit the upload process on error
      }
    }

    console.log("All chunks uploaded successfully");
    // Call onFinalizeUpload after all chunks are uploaded
    await onFinalizeUpload(file.name, chunks.length);
  }

  function onSubmit() {
    if (!files) {
      // TODO: trigger a notification error
      return;
    }

    if (files.length === 0) {
      // TODO: trigger a notification error
      return;
    }

    const largeFile = files[0];

    onUpload(largeFile);
  }

  return {
    onUpload,
    uploadChunk,
    onFinalizeUpload,
    onChange,
    onSubmit,
    files,
  };
}
