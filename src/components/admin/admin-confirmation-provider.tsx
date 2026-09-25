"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { ConfirmationDialog, type ConfirmationRequest } from "@/components/admin/confirmation-dialog";

type ConfirmationOptions = Omit<ConfirmationRequest, "onConfirm">;
type AskConfirmation = (options: ConfirmationOptions) => Promise<boolean>;

const ConfirmationContext = createContext<AskConfirmation | null>(null);

export function AdminConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const resolvePending = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<AskConfirmation>((options) => {
    if (resolvePending.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      resolvePending.current = resolve;
      setRequest({ ...options, onConfirm: () => {} });
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    const resolve = resolvePending.current;
    resolvePending.current = null;
    setRequest(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => () => { resolvePending.current?.(false); resolvePending.current = null; }, []);

  return <ConfirmationContext.Provider value={confirm}>
    {children}
    <ConfirmationDialog request={request} busy={false} onCancel={() => settle(false)} onConfirm={() => settle(true)} />
  </ConfirmationContext.Provider>;
}

export function useAdminConfirm() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error("A confirmação administrativa precisa do provedor do painel.");
  return confirm;
}
