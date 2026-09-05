import Image from "next/image";
import Link from "next/link";

import { cn } from "@/utils/cn";

interface SiteLogoProps {
  compact?: boolean;
  className?: string;
  priority?: boolean;
}

export function SiteLogo({
  compact = false,
  className,
  priority = false,
}: SiteLogoProps) {
  const imageSize = compact ? 38 : 64;

  return (
    <Link
      aria-label="ACRUX ROBOCEP — página inicial"
      className={cn("group inline-flex items-center gap-2.5", className)}
      href="/"
    >
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 transition-shadow duration-200 group-hover:shadow-[0_0_1.35rem_rgba(75,212,232,0.38)]",
          compact ? "h-9.5 w-9.5" : "h-16 w-16",
        )}
      >
        <Image
          alt="Logo da ACRUX ROBOCEP"
          height={imageSize}
          priority={priority}
          sizes={compact ? "38px" : "64px"}
          src="/brand/acrux-logo.jpg"
          width={imageSize}
        />
      </span>
      <span className="grid leading-none">
        <span className="text-sm font-black tracking-[0.16em] text-white">ACRUX</span>
        <span className="mt-1 text-[0.63rem] font-bold tracking-[0.18em] text-acrux-muted">
          ROBOCEP
        </span>
      </span>
    </Link>
  );
}

