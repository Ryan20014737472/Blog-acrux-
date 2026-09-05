"use client";

import { useSearchParams } from "next/navigation";

export function LoginErrorNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("error") !== "unauthorized") {
    return null;
  }

  return (
    <p className="mb-4 rounded-xl border border-yellow-200/24 bg-yellow-300/8 px-4 py-3 text-sm text-yellow-50" role="alert">
      Esta conta não possui permissão administrativa.
    </p>
  );
}
