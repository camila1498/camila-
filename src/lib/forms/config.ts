import { legalPending } from "@/lib/legal";
import type { FormDefinition } from "./types";

/**
 * Decisiones que el documento deja abiertas ("Decisiones abiertas para Cami").
 * Valores propuestos en el documento; confirmarlos antes de abrir los formularios.
 */
export const programRules = {
  /** Rango de edad del Bootcamp 2026 y de CreateWomen (propuesta del documento: 14 a 24). */
  age: { min: 14, max: 24 },
  bootcampDates: "del 14 al 23 de diciembre de 2026",
  empleaLabDates: "del 26 al 30 de diciembre de 2026",
  /** Horario de las sesiones del Bootcamp (variable BOOTCAMP_SCHEDULE). El documento lo deja como [horario]. */
  bootcampSchedule: process.env.BOOTCAMP_SCHEDULE?.trim() ?? "",
};

/** Lo que falta por definir para poder abrir un formulario (vacio = listo). */
export function missingConfig(slug: FormDefinition["slug"]): string[] {
  const missing = [...legalPending()];
  if (slug === "bootcamp" && !programRules.bootcampSchedule.trim()) missing.push("horario del Bootcamp");
  return missing;
}
