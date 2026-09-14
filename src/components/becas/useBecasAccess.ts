"use client";

import { useEffect, useState } from "react";
import { BECAS_ACCESS_CODE, BECAS_SESSION_KEY } from "@/lib/constants";

/**
 * Gate de clave del dashboard de becas. Es el mismo mecanismo de la maqueta original:
 * una clave en texto plano comparada en el cliente y recordada en sessionStorage.
 * No es autenticación real — ver la nota en `src/lib/constants.ts`.
 */
export function useBecasAccess() {
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(BECAS_SESSION_KEY) === "ok") {
      setUnlocked(true);
    }
  }, []);

  function verify(input: string) {
    if (input.trim().toUpperCase() === BECAS_ACCESS_CODE) {
      sessionStorage.setItem(BECAS_SESSION_KEY, "ok");
      setUnlocked(true);
      setError(false);
      return true;
    }
    setError(true);
    return false;
  }

  return { unlocked, error, verify };
}
