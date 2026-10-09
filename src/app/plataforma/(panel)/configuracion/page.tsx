import { requireRole } from "@/lib/admin/auth";
import { formatLima } from "@/lib/forms/lima";
import { legalStatus, loadLegal } from "@/lib/forms/legal-admin";
import styles from "../../admin.module.css";
import { approveLegal, revokeLegal, saveLegal } from "./actions";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase } = await requireRole("admin");
  const row = await loadLegal(supabase);
  const status = legalStatus(row);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Configuración</h1>
          <p>Datos legales que aparecen en el aviso de privacidad de todos los formularios.</p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}

      <div className={`${styles.flash} ${status.ready ? styles.ok : styles.warn}`}>
        {status.ready ? (
          <>
            <strong>Listo para publicar.</strong> Aprobado por {row?.approved_by} el {formatLima(row?.approved_at ?? null)}.
          </>
        ) : (
          <>
            <strong>Aún no se puede publicar ningún formulario.</strong> {status.message}
          </>
        )}
      </div>

      <form action={saveLegal} className={styles.form}>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="controller_name">Responsable del tratamiento</label>
          <input id="controller_name" name="controller_name" required maxLength={200} defaultValue={row?.controller_name ?? ""} />
          <span className={styles.hint}>La Asociación CreateLatam, o la persona natural que Legal indique de forma temporal.</span>
        </div>
        <div className={styles.field}>
          <label htmlFor="ruc">RUC</label>
          <input id="ruc" name="ruc" inputMode="numeric" maxLength={11} defaultValue={row?.ruc ?? ""} placeholder="11 dígitos" />
        </div>
        <div className={styles.field}>
          <label htmlFor="privacy_email">Correo de privacidad</label>
          <input id="privacy_email" name="privacy_email" type="email" defaultValue={row?.privacy_email ?? ""} />
          <span className={styles.hint}>Para solicitudes de acceso, rectificación, cancelación u oposición.</span>
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="address">Domicilio</label>
          <input id="address" name="address" maxLength={300} defaultValue={row?.address ?? ""} />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="storage_notice">Dónde se guardan los datos</label>
          <textarea id="storage_notice" name="storage_notice" rows={3} required maxLength={600} defaultValue={row?.storage_notice ?? ""} />
          <span className={styles.hint}>Debe declarar los servidores fuera del Perú. Legal confirma el texto.</span>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar datos
          </button>
          <span className={styles.hint}>Cambiar cualquiera de estos datos retira la aprobación de Legal.</span>
        </div>
      </form>

      <h2 className={styles.sectionTitle}>Aprobación de Legal</h2>
      <p className={styles.hint} style={{ marginBottom: 14 }}>
        Ningún formulario se publica ni recibe envíos sin esta aprobación. Registra aquí quién la dio, después de que Legal
        revise los datos de arriba y el aviso de privacidad.
      </p>
      {row?.approved_at ? (
        <form action={revokeLegal}>
          <button type="submit" className={styles.btnDanger}>
            Retirar la aprobación
          </button>
        </form>
      ) : (
        <form action={approveLegal} className={`${styles.form} ${styles.publishForm}`}>
          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="approved_by">Nombre de quien aprobó por Legal</label>
            <input id="approved_by" name="approved_by" required maxLength={120} />
          </div>
          <div className={`${styles.field} ${styles.check} ${styles.full}`}>
            <input id="confirm" name="confirm" type="checkbox" required />
            <label htmlFor="confirm">Legal revisó y aprobó estos datos y el aviso de privacidad.</label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>
              Registrar aprobación
            </button>
          </div>
        </form>
      )}
    </>
  );
}
