import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import acruxLogo from "@/assets/acrux-logo.jpeg";

export const metadata: Metadata = {
  title: "404 — Página não encontrada",
  description: "Este endereço pode estar incorreto ou a página pode ter sido removida. Volte ao início ou explore o blog da ACRUX ROBOCEP.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-title"
      className="not-found-page relative isolate flex min-h-[min(48rem,100svh)] items-center overflow-hidden pb-14 pt-[calc(7rem+env(safe-area-inset-top))] sm:pb-20 sm:pt-[calc(8rem+env(safe-area-inset-top))]"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[min(58rem,140%)] -translate-x-1/2 -translate-y-1/2 text-[var(--not-found-gold)]"
        fill="none"
        focusable="false"
        viewBox="0 0 600 400"
      >
        <ellipse cx="300" cy="200" opacity="0.08" rx="240" ry="165" stroke="currentColor" />
        <path d="m95 110 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm407 147 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="currentColor" opacity="0.6" />
        <path d="m485 80 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm-365 223 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" opacity="0.3" />
      </svg>

      <div className="shell max-w-2xl text-center">
        <Image
          alt="Logo da ACRUX ROBOCEP"
          className="mx-auto rounded-full ring-1 ring-white/15"
          height={80}
          sizes="80px"
          src={acruxLogo}
          width={80}
        />
        <h1 className="mt-5 font-extrabold" id="not-found-title">
          <span className="block text-[clamp(6rem,20vw,10rem)] leading-none tracking-[-0.06em] text-[var(--not-found-gold)]">404</span>
          <span className="sr-only"> — </span>
          <span className="mt-4 block text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-white">Página não encontrada</span>
        </h1>
        <p className="body-copy mx-auto mt-5 max-w-[40ch] leading-relaxed">
          Este endereço pode estar incorreto ou a página pode ter sido removida.
        </p>
        <nav aria-label="Opções para continuar" className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="button-primary not-found-home w-full sm:w-auto" href="/" prefetch={false}>
            Voltar ao início <span aria-hidden="true">→</span>
          </Link>
          <Link className="button-secondary w-full sm:w-auto" href="/blog" prefetch={false}>
            Ir para o blog <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}

