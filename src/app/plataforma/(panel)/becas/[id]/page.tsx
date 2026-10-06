import Link from "next/link";
import { notFound } from "next/navigation";
import BecaForm, { type BecaFormValues } from "@/components/admin/BecaForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { requireRole } from "@/lib/admin/auth";
import styles from "../../../admin.module.css";
import { deleteBeca, updateBeca } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarBecaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireRole("admin");
  const { data } = await supabase
    .from("becas")
    .select("slug,label,tag_variant,estado,title,institution,description,deadline,tags,url,published")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<BecaFormValues, { merge: false }>();
  if (!data) notFound();

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Editar beca</h1>
          <p>
            <Link href="/plataforma/becas">← Volver a becas</Link>
          </p>
        </div>
      </div>
      {error && <div className={`${styles.flash} ${styles.error}`}>{error}</div>}
      <BecaForm action={updateBeca.bind(null, id)} values={data} lockSlug>
        <ConfirmDeleteButton
          action={deleteBeca.bind(null, id)}
          message={`¿Eliminar “${data.title}”? Esta acción no se puede deshacer. Si solo quieres quitarla del sitio, ocúltala.`}
        />
      </BecaForm>
    </>
  );
}
