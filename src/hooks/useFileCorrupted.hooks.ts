import { UploadFile } from "../model/uploadFile.model";
import { getChunksByFileId } from "../queries/chunk.query";

export default function useFileCorrupted() {
  const isFileCorrupted = async (file: UploadFile) => {
    const { is_processed } = file;

    if (!is_processed) return true;

    const chunks = await getChunksByFileId(file.file_id);

    if (chunks.length === 0 && !is_processed) return true;
    if (chunks.length === 0) return true;

    // the file is valid.
    if (file.number_of_chunks === chunks.length) {
      return false;
    }

    // let's assume that the chunks are coming in order.
    // and the upload is happening on order too.

    const last_chunk = chunks[chunks.length - 1];

    // the file still valid.
    if (last_chunk.chunk_index === file.number_of_chunks - 1) {
      return false;
    }

    // otherwise it means the chunks were not all inserted in the processing phase.
    return true;

    // it can be other cases.
    // TODO: in case the upload is not happening in order, need to think about it.
  };

  return {
    isFileCorrupted,
  };
}
