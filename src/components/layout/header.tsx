"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { publicNavigation } from "@/config/site";
import { SiteLogo } from "@/components/layout/site-logo";
import { cn } from "@/utils/cn";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreScrollRef = useRef(true);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    restoreScrollRef.current = false;
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 80rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!isMenuOpen || !menu) return;

    const header = headerRef.current;
    const trigger = triggerRef.current;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
    };

    restoreScrollRef.current = true;
    Object.assign(body.style, {
      overflow: "hidden",
      position: "fixed",
      top: `-${scrollY}px`,
      left: `-${scrollX}px`,
      width: "100%",
    });
    menu.showModal();
    menu.querySelector<HTMLAnchorElement>("nav a")?.focus({ preventScroll: true });

    return () => {
      menu.close();
      Object.assign(body.style, previousStyles);
      window.scrollTo({
        left: restoreScrollRef.current ? scrollX : 0,
        top: restoreScrollRef.current ? scrollY : 0,
        behavior: "instant",
      });
      const focusTarget = trigger?.getClientRects().length
        ? trigger
        : header?.querySelector<HTMLAnchorElement>("a");
      focusTarget?.focus({ preventScroll: true });
    };
  }, [isMenuOpen]);

  function closeForNavigation(href: string) {
    const currentPath = pathname.replace(/\/$/, "") || "/";
    restoreScrollRef.current = href === currentPath;
    setIsMenuOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled || isMenuOpen
          ? "border-b border-white/10 bg-[#020817]/78 shadow-[0_0.5rem_2rem_rgba(0,0,0,0.15)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="shell flex min-h-18 items-center justify-between gap-4 py-3">
        <SiteLogo compact priority />

        <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 xl:flex">
          {publicNavigation.map((item) => {
            const isCurrent = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-semibold transition-colors",
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
          <Link className="button-secondary ml-2 min-h-11 whitespace-nowrap px-3 py-2 text-sm" href="/admin">
            Área da equipe
          </Link>
        </nav>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
          aria-label="Abrir menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white xl:hidden"
          onClick={() => setIsMenuOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <span aria-hidden="true" className="grid gap-1.25">
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      <dialog
        aria-label="Menu de navegação"
        aria-modal="true"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-[#020817]/98 p-0 text-white backdrop:bg-[#020817]/70 xl:hidden"
        id="mobile-navigation"
        onCancel={(event) => {
          event.preventDefault();
          setIsMenuOpen(false);
        }}
        onClose={(event) => {
          if (!event.currentTarget.open) setIsMenuOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsMenuOpen(false);
        }}
        ref={menuRef}
      >
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
          <div className="shell flex min-h-18 shrink-0 items-center justify-between gap-4 py-3">
            <SiteLogo compact onClick={() => closeForNavigation("/")} />
            <button
              aria-label="Fechar menu"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white"
              onClick={() => setIsMenuOpen(false)}
              type="button"
            >
              <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <nav
            aria-label="Navegação principal no celular"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/10 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onClick={(event) => {
              if (event.target === event.currentTarget) setIsMenuOpen(false);
            }}
          >
            <div
              className="shell grid gap-1 py-5"
              onClick={(event) => {
                if (event.target === event.currentTarget) setIsMenuOpen(false);
              }}
            >
              {publicNavigation.map((item) => {
                const isCurrent = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                      isCurrent
                        ? "bg-acrux-blue/32 text-acrux-cyan-bright"
                        : "text-white hover:bg-white/6",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => closeForNavigation(item.href)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link className="button-secondary mt-3 min-h-11" href="/admin" onClick={() => closeForNavigation("/admin")}>
                Área da equipe
              </Link>
            </div>
          </nav>
        </div>
      </dialog>
    </header>
  );
}

