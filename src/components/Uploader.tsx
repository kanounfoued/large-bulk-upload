import useUploader from "../hooks/useUploader.hooks";
import FileTab from "./FileTab";

export default function Uploader() {
  const {
    indexed_files,
    onChange,
    onUpload,
    isProcessing,
    isResumable,
    isUploading,
    onChangeAutoUploadAfterPageLoading,
    onResumeUploads,
    handleProcessingState,
    handleUploadingState,
  } = useUploader({
    type: "dataset",
  });

  return (
    <div>
      <div className="button-section">
        <button onClick={onChangeAutoUploadAfterPageLoading}>
          auto save onLoad
        </button>

        <button
          onClick={() => {
            handleProcessingState(true);
            handleUploadingState(false);
          }}
        >
          toggle processing
        </button>
        <button onClick={() => handleProcessingState(false)}>
          Stop processing
        </button>

        {isResumable ? (
          <button onClick={onResumeUploads}>resume downloads</button>
        ) : null}
      </div>

      <div className="upload-component">
        <input type="file" onChange={onChange} multiple />
        <button disabled={isUploading || isProcessing} onClick={onUpload}>
          upload
        </button>
      </div>

      {isProcessing ? (
        <>
          <h3>Processing ....</h3>
          <p>Please do not refresh or change the page</p>
        </>
      ) : null}

      {isProcessing || indexed_files?.length === 0 ? (
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
