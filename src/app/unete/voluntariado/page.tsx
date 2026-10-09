import type { Metadata } from "next";
import FormPage from "@/components/forms/FormPage";

export const metadata: Metadata = { title: "Voluntariado — CreateLatam" };
export const revalidate = 60;

export default function VoluntariadoPage() {
  return <FormPage slug="voluntariado" trail={[{ label: "Únete", href: "/unete" }]} />;
}
