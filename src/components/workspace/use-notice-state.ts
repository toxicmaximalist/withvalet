"use client";

import { useState } from "react";

type NoticeState = {
  error?: string;
  success?: string;
};

export function useNoticeState(initialError?: string, initialSuccess?: string) {
  const [notice, setNotice] = useState<NoticeState>({
    error: initialError,
    success: initialSuccess,
  });

  return {
    error: notice.error,
    setNotice,
    showError(message: string) {
      setNotice({ error: message, success: undefined });
    },
    showSuccess(message: string) {
      setNotice({ error: undefined, success: message });
    },
    success: notice.success,
  };
}
