import { useState } from "react";

export default function useResumeUploads() {
  const [isResumable, setIsResumable] = useState<boolean>(false);

  // TODO: integrate index db or local storage for long term usage of the user's response.
  function onResumeUploads(isQueueFull: boolean) {
    setIsResumable(isQueueFull);
  }

  return {
    isResumable,
    onResumeUploads,
  };
}
