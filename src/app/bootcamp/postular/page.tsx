import type { Metadata } from "next";
import FormPage from "@/components/forms/FormPage";

export const metadata: Metadata = { title: "Postulación al Bootcamp 2026 — CreateLatam" };
export const revalidate = 60;

export default function BootcampPostularPage() {
  return <FormPage slug="bootcamp" trail={[]} />;
}
