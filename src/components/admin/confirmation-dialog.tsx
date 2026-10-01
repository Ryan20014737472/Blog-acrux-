"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface ConfirmationRequest {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  requiredText?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({ request, busy, onCancel, onConfirm }: {
  request: ConfirmationRequest | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !request) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTyped("");
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [request]);

  if (!request) return null;
  const matches = !request.requiredText || typed.trim().toLowerCase() === request.requiredText.toLowerCase();

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="admin-auth fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] m-auto max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] w-[calc(100vw-max(1rem,env(safe-area-inset-left))-max(1rem,env(safe-area-inset-right)))] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-cyan-200/25 bg-[#081a36] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop:bg-[#010610]/85 sm:rounded-3xl"
      onCancel={(event) => { if (busy) event.preventDefault(); else onCancel(); }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
      }}
    >
      <div className="border-b border-white/10 border-l-2 border-l-acrux-cyan-bright bg-gradient-to-r from-[#0e2c55] to-[#081a36] px-4 py-4 sm:px-8 sm:py-5">
        <h2 id={titleId} className="text-balance text-xl font-bold [overflow-wrap:anywhere] sm:text-2xl">{request.title}</h2>
      </div>
      <div className="grid min-w-0 gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <p id={descriptionId} className="break-words text-sm leading-6 text-acrux-muted">{request.description}</p>
        {request.requiredText && (
          <label className="grid min-w-0 gap-2 text-sm font-semibold" htmlFor={`${titleId}-confirmation`}>
            Para confirmar, digite o e-mail completo:
            <span className="break-all font-normal text-acrux-cyan-bright">{request.requiredText}</span>
            <input
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              className="min-h-12 min-w-0 w-full rounded-xl border border-white/20 bg-[#020817] px-4 text-base text-white outline-none focus-visible:border-acrux-cyan-bright focus-visible:ring-2 focus-visible:ring-acrux-cyan-bright/30"
              disabled={busy}
              enterKeyHint="done"
              id={`${titleId}-confirmation`}
              inputMode="email"
              name="confirmationEmail"
              onChange={(event) => setTyped(event.target.value)}
              spellCheck={false}
              type="email"
              value={typed}
            />
          </label>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button autoFocus className="button-secondary" disabled={busy} onClick={onCancel} type="button">Cancelar</button>
          <button
            className={request.tone === "danger" ? "min-h-12 rounded-xl bg-[var(--acrux-danger)] px-5 py-2 font-bold text-white transition-colors enabled:hover:bg-[var(--acrux-danger-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 disabled:cursor-not-allowed disabled:opacity-50" : "button-primary"}
            disabled={busy || !matches}
            onClick={onConfirm}
            type="button"
          >
            {busy ? "Processando…" : request.confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

