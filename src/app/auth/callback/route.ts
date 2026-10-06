import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toLogin(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/plataforma/login?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return toLogin(origin, "No pudimos completar el inicio de sesión. Inténtalo de nuevo.");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return toLogin(origin, "No pudimos completar el inicio de sesión. Inténtalo de nuevo.");

  // Solo entra quien esta registrado como miembro; el resto se desconecta de inmediato.
  const { data: role } = await supabase.rpc("claim_membership");
  if (!role) {
    await supabase.auth.signOut();
    return toLogin(
      origin,
      "Tu cuenta de Google no está registrada en la plataforma. Pide acceso al equipo de CreateLatam.",
    );
  }

  return NextResponse.redirect(`${origin}/plataforma`);
}
