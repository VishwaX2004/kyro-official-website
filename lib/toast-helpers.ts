import toast from 'react-hot-toast';

/**
 * Show a loading toast and return its ID for later replacement
 */
export function showLoadingToast(message: string): string {
  return toast.loading(message);
}

/**
 * Replace a loading toast with a success message
 */
export function replaceWithSuccess(toastId: string, message: string): void {
  toast.dismiss(toastId);
  toast.success(message, { duration: 4000 });
}

/**
 * Replace a loading toast with an error message
 */
export function replaceWithError(toastId: string, message: string): void {
  toast.dismiss(toastId);
  toast.error(message, { duration: 6000 });
}

/**
 * Extract error message from API response or return fallback
 */
export function extractErrorMessage(data: unknown, fallback: string = 'Something went wrong. Please try again.'): string {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      return obj.message;
    }
    if (typeof obj.error === 'string') {
      return obj.error;
    }
  }
  return fallback;
}
