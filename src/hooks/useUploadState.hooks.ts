import { useState } from "react";

export default function useUploadState() {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleUploadingState = (isUploading: boolean) => {
    setIsUploading(isUploading);
  };

  return {
    isUploading,
    handleUploadingState,
  };
}
