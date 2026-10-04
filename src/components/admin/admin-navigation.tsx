"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import type { AdminRole } from "@/components/admin/admin-gate";
import { adminNavigation } from "@/config/site";
import { cn } from "@/utils/cn";

interface AdminNavigationProps {
  busy: boolean;
  signingOut?: boolean;
  onSignOut: () => void;
  role: AdminRole;
  notificationCount?: number;
  canViewNotifications?: boolean;
  section?: string;
  variant?: "horizontal" | "sidebar";
}

export function AdminNavigation({ busy, signingOut = busy, onSignOut, role, notificationCount = 0, canViewNotifications = false, section, variant = "horizontal" }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const currentHref = section ? `/admin/${section}` : "/admin";
  const navigation = adminNavigation.filter((item) =>
    (role === "admin" || (item.label !== "Usuários" && item.label !== "Sobre")) &&
    (item.label !== "Notificações" || canViewNotifications));
  const currentLabel = navigation.find((item) => item.href === currentHref)?.label ?? "Painel";

  return (
    <nav
      aria-label="Navegação administrativa"
      className="mt-4 min-w-0"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;
        event.preventDefault();
        setIsOpen(false);
        toggleRef.current?.focus();
      }}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/4 px-3 text-left text-sm font-bold text-white lg:hidden"
        onClick={() => setIsOpen((open) => !open)}
        ref={toggleRef}
        type="button"
      >
        <span>Menu do painel</span>
        <span className="flex min-w-0 items-center gap-2 text-acrux-cyan-bright">
          <span className="truncate">{currentLabel}</span>
          <svg aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} fill="none" viewBox="0 0 20 20">
            <path d="m5 7 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
          </svg>
        </span>
      </button>
      <div
        className={cn(
          "mt-2 gap-2 lg:mt-0",
          isOpen ? "grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3" : "hidden",
          variant === "sidebar" ? "lg:grid lg:grid-cols-1 lg:gap-1" : "lg:flex lg:flex-wrap",
        )}
        id={menuId}
      >
        {navigation.map((item) => {
          const isCurrent = item.href === currentHref;
          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-0 items-center rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                variant === "horizontal" && "lg:shrink-0 lg:rounded-full",
                isCurrent ? "border-cyan-200/30 bg-cyan-300/12 font-bold text-acrux-cyan-bright" : "border-white/10 bg-white/3 text-acrux-muted hover:border-cyan-200/25 hover:text-white",
              )}
              href={item.href}
              key={item.href}
              onClick={() => setIsOpen(false)}
            >
              <span>{item.label}</span>
              {item.label === "Notificações" && notificationCount > 0 ? <span className="ml-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-acrux-cyan-bright px-1.5 text-xs font-bold text-acrux-navy" aria-label={`${notificationCount} não lidas`}>{notificationCount > 99 ? "99+" : notificationCount}</span> : null}
            </Link>
          );
        })}
        <button
          className={cn("flex min-h-11 items-center rounded-xl border border-white/12 px-3 py-2 text-left text-sm font-bold text-acrux-muted transition-colors hover:border-red-200/30 hover:text-red-100", variant === "horizontal" && "lg:ml-auto lg:shrink-0 lg:rounded-full", variant === "sidebar" && "lg:mt-3")}
          disabled={busy}
          onClick={onSignOut}
          type="button"
        >
          {signingOut ? "Saindo…" : "Sair"}
        </button>
      </div>
    </nav>
  );
}
