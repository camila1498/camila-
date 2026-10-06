"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import StarIcon from "@/components/ui/StarIcon";
import type { NavSection } from "@/lib/admin/nav";
import NavIcon from "./NavIcon";
import styles from "@/app/plataforma/admin.module.css";

type AdminShellProps = {
  sections: NavSection[];
  user: { email: string; name: string | null; avatar: string | null };
  roleLabel: string;
  signOutAction: () => void | Promise<void>;
  children: React.ReactNode;
};

export default function AdminShell({
  sections,
  user,
  roleLabel,
  signOutAction,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/plataforma" ? pathname === "/plataforma" : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <div className={styles.app}>
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <span className={styles.brandText}>CreateLatam</span>
      </div>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} />}

      <aside
        id="admin-sidebar"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
        aria-label="Navegación de la plataforma"
      >
        <Link href="/plataforma" className={styles.sidebarBrand}>
          <StarIcon size={22} fill="#FFD938" />
          <span>CreateLatam</span>
        </Link>

        <nav className={styles.sidebarNav}>
          {sections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <p className={styles.navTitle}>{section.title}</p>
              {section.items.map((item) =>
                item.soon ? (
                  <span key={item.href} className={`${styles.navItem} ${styles.navDisabled}`}>
                    <NavIcon name={item.icon} />
                    {item.label}
                    <span className={styles.soon}>Pronto</span>
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive(item.href) ? styles.navActive : ""}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/" className={styles.navItem}>
            ↗ Ver el sitio
          </Link>
          <div className={styles.userCard}>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.avatarFallback}>{initial}</span>
            )}
            <div className={styles.userMeta}>
              <strong>{user.name ?? user.email}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className={styles.signOut}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.content}>
        <main className={styles.page}>{children}</main>
      </div>
    </div>
  );
}
