"use client";

import { useEffect, useState } from "react";
import StarIcon from "@/components/ui/StarIcon";
import BecasDashboard from "./BecasDashboard";
import { useBecasAccess } from "./useBecasAccess";
import styles from "./BecasModal.module.css";

type BecasModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function BecasModal({ open, onClose }: BecasModalProps) {
  const { unlocked, error, verify } = useBecasAccess();
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSubmit() {
    const ok = verify(value);
    if (!ok) {
      setValue("");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div
      className={`${styles.overlay} ${open ? styles.active : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose} title="Cerrar" type="button">
          ✕
        </button>

        {!unlocked ? (
          <div className={styles.login}>
            <span className="star">
              <StarIcon fill="#5B1BD2" />
            </span>
            <h2>Espacio exclusivo para voluntarios</h2>
            <p>Este dashboard es solo para el equipo CreateLatam. Ingresa tu clave de acceso.</p>
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
        ) : (
          <div className={styles.dashboard}>
            <div className={styles.dashHeader}>
              <h2>Dashboard de Becas 🌟</h2>
              <p>38+ oportunidades internacionales para la comunidad CreateLatam</p>
            </div>
            <div className={styles.dashBody}>
              <BecasDashboard variant="modal" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
