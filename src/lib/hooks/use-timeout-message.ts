import { AuthMessage } from "@/features/auth/form-message";
import { useEffect, useState } from "react";

export function useTimeoutMessage(timeout: number = 5000) {
  const [message, setMessage] = useState<AuthMessage | null>(null);

  useEffect(() => {
    if (!message) return;

    const timeoutId = setTimeout(() => {
      setMessage(null);
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [message, timeout]);

  return [message, setMessage] as const;
}
