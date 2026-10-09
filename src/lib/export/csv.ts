/** Separador `;` y BOM: así Excel en español abre el archivo con tildes y columnas bien separadas. */
const SEP = ";";
const BOM = "﻿";

/** Teléfonos y números sueltos (p. ej. "+51 999 888 777") no se tocan aunque empiecen con + o -. */
const PLAIN_NUMBER = /^[+-]?[\d\s().-]+$/;

/**
 * Un texto que empieza con = + - @ lo ejecutaría Excel como fórmula (una postulación podría traer
 * `=HYPERLINK(...)`); se antepone una comilla para que se lea como texto.
 */
export function safeCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value) && !PLAIN_NUMBER.test(value)) return `'${value}`;
  return value;
}

export function csvCell(value: string): string {
  const v = safeCell(value);
  return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  return BOM + rows.map((r) => r.map(csvCell).join(SEP)).join("\r\n") + "\r\n";
}
