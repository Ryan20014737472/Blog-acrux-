"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ArrowLink } from "@/components/ui/arrow-link";

const stars = [
  { left: "6%", top: "21%", size: 3 },
  { left: "13%", top: "72%", size: 4 },
  { left: "20%", top: "36%", size: 3 },
  { left: "26%", top: "10%", size: 3 },
  { left: "32%", top: "64%", size: 4 },
  { left: "41%", top: "17%", size: 3 },
  { left: "53%", top: "7%", size: 4 },
  { left: "62%", top: "25%", size: 3 },
  { left: "69%", top: "58%", size: 4 },
  { left: "76%", top: "13%", size: 3 },
  { left: "83%", top: "37%", size: 3 },
  { left: "91%", top: "71%", size: 4 },
] as const;

export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scope.current || reduceMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .fromTo(".hero-star", { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.045 })
        .fromTo(".hero-line", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.11 }, "-=0.25")
        .fromTo(".hero-logo", { autoAlpha: 0, scale: 0.9, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.68 }, "-=0.15")
        .fromTo(".hero-copy", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.09 }, "-=0.38");

      gsap.to(".hero-orbit", {
        y: 88,
        ease: "none",
        scrollTrigger: {
          trigger: scope.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.7,
        },
      });
    }, scope);

    return () => context.revert();
  }, [reduceMotion]);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[44rem] items-center overflow-hidden pt-24 sm:min-h-[47rem]"
      ref={scope}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(7,155,185,0.26),transparent_17rem),radial-gradient(circle_at_50%_5%,rgba(9,59,120,0.56),transparent_29rem),linear-gradient(180deg,#020817_0%,#061a49_70%,#020817_100%)]" />
        <div className="hero-orbit absolute left-1/2 top-[12%] h-[31rem] w-[31rem] -translate-x-1/2 rounded-full border border-cyan-200/8 shadow-[0_0_8rem_rgba(7,155,185,0.12)] sm:h-[39rem] sm:w-[39rem]" />
        <div className="hero-orbit absolute left-1/2 top-[16%] h-[23rem] w-[23rem] -translate-x-1/2 rounded-full border border-cyan-200/7 sm:h-[30rem] sm:w-[30rem]" />
        {stars.map((star, index) => (
          <span
            className={`hero-star star ${index === 7 ? "star--accent" : ""}`}
            key={`${star.left}-${star.top}`}
            style={{
              height: `${star.size}px`,
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
            }}
          />
        ))}
        <svg
          className="absolute inset-0 h-full w-full opacity-90"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path className="hero-line constellation-line" d="M 13 72 L 31 64 L 49 77 L 69 58 L 91 71" vectorEffect="non-scaling-stroke" />
          <path className="hero-line constellation-line" d="M 20 36 L 41 17 L 62 25 L 83 37" vectorEffect="non-scaling-stroke" />
          <path className="hero-line constellation-line" d="M 26 10 L 41 17 L 53 7 L 76 13" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="shell relative z-10 flex flex-col items-center pb-16 pt-12 text-center sm:pb-20">
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
          className="hero-logo relative"
          transition={{ duration: 5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="absolute inset-0 rounded-full bg-acrux-cyan/24 blur-3xl" />
          <div className="relative overflow-hidden rounded-full ring-1 ring-white/20 shadow-[0_1rem_4rem_rgba(7,155,185,0.3)]">
            <Image
              alt="Logo oficial da ACRUX ROBOCEP"
              className="h-31 w-31 object-cover sm:h-39 sm:w-39"
              height={156}
              priority
              sizes="(min-width: 640px) 156px, 124px"
              src="/brand/acrux-logo.jpg"
              width={156}
            />
          </div>
        </motion.div>

        <div className="mt-7">
          <p className="hero-copy text-sm font-bold tracking-[0.34em] text-acrux-cyan-bright sm:text-base">ACRUX</p>
          <h1 className="hero-copy mt-2 text-5xl font-black tracking-[-0.08em] text-white sm:text-7xl" id="hero-title">
            ROBOCEP
          </h1>
        </div>

        <p className="hero-copy mt-6 text-base font-semibold tracking-[0.06em] text-acrux-muted sm:text-lg">
          Tecnologia <span aria-hidden="true">•</span> Engenharia <span aria-hidden="true">•</span> Inovação
        </p>
        <p className="hero-copy mt-4 max-w-xl text-base leading-7 text-white/72">
          O espaço oficial para acompanhar a jornada da equipe, seus robôs, projetos e histórias.
        </p>

        <div className="hero-copy mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ArrowLink href="/equipe" variant="primary">
            Conheça a equipe
          </ArrowLink>
          <ArrowLink href="/blog" variant="secondary">
            Nosso blog
          </ArrowLink>
        </div>

        <a
          aria-label="Ir para a apresentação da ACRUX"
          className="hero-copy mt-12 inline-flex flex-col items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-acrux-muted transition-colors hover:text-white"
          href="#sobre-acrux"
        >
          Explorar
          <span aria-hidden="true" className="text-lg leading-none">↓</span>
        </a>
      </div>
    </section>
  );
}

