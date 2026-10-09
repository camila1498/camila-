/** Los formularios originales conservan su ruta propia dentro del sitio. */
const builtInPaths: Record<string, string> = {
  voluntariado: "/unete/voluntariado",
  aliados: "/unete/aliados",
  emplealab: "/programas/emplealab/postular",
  createwomen: "/programas/createwomen/postular",
  bootcamp: "/bootcamp/postular",
};

/** Los formularios nuevos viven en /formularios/<slug>. */
export function formPath(slug: string) {
  return builtInPaths[slug] ?? `/formularios/${slug}`;
}

export const isBuiltInForm = (slug: string) => slug in builtInPaths;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 40;

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}
