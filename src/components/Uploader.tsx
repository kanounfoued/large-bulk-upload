import useUploader from "../hooks/useUploader.hooks";
import FileTab from "./FileTab";

export default function Uploader() {
  const {
    indexed_files,
    onChange,
    onUpload,
    isProcessing,
    resumeDownloads,
    onChangeAutoUploadOnLoad,
    onResumeDoawnloads,
  } = useUploader({
    type: "dataset",
  });

  return (
    <div>
      <button onClick={() => onChangeAutoUploadOnLoad()}>
        auto save onLoad
      </button>
      {resumeDownloads ? (
        <button onClick={onResumeDoawnloads}>resume downloads</button>
      ) : null}

      <div className="upload-component">
        <input type="file" onChange={onChange} multiple />
        <button
          onClick={() => {
            onUpload();
          }}
        >
          upload
        </button>
      </div>

      {isProcessing ? <h3>Processing ....</h3> : null}

      {indexed_files?.length === 0 ? (
        <div>No file or chunk found to upload </div>
      ) : (
        <div className="files-list">
          {indexed_files?.map((file) => (
            <FileTab key={file.file_id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
