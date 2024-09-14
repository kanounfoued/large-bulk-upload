import { useRef } from "react";
import { QueueFn, QueueFnArgs } from "../model/queue.model";

export const MAX_REQUEST_CONNECTIONS = 6;

export default function useQueue() {
  const active_requests = useRef(0);

  const queue = useRef<
    {
      fnCall: QueueFn;
      args?: QueueFnArgs;
    }[]
  >([]);

  const enqueue = (fnCall: QueueFn, args?: QueueFnArgs) => {
    queue.current.push({ fnCall, args });
  };

  const dequeue = async () => {
    if (queue.current.length === 0) return;

    if (active_requests.current < MAX_REQUEST_CONNECTIONS) {
      const { fnCall, args } = queue.current.shift() ?? {};

      if (!fnCall || !args) return;

      active_requests.current += 1;

      return await fnCall(args).then(async () => {
        active_requests.current -= 1;
        return Promise.resolve({ ...args, fnCallName: fnCall.name });
      });
    }
  };

  const resetQueue = () => {
    active_requests.current = 0;
    queue.current = [];
  };

  return {
    enqueue,
    dequeue,
    resetQueue,
    queue: queue.current,
  };
}
