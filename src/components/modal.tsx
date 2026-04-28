"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModalProps = {
  children: React.ReactNode;
  className?: string;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Modal({
  children,
  className,
  description,
  onClose,
  open,
  title,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "panel-strong w-full max-w-2xl rounded-[32px] border border-white/10 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)] sm:p-8",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
