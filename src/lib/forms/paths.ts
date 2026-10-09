import type { FormDefinition } from "./types";

/** Pagina publica de cada formulario. */
export const formPaths: Record<FormDefinition["slug"], string> = {
  voluntariado: "/unete/voluntariado",
  aliados: "/unete/aliados",
  emplealab: "/programas/emplealab/postular",
  createwomen: "/programas/createwomen/postular",
  bootcamp: "/bootcamp/postular",
};
