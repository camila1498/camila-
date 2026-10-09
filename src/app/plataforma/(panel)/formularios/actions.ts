"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminOrThrow } from "@/lib/admin/auth";
import { missingConfig } from "@/lib/forms/config";
import { formDefinitions } from "@/lib/forms/definitions";
import { fromLimaInput } from "@/lib/forms/lima";
import { formPaths } from "@/lib/forms/paths";
import type { FormDefinition } from "@/lib/forms/types";

type Slug = FormDefinition["slug"];
type Status = "draft" | "open" | "closed";

const BASE = "/plataforma/formularios";

function done(message: string): never {
  redirect(`${BASE}?ok=${encodeURIComponent(message)}`);
}

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

function isSlug(value: string): value is Slug {
  return value in formDefinitions;
}

function refresh(slug: Slug) {
  revalidatePath(BASE);
  revalidatePath(formPaths[slug]);
}

/** Abre solo si no falta ningun dato legal o del programa: es la regla de "nada se publica sin Legal". */
function assertCanOpen(slug: Slug) {
  const missing = missingConfig(slug);
  if (missing.length > 0) {
    fail(
      `No se puede abrir "${formDefinitions[slug].title}": faltan ${missing.join(", ")}. Configúralos en las variables de entorno (ver README).`,
    );
  }
}

/** Abrir o cerrar con un clic (botones rapidos). */
export async function setFormStatus(slug: string, status: Status) {
  const { supabase } = await requireAdminOrThrow();
  if (!isSlug(slug) || !["draft", "open", "closed"].includes(status)) fail("Formulario no válido.");

  if (status === "open") {
    assertCanOpen(slug);
    // Reabrir tras una fecha de cierre pasada no tendria efecto: se avisa en vez de fallar en silencio.
    const { data } = await supabase.from("forms").select("closes_at").eq("slug", slug).maybeSingle();
    if (data?.closes_at && Date.parse(data.closes_at) < Date.now()) {
      fail("La fecha de cierre ya pasó. Edita las fechas y guarda para volver a abrirlo.");
    }
  }

  const { error } = await supabase.from("forms").update({ status }).eq("slug", slug);
  if (error) fail(`No se pudo actualizar: ${error.message}`);

  refresh(slug);
  done(
    status === "open"
      ? `"${formDefinitions[slug].title}" está abierto: ya recibe postulaciones.`
      : status === "closed"
        ? `"${formDefinitions[slug].title}" está cerrado.`
        : `"${formDefinitions[slug].title}" volvió a borrador.`,
  );
}

/** Estado, ventana de fechas (hora de Lima) y cupos, desde el formulario detallado. */
export async function saveForm(slug: string, formData: FormData) {
  const { supabase } = await requireAdminOrThrow();
  if (!isSlug(slug)) fail("Formulario no válido.");

  const status = String(formData.get("status") ?? "");
  if (!["draft", "open", "closed"].includes(status)) fail("Estado no válido.");

  const opensRaw = String(formData.get("opens_at") ?? "");
  const closesRaw = String(formData.get("closes_at") ?? "");
  const opens_at = opensRaw ? fromLimaInput(opensRaw) : null;
  const closes_at = closesRaw ? fromLimaInput(closesRaw) : null;
  if ((opensRaw && !opens_at) || (closesRaw && !closes_at)) fail("Revisa las fechas.");
  if (opens_at && closes_at && Date.parse(closes_at) <= Date.parse(opens_at)) {
    fail("La fecha de cierre debe ser posterior a la de apertura.");
  }

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw === "" ? null : Number(capacityRaw);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    fail("Los cupos deben ser un número entero mayor que 0.");
  }

  if (status === "open") {
    assertCanOpen(slug);
    if (closes_at && Date.parse(closes_at) < Date.now()) fail("La fecha de cierre ya pasó.");
  }

  const { error } = await supabase
    .from("forms")
    .update({ status, opens_at, closes_at, capacity })
    .eq("slug", slug);
  if (error) fail(`No se pudo guardar: ${error.message}`);

  refresh(slug);
  done(`Cambios guardados en "${formDefinitions[slug].title}".`);
}
