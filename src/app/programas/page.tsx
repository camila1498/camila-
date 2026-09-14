import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProgramDetail from "@/components/programas/ProgramDetail";
import { programPillars } from "@/data/programs";
import { VOLUNTEER_FORM_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Programas — CreateLatam",
};

export default function ProgramasPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Programas
          </p>
          <h1>Tres formas de aprender, en comunidad</h1>
          <p>
            Eventos, mentorías y programas de formación — cada uno pensado para un momento
            distinto del camino de una chica hacia la tecnología y el diseño.
          </p>
        </div>
      </section>

      {programPillars.map((pillar, index) => (
        <ProgramDetail pillar={pillar} alt={index % 2 === 1} key={pillar.title} />
      ))}

      <section className="cta-strip">
        <div className="wrap">
          <h2>¿Lista para ser parte?</h2>
          <p>Estamos abiertos — postulaciones activas para voluntariado y para nuestros próximos programas.</p>
          <a href={VOLUNTEER_FORM_URL} target="_blank" rel="noreferrer" className="btn-primary">
            Sé voluntaria →
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
