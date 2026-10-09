"use client";

import styles from "@/app/plataforma/admin.module.css";

type ConfirmDeleteButtonProps = {
  action: () => void | Promise<void>;
  message: string;
  label?: string;
  /** "primary" para acciones que confirman algo importante pero no destructivo. */
  tone?: "danger" | "primary";
};

/** Boton fuera del <form> principal: usa formAction para no anidar formularios. */
export default function ConfirmDeleteButton({ action, message, label = "Eliminar", tone = "danger" }: ConfirmDeleteButtonProps) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      className={tone === "primary" ? styles.btn : styles.btnDanger}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
