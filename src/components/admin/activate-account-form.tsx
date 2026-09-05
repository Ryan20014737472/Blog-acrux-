"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActivationState = "checking" | "ready" | "invalid" | "success" | "unconfigured";

export function ActivateAccountForm() {
  const [activationState, setActivationState] = useState<ActivationState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setActivationState("unconfigured");
      return;
    }

    let isCurrent = true;

    async function checkInvitationSession() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();

      if (isCurrent) {
        setActivationState(user ? "ready" : "invalid");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isCurrent && session?.user) {
        setActivationState("ready");
      }
    });

    void checkInvitationSession();

    return () => {
      isCurrent = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError("A autenticação ainda não foi configurada neste ambiente.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError("Não foi possível definir a senha. Abra novamente o link de convite e tente outra vez.");
      return;
    }

    setPassword("");
    setConfirmation("");
    setActivationState("success");
  }

  if (activationState === "checking") {
    return <p className="text-base leading-7 text-acrux-muted" aria-live="polite">Validando o convite…</p>;
  }

  if (activationState === "unconfigured") {
    return <p className="text-base leading-7 text-acrux-muted">A autenticação ainda não foi configurada neste ambiente.</p>;
  }

  if (activationState === "invalid") {
    return (
      <div className="grid gap-4">
        <p className="text-base leading-7 text-acrux-muted">Este convite não está ativo. Solicite um novo convite à equipe responsável e abra o link diretamente pelo e-mail.</p>
        <Link className="button-secondary w-fit" href="/admin/login">Voltar ao login</Link>
      </div>
    );
  }

  if (activationState === "success") {
    return (
      <div className="grid gap-4">
        <p className="text-base leading-7 text-acrux-muted">Senha definida com sucesso. Sua conta já pode entrar na área administrativa.</p>
        <Link className="button-primary w-fit" href="/admin/login">Ir para o login</Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-white" htmlFor="new-password">
        Crie uma senha
        <input
          autoComplete="new-password"
          className="min-h-12 rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base font-normal text-white"
          id="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-white" htmlFor="confirm-password">
        Confirme a senha
        <input
          autoComplete="new-password"
          className="min-h-12 rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base font-normal text-white"
          id="confirm-password"
          minLength={8}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </label>
      {error ? <p className="rounded-xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
      <button className="button-primary mt-1 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Salvando…" : "Definir senha"}
      </button>
    </form>
  );
}
