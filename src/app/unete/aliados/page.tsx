import type { Metadata } from "next";
import FormPage from "@/components/forms/FormPage";

export const metadata: Metadata = { title: "Aliados — CreateLatam" };
export const revalidate = 60;

export default function AliadosPage() {
  return <FormPage slug="aliados" trail={[{ label: "Únete", href: "/unete" }]} />;
}
