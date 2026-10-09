/** Códigos telefónicos de los países de la lista C4 de los formularios. */
const dialCodes: Record<string, string> = {
  "Perú": "51",
  Argentina: "54",
  Bolivia: "591",
  Brasil: "55",
  Chile: "56",
  Colombia: "57",
  "Costa Rica": "506",
  Cuba: "53",
  Ecuador: "593",
  "El Salvador": "503",
  Guatemala: "502",
  Honduras: "504",
  "México": "52",
  Nicaragua: "505",
  "Panamá": "507",
  Paraguay: "595",
  "República Dominicana": "1",
  Uruguay: "598",
  Venezuela: "58",
};

export type WhatsAppNumber = {
  /** Solo dígitos con código de país (lo que pide wa.me). Vacío si no sirve. */
  digits: string;
  /** Cómo se lo mostramos al equipo. */
  display: string;
  /**
   * ok: venía con código de país. assumed: se le agregó el del país indicado (conviene revisarlo).
   * invalid: no se pudo armar un número usable.
   */
  confidence: "ok" | "assumed" | "invalid";
};

export function toWhatsAppNumber(raw: unknown, country?: unknown): WhatsAppNumber {
  const text = typeof raw === "string" ? raw.trim() : "";
  const invalid: WhatsAppNumber = { digits: "", display: text || "—", confidence: "invalid" };
  if (!text) return invalid;

  let digits = text.replace(/\D/g, "");
  // "(+52) 55 1234 5678" también trae el código: se ignoran espacios y paréntesis iniciales.
  let explicit = text.replace(/[\s()]/g, "").startsWith("+");
  if (!explicit && digits.startsWith("00")) {
    digits = digits.slice(2);
    explicit = true;
  }

  let confidence: WhatsAppNumber["confidence"] = "ok";
  if (!explicit) {
    const dial = typeof country === "string" ? dialCodes[country] : undefined;
    if (!dial) return invalid;
    digits = digits.replace(/^0+/, "");
    // Si ya empieza con el código y el largo es de número completo, se respeta; si no, se agrega.
    const hasCode = digits.startsWith(dial) && digits.length >= dial.length + 8;
    if (!hasCode) digits = dial + digits;
    confidence = "assumed";
  }

  if (digits.length < 8 || digits.length > 15) return invalid;
  return { digits, display: `+${digits}`, confidence };
}
