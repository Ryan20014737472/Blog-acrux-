"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { NotificationEmailSettings } from "@/components/admin/notification-email-settings";
import { refreshContentNotificationStatus, useContentNotificationStatus } from "@/components/admin/use-content-notification-status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  mergeNotifications, notificationAction, notificationActor, notificationDate, notificationField, notificationRole,
  notificationSection, notificationValue, parseNotificationPage, type ContentNotification, type ContentNotificationStatus,
} from "@/features/admin/notification-model";

export function NotificationsManager({ session }: { session: AdminSession }) {
  const { status, loading, error, refresh } = useContentNotificationStatus(session.userId);

  return <AdminWorkspace session={session} section="notificacoes" title="Suas notificações" description="Acompanhe as mudanças no site, quem fez cada alteração e os valores anteriores e atuais.">
    <div className="mt-7 min-w-0 sm:mt-10">
      {loading ? <div className="glass-panel rounded-2xl p-5" aria-busy="true" role="status"><p className="text-base leading-7 text-acrux-muted">Verificando o acesso às suas notificações…</p></div> : null}
      {error ? <div className="glass-panel mb-5 rounded-2xl p-5"><p className="text-base leading-7 text-acrux-muted" role="alert">{error}</p><button className="button-secondary mt-4" onClick={() => void refresh()} type="button">Tentar novamente</button></div> : null}
      {!loading && status && !status.is_owner ? <div className="glass-panel rounded-2xl p-5"><h2 className="text-xl font-bold text-white">Acesso exclusivo do proprietário</h2><p className="mt-3 text-base leading-7 text-acrux-muted">Estas notificações são privadas e estão disponíveis somente para a conta do proprietário do site.</p></div> : null}
      {status?.is_owner ? <>
        <NotificationEmailSettings onSettingsChanged={refreshContentNotificationStatus} />
        <NotificationInbox key={session.userId} session={session} status={status} refreshStatus={refresh} />
      </> : null}
    </div>
  </AdminWorkspace>;
}

type LoadMode = "refresh" | "more" | "poll";

