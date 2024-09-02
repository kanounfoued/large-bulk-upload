import { useRef } from "react";
import { useDeleteChunk } from "../queries/chunk.query";
import { useDeleteFile } from "../queries/uploadFile.query";
import { QueueFn, QueueFnArgs } from "../model/queue.model";

export const MAX_REQUEST_CONNECTIONS = 6;

export default function useUploadRequestQueue() {
  const active_requests = useRef(0);

  const { deleteChunk } = useDeleteChunk();
  const { deleteFile } = useDeleteFile();

  const queue = useRef<
    {
      fnCall: QueueFn;
      args?: QueueFnArgs;
    }[]
  >([]);

  const enqueue = (fnCall: QueueFn, args?: QueueFnArgs) => {
    queue.current.push({ fnCall, args });
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
    queue: queue.current,
  };
}
