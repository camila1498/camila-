"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { buildStatement, getPublicConsent, TOKEN_PATTERN } from "@/lib/consent/consent";
import { createPublicClient } from "@/lib/supabase/public";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo.").max(120, "El nombre es demasiado largo."),
  relationship: z.enum(["madre", "padre", "tutor"], { message: "Indica tu parentesco." }),
  decision: z.enum(["autorizo", "no_autorizo"]),
  image: z.enum(["si", "no"]).optional(),
});

const RPC_ERRORS: Record<string, string> = {
  already_responded: "Este enlace ya se usó. Si necesitas cambiar tu respuesta, escríbenos.",
  expired: "El enlace venció. Pídenos uno nuevo.",
  unavailable: "Este formulario aún no está disponible. Vuelve a intentarlo en unos días.",
  invalid_token: "El enlace no es válido.",
};

/** Registra la respuesta del tutor. El texto que acepta se arma aquí, con datos de la base, no con lo que envía el navegador. */
export async function submitConsent(token: string, formData: FormData) {
  if (!TOKEN_PATTERN.test(token)) redirect("/");
  const back = (error?: string): never => redirect(`/consentimiento/${token}${error ? `?error=${encodeURIComponent(error)}` : ""}`);

  const parsed = schema.safeParse({
    name: formData.get("name"),
    relationship: formData.get("relationship"),
    decision: formData.get("decision"),
    image: formData.get("image") ?? undefined,
  });
  if (!parsed.success) return back(parsed.error.issues[0]?.message ?? "Revisa los datos.");
  const { name, relationship, decision } = parsed.data;
  const authorize = decision === "autorizo";
  if (authorize && !parsed.data.image) return back("Indica si autorizas o no el uso de la imagen.");

  const info = await getPublicConsent(token);
  if (!info) redirect("/");
  if (info!.state !== "pending") return back(info!.state === "expired" ? RPC_ERRORS.expired : info!.state === "unavailable" ? RPC_ERRORS.unavailable : RPC_ERRORS.already_responded);

  const statement = buildStatement({
    guardianName: name,
    relationship,
    participantName: info!.participantName,
    age: info!.age,
    program: info!.program,
    controller: info!.legal.controllerName,
    authorize,
    image: parsed.data.image === "si",
  });

  const { error } = await createPublicClient().rpc("submit_guardian_consent", {
    p_token: token,
    p_name: name,
    p_relationship: relationship,
    p_data_ok: authorize,
    p_image_ok: authorize && parsed.data.image === "si",
    p_statement: statement,
  });
  if (error) return back(RPC_ERRORS[error.message] ?? "No pudimos guardar tu respuesta. Inténtalo de nuevo.");

  back();
}
