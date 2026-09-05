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
        : "group inline-flex items-center gap-2 text-sm font-bold text-acrux-cyan-bright transition-colors hover:text-acrux-white";

  return (
    <motion.div
      className="inline-flex"
      whileHover={reduceMotion ? undefined : { x: variant === "text" ? 3 : 0 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      <Link className={cn(variantClass, className)} href={href}>
        <span>{children}</span>
        <span aria-hidden="true" className="text-base leading-none">
          →
        </span>
      </Link>
    </motion.div>
  );
}

