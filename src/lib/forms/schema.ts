import { z } from "zod";
import { SLUG_MAX, SLUG_PATTERN } from "./paths";
import type { Condition, Field, FormDefinition } from "./types";

/**
 * Esquema de las definiciones guardadas en la base de datos. Nada que venga del JSON se asume
 * correcto: se valida al guardar el borrador, al publicar y al leer la version de una campaña.
 */

const condition = z.union([
  z.object({ field: z.string().min(1), equals: z.union([z.string(), z.boolean()]) }),
  z.object({ field: z.string().min(1), includesAny: z.array(z.string()).min(1) }),
]);

const option = z.object({
  value: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(200),
});

const base = {
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,31}$/, "Identificador no válido"),
  label: z.string().trim().min(1, "Cada pregunta necesita un texto").max(500),
  help: z.string().trim().max(500).optional(),
  required: z.union([z.boolean(), condition]).optional(),
  showIf: condition.optional(),
  sensitive: z.boolean().optional(),
  hidden: z.boolean().optional(),
  locked: z.enum(["core", "options"]).optional(),
};

const field = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("text"), maxLength: z.number().int().min(1).max(1000).optional() }),
  z.object({ ...base, type: z.literal("email") }),
  z.object({ ...base, type: z.literal("tel") }),
  z.object({ ...base, type: z.literal("url") }),
  z.object({
    ...base,
    type: z.literal("textarea"),
    minWords: z.number().int().min(1).max(2000).optional(),
    maxWords: z.number().int().min(1).max(2000).optional(),
  }),
  z.object({
    ...base,
    type: z.literal("number"),
    min: z.number().int().optional(),
    max: z.number().int().optional(),
  }),
  z.object({ ...base, type: z.literal("select"), options: z.array(option).min(1).max(60) }),
  z.object({
    ...base,
    type: z.literal("multiselect"),
    options: z.array(option).min(1).max(60),
    max: z.number().int().min(1).max(60).optional(),
  }),
  z.object({ ...base, type: z.literal("boolean") }),
  z.object({ ...base, type: z.literal("checkbox") }),
]);

export const definitionSchema = z.object({
  schemaVersion: z.literal(1).optional(),
  slug: z.string().max(SLUG_MAX).regex(SLUG_PATTERN),
  version: z.number().int().min(1),
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  intro: z.string().trim().max(3000),
  submitLabel: z.string().trim().min(1, "El texto del botón es obligatorio").max(80),
  sections: z
    .array(
      z.object({
        title: z.string().trim().max(200).optional(),
        description: z.string().trim().max(1000).optional(),
        fields: z.array(field).max(80),
      }),
    )
    .min(1)
    .max(20),
  endIf: z.object({ condition, message: z.string().trim().min(1).max(1000) }).optional(),
  minorField: z.string().optional(),
  retention: z.string().trim().max(1000),
});

export type ParsedDefinition =
  | { ok: true; definition: FormDefinition }
  | { ok: false; errors: string[] };

export function parseDefinition(input: unknown): ParsedDefinition {
  const result = definitionSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)),
    };
  }
  return { ok: true, definition: result.data as FormDefinition };
}

export function fieldsOf(def: FormDefinition): Field[] {
  return def.sections.flatMap((s) => s.fields);
}

const conditionFields = (c: Condition | undefined) => (c ? [c.field] : []);

/**
 * Reglas que el esquema no expresa: ids unicos, condiciones que apuntan a preguntas anteriores,
 * opciones validas y, respecto de la ultima version publicada, que no se pierda ni se
 * desnaturalice nada (ids, preguntas nucleo, opciones bloqueadas).
 */
