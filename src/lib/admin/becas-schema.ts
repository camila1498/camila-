import { z } from "zod";

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label} es demasiado largo (máx. ${max})`);

export const becaSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "El slug solo admite minúsculas, números y guiones")
    .max(80)
    .optional(),
  label: text("La etiqueta", 60),
  tag_variant: z.enum(["default", "stem", "liderazgo", "europa"]),
  estado: text("El estado", 60),
  title: text("El título", 200),
  institution: text("La institución", 200),
  description: text("La descripción", 1000),
  deadline: text("La fecha límite", 100),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/, "Cada etiqueta usa minúsculas, números y guiones")),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "El enlace debe empezar con http:// o https://")
    .transform((v) => (v === "" ? null : v)),
  published: z.boolean(),
});

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseBecaForm(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "");
  const rawSlug = get("slug").trim();
  const slug = rawSlug || slugify(get("title"));

  return becaSchema.safeParse({
    slug: slug || undefined,
    label: get("label"),
    tag_variant: get("tag_variant"),
    estado: get("estado"),
    title: get("title"),
    institution: get("institution"),
    description: get("description"),
    deadline: get("deadline"),
    tags: get("tags")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    url: get("url"),
    published: formData.get("published") === "on",
  });
}
