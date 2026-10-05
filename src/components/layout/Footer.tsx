import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import { programs } from "@/data/programs";
import { CONTACT_EMAIL } from "@/lib/constants";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="star">
              <StarIcon size={20} fill="#5B1BD2" />
            </span>
            CreateLatam
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Organización</h4>
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/equipo">Equipo</Link>
                </li>
                <li>
                  <Link href="/oportunidades">Oportunidades</Link>
                </li>
                <li>
                  <Link href="/unete">Únete</Link>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Programas</h4>
              <ul>
                {programs.map((program) => (
                  <li key={program.slug}>
                    <Link href={`/programas/${program.slug}`}>{program.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 CreateLatam. Educación gratuita en IA, diseño de producto y STEM para jóvenes de
          Latinoamérica.
        </div>
      </div>
    </footer>
  );
}
