import useUploader from "../hooks/useUploader.hooks";
import { useGetFiles } from "../queries/uploadFile.query";
import FileTab from "./FileTab";

export default function Uploader() {
  const { onChange, onSubmit } = useUploader();

  const files = useGetFiles();

  return (
    <div>
      <div className="upload-component">
        <input type="file" onChange={onChange} multiple />
        <button onClick={onSubmit}>upload</button>
      </div>

      {files?.length === 0 ? (
        <div>No file or chunk found to upload </div>
      ) : (
        <div className="files-list">
          {files?.map((file) => (
            <FileTab key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
