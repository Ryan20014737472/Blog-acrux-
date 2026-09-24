"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ArrowLink } from "@/components/ui/arrow-link";
import acruxLogo from "@/assets/acrux-logo.jpeg";
import { HeroConstellation } from "@/features/home/hero-constellation";

export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      // Default markup is complete and visible, including without JavaScript.
      // matchMedia also restores it if the motion preference changes at runtime.
      media.add("(prefers-reduced-motion: no-preference)", () => {
        scope.current?.querySelectorAll<SVGPathElement>(".acrux-constellation-line").forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });

        gsap.timeline({ defaults: { ease: "power3.out" } })
          .fromTo(".acrux-constellation-node", { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.06 }, 0)
          .to(".acrux-constellation-line", { strokeDashoffset: 0, duration: 1.05, stagger: 0.18, ease: "power2.inOut" }, 0.2)
          .fromTo(".acrux-constellation-star", { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.09 }, 1.05)
          .fromTo(".hero-copy", { opacity: 0.65, y: 12 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06 }, 0);

        gsap.to(".hero-orbit", {
          y: 40,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
          },
        });
      });
    }, scope);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[44rem] items-center overflow-hidden pt-24 sm:min-h-[47rem]"
      ref={scope}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(7,155,185,0.26),transparent_17rem),radial-gradient(circle_at_50%_5%,rgba(9,59,120,0.56),transparent_29rem),linear-gradient(180deg,#020817_0%,#061a49_70%,#020817_100%)]" />
        <div className="hero-orbit absolute left-1/2 top-[12%] h-[31rem] w-[31rem] -translate-x-1/2 rounded-full border border-cyan-200/8 shadow-[0_0_8rem_rgba(7,155,185,0.12)] sm:h-[39rem] sm:w-[39rem]" />
        <div className="hero-orbit absolute left-1/2 top-[16%] h-[23rem] w-[23rem] -translate-x-1/2 rounded-full border border-cyan-200/7 sm:h-[30rem] sm:w-[30rem]" />
      </div>

      <div className="shell relative z-10 grid items-center gap-8 pb-16 pt-6 text-center sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:pt-12 lg:text-left">
        <div className="relative mx-auto w-[min(68vw,16rem)] lg:order-2 lg:w-full lg:max-w-[27rem]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-[12%] rounded-full bg-acrux-cyan/10 blur-3xl" />
          <div className="pointer-events-none relative">
            <HeroConstellation />
          </div>
          <motion.div
            className="hero-logo absolute right-0 top-0 w-20 lg:w-28"
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 rounded-full bg-acrux-cyan/24 blur-3xl" />
            <div className="relative overflow-hidden rounded-full ring-1 ring-white/20 shadow-[0_1rem_4rem_rgba(7,155,185,0.3)]">
              <Image
                alt="Logo oficial da ACRUX ROBOCEP"
                className="aspect-square h-auto w-full object-cover"
                height={112}
                priority
                sizes="(min-width: 1024px) 112px, 80px"
                src={acruxLogo}
                width={112}
              />
            </div>
          </motion.div>
        </div>

        <div className="lg:order-1">
          <div>
            <p className="hero-copy text-sm font-bold tracking-[0.34em] text-acrux-cyan-bright sm:text-base">ACRUX</p>
            <h1 className="hero-copy mt-2 text-5xl font-black tracking-[-0.08em] text-white sm:text-7xl" id="hero-title">
              ROBOCEP
            </h1>
          </div>

          <p className="hero-copy mt-6 text-base font-semibold tracking-[0.06em] text-acrux-muted sm:text-lg">
            Tecnologia <span aria-hidden="true">•</span> Engenharia <span aria-hidden="true">•</span> Inovação
          </p>
          <p className="hero-copy mx-auto mt-4 max-w-xl text-base leading-7 text-white/72 lg:mx-0">
            O espaço oficial para acompanhar a jornada da equipe, seus robôs, projetos e histórias.
          </p>

          <div className="hero-copy mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
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
      </div>
    </section>
  );
}
