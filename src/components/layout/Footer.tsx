"use client";

import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import { BOOTCAMP_WAITLIST_URL, VOLUNTEER_FORM_URL } from "@/lib/constants";

type FooterProps = {
  /** Solo se pasa en home: agrega las columnas de enlaces y el trigger del dashboard de becas. */
  onOpenBecas?: () => void;
};

export default function Footer({ onOpenBecas }: FooterProps) {
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

          {onOpenBecas && (
            <div className="footer-cols">
              <div className="footer-col">
                <h4>Organización</h4>
                <ul>
                  <li>
                    <Link href="#about">Nosotras</Link>
                  </li>
                  <li>
                    <Link href="/programas">Programas</Link>
                  </li>
                  <li>
                    <Link href="#oportunidades">Oportunidades</Link>
                  </li>
                  <li>
                    <Link href="#aliados">Aliados</Link>
                  </li>
                  <li>
                    <Link href="/voluntarios">Voluntarios</Link>
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Iniciativas</h4>
                <ul>
                  <li>
                    <Link href="#iniciativas">CEP</Link>
                  </li>
                  <li>
                    <Link href="#iniciativas">EmpleaLab</Link>
                  </li>
                  <li>
                    <Link href="#iniciativas">CreateWomen</Link>
                  </li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Comunidad</h4>
                <ul>
                  <li>
                    <a href={VOLUNTEER_FORM_URL} target="_blank" rel="noreferrer">
                      Sé voluntaria
                    </a>
                  </li>
                  <li>
                    <a href={BOOTCAMP_WAITLIST_URL} target="_blank" rel="noreferrer">
                      Waitlist Bootcamp
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenBecas();
                      }}
                    >
                      🔐 Dashboard de Becas
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="footer-bottom">
          © 2026 CreateLatam. Educación gratuita en IA, diseño de producto y STEM para jóvenes de
          Latinoamérica.
        </div>
      </div>
    </footer>
  );
}
