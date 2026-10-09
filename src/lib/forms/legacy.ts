import { BOOTCAMP_WAITLIST_URL, VOLUNTEER_FORM_URL } from "@/lib/constants";

/**
 * Google Forms anteriores: se ofrecen como respaldo mientras el formulario nuevo aun no esta
 * abierto, para no dejar el sitio sin forma de postular. Se pueden retirar cuando ya no hagan falta.
 */
export const legacyFormUrls: Partial<Record<string, string>> = {
  voluntariado: VOLUNTEER_FORM_URL,
  aliados: VOLUNTEER_FORM_URL,
  createwomen: BOOTCAMP_WAITLIST_URL,
};
