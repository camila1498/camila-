"use client";

import { logWhatsApp } from "@/app/plataforma/(panel)/campanas/actions";
import styles from "@/app/plataforma/admin.module.css";

type WhatsAppButtonProps = {
  url: string;
  submissionId: string;
  template: string;
  to: string;
  who: "persona" | "tutor";
  label: string;
  title?: string;
};

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5-1.6A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3a8.2 8.2 0 1 1 6.8 3.7Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 3.9c1.7.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.3-.5-.4Z" />
    </svg>
  );
}

/**
 * Abre WhatsApp con el mensaje ya escrito. Es un enlace normal (sin bloqueo de ventanas emergentes)
 * y, de paso, deja constancia en el historial de quién lo abrió.
 */
export default function WhatsAppButton({ url, submissionId, template, to, who, label, title }: WhatsAppButtonProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.waBtn}
      title={title ?? label}
      onClick={() => {
        void logWhatsApp(submissionId, template, to, who);
      }}
    >
      <WhatsAppIcon />
      {label}
    </a>
  );
}
