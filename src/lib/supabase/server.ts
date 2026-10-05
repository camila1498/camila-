import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente con la sesion del usuario (cookies). Solo para rutas dinamicas como /admin. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component: la sesion se refresca en el middleware.
          }
        },
      },
    },
  );
}
