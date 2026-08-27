import { toast } from 'sonner';
import { getResponseMessage } from '@/lib/response-codes';

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error);

  let errMsg = getResponseMessage(error);

  if (error && typeof error === 'object' && 'status' in error && Number(error.status) === 204) {
    errMsg = 'Content not found.';
  }

  toast.error(errMsg);
}
