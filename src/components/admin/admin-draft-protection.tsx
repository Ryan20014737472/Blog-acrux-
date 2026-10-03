"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { ConfirmationRequest } from "@/components/admin/confirmation-dialog";

interface DraftProtection {
  dirty: boolean;
  busy: boolean;
  discardDescription: string;
}

type AskConfirmation = (request: Omit<ConfirmationRequest, "onConfirm">) => Promise<boolean>;
interface ProtectionContext {
  busy: boolean;
  notice: string;
  register: (id: string, protection: DraftProtection) => () => void;
  requestNavigation: () => Promise<boolean>;
}

const DraftProtectionContext = createContext<ProtectionContext | null>(null);
const historyMarker = "acruxAdminDraftGuard";

export function AdminDraftProtectionProvider({ children, confirm }: { children: ReactNode; confirm: AskConfirmation }) {
  const protections = useRef(new Map<string, DraftProtection>());
  const allowUnload = useRef(false);
  const sentinel = useRef<{ token: string; url: string } | null>(null);
  const removing = useRef<{ promise: Promise<void>; resolve: () => void; rearm: boolean } | null>(null);
  const departing = useRef(false);
  const acceptedBack = useRef(false);
  const backPending = useRef(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");

  const register = useCallback((id: string, protection: DraftProtection) => {
    protections.current.set(id, protection);
    setRevision((value) => value + 1);
    if (!protection.busy) setNotice("");
    return () => {
      protections.current.delete(id);
      setRevision((value) => value + 1);
    };
  }, []);

  const hasProtection = useCallback(() => [...protections.current.values()].some((protection) => protection.dirty || protection.busy), []);
  const armHistory = useCallback(() => {
    if (sentinel.current || removing.current || departing.current || !hasProtection()) return;
    const entry = { token: crypto.randomUUID(), url: location.href };
    sentinel.current = entry;
    // Next adds its current router state to custom history entries. Do not copy
    // a previously captured __NA/tree, which can restore the wrong route.
    history.pushState({ [historyMarker]: entry.token }, "", entry.url);
  }, [hasProtection]);

  const removeHistory = useCallback((rearm: boolean) => {
    if (removing.current) return removing.current.promise;
    const entry = sentinel.current;
    if (!entry || history.state?.[historyMarker] !== entry.token || location.href !== entry.url) {
      sentinel.current = null;
      return Promise.resolve();
    }
    let finish!: () => void;
    const promise = new Promise<void>((resolve) => { finish = resolve; });
    removing.current = { promise, resolve: finish, rearm };
    history.back();
    return promise;
  }, []);

  const confirmNavigation = useCallback(async () => {
    const current = [...protections.current.values()];
    if (current.some((protection) => protection.busy)) {
      setNotice("Aguarde a operação em andamento terminar antes de sair desta página.");
      return false;
    }
    const unsaved = current.filter((protection) => protection.dirty);
    if (!unsaved.length) return true;
    return confirm({
      title: "Sair sem salvar?",
      description: unsaved.length === 1 ? unsaved[0].discardDescription : "As alterações ainda não salvas serão descartadas.",
      confirmLabel: "Descartar e sair",
      tone: "danger",
    });
  }, [confirm]);

  const requestNavigation = useCallback(async () => {
    if (!await confirmNavigation()) return false;
    departing.current = true;
    await removeHistory(false);
    allowUnload.current = true;
    return true;
  }, [confirmNavigation, removeHistory]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowUnload.current) { allowUnload.current = false; return; }
      if (![...protections.current.values()].some((protection) => protection.dirty || protection.busy)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href);
      if (destination.pathname === location.pathname && destination.search === location.search && destination.origin === location.origin) return;
      if (![...protections.current.values()].some((protection) => protection.dirty || protection.busy)) return;
      event.preventDefault();
      event.stopPropagation();
      void requestNavigation().then((accepted) => {
        if (!accepted) return;
        allowUnload.current = true;
        window.location.assign(destination.href);
      });
    };
    const traverse = (event: PopStateEvent) => {
      if (removing.current) {
        event.stopImmediatePropagation();
        const removal = removing.current;
        removing.current = null;
        sentinel.current = null;
        removal.resolve();
        if (removal.rearm) armHistory();
        return;
      }
      if (acceptedBack.current) { acceptedBack.current = false; return; }
      const entry = sentinel.current;
      if (!entry || !hasProtection()) return;
      // Hash-only traversal stays within the editor and does not discard it.
      const current = new URL(location.href);
      const protectedUrl = new URL(entry.url);
      if (current.pathname === protectedUrl.pathname && current.search === protectedUrl.search && location.href !== entry.url) return;
      if (event.state?.[historyMarker] === entry.token) return;
      event.stopImmediatePropagation();
      // Restore the duplicate entry immediately, before opening the dialog, so
      // another Back press also stops before Next unmounts the editor.
      history.pushState({ [historyMarker]: entry.token }, "", entry.url);
      if (backPending.current) return;
      backPending.current = true;
      void confirmNavigation().then(async (accepted) => {
        backPending.current = false;
        if (!accepted) return;
        departing.current = true;
        await removeHistory(false);
        allowUnload.current = true;
        acceptedBack.current = true;
        history.back();
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", traverse, true);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", traverse, true);
      document.removeEventListener("click", navigate, true);
    };
  }, [requestNavigation, confirmNavigation, removeHistory, hasProtection, armHistory]);

  useEffect(() => {
    if (hasProtection()) armHistory();
    else void removeHistory(true);
  }, [revision, hasProtection, armHistory, removeHistory]);

  const value = { busy: [...protections.current.values()].some((protection) => protection.busy), notice, register, requestNavigation };
  return <DraftProtectionContext.Provider value={value}>{children}</DraftProtectionContext.Provider>;
}

export function useAdminDraftProtection({ dirty, busy, discardDescription }: DraftProtection) {
  const protection = useContext(DraftProtectionContext);
  const register = protection?.register;
  const id = useId();
  useEffect(() => register?.(id, { dirty, busy, discardDescription }), [register, id, dirty, busy, discardDescription]);
}

export function useAdminNavigationProtection() {
  const protection = useContext(DraftProtectionContext);
  return {
    busy: protection?.busy ?? false,
    notice: protection?.notice ?? "",
    requestNavigation: protection?.requestNavigation ?? (() => Promise.resolve(true)),
  };
}
