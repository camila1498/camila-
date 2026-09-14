import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeamByArea from "@/components/voluntarios/TeamByArea";
import Beneficios from "@/components/voluntarios/Beneficios";
import RolesAbiertos from "@/components/voluntarios/RolesAbiertos";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Voluntarios — CreateLatam",
};

export default function VoluntariosPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Voluntarios
          </p>
          <h1>Los voluntarios detrás de CreateLatam</h1>
          <p>25 voluntarios, repartidos en distintas áreas, sosteniendo la operación día a día.</p>
        </div>
      </section>

      <TeamByArea />
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
