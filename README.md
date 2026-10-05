# CreateLatam

Landing page y (próximamente) CMS/dashboard de impacto de **CreateLatam**, organización sin
fines de lucro que acerca educación en IA, diseño de producto y STEM a jóvenes mujeres de
Latinoamérica.

Este repo empezó como una maqueta estática en HTML (ver [`legacy-html/`](./legacy-html)) y se
migró a Next.js + TypeScript + Tailwind CSS como base para ir escalando el proyecto.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Supabase

Las becas viven en Supabase (tabla `becas`, solo lectura pública de las publicadas).
Sin las variables de entorno, `/oportunidades` muestra un aviso en vez del listado.

1. Crea el proyecto en [supabase.com](https://supabase.com) y copia **Project URL** y **anon key**
   (Project Settings → API). Nunca uses la `service_role` key en este repo ni en Vercel.
2. Copia `.env.local.example` a `.env.local` y complétalo. Pon las mismas dos variables en
   Vercel (Production y Preview).
3. Crea el esquema y los datos iniciales, con una de estas opciones:
   - **CLI**: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`
     y ejecuta `supabase/seed.sql` (SQL Editor o `npx supabase db push --include-seed`).
   - **Sin CLI**: pega `supabase/migrations/*.sql` y luego `supabase/seed.sql` en el SQL Editor.
4. Para dar acceso de administrador (lo usará el panel de becas), crea el usuario en
   Authentication y ejecuta en el SQL Editor:
   `insert into public.admins (user_id) select id from auth.users where email = 'correo@ejemplo.org';`

## Estructura del sitio

| Ruta | Contenido |
|---|---|
| `/` | Home: reseña, aliados, cifras, testimonios (carrusel), contacto |
| `/programas`, `/programas/[slug]` | Emplealab, Createwomen, Eventos |
| `/equipo` | Voluntarios por área (`/voluntarios` redirige aquí) |
| `/oportunidades` | Becas: pestañas Database y Rankeadas, públicas (`/becas` redirige aquí) |
| `/unete` | Beneficios, roles abiertos y formulario de voluntario |

## Arquitectura

```
src/
  app/                       Rutas (App Router), layout raíz y tokens de diseño (globals.css)
  components/
    layout/                  Header y Footer
    ui/                      StarIcon, SectionHead
    home/                    Secciones de la landing
    programas/, voluntarios/  Componentes de esas páginas
    becas/                   Listado de becas con buscador, filtros y pestañas
  data/                      Contenido tipado (equipo, programas, testimonios) y tipos de becas
  lib/supabase/              Cliente público de Supabase; lib/becas.ts lee las becas
  lib/constants.ts           Links externos (Google Forms) y email de contacto
```

### Ranking de oportunidades

La pestaña **Rankeadas** muestra las becas que tengan `rank` (1 = mejor), ordenadas; una beca
sin `rank` solo aparece en **Database**. Hoy se edita en la tabla `becas` de Supabase; el panel
admin lo hará desde la web. Los cambios se reflejan en `/oportunidades` en hasta 1 minuto.

## Próximos pasos

- **Panel administrativo de becas** con autenticación real (crear, editar, publicar y rankear).
- **Supabase para el resto del contenido** (equipo, programas, testimonios), hoy en `src/data/`.
- **Formularios propios** para mentee (Emplealab, Createwomen) y voluntario, guardados en
  Supabase (hoy apuntan a Google Forms vía `src/lib/constants.ts`).
- **Panel administrativo** con autenticación real para ver, exportar y archivar respuestas.
