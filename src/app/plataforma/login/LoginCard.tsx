"use client";

import { useState } from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import styles from "../admin.module.css";

export default function LoginCard({ initialError }: { initialError?: string }) {
  const [error, setError] = useState(initialError ?? "");

  return (
    <>
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}
      <GoogleSignInButton className={styles.googleBtn} onError={setError} />
    </>
  );
}
