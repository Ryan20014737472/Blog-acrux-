"use client";

import { useEffect, useState } from "react";

/** Use only for client-only UI that must wait for hydration. */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