function NotificationInbox({ session, status, refreshStatus }: { session: AdminSession; status: ContentNotificationStatus; refreshStatus: () => Promise<void> }) {
  const [items, setItems] = useState<ContentNotification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState<number | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loadRef = useRef<(mode: LoadMode) => Promise<void>>(async () => {});
  const mountedRef = useRef(false);
  const markingRef = useRef(false);
  const load = useCallback((mode: LoadMode) => loadRef.current(mode), []);

  useEffect(() => {
    let current = true;
    let pending = false;
    let cursor: number | null = null;
    let loadedPages = 1;
    mountedRef.current = true;
    setItems([]);
    setNextCursor(null);
    setLoading(true);
    setError(null);
    setNotice(null);

    async function loadPage(mode: LoadMode) {
      if (pending || markingRef.current || (mode === "more" && cursor === null)) return;
      pending = true;
      setRefreshing(true);
      if (mode !== "poll") setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) throw new Error("Supabase unavailable");
        const { data, error: requestError } = await supabase.rpc("list_content_notifications", {
          p_limit: 30, p_before_id: mode === "more" ? cursor : null, p_unread_only: unreadOnly,
        });
        if (requestError) throw requestError;
        const page = parseNotificationPage(data);
        if (mode === "poll") {
          let refreshedPages = 1;
          while (page.next_cursor !== null && refreshedPages < loadedPages) {
            const { data: nextData, error: nextError } = await supabase.rpc("list_content_notifications", {
              p_limit: 30, p_before_id: page.next_cursor, p_unread_only: unreadOnly,
            });
            if (nextError) throw nextError;
            if (!current) return;
            const nextPage = parseNotificationPage(nextData);
            page.items = mergeNotifications(page.items, nextPage.items);
            page.next_cursor = nextPage.next_cursor;
            refreshedPages++;
          }
          loadedPages = refreshedPages;
        }
        if (!current) return;
        if (mode === "more") loadedPages++;
        if (mode === "refresh") loadedPages = 1;
        setItems((previous) => mode === "more" ? mergeNotifications(previous, page.items) : page.items);
        cursor = page.next_cursor;
        setNextCursor(cursor);
        setError(null);
      } catch (requestError) {
        if (!current) return;
        setError("Não foi possível carregar as notificações. Seus registros continuam guardados; tente novamente.");
        if (requestError && typeof requestError === "object" && "code" in requestError && requestError.code === "42501") void refreshStatus();
      } finally {
        pending = false;
        if (current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadRef.current = loadPage;
    void loadPage("refresh");
    function pollWhenVisible() {
      if (!document.hidden) void loadPage("poll");
    }
    const interval = window.setInterval(pollWhenVisible, 30_000);
    document.addEventListener("visibilitychange", pollWhenVisible);
    return () => {
      current = false;
      mountedRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", pollWhenVisible);
      loadRef.current = async () => {};
    };
  }, [session.userId, unreadOnly, refreshStatus]);

  async function markRead(id: number | null) {
    if (markingRef.current || refreshing) return;
    markingRef.current = true;
    setMarking(id ?? "all");
    setNotice(null);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase unavailable");
      const { data, error: requestError } = await supabase.rpc("mark_content_notifications_read", { p_ids: id === null ? null : [id] });
      if (requestError) throw requestError;
      if (!mountedRef.current) return;
      const readAt = new Date().toISOString();
      setItems((previous) => previous.map((item) => id === null || item.id === id ? { ...item, read_at: item.read_at ?? readAt } : item).filter((item) => !unreadOnly || item.read_at === null));
      setNotice(id === null ? `${data} notificações marcadas como lidas.` : "Notificação marcada como lida.");
      refreshContentNotificationStatus();
    } catch (requestError) {
      if (mountedRef.current) setError("Não foi possível marcar a leitura. Tente novamente; o conteúdo do histórico foi preservado.");
      if (requestError && typeof requestError === "object" && "code" in requestError && requestError.code === "42501") void refreshStatus();
    } finally {
      markingRef.current = false;
      if (mountedRef.current) setMarking(null);
    }
  }

  const busy = refreshing || marking !== null;

  return <section className="mt-6 min-w-0" aria-labelledby="notification-history-title">
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><h2 className="text-xl font-bold text-white" id="notification-history-title">Histórico de alterações</h2><p className="mt-2 text-sm leading-6 text-acrux-muted">{status.unread_count} não lidas. Horários no seu fuso. O histórico é atualizado a cada 30 segundos enquanto esta página está visível.</p></div>
        <button className="button-secondary w-full shrink-0 sm:w-auto" onClick={() => void load("refresh")} disabled={busy} type="button">{refreshing ? "Atualizando…" : "Atualizar"}</button>
      </div>
      <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-wrap gap-2" aria-label="Filtrar notificações">
          <button className={unreadOnly ? "button-secondary" : "button-primary"} aria-pressed={!unreadOnly} disabled={busy} onClick={() => setUnreadOnly(false)} type="button">Todas</button>
          <button className={unreadOnly ? "button-primary" : "button-secondary"} aria-pressed={unreadOnly} disabled={busy} onClick={() => setUnreadOnly(true)} type="button">Não lidas</button>
        </div>
        <button className="button-secondary w-full sm:ml-auto sm:w-auto" disabled={busy || status.unread_count === 0} onClick={() => void markRead(null)} type="button">{marking === "all" ? "Marcando leitura…" : "Marcar todas como lidas"}</button>
      </div>
      {notice ? <p className="mt-4 text-base leading-7 text-acrux-cyan-bright" role="status">{notice}</p> : null}
      {error ? <div className="mt-4"><p className="text-base leading-7 text-red-200" role="alert">{error}</p><button className="button-secondary mt-3" disabled={busy} onClick={() => void load("refresh")} type="button">Tentar novamente</button></div> : null}
    </div>

    {loading ? <p className="mt-5 text-base leading-7 text-acrux-muted" role="status">Carregando o histórico…</p> : null}
    {!loading && !error && items.length === 0 ? <div className="glass-panel mt-5 rounded-2xl p-5"><p className="font-bold text-white">{unreadOnly ? "Você está em dia." : "Nenhuma alteração registrada ainda."}</p><p className="mt-2 text-base leading-7 text-acrux-muted">{unreadOnly ? "As notificações já lidas continuam disponíveis em Todas." : "As próximas mudanças de conteúdo aparecerão aqui, incluindo o responsável e os detalhes."}</p></div> : null}

    <ol className="mt-5 grid min-w-0 gap-4" aria-label="Alterações no site">
      {items.map((item) => <li className="min-w-0" key={item.id}><NotificationCard item={item} emailConfigured={status.email_configured} disabled={busy} marking={marking === item.id} onRead={() => void markRead(item.id)} /></li>)}
    </ol>
    {nextCursor !== null ? <button className="button-secondary mt-5 w-full sm:w-auto" disabled={busy} onClick={() => void load("more")} type="button">{refreshing ? "Carregando…" : "Carregar mais notificações"}</button> : null}
  </section>;
}

