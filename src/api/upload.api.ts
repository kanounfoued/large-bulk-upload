import axios from "axios";

export async function uploadChunk(
  fileName: string,
  chunk: Blob,
  index: number,
  onUploadEnd?: () => Promise<void>
) {
  const formData = new FormData();
  formData.append("fileChunk", chunk);
  formData.append("chunkIndex", `${index}`);
  formData.append("fileName", fileName);

  // Update this URL to your upload endpoint
  const uploadUrl = "http://localhost:3000/upload";

  try {
    const response = await axios(uploadUrl, {
      method: "POST",
      data: formData,
    });

    await onUploadEnd?.();

    return response.data;
  } catch (error) {
    console.error("Upload failed for chunk " + index, error);
    throw error; // Rethrow so we can catch it later
  }
}

// Function to finalize the upload and start file reassembly
export async function finalizeUpload(fileName: string, totalChunks: number) {
  const data = { fileName, totalChunks };

  const response = await axios("http://localhost:3000/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data,
  });

  if (response.statusText === "OK") {
    console.log("File reassembled successfully on server.");
  } else {
    console.error("Failed to finalize the upload:", await response.data.text());
  }
}
