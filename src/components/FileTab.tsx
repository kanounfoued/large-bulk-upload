import { UploadFile } from "../model/uploadFile.model";
import { useState } from "react";
import { useGetChunksByFileId } from "../queries/chunk.query";

type Props = {
  file: UploadFile;
};

export default function FileTab({ file }: Props) {
  const [open, setOpen] = useState(false);
  const progress = 70;

  const chunks = useGetChunksByFileId(file.id);

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div key={file.id} className="file-section">
      <div>
        <div className="file-title">
          <h3>{file.content.name}</h3>
          <button onClick={onToggle}>toggle</button>
        </div>
        <progress style={{ width: "100%" }} max="100" value={progress}>
          {progress} %
        </progress>
      </div>

      {open ? (
        <div className="chunk-section">
          {chunks?.map((chunk) => (
            <div key={chunk.id}>
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