function NotificationCard({ item, emailConfigured, disabled, marking, onRead }: { item: ContentNotification; emailConfigured: boolean; disabled: boolean; marking: boolean; onRead: () => void }) {
  const role = notificationRole(item.actor_role);
  const emailLabel = item.email_status === "sent" ? "E-mail enviado" : item.email_status === "failed" ? "Falha no envio do e-mail" :
    item.email_status === "disabled" ? "Envio por e-mail pausado" : !emailConfigured ? "E-mail aguarda configuração" : "E-mail na fila de envio";

  return <article className={`glass-panel min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 ${item.read_at ? "border-white/10" : "border-cyan-200/35"}`}>
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold uppercase tracking-[0.08em]">
      <span className="text-acrux-cyan-bright">{notificationSection(item.entity_table)}</span>
      {!item.read_at ? <span className="rounded-full bg-cyan-300/12 px-2 py-1 text-acrux-cyan-bright">Não lida</span> : null}
      <time className="text-acrux-muted sm:ml-auto" dateTime={item.occurred_at}>{notificationDate(item.occurred_at)}</time>
    </div>
    <h3 className="mt-4 text-lg font-bold leading-7 text-white [overflow-wrap:anywhere]">{notificationAction(item)}: {item.entity_label || "Registro sem título"}</h3>
    <p className="mt-2 text-base leading-7 text-acrux-muted [overflow-wrap:anywhere]"><span className="font-semibold text-white">{notificationActor(item)}</span>{role ? ` · ${role}` : ""}</p>
    <p className="mt-2 text-sm leading-6 text-acrux-muted">{emailLabel}</p>

    <details className="mt-4 min-w-0 rounded-xl border border-white/10 bg-white/3">
      <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-base font-bold text-acrux-cyan-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acrux-cyan-bright">Ver alterações ({item.changed_fields.length})</summary>
      <div className="grid min-w-0 gap-4 p-3 pt-1 sm:p-4 sm:pt-1">
        {item.changed_fields.map((field) => <section className="min-w-0 border-t border-white/10 pt-3" key={field}>
          <h4 className="text-base font-bold text-white [overflow-wrap:anywhere]">{notificationField(field)}</h4>
          <dl className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-black/15 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-acrux-muted">Antes</dt><dd className="mt-2 whitespace-pre-wrap text-base leading-7 text-acrux-muted [overflow-wrap:anywhere]">{item.action === "create" ? "O registro ainda não existia" : notificationValue(item.before_values[field], field)}</dd></div>
            <div className="min-w-0 rounded-xl bg-cyan-300/5 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-acrux-cyan-bright">Depois</dt><dd className="mt-2 whitespace-pre-wrap text-base leading-7 text-white [overflow-wrap:anywhere]">{item.action === "delete" ? "O registro foi excluído" : notificationValue(item.after_values[field], field)}</dd></div>
          </dl>
        </section>)}
        {item.changed_fields.length === 0 ? <p className="text-base leading-7 text-acrux-muted">Alteração no registro, sem campos adicionais para exibir.</p> : null}
        <p className="text-xs leading-5 text-acrux-muted [overflow-wrap:anywhere]">Registro: {item.entity_id}. Textos longos podem aparecer como trechos.</p>
      </div>
    </details>
    {!item.read_at ? <button className="button-secondary mt-4 w-full sm:w-auto" disabled={disabled} onClick={onRead} type="button">{marking ? "Marcando leitura…" : "Marcar como lida"}</button> : null}
  </article>;
}
