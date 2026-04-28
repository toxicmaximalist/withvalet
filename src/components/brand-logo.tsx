import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = 32,
  rounded = true,
}: {
  className?: string;
  size?: number;
  rounded?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="WithValet logo"
      width={size}
      height={size}
      className={cn("shrink-0", rounded && "rounded-full", className)}
      priority
    />
  );
}
