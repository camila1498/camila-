"use client";

import { type ReactNode, useState } from "react";
import StarIcon from "@/components/ui/StarIcon";
import { useBecasAccess } from "./useBecasAccess";
import styles from "./BecasAccessGate.module.css";

type BecasAccessGateProps = {
  children: ReactNode;
};

/** Gate de página completa usado por /becas — igual al overlay de la maqueta original. */
export default function BecasAccessGate({ children }: BecasAccessGateProps) {
  const { unlocked, error, verify } = useBecasAccess();
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit() {
    const ok = verify(value);
    if (!ok) {
      setValue("");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <span className="star">
          <StarIcon fill="#5B1BD2" />
        </span>
        <h2>Espacio exclusivo para voluntarios</h2>
        <p>Este dashboard es solo para el equipo CreateLatam. Ingresa tu clave de acceso para continuar.</p>
        <input
          type="password"
          className={`${styles.input} ${shake ? styles.error : ""}`}
          placeholder="Clave de acceso"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button type="button" className={styles.button} onClick={handleSubmit}>
          Ingresar →
        </button>
        {error && <p className={styles.errorText}>Clave incorrecta. Inténtalo de nuevo.</p>}
      </div>
    </div>
  );
}
