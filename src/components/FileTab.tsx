import { UploadFile } from "../model/uploadFile.model";
import { useState } from "react";
import {
  useDeleteByFileId,
  useGetChunksByFileId,
} from "../queries/chunk.query";
import { useDeleteById } from "../queries/uploadFile.query";

type Props = {
  file: UploadFile;
};

export default function FileTab({ file }: Props) {
  const [open, setOpen] = useState(false);
  const progress = 70;

  const chunks = useGetChunksByFileId(file.file_id);

  const { removeFile } = useDeleteById();
  const { removeChunks } = useDeleteByFileId();

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  const onRemove = () => {
    removeFile(file.file_id);
    removeChunks(file.file_id);
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
