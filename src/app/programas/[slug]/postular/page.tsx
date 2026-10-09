import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FormPage from "@/components/forms/FormPage";
import { getProgram } from "@/data/programs";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

/** Solo los programas con postulacion propia. */
const formByProgram: Record<string, string> = {
  emplealab: "emplealab",
  createwomen: "createwomen",
};

export function generateStaticParams() {
  return Object.keys(formByProgram).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);
  return { title: program ? `Postular a ${program.title} — CreateLatam` : "Postular — CreateLatam" };
}

export default async function PostularPage({ params }: Props) {
  const { slug } = await params;
  const formSlug = formByProgram[slug];
  if (!formSlug) notFound();

  return (
    <FormPage
      slug={formSlug}
      trail={[
        { label: "Programas", href: "/programas" },
        { label: getProgram(slug)?.title ?? slug, href: `/programas/${slug}` },
      ]}
    />
  );
}
