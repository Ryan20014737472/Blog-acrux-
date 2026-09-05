"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { publicNavigation } from "@/config/site";
import { SiteLogo } from "@/components/layout/site-logo";
import { cn } from "@/utils/cn";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled || isMenuOpen
          ? "border-b border-white/10 bg-[#020817]/78 shadow-[0_0.5rem_2rem_rgba(0,0,0,0.15)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="shell flex min-h-18 items-center justify-between gap-4 py-3">
        <SiteLogo compact priority />

        <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 lg:flex">
          {publicNavigation.map((item) => {
            const isCurrent = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  isCurrent
                    ? "bg-white/7 text-acrux-cyan-bright"
                    : "text-acrux-muted hover:text-white",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          <Link className="button-secondary ml-2 min-h-0 px-3 py-2 text-sm" href="/admin">
            Área da equipe
          </Link>
        </nav>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/5 text-white lg:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="grid gap-1.25">
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-transform duration-200",
                isMenuOpen && "translate-y-1.75 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-opacity duration-200",
                isMenuOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-transform duration-200",
                isMenuOpen && "-translate-y-1.75 -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen ? (
          <motion.nav
            animate={{ opacity: 1, height: "auto" }}
            aria-label="Navegação mobile"
            className="overflow-hidden border-t border-white/10 bg-[#020817]/96 lg:hidden"
            exit={{ opacity: 0, height: 0 }}
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shell grid gap-1 py-5">
              {publicNavigation.map((item) => {
                const isCurrent = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                      isCurrent
                        ? "bg-acrux-blue/32 text-acrux-cyan-bright"
                        : "text-white hover:bg-white/6",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link className="button-secondary mt-3" href="/admin">
                Área da equipe
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

