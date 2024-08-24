import useUploader from "../hooks/useUploader.hooks";

export default function Uploader() {
  const { onChange, onSubmit } = useUploader();

  return (
    <>
      <input type="file" onChange={onChange} />

      <button onClick={onSubmit}>upload</button>
    </>
  );
}
