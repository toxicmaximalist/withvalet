import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeBannerProps = {
  className?: string;
  error?: string;
  success?: string;
};

export function NoticeBanner({
  className,
  error,
  success,
}: NoticeBannerProps) {
  const message = error ?? success;

  if (!message) {
    return null;
  }

  const isError = Boolean(error);

  return (
    <div
      className={cn(
        "panel flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
        isError
          ? "border-danger/30 bg-danger/8 text-danger"
          : "border-accent/30 bg-accent/10 text-accent-foreground",
        className,
      )}
    >
      {isError ? (
        <AlertCircle className="size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="size-4 shrink-0" />
      )}
      <p>{message}</p>
    </div>
  );
}
