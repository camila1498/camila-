import { requireRole, roleLabels, type Role } from "@/lib/admin/auth";
import styles from "../../admin.module.css";
import { addMember, setMemberActive, setMemberRole } from "./actions";

type Member = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  user_id: string | null;
  active: boolean;
};

const roles = Object.keys(roleLabels) as Role[];

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { supabase, user } = await requireRole("admin");

  const { data, error: loadError } = await supabase
    .from("members")
    .select("id,email,full_name,role,user_id,active")
    .order("created_at", { ascending: true })
    .overrideTypes<Member[], { merge: false }>();
  const members = data ?? [];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Miembros</h1>
          <p>
            Solo pueden ingresar con Google quienes estén en esta lista. {members.length}{" "}
            registrados.
          </p>
        </div>
      </div>

      {ok && <div className={`${styles.flash} ${styles.ok}`}>{ok}</div>}
      {(error || loadError) && (
        <div className={`${styles.flash} ${styles.error}`}>
          {error ?? `No se pudieron cargar los miembros: ${loadError?.message}`}
        </div>
      )}

      <form action={addMember} className={`${styles.form} ${styles.formInline}`}>
        <div className={styles.field}>
          <label htmlFor="email">Correo de Google</label>
          <input id="email" name="email" type="email" required placeholder="nombre@gmail.com" />
        </div>
        <div className={styles.field}>
          <label htmlFor="full_name">Nombre (opcional)</label>
          <input id="full_name" name="full_name" maxLength={120} />
        </div>
        <div className={styles.field}>
          <label htmlFor="role">Rol</label>
          <select id="role" name="role" defaultValue="team">
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.btn}>
          Registrar
        </button>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.user_id === user.id;
              return (
                <tr key={member.id} className={member.active ? undefined : styles.hiddenRow}>
                  <td className={styles.titleCell}>
                    <strong>{member.full_name ?? member.email}</strong>
                    <span>
                      {member.full_name ? `${member.email} · ` : ""}
                      {member.user_id ? "Ya ingresó" : "Aún no ingresa"}
                      {isSelf ? " · Tú" : ""}
                    </span>
                  </td>
                  <td>
                    {isSelf ? (
                      roleLabels[member.role]
                    ) : (
                      <form action={setMemberRole.bind(null, member.id)} className={styles.inlineForm}>
                        <select
                          name="role"
                          defaultValue={member.role}
                          className={styles.select}
                          aria-label={`Rol de ${member.email}`}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={styles.btnGhost}>
                          OK
                        </button>
                      </form>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.pill} ${styles.pillStatic} ${member.active ? styles.pillOn : styles.pillOff}`}
                    >
                      {member.active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td>
                    {!isSelf && (
                      <form action={setMemberActive.bind(null, member.id, !member.active)}>
                        <button type="submit" className={styles.btnGhost}>
                          {member.active ? "Desactivar" : "Reactivar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
