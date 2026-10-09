const env = (name: string) => process.env[name]?.trim() ?? "";

/**
 * Datos legales de los formularios, tomados de variables de entorno (solo servidor):
 * LEGAL_RUC, LEGAL_ADDRESS y LEGAL_PRIVACY_EMAIL. Los completa Legal antes de abrir cualquier
 * formulario: mientras falte alguno, los formularios no reciben envios aunque esten "abiertos"
 * en la base de datos (ver missingConfig en lib/forms/config.ts).
 */
export const legal = {
  /** Responsable del tratamiento. Legal decide si es la Asociacion o una persona natural temporal. */
  controllerName: "Asociación CreateLatam",
  ruc: env("LEGAL_RUC"),
  address: env("LEGAL_ADDRESS"),
  /** Correo para solicitudes de acceso, rectificacion, cancelacion u oposicion. */
  privacyEmail: env("LEGAL_PRIVACY_EMAIL"),
  /**
   * BORRADOR: el documento original decia "Google y Notion". Los formularios guardan los datos
   * en Supabase y el sitio corre en Vercel; Legal debe confirmar encargados y region.
   */
  storageNotice:
    "Guardamos la información en Supabase y Vercel, con servidores fuera del Perú (principalmente en EE.UU.).",
};

export const legalPending = () => {
  const missing: string[] = [];
  if (!legal.ruc.trim()) missing.push("RUC");
  if (!legal.address.trim()) missing.push("domicilio");
  if (!legal.privacyEmail.trim()) missing.push("correo de privacidad");
  return missing;
};
