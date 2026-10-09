import { z } from "zod";
import type { Answers, Condition, Field, FormDefinition } from "./types";

export function evaluate(condition: Condition | undefined, answers: Answers): boolean {
  if (!condition) return true;
  const value = answers[condition.field];
  if ("equals" in condition) return value === condition.equals;
  return Array.isArray(value) && value.some((v) => condition.includesAny.includes(String(v)));
}

export function isVisible(field: Field, answers: Answers) {
  return !field.hidden && evaluate(field.showIf, answers);
}

export function isRequired(field: Field, answers: Answers) {
  if (field.required === true) return true;
  if (!field.required) return false;
  return evaluate(field.required, answers);
}

export function allFields(def: FormDefinition) {
  return def.sections.flatMap((section) => section.fields);
}

export function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

const emailSchema = z.string().email().max(200);
const urlSchema = z
  .string()
  .max(500)
  .refine((v) => /^https?:\/\/\S+\.\S+/i.test(v));
const phoneSchema = z.string().regex(/^\+?[0-9][0-9\s().-]{6,19}$/);

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

/** Devuelve el mensaje de error del campo, o null si es valido. `value` ya es lo que envio la persona. */
function checkField(field: Field, value: unknown, required: boolean): string | null {
  if (field.type === "checkbox") {
    if (required && value !== true) return "Debes aceptar para continuar";
    return value === undefined || typeof value === "boolean" ? null : "Valor no válido";
  }
  if (field.type === "boolean") {
    if (value === undefined || value === null || value === "") return required ? "Elige una opción" : null;
    return typeof value === "boolean" ? null : "Valor no válido";
  }

  if (isEmpty(value)) return required ? "Este campo es obligatorio" : null;

  switch (field.type) {
    case "text": {
      if (typeof value !== "string") return "Valor no válido";
      return value.length > (field.maxLength ?? 200) ? "Es demasiado largo" : null;
    }
    case "email":
      return typeof value === "string" && emailSchema.safeParse(value.trim()).success
        ? null
        : "Escribe un correo válido";
    case "tel":
      return typeof value === "string" && phoneSchema.safeParse(value.trim()).success
        ? null
        : "Escribe un número válido, con código de país (ej. +51 999 999 999)";
    case "url":
      return typeof value === "string" && urlSchema.safeParse(value.trim()).success
        ? null
        : "Escribe un enlace válido que empiece con https://";
    case "textarea": {
      if (typeof value !== "string") return "Valor no válido";
      if (value.length > 5000) return "Es demasiado largo";
      const words = countWords(value);
      if (field.minWords && words < field.minWords) return `Escribe al menos ${field.minWords} palabras (llevas ${words})`;
      if (field.maxWords && words > field.maxWords) return `Máximo ${field.maxWords} palabras (llevas ${words})`;
      return null;
    }
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n) || !Number.isInteger(n)) return "Escribe un número entero";
      if (field.min !== undefined && n < field.min) return `Debe ser ${field.min} o más`;
      if (field.max !== undefined && n > field.max) return `Debe ser ${field.max} o menos`;
      return null;
    }
    case "select":
      return typeof value === "string" && field.options.some((o) => o.value === value)
        ? null
        : "Elige una opción válida";
    case "multiselect": {
      if (!Array.isArray(value)) return "Valor no válido";
      const valid = value.every((v) => field.options.some((o) => o.value === v));
      if (!valid) return "Elige opciones válidas";
      if (field.max && value.length > field.max) return `Elige como máximo ${field.max}`;
      return null;
    }
  }
}

export type ValidationResult =
  | { ok: true; answers: Answers; sensitive: Answers; ended: false }
  | { ok: true; ended: true; message: string }
  | { ok: false; errors: Record<string, string> };

/**
 * Valida las respuestas contra la definicion. Solo conserva campos visibles de la definicion
 * (ignora cualquier otra clave) y separa los sensibles. Se usa en el navegador y, de forma
 * autoritativa, en el servidor.
 */
export function validateSubmission(def: FormDefinition, raw: Answers): ValidationResult {
  if (def.endIf && evaluate(def.endIf.condition, raw)) {
    return { ok: true, ended: true, message: def.endIf.message };
  }

  const errors: Record<string, string> = {};
  const answers: Answers = {};
  const sensitive: Answers = {};

  for (const field of allFields(def)) {
    if (!isVisible(field, raw)) continue;

    let value = raw[field.id];
    if (typeof value === "string") value = value.trim();
    if (field.type === "number" && typeof value === "string" && value !== "") value = Number(value);

    const error = checkField(field, value, isRequired(field, raw));
    if (error) {
      errors[field.id] = error;
      continue;
    }
    if (isEmpty(value) && field.type !== "boolean" && field.type !== "checkbox") continue;
    if (value === undefined || value === "") continue;

    (field.sensitive ? sensitive : answers)[field.id] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, answers, sensitive, ended: false };
}
