import { useState } from 'react'

export type Toast = { message: string; kind?: "error" | "success" };

// Callback screens receive for surfacing success/error toasts.
export type Notify = (message: string, kind?: Toast["kind"]) => void;

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify: Notify = (message, kind = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3500);
  };
  return { toast, notify };
}
