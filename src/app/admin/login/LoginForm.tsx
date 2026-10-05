"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(initialError ?? "");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Solo usuarios ya creados en Supabase: nadie se registra desde aqui.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("idle");
      setError(
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.",
      );
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p>
        Si <strong>{email}</strong> tiene acceso, te enviamos un enlace para entrar. Ábrelo en este
        mismo navegador.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className={styles.btn} disabled={status === "sending"}>
        {status === "sending" ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
