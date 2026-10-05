import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeamByArea from "@/components/voluntarios/TeamByArea";

export const metadata: Metadata = {
  title: "Equipo — CreateLatam",
};

export default function EquipoPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <p className="breadcrumb">
            <Link href="/">CreateLatam</Link> / Equipo
          </p>
          <h1>Los voluntarios detrás de CreateLatam</h1>
          <p>25 voluntarios, repartidos en distintas áreas, sosteniendo la operación día a día.</p>
        </div>
      </section>

      <TeamByArea />

      <section className="cta-strip">
        <div className="wrap">
          <h2>¿Quieres ser parte del equipo?</h2>
          <p>Conoce los beneficios de ser voluntaria y los roles abiertos.</p>
          <Link href="/unete" className="btn-primary">
            Únete →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
