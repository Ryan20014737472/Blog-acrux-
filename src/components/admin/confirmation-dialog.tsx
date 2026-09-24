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
    setTyped("");
    dialog.showModal();
    return () => dialog.close();
  }, [request]);

  if (!request) return null;
  const matches = !request.requiredText || typed.trim().toLowerCase() === request.requiredText.toLowerCase();

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-cyan-200/25 bg-[#081a36] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop:bg-[#010610]/85"
      onCancel={(event) => { if (busy) event.preventDefault(); else onCancel(); }}
    >
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0e2c55] to-[#081a36] px-6 py-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-acrux-cyan-bright">ACRUX · Confirmação</p>
        <h2 id={titleId} className="mt-2 text-xl font-bold sm:text-2xl">{request.title}</h2>
      </div>
      <div className="grid gap-5 px-6 py-6 sm:px-8">
        <p id={descriptionId} className="break-words text-sm leading-6 text-acrux-muted">{request.description}</p>
        {request.requiredText && (
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${titleId}-confirmation`}>
            Para confirmar, digite o e-mail completo:
            <span className="break-all font-normal text-acrux-cyan-bright">{request.requiredText}</span>
            <input
              autoFocus
              autoComplete="off"
              className="min-h-12 w-full rounded-xl border border-white/20 bg-[#020817] px-4 text-base text-white outline-none focus-visible:border-acrux-cyan-bright focus-visible:ring-2 focus-visible:ring-acrux-cyan-bright/30"
              id={`${titleId}-confirmation`}
              onChange={(event) => setTyped(event.target.value)}
              spellCheck={false}
              type="email"
              value={typed}
            />
          </label>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button autoFocus={!request.requiredText} className="button-secondary" disabled={busy} onClick={onCancel} type="button">Cancelar</button>
          <button
            className={request.tone === "danger" ? "min-h-12 rounded-xl bg-red-500 px-5 py-2 font-bold text-white transition hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-50" : "button-primary"}
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

