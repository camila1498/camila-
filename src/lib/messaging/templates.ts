/** Variables que se pueden usar en las plantillas: lista cerrada, nada más se interpreta. */
export const TEMPLATE_VARIABLES = [
  { name: "nombre", help: "Primer nombre de la persona" },
  { name: "nombre_completo", help: "Nombre y apellidos" },
  { name: "formulario", help: "Nombre del formulario" },
  { name: "campana", help: "Nombre de la campaña (p. ej. Bootcamp 2026)" },
] as const;

export type TemplateVars = Record<(typeof TEMPLATE_VARIABLES)[number]["name"], string>;

const KNOWN = new Set<string>(TEMPLATE_VARIABLES.map((v) => v.name));
const PLACEHOLDER = /\{\{\s*([a-z_]+)\s*\}\}/gi;

export function firstName(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

export function renderTemplate(body: string, vars: TemplateVars) {
  return body.replace(PLACEHOLDER, (match, name: string) => {
    const key = name.toLowerCase();
    return KNOWN.has(key) ? vars[key as keyof TemplateVars] : match;
  });
}

/** Variables escritas en la plantilla que no existen (para avisar al editarla). */
export function unknownVariables(body: string) {
  const unknown = new Set<string>();
  for (const m of body.matchAll(PLACEHOLDER)) {
    if (!KNOWN.has(m[1]!.toLowerCase())) unknown.add(m[0]);
  }
  return [...unknown];
}

/** Estado de la postulación → plantilla que corresponde. */
export const templateForStatus: Record<string, string | undefined> = {
  admitida: "approved",
  lista_espera: "waitlist",
  descartada: "rejected",
};
