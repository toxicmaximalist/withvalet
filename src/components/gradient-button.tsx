import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type GradientButtonProps =
  | ({ href: string } & ComponentPropsWithoutRef<typeof Link>)
  | ({ href?: never } & ComponentPropsWithoutRef<"button">);

const buttonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-strong via-[#ea3a42] to-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-[0_12px_40px_rgba(214,31,44,0.24)] hover:scale-[1.01] hover:shadow-[0_18px_52px_rgba(214,31,44,0.28)]";

export function GradientButton(props: GradientButtonProps) {
  if ("href" in props && props.href) {
    const { className, href, ...rest } = props;

    return <Link href={href} className={cn(buttonClassName, className)} {...rest} />;
  }

  const { className, type = "button", ...rest } =
    props as ComponentPropsWithoutRef<"button">;

  return <button type={type} className={cn(buttonClassName, className)} {...rest} />;
}