export function validateDefinition(next: FormDefinition, published: FormDefinition | null): string[] {
  const errors: string[] = [];
  const fields = fieldsOf(next);

  // Cualquier formulario necesita nombre, correo y consentimiento: la base de datos los exige al guardar.
  const requiredBase: [string, Field["type"], string][] = [
    ["C1", "text", "nombre"],
    ["C2", "email", "correo"],
    ["C7", "checkbox", "consentimiento"],
  ];
  for (const [id, type, name] of requiredBase) {
    const f = fields.find((x) => x.id === id);
    if (!f || f.type !== type || f.hidden || f.showIf) {
      errors.push(`Falta la pregunta base de ${name} (${id}): debe existir, estar visible y sin condición.`);
    } else if (id === "C7" && f.required !== true) {
      errors.push("La casilla de consentimiento (C7) debe ser obligatoria.");
    }
  }

  const seen = new Set<string>();
  fields.forEach((f) => {
    if (seen.has(f.id)) errors.push(`El identificador ${f.id} está repetido.`);

    const refs = [...conditionFields(f.showIf), ...(typeof f.required === "object" ? conditionFields(f.required) : [])];
    for (const ref of refs) {
      if (!seen.has(ref)) errors.push(`"${f.label}" depende de una pregunta que no existe o va después.`);
    }
    seen.add(f.id);

    if (f.type === "select" || f.type === "multiselect") {
      const values = f.options.map((o) => o.value);
      if (new Set(values).size !== values.length) errors.push(`"${f.label}" tiene opciones repetidas.`);
    }
    if (f.type === "number" && f.min !== undefined && f.max !== undefined && f.min > f.max) {
      errors.push(`"${f.label}": el mínimo es mayor que el máximo.`);
    }
    if (f.type === "textarea" && f.minWords && f.maxWords && f.minWords > f.maxWords) {
      errors.push(`"${f.label}": el mínimo de palabras es mayor que el máximo.`);
    }
  });

  for (const ref of conditionFields(next.endIf?.condition)) {
    if (!seen.has(ref)) errors.push("La condición de fin del formulario apunta a una pregunta que no existe.");
  }
  if (next.minorField) {
    const minor = fields.find((f) => f.id === next.minorField);
    if (!minor || minor.type !== "boolean") errors.push("La pregunta de menor de edad debe existir y ser Sí/No.");
  }

  if (published) {
    const byId = new Map(fields.map((f) => [f.id, f]));
    for (const old of fieldsOf(published)) {
      const now = byId.get(old.id);
      if (!now) {
        errors.push(`La pregunta "${old.label}" ya estuvo publicada: no se puede borrar, solo ocultar.`);
        continue;
      }
      if (old.locked === "core") {
        if (now.type !== old.type) errors.push(`"${old.label}" es una pregunta base: no se puede cambiar de tipo.`);
        if (now.hidden) errors.push(`"${old.label}" es una pregunta base: no se puede ocultar.`);
        if (JSON.stringify(now.required ?? false) !== JSON.stringify(old.required ?? false)) {
          errors.push(`"${old.label}" es una pregunta base: no se puede cambiar si es obligatoria.`);
        }
        if (JSON.stringify(now.showIf ?? null) !== JSON.stringify(old.showIf ?? null)) {
          errors.push(`"${old.label}" es una pregunta base: no se puede condicionar.`);
        }
      }
      if (old.locked && now.locked !== old.locked) errors.push(`"${old.label}" es una pregunta base y no se puede desbloquear.`);
      if (old.locked === "options" && (old.type === "select" || old.type === "multiselect")) {
        const a = old.options.map((o) => o.value).join("|");
        const b = now.type === old.type ? now.options.map((o) => o.value).join("|") : "";
        if (a !== b) errors.push(`Las opciones de "${old.label}" alimentan el puntaje o las estadísticas y no se pueden cambiar.`);
      }
    }
    if (published.minorField && next.minorField !== published.minorField) {
      errors.push("No se puede cambiar la pregunta de menor de edad.");
    }
  }

  return errors;
}

/** Marcadores de "falta completar" que impiden publicar: [●], [horario…], [por definir], [por confirmar]… */
const PLACEHOLDER = /\[\s*(●|…|\.\.\.|horario[^\]]*|por\s+(definir|confirmar)[^\]]*|completar[^\]]*)\s*\]/i;

export function findPlaceholders(def: FormDefinition): string[] {
  const hits: string[] = [];
  const check = (where: string, text: string | undefined) => {
    if (text && PLACEHOLDER.test(text)) hits.push(`${where}: “${text.length > 70 ? `${text.slice(0, 70)}…` : text}”`);
  };
  check("Título", def.title);
  check("Texto introductorio", def.intro);
  check("Plazo de conservación", def.retention);
  check("Mensaje de fin", def.endIf?.message);
  for (const f of fieldsOf(def)) {
    if (f.hidden) continue;
    check(`Pregunta ${f.id}`, f.label);
    check(`Ayuda de ${f.id}`, f.help);
    if (f.type === "select" || f.type === "multiselect") for (const o of f.options) check(`Opción de ${f.id}`, o.label);
  }
  return hits;
}
