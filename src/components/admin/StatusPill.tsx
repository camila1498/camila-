import { STATUS_LABELS, statusClass } from "@/lib/forms/review";
import styles from "@/app/plataforma/admin.module.css";

export default function StatusPill({ status }: { status: string }) {
  const cls = styles[statusClass(status)] ?? "";
  return <span className={`${styles.statusPill} ${cls}`}>{STATUS_LABELS[status] ?? status}</span>;
}
