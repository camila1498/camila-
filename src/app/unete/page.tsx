import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Beneficios from "@/components/voluntarios/Beneficios";
import RolesAbiertos from "@/components/voluntarios/RolesAbiertos";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Únete — CreateLatam",
};

export default function UnetePage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Únete
          </p>
          <h1>Estamos construyendo nuestra próxima etapa</h1>
          <p>
            Estamos relanzando CreateLatam con una nueva estructura. Si quieres ser parte de la
            comunidad que forma a la próxima generación de mujeres en tech, este es el momento.
          </p>
          <p style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/unete/voluntariado" className="btn-primary">
              Quiero ser voluntaria/o →
            </Link>
            <Link href="/unete/aliados" className="btn-ghost">
              Quiero ser aliada/o
            </Link>
          </p>
        </div>
      </section>

      <Beneficios />
      <RolesAbiertos />

      <section className="cta-strip">
        <div className="wrap">
          <h2>¿Tienes preguntas?</h2>
          <p>
            Escríbenos a <strong>{CONTACT_EMAIL}</strong> y con gusto te contamos más.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn-primary">
            Contáctanos →
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
