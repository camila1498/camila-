"use client";

import Link from "next/link";
import StarIcon from "@/components/ui/StarIcon";
import { VOLUNTEER_FORM_URL } from "@/lib/constants";

type HeaderProps = {
  /** Solo se pasa en home: abre el modal de Becas en vez de navegar. */
  onOpenBecas?: () => void;
};

export default function Header({ onOpenBecas }: HeaderProps) {
  const isHome = Boolean(onOpenBecas);

  return (
    <header>
      <nav className="wrap">
        <Link href={isHome ? "#top" : "/"} className="brand">
          <span className="star">
            <StarIcon size={22} fill="#FFD938" />
          </span>
          CreateLatam
        </Link>
        <ul>
          <li>
            <Link href={isHome ? "#about" : "/#about"}>Nosotras</Link>
          </li>
          <li>
            <Link href="/programas">Programas</Link>
          </li>
          <li>
            {onOpenBecas ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenBecas();
                }}
              >
                Oportunidades
              </a>
            ) : (
              <Link href="/#oportunidades">Oportunidades</Link>
            )}
          </li>
          <li>
            <Link href={isHome ? "#impacto" : "/#impacto"}>Impacto</Link>
          </li>
          <li>
            <Link href={isHome ? "#unete" : "/#unete"}>Únete</Link>
          </li>
          {onOpenBecas && (
            <li>
              <a
                href="#"
                style={{ color: "var(--magenta)", fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenBecas();
                }}
              >
                🔐 Becas
              </a>
            </li>
          )}
        </ul>
        {isHome ? (
          <Link href="#unete" className="nav-cta">
            Postula →
          </Link>
        ) : (
          <a href={VOLUNTEER_FORM_URL} target="_blank" rel="noreferrer" className="nav-cta">
            Estamos abiertos →
          </a>
        )}
      </nav>
    </header>
  );
}
