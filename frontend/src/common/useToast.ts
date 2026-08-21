import { useState } from 'react'

export type Toast = { message: string; kind?: "error" | "success" };

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = (message: string, kind: Toast["kind"] = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3500);
  };
  return { toast, notify };
}
