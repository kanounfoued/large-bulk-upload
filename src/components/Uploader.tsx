import useUploader from "../hooks/useUploader.hooks";
import FileTab from "./FileTab";

export default function Uploader() {
  const {
    uploadFiles,
    files,
    isProcessing,
    isResumable,
    isUploading,
    isSkipResumable,
    onChange,
    onUpload,
    onResume,
    handleIsSkipResumable,
    // onChangeAutoUploadAfterPageLoading,
    // handleFileProcessingState,
    // handleUploadingState,
  } = useUploader({
    type: "dataset",
  });

  const isUploadDisabled = isUploading || !files?.length || isProcessing;

  const isResumeDisabled =
    isUploading || uploadFiles?.length === 0 || isProcessing;

  return (
    <div>
      <div className="button-section">
        {/* <button onClick={onChangeAutoUploadAfterPageLoading}>
          auto save onLoad
        </button> */}

        {/* <button
          onClick={() => {
            handleFileProcessingState(true);
            handleUploadingState(false);
          }}
        >
          toggle processing
        </button>
        <button onClick={() => handleFileProcessingState(false)}>
          Stop processing
        </button> */}

        {!isSkipResumable && isResumable ? (
          <>
            <button disabled={isResumeDisabled} onClick={onResume}>
              resume uploads
            </button>
            <button onClick={() => handleIsSkipResumable(true)}>
              Skip resuming files
            </button>
          </>
        ) : null}
      </div>
      <div className="upload-component">
        <input type="file" onChange={onChange} multiple />
        <button disabled={isUploadDisabled} onClick={onUpload}>
          upload
        </button>
      </div>
      {isProcessing ? (
        <>
          <h3>Processing ....</h3>
          <p>Please do not refresh or change the page</p>
        </>
      ) : null}

      {isProcessing || uploadFiles?.length === 0 ? (
        <div>No file or chunk found to upload </div>
      ) : (
        <>
          <p>Current Uploads</p>
          <div className="files-list">
            {files?.map((file) => (
              <FileTab key={file?.file_id} file={file} />
            ))}
          </div>

          <p>Resumable Uploads</p>
          {!isSkipResumable || isResumable ? (
            <div className="files-list">
              {uploadFiles?.map((file) => (
                <FileTab key={file.file_id} file={file} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
