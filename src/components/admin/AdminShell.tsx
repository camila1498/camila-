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

const COLLAPSED_KEY = "plataforma:sidebar-collapsed";

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function AdminShell({
  sections,
  user,
  roleLabel,
  signOutAction,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Contraído = solo íconos (en escritorio). Se recuerda la elección en este navegador.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Sin almacenamiento (modo privado): el menú simplemente arranca expandido.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, v ? "0" : "1");
      } catch {
        // Igual funciona durante la sesión.
      }
      return !v;
    });
  };

  const isActive = (href: string) =>
    href === "/plataforma" ? pathname === "/plataforma" : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <div className={`${styles.app} ${collapsed ? styles.collapsed : ""}`}>
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
        <div className={styles.sidebarHead}>
          <Link href="/plataforma" className={styles.sidebarBrand} title="CreateLatam">
            <StarIcon size={22} fill="#FFD938" />
            <span className={styles.navLabel}>CreateLatam</span>
          </Link>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir el menú" : "Contraer el menú"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir el menú" : "Contraer el menú"}
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {sections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <p className={styles.navTitle}>
                <span className={styles.navLabel}>{section.title}</span>
              </p>
              {section.items.map((item) =>
                item.soon ? (
                  <span key={item.href} className={`${styles.navItem} ${styles.navDisabled}`} title={`${item.label} (pronto)`}>
                    <NavIcon name={item.icon} />
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={`${styles.soon} ${styles.navLabel}`}>Pronto</span>
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive(item.href) ? styles.navActive : ""}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    title={item.label}
                  >
                    <NavIcon name={item.icon} />
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/" className={styles.navItem} title="Ver el sitio">
            <span aria-hidden="true" className={styles.siteIcon}>
              ↗
            </span>
            <span className={styles.navLabel}>Ver el sitio</span>
          </Link>
          <div className={styles.userCard} title={user.name ?? user.email}>
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
            <button type="submit" className={styles.signOut} title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogoutIcon />
              <span className={styles.navLabel}>Cerrar sesión</span>
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
