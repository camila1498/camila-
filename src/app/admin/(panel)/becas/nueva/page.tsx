import Link from "next/link";
import { requireRole } from "@/lib/admin/auth";
import BecaForm from "@/components/admin/BecaForm";
import styles from "../../../admin.module.css";
import { createBeca } from "../actions";

export default async function NuevaBecaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("admin");
  const { error } = await searchParams;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Nueva beca</h1>
          <p>
            <Link href="/admin/becas">← Volver a becas</Link>
          </p>
        </div>
      </div>
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}
      <BecaForm action={createBeca} />
    </>
  );
}
