import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Acceso — Admin CreateLatam",
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
        <h1>Panel de administración</h1>
        <p>Ingresa con tu correo de administrador. Te enviaremos un enlace de acceso.</p>
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
