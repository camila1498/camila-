import type { Role } from "./auth";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "becas" | "members" | "bootcamps" | "visitors" | "forms" | "settings" | "inbox" | "messages";
  /** Roles que ven el item. Para sumar vistas de equipo/estudiantes basta ampliar esta lista. */
  roles: Role[];
  /** Vistas planeadas que aun no existen: se muestran deshabilitadas. */
  soon?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    title: "General",
    items: [{ href: "/plataforma", label: "Dashboard", icon: "dashboard", roles: ["admin", "team", "student"] }],
  },
  {
    title: "Contenido",
    items: [{ href: "/plataforma/becas", label: "Becas", icon: "becas", roles: ["admin"] }],
  },
  {
    title: "Comunidad",
    items: [
      { href: "/plataforma/formularios", label: "Formularios", icon: "forms", roles: ["admin"] },
      { href: "/plataforma/campanas", label: "Respuestas", icon: "inbox", roles: ["admin"] },
      { href: "/plataforma/mensajes", label: "Mensajes", icon: "messages", roles: ["admin"] },
      { href: "/plataforma/visitantes", label: "Visitantes", icon: "visitors", roles: ["admin"], soon: true },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/plataforma/miembros", label: "Miembros", icon: "members", roles: ["admin"] },
      { href: "/plataforma/configuracion", label: "Configuración", icon: "settings", roles: ["admin"] },
    ],
  },
];

export function navFor(role: Role | null): NavSection[] {
  if (!role) return [];
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}
