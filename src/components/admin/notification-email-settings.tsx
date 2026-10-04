"use client";

import { FunctionsHttpError } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";

import { useAdminDraftProtection } from "@/components/admin/admin-draft-protection";
import { refreshContentNotificationStatus } from "@/components/admin/use-content-notification-status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MailSettings {
  enabled: boolean;
  configured: boolean;
  sender: string;
  pending_count: number;
  last_error: string | null;
}

interface MailReply {
  settings?: MailSettings;
  message?: string;
}

async function mailRequest(body: Record<string, unknown>): Promise<MailReply> {
  const client = createSupabaseBrowserClient();
  if (!client) throw new Error("Não foi possível conectar ao serviço de notificações.");
  const { data, error } = await client.functions.invoke<MailReply>("content-notification-mail", { body });
  if (error instanceof FunctionsHttpError) {
    const reply = await error.context.json().catch(() => null);
    throw new Error(typeof reply?.error === "string" ? reply.error : "Não foi possível concluir. Tente novamente.");
  }
  if (error || !data) throw new Error("Não foi possível acessar o envio de e-mails. Tente novamente.");
  return data;
}

export function NotificationEmailSettings({ onSettingsChanged }: { onSettingsChanged?: () => void }) {
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [sender, setSender] = useState("onboarding@resend.dev");
  const [enabled, setEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty = Boolean(apiKey || settings && (sender !== settings.sender || enabled !== (settings.configured ? settings.enabled : true)));
  useAdminDraftProtection({ dirty, busy, discardDescription: "A configuração de e-mail ainda não foi salva. A chave digitada será descartada ao sair." });

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    void mailRequest({ action: "status" }).then((reply) => {
      if (!current) return;
      if (!reply.settings) throw new Error("Não foi possível carregar a configuração de e-mail.");
      setSettings(reply.settings);
      setSender(reply.settings.sender);
      setEnabled(reply.settings.configured ? reply.settings.enabled : true);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a configuração de e-mail.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !settings) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const reply = await mailRequest({ action: "configure", api_key: apiKey.trim() || null, sender: sender.trim(), enabled });
      if (!reply.settings) throw new Error("Não foi possível confirmar a configuração. Atualize esta página antes de tentar novamente.");
      setApiKey("");
      setSettings(reply.settings);
      setSender(reply.settings.sender);
      setEnabled(reply.settings.enabled);
      setMessage(reply.settings.enabled ? "Envio ativado. As notificações aguardando envio serão processadas automaticamente." : "Envio por e-mail pausado. As notificações continuam disponíveis no painel.");
      (onSettingsChanged ?? refreshContentNotificationStatus)();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a configuração.");
    } finally { setBusy(false); }
  }

  async function sendTest() {
    if (busy || !settings?.configured || dirty) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const reply = await mailRequest({ action: "test" });
      setMessage(reply.message ?? "E-mail de teste aceito pelo serviço. Confira também a pasta de spam.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o teste.");
    } finally { setBusy(false); }
  }

  return <section className="glass-panel mt-6 min-w-0 rounded-2xl p-4 sm:p-6" aria-labelledby="notification-email-title" aria-busy={loading || busy}>
    <h2 className="text-xl font-bold text-white" id="notification-email-title">Avisos por e-mail</h2>
    <p className="mt-2 text-sm leading-6 text-acrux-muted">Os avisos são enviados apenas ao e-mail da sua conta, definido como destinatário deste painel.</p>
    {error ? <p className="mt-4 text-sm leading-6 text-red-200 [overflow-wrap:anywhere]" role="alert">{error}</p> : null}
    {message ? <p className="mt-4 text-sm leading-6 text-acrux-cyan-bright" role="status">{message}</p> : null}
    {loading ? <p className="mt-4 text-sm text-acrux-muted" role="status">Carregando configuração de e-mail…</p> : !settings ? <button className="button-secondary mt-4 min-h-11 w-full sm:w-auto" onClick={() => setAttempt((value) => value + 1)} type="button">Tentar novamente</button> : <>
      <p className="mt-4 text-sm leading-6 text-acrux-muted">{settings.configured ? settings.enabled ? "Envio automático ativo." : "Envio automático pausado." : "Ative o serviço de envio para receber avisos por e-mail."} {settings.pending_count > 0 ? `${settings.pending_count} ${settings.pending_count === 1 ? "aviso aguarda" : "avisos aguardam"} envio.` : ""}</p>
      {settings.last_error ? <p className="mt-2 text-sm leading-6 text-amber-200">O último envio não foi concluído. Confira a chave e o remetente; os avisos ficam na fila para uma nova tentativa.</p> : null}
      <details className="mt-4 min-w-0" open={!settings.configured}>
        <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-sm font-bold text-acrux-cyan-bright">Configurar envio</summary>
        <p className="mt-2 text-sm leading-6 text-acrux-muted">Use uma chave de envio do <a className="inline-flex min-h-11 items-center font-semibold text-acrux-cyan-bright underline" href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">Resend</a>. Ela é guardada de forma criptografada no servidor e não fica salva neste navegador.</p>
        <form className="mt-4 min-w-0 space-y-4" onSubmit={save}>
          <fieldset className="min-w-0 space-y-4" disabled={busy}>
            <div>
              <label className="text-sm font-semibold text-white" htmlFor="notification-mail-key">{settings.configured ? "Nova chave de envio (opcional)" : "Chave de envio"}</label>
              <input autoComplete="off" className="admin-input mt-2 w-full min-w-0" id="notification-mail-key" maxLength={256} onChange={(event) => setApiKey(event.target.value)} placeholder={settings.configured ? "Deixe vazio para manter a chave atual" : "re_…"} required={!settings.configured && enabled} spellCheck={false} type="password" value={apiKey} />
            </div>
            <div>
              <label className="text-sm font-semibold text-white" htmlFor="notification-mail-sender">E-mail do remetente</label>
              <input autoComplete="email" className="admin-input mt-2 w-full min-w-0" id="notification-mail-sender" maxLength={254} onChange={(event) => setSender(event.target.value)} required type="email" value={sender} aria-describedby="notification-mail-sender-help" />
              <p className="mt-2 text-sm leading-6 text-acrux-muted [overflow-wrap:anywhere]" id="notification-mail-sender-help">Com onboarding@resend.dev, o destinatário precisa ser o e-mail da sua conta no Resend. Para outro destinatário, use um remetente de domínio verificado.</p>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-white">
              <input checked={enabled} className="h-5 w-5 shrink-0" onChange={(event) => setEnabled(event.target.checked)} type="checkbox" />
              <span>Receber avisos por e-mail</span>
            </label>
            <button className="button-primary min-h-11 w-full sm:w-auto" type="submit">{busy ? "Aguarde…" : "Salvar configuração"}</button>
          </fieldset>
        </form>
      </details>
      <button className="button-secondary mt-4 min-h-11 w-full sm:w-auto" disabled={busy || dirty || !settings.configured} onClick={sendTest} type="button">Enviar e-mail de teste para mim</button>
      {dirty && settings.configured ? <p className="mt-2 text-sm leading-6 text-acrux-muted">Salve a configuração antes de enviar o teste.</p> : null}
    </>}
  </section>;
}
