import { useState } from "react";

export default function useUploadState() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setProcessing] = useState<boolean>(false);

  const handleUploadingState = (isUploading: boolean) => {
    setIsUploading(isUploading);
  };

  const handleProcessingState = (isProcessing: boolean) => {
    setProcessing(isProcessing);
  };

  return {
    isUploading,
    isProcessing,
    handleUploadingState,
    handleProcessingState,
  };
}
