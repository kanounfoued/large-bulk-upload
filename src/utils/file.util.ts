// Helper function to split file into chunks
export function chunkFile(file: File, chunkSize: number) {
  const chunks = [];
  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
  }

  return chunks;
}
