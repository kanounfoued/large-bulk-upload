import axios from "axios";
import { Chunk } from "../model/chunk.model";
import { UploadFile } from "../model/uploadFile.model";

export async function uploadChunk({
  chunk,
}: {
  chunk: Chunk;
  file: UploadFile;
}) {
  const formData = new FormData();
  formData.append("fileChunk", chunk.content);
  formData.append("chunkIndex", `${chunk.chunk_index}`);
  formData.append("fileName", chunk.file_name);

  // Update this URL to your upload endpoint
  const uploadUrl = "http://localhost:3000/upload";

  try {
    const response = await axios({
      url: uploadUrl,
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // onUploadProgress: async (progressEvent) => {
      //   console.log("progressEvent", progressEvent);
      //   const { progress } = progressEvent;

      //   const f = await db.files.where("file_id").equals(file_id).first();
      //   console.log("file", f);

      //   await db.files.update(file_id, {
      //     progress,
      //   });
      // },
      data: formData,
    });

    return response.data;
  } catch (error) {
    console.error("Upload failed for chunk " + chunk.chunk_index, error);
    throw error; // Rethrow so we can catch it later
  }
}

// Function to finalize the upload and start file reassembly
export async function finalizeUpload({
  file,
}: {
  file: UploadFile;
  chunk: Chunk;
}) {
  try {
    const data = {
      fileName: file.file_name,
      totalChunks: file.number_of_chunks,
    };

    const response = await axios({
      url: "http://localhost:3000/finalize",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to finalize the upload:", error);
  }
}
