"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  loading,
  pendingLabel = "Saving...",
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = loading ?? formPending;

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={pending || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-strong via-[#ea3a42] to-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-[0_12px_40px_rgba(214,31,44,0.24)] hover:scale-[1.01] hover:shadow-[0_18px_52px_rgba(214,31,44,0.28)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
