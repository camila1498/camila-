import Link from "next/link";
import { becaFilters } from "@/data/becas";
import styles from "@/app/admin/admin.module.css";

export type BecaFormValues = {
  slug: string;
  label: string;
  tag_variant: string;
  estado: string;
  title: string;
  institution: string;
  description: string;
  deadline: string;
  tags: string[];
  url: string | null;
  published: boolean;
};

const empty: BecaFormValues = {
  slug: "",
  label: "",
  tag_variant: "default",
  estado: "● Abierta",
  title: "",
  institution: "",
  description: "",
  deadline: "",
  tags: [],
  url: "",
  published: true,
};

type BecaFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  values?: BecaFormValues;
  /** En edición el slug no cambia (es el identificador estable de la beca). */
  lockSlug?: boolean;
  children?: React.ReactNode;
};

const filterTags = becaFilters
  .filter((f) => f.value !== "all")
  .map((f) => f.value)
  .join(", ");

export default function BecaForm({ action, values = empty, lockSlug, children }: BecaFormProps) {
  return (
    <form action={action} className={styles.form}>
      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="title">Título</label>
        <input id="title" name="title" required maxLength={200} defaultValue={values.title} />
      </div>

      <div className={styles.field}>
        <label htmlFor="institution">Institución y lugar</label>
        <input
          id="institution"
          name="institution"
          required
          maxLength={200}
          defaultValue={values.institution}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="deadline">Fecha límite</label>
        <input
          id="deadline"
          name="deadline"
          required
          maxLength={100}
          defaultValue={values.deadline}
          placeholder="📅 31 enero 2027"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="label">Etiqueta</label>
        <input id="label" name="label" required maxLength={60} defaultValue={values.label} />
      </div>
      <div className={styles.field}>
        <label htmlFor="tag_variant">Color de la etiqueta</label>
        <select id="tag_variant" name="tag_variant" defaultValue={values.tag_variant}>
          <option value="default">Lavanda (por defecto)</option>
          <option value="stem">Verde (STEM)</option>
          <option value="liderazgo">Naranja (Liderazgo)</option>
          <option value="europa">Violeta claro (Europa)</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="estado">Estado</label>
        <input id="estado" name="estado" required maxLength={60} defaultValue={values.estado} />
      </div>
      <div className={styles.field}>
        <label htmlFor="url">Enlace (opcional)</label>
        <input
          id="url"
          name="url"
          type="url"
          maxLength={500}
          defaultValue={values.url ?? ""}
          placeholder="https://…"
        />
        <span className={styles.hint}>Si lo dejas vacío, la tarjeta no muestra “Ver más”.</span>
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={1000}
          defaultValue={values.description}
        />
      </div>

      <div className={`${styles.field} ${styles.full}`}>
        <label htmlFor="tags">Etiquetas de filtro</label>
        <input id="tags" name="tags" defaultValue={values.tags.join(", ")} />
        <span className={styles.hint}>
          Separadas por coma. Los filtros del sitio usan: {filterTags}. Puedes agregar otras
          (europa, mujeres, …) para la búsqueda.
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          defaultValue={values.slug}
          readOnly={lockSlug}
          placeholder="se genera desde el título"
        />
      </div>
      <div className={`${styles.field} ${styles.check}`}>
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={values.published}
        />
        <label htmlFor="published">Visible en el sitio</label>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.btn}>
          Guardar
        </button>
        <Link href="/admin/becas" className={styles.btnGhost}>
          Cancelar
        </Link>
        <span className={styles.spacer} />
        {children}
      </div>
    </form>
  );
}
