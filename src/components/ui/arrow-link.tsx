"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "text";
}

export function ArrowLink({
  href,
  children,
  className,
  variant = "text",
}: ArrowLinkProps) {
  const reduceMotion = useReducedMotion();
  const variantClass =
    variant === "primary"
      ? "button-primary"
      : variant === "secondary"
        ? "button-secondary"
        : "group inline-flex min-h-11 max-w-full items-center gap-2 py-2 text-sm font-bold text-acrux-cyan-bright transition-colors hover:text-acrux-white";

  return (
    <motion.div
      className={cn("min-w-0 max-w-full", variant === "text" ? "inline-flex" : "flex w-full sm:inline-flex sm:w-auto")}
      tabIndex={-1}
      whileHover={reduceMotion ? undefined : { x: variant === "text" ? 3 : 0 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      <Link className={cn(variantClass, variant !== "text" && "w-full sm:w-auto", className)} href={href}>
        <span className="min-w-0 break-words">{children}</span>
        <span aria-hidden="true" className="shrink-0 text-base leading-none">
          →
        </span>
      </Link>
    </motion.div>
  );
}

