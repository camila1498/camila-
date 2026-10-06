"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import StarIcon from "@/components/ui/StarIcon";

const links = [
  { href: "/", label: "Home" },
  { href: "/programas", label: "Programas" },
  { href: "/equipo", label: "Equipo" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/unete", label: "Únete" },
];

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header>
      <nav className="wrap">
        <Link href="/" className="brand">
          <span className="star">
            <StarIcon size={22} fill="#FFD938" />
          </span>
          CreateLatam
        </Link>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? "active" : undefined}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <GoogleSignInButton label="Ingresar" className="nav-login" />
          <Link href="/unete" className="nav-cta">
            Estamos abiertos →
          </Link>
        </div>
      </nav>
    </header>
  );
}
