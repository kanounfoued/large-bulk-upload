import { useEffect, useRef } from "react";
import { Chunk } from "../model/chunk.model";
import { UploadFile } from "../model/uploadFile.model";
import { useDeleteChunk } from "../queries/chunk.query";
import { useDeleteFile } from "../queries/uploadFile.query";

export const MAX_REQUEST_CONNECTIONS = 6;

type Props = {
  // type: string;
  isProcessing: boolean;
  autoUploadOnPageLoading: boolean;
  // autoUploadOnFileLoading: boolean;
  // onUploadEnd: () => void;
};

export type FnCallArgs = { chunk: Chunk; file: UploadFile };
export type FnCall = (
  props: FnCallArgs
) => Promise<{ chunk: Chunk; file: UploadFile }>;

export default function useUploadRequestQueue({
  isProcessing,
  autoUploadOnPageLoading,
}: Props) {
  const active_requests = useRef(0);

  const { deleteChunk } = useDeleteChunk();
  const { deleteFile } = useDeleteFile();

  const queue = useRef<
    {
      fnCall: FnCall;
      args?: FnCallArgs;
    }[]
  >([]);

  useEffect(() => {
    if (isProcessing) {
      active_requests.current = 0;
      queue.current = [];
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isProcessing) return;

    // auto upload whenever the user load the page.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnPageLoading = true | false
    if (autoUploadOnPageLoading) {
      dequeuePerMax();
    }
  }, [isProcessing, autoUploadOnPageLoading]);

  const enqueue = async (fnCall: FnCall, args?: FnCallArgs) => {
    return new Promise(() => {
      queue.current.push({ fnCall, args });

      // dequeue();
    });

    // auto upload whenever the user load the docs.
    // in case of auto upload, but need to be configured by the user.
    // the response can be stored in the storage.
    // autoUploadOnFileLoading = true | false
  };

  const dequeue = async (): Promise<any> => {
    if (queue.current.length === 0) return;

    if (active_requests.current < MAX_REQUEST_CONNECTIONS) {
      const { fnCall, args } = queue.current.shift() ?? {};

      if (!fnCall || !args) return;

      active_requests.current += 1;

      return await fnCall(args)
        .then(async () => {
          active_requests.current -= 1;

          const { chunk } = args;
          deleteChunk(chunk.chunk_id);

          if (fnCall.name === "finalizeUpload") {
            deleteFile(chunk.file_id);
          }

          dequeuePerMax();

          return Promise.resolve({ ...args, fnCallName: fnCall.name });
        })
        .catch((error) => {
          /** TODO: handle error
           *
           * if it fails on level of uploadFile
           * if it fails on level of finalizeUpload
           *
           */
          return Promise.reject(error);
        });
    }
  };

  const resetQueue = () => {
    active_requests.current = 0;
    queue.current = [];
  };

  const dequeuePerMax = async () => {
    for (let i = 0; i < MAX_REQUEST_CONNECTIONS; i++) dequeue();
  };

  return {
    enqueue,
    dequeue,
    dequeuePerMax,
    resetQueue,
  };
}
