"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { parseNotificationStatus, type ContentNotificationStatus } from "@/features/admin/notification-model";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const notificationRefreshEvent = "acrux:content-notifications-refresh";

export function refreshContentNotificationStatus() {
  window.dispatchEvent(new Event(notificationRefreshEvent));
}

export function useContentNotificationStatus(userId: string) {
  const [status, setStatus] = useState<ContentNotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(() => refreshRef.current(), []);

  useEffect(() => {
    let current = true;
    let pending = false;
    setStatus(null);
    setLoading(true);
    setError(null);

    async function checkStatus() {
      if (pending) return;
      pending = true;
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) throw new Error("Supabase unavailable");
        const { data, error: requestError } = await supabase.rpc("content_notification_status");
        if (requestError) throw requestError;
        const result = parseNotificationStatus(data);
        if (current) {
          setStatus(result);
          setError(null);
        }
      } catch {
        if (current) setError("Não foi possível consultar as notificações. Confira sua conexão e tente novamente.");
      } finally {
        pending = false;
        if (current) setLoading(false);
      }
    }

    refreshRef.current = checkStatus;
    void checkStatus();
    function refreshWhenVisible() {
      if (!document.hidden) void checkStatus();
    }
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener(notificationRefreshEvent, refreshWhenVisible);
    return () => {
      current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener(notificationRefreshEvent, refreshWhenVisible);
      refreshRef.current = async () => {};
    };
  }, [userId]);

  return { status, loading, error, refresh };
}
