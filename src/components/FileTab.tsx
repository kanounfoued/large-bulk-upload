import { UploadFile } from "../model/uploadFile.model";
import { useEffect, useState } from "react";
import {
  useDeleteByFileId,
  useGetChunksByFileId,
} from "../queries/chunk.query";
import { useDeleteFile } from "../queries/uploadFile.query";

type Props = {
  file: UploadFile;
};

export default function FileTab({ file }: Props) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const chunks = useGetChunksByFileId(file.file_id);

  useEffect(() => {
    if (!chunks) return;

    const diff = file.number_of_chunks - chunks?.length;

    setProgress((diff / file.number_of_chunks) * 100);
  }, [chunks?.length]);

  const { deleteFile } = useDeleteFile();
  const { deleteChunks } = useDeleteByFileId();

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  const onRemove = async () => {
    await deleteFile(file.file_id);
    await deleteChunks(file.file_id);
  };

  return (
    <div key={file.file_id} className="file-section">
      <div>
        <div className="file-title">
          <h3>{file.content.name}</h3>
          <button onClick={onRemove}>remove</button>
          <button onClick={onToggle}>toggle</button>
        </div>
        <progress style={{ width: "100%" }} max="100" value={progress}>
          {progress} %
        </progress>
      </div>

      {open ? (
        <div className="chunk-section">
          {chunks?.map((chunk) => (
            <div key={chunk.chunk_id}>
              <div className="card">
                <div>
                  <div className="card-title">{chunk.file_name}</div>
                  <div className="card-id">{chunk.file_id}</div>
                </div>

                <span className="badge">{chunk.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
