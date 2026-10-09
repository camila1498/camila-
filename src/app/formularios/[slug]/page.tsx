import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import { formPath, isBuiltInForm, SLUG_MAX, SLUG_PATTERN } from "@/lib/forms/paths";
import { getPublicForm } from "@/lib/forms/store";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

// Sin paginas generadas al compilar: cada formulario se genera la primera vez que se visita y se cachea.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = SLUG_PATTERN.test(slug) && slug.length <= SLUG_MAX ? await getPublicForm(slug) : null;
  return {
    title: form ? `${form.title} — CreateLatam` : "Formulario — CreateLatam",
    robots: form?.state === "open" ? undefined : { index: false },
  };
}

/** Formularios creados desde la plataforma. Los cinco originales conservan su ruta propia. */
export default async function FormularioPage({ params }: Props) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX) notFound();
  if (isBuiltInForm(slug)) redirect(formPath(slug));

  const form = await getPublicForm(slug);
  if (!form) notFound();

  return <FormPage slug={slug} trail={[]} />;
}
