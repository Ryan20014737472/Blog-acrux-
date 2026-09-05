"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A autenticação ainda não foi configurada neste ambiente.");
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (signInError) {
      setError("Não foi possível entrar com essas credenciais.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      await supabase.auth.signOut();
      setError("Esta conta não possui permissão administrativa.");
      return;
    }

    router.replace("/admin");
  }

  return (
    <motion.form
      className="glass-panel rounded-3xl p-6 sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      onSubmit={handleSubmit}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-white" htmlFor="email">
          E-mail autorizado
          <input
            autoComplete="email"
            className="min-h-12 rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base font-normal text-white"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white" htmlFor="password">
          Senha
          <input
            autoComplete="current-password"
            className="min-h-12 rounded-xl border border-white/12 bg-[#020817]/58 px-4 text-base font-normal text-white"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
      </div>
      {error ? <p className="mt-4 rounded-xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
      <button className="button-primary mt-6 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando…" : "Entrar na área administrativa"}
      </button>
      <div className="mt-4 grid gap-2 text-center text-xs leading-5 text-acrux-muted">
        <Link className="font-bold text-acrux-cyan-bright hover:text-white" href="/admin/recuperar-senha">Esqueci minha senha</Link>
        <p>Não há cadastro público de administradores. Solicite acesso à equipe responsável.</p>
      </div>
    </motion.form>
  );
}
