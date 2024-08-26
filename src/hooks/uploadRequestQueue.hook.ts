import {
  useDequeueRequest,
  useGetRequests,
  useQueueRequest,
} from "../queries/request.query";

export default function useUploadRequestQueue() {
  const requests = useGetRequests();
  const { dequeue } = useDequeueRequest();
  const { queue } = useQueueRequest();

  return {
    queue,
    dequeue,
    requests,
  };
}
