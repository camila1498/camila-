import type { Metadata } from "next";
import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import LoginCard from "./LoginCard";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Ingresar — CreateLatam",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.login}>
      <div className={styles.loginBox}>
        <span className={styles.loginMark}>
          <StarIcon size={28} fill="#5B1BD2" />
        </span>
        <h1>Plataforma CreateLatam</h1>
        <p>Acceso solo para miembros registrados. Ingresa con tu cuenta de Google.</p>
        <LoginCard initialError={error} />
        <Link href="/" className={styles.loginBack}>
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
