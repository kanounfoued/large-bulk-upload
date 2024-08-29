import { useState } from "react";

export default function useAutoUpload() {
  const [autoUploadOnPageLoading, setAutoUploadOnPageLoading] =
    useState<boolean>(false);

  const [autoUploadOnFileLoading, setAutoUploadOnFileLoading] =
    useState<boolean>(false);

  const onChangeAutoUploadAfterPageLoading = () => {
    setAutoUploadOnPageLoading((prev) => !prev);
  };

  const onChangeAutoUploadAfterFileLoading = () => {
    setAutoUploadOnFileLoading((prev) => !prev);
  };

  return {
    autoUploadOnPageLoading,
    autoUploadOnFileLoading,
    onChangeAutoUploadAfterPageLoading,
    onChangeAutoUploadAfterFileLoading,
  };
}
