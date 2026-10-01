import Image from "next/image";

import { cn } from "@/utils/cn";

interface PostImageProps {
  alt: string;
  className?: string;
  src: string;
  variant?: "card" | "article" | "gallery";
}

export function PostImage({ alt, className, src, variant = "card" }: PostImageProps) {
  if (variant === "article") {
    return (
      <div className={cn("relative mx-auto aspect-square max-h-[75svh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-acrux-navy/70 sm:aspect-video", className)}>
        <Image
          alt={alt}
          className="object-contain object-center"
          fill
          sizes="(min-width: 1024px) 896px, calc(100vw - 5rem)"
          src={src}
          unoptimized
        />
      </div>
    );
  }

  const isGallery = variant === "gallery";

  return (
    <div className={cn(
      "relative w-full overflow-hidden bg-acrux-navy/70",
      isGallery ? "aspect-[4/3] rounded-2xl border border-white/10" : "aspect-video border-b border-white/10",
      className,
    )}>
      <Image
        alt={alt}
        className={isGallery ? "object-contain object-center p-2 sm:p-3" : "object-contain object-center"}
        fill
        sizes={isGallery
          ? "(min-width: 1024px) 544px, (min-width: 640px) 45vw, calc(100vw - 5rem)"
          : "(min-width: 1024px) 704px, calc(100vw - 2rem)"}
        src={src}
        unoptimized
      />
    </div>
  );
}
