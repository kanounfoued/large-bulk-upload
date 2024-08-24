import { ChangeEvent, useState } from "react";

export default function useUploader() {
  const [files, setFiles] = useState<FileList | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
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

  // Helper function to split file into chunks
  function sliceFile(file: File, chunkSize: number) {
    let chunks = [];
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }
    return chunks;
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
  async function uploadFile(file: File) {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size
    const chunks: Blob[] = sliceFile(file, CHUNK_SIZE);

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

    uploadFile(largeFile);
  }

  return {
    uploadFile,
    uploadChunk,
    onFinalizeUpload,
    onChange,
    onSubmit,
    files,
  };
}
