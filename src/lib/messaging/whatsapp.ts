/**
 * Enlace que abre WhatsApp (web o app) con el chat del número y el mensaje ya escrito. No usa la API
 * de Meta: el mensaje lo envía una persona del equipo desde su propio WhatsApp.
 */
export function whatsappUrl(digits: string, message: string) {
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
