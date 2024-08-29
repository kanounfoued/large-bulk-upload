import useUploader from "../hooks/useUploader.hooks";
import { useGetFiles } from "../queries/uploadFile.query";
import FileTab from "./FileTab";

export default function Uploader() {
  const { onChange, onUpload, isProcessing } = useUploader({
    type: "dataset",
  });

  const files = useGetFiles({ type: "dataset" });

  return (
    <div>
      <div className="upload-component">
        <input type="file" onChange={onChange} multiple />
        <button
          onClick={() => {
            // console.log("time", performance.now());
            onUpload();
          }}
        >
          upload
        </button>
      </div>

      {isProcessing ? <h3>Processing ....</h3> : null}

      {files?.length === 0 ? (
        <div>No file or chunk found to upload </div>
      ) : (
        <div className="files-list">
          {files?.map((file) => (
            <FileTab key={file.file_id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
