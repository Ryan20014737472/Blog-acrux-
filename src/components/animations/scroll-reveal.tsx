"use client";

import { useAnimate, useInView, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 18,
}: ScrollRevealProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const isInView = useInView(scope, { once: true, amount: 0.16 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scope.current || !isInView || reduceMotion === null) {
      return;
    }

    const animation = animate(
      scope.current,
      reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0, 1], y: [y, 0] },
      {
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      },
    );

    return () => animation.stop();
  }, [animate, delay, isInView, reduceMotion, scope, y]);

  return (
    <div ref={scope} className={cn(className)}>
      {children}
    </div>
  );
}

