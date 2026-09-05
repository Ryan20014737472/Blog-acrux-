"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getActivationUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl = configuredUrl || window.location.origin;
  return new URL("admin/ativar-conta/", `${siteUrl.replace(/\/$/, "")}/`).toString();
}

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A autenticação ainda não foi configurada neste ambiente.");
      return;
    }

    setIsSubmitting(true);
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getActivationUrl(),
    });
    setIsSubmitting(false);

    if (recoveryError) {
      setError("Não foi possível enviar o e-mail agora. Tente novamente em alguns instantes.");
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <div className="grid gap-4">
        <p className="text-base leading-7 text-acrux-muted">Se este e-mail possuir uma conta autorizada, você receberá um link para definir a senha.</p>
        <Link className="button-secondary w-fit" href="/admin/login">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-white" htmlFor="recovery-email">
        E-mail autorizado
        <input
          autoComplete="email"
          className="min-h-12 rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base font-normal text-white"
          id="recovery-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      {error ? <p className="rounded-xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
      <button className="button-primary mt-1 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enviando…" : "Enviar link para definir senha"}
      </button>
    </form>
  );
}
