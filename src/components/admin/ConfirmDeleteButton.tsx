"use client";

import styles from "@/app/plataforma/admin.module.css";

type ConfirmDeleteButtonProps = {
  action: () => void | Promise<void>;
  message: string;
  label?: string;
};

/** Boton fuera del <form> principal: usa formAction para no anidar formularios. */
export default function ConfirmDeleteButton({ action, message, label = "Eliminar" }: ConfirmDeleteButtonProps) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      className={styles.btnDanger}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
