"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import type { AboutMilestone } from "@/features/about/about-model";

export function AboutTimeline({ items }: { items: AboutMilestone[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scope.current || reduceMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        ".timeline-entry",
        { autoAlpha: 0, x: -18 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: scope.current,
            start: "top 78%",
          },
        },
      );
    }, scope);

    return () => context.revert();
  }, [reduceMotion, items.length]);

  if (items.length === 0) {
    return <p className="mt-10 border-l-2 border-acrux-cyan pl-5 text-sm leading-6 text-acrux-muted">Os marcos da trajetória serão adicionados pela equipe.</p>;
  }

  return (
    <div className="relative mt-10 border-l border-cyan-200/20 pl-7 sm:pl-9" ref={scope}>
      {items.map((item, index) => (
        <article className="timeline-entry relative pb-8 last:pb-0" key={`${index}-${item.title}`}>
          <span className="absolute -left-[2.03rem] top-1.5 h-3 w-3 rounded-full border-2 border-[#06163f] bg-acrux-cyan shadow-[0_0_0.85rem_rgba(75,212,232,0.5)]" />
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Marco {String(index + 1).padStart(2, "0")}</p>
          <h2 className="mt-2 text-xl font-bold text-white">{item.title}</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-acrux-muted">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
