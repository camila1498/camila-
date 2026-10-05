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
4. Aplica también la migración `20261006000000_becas_rank.sql` (reordenar el ranking).

## Panel de administración (`/admin`)

Gestiona las becas: crear, editar, eliminar, ocultar/publicar y asignar el ranking. Entra con
un enlace por correo (Supabase Auth); solo los usuarios de la tabla `admins` pueden editar
(lo exige RLS, no solo la interfaz).

1. En Supabase → Authentication → URL Configuration, agrega en **Redirect URLs**
   `https://TU-DOMINIO/auth/callback` y `http://localhost:3011/auth/callback` (y el dominio de
   Preview de Vercel si quieres probar ahí).
2. Crea el usuario en Authentication → Users (nadie puede registrarse desde la web).
3. Dale acceso de admin en el SQL Editor:
   `insert into public.admins (user_id) select id from auth.users where email = 'correo@ejemplo.org';`
4. Entra en `/admin`, escribe el correo y abre el enlace **en el mismo navegador**.

Los cambios aparecen en `/oportunidades` al instante (el panel invalida la caché).

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
  lib/supabase/              Clientes de Supabase (público, servidor, navegador, middleware)
  lib/admin/                 Autenticación de admin y validación del formulario de becas
  components/admin/          Formulario y botón de eliminar del panel
  lib/constants.ts           Links externos (Google Forms) y email de contacto
```

### Ranking de oportunidades

La pestaña **Rankeadas** muestra las becas que tengan `rank` (1 = mejor), ordenadas; una beca
sin `rank` solo aparece en **Database**. Se asigna desde el panel
admin; si la posición ya la tiene otra beca, las dos intercambian.

## Próximos pasos

- **Supabase para el resto del contenido** (equipo, programas, testimonios), hoy en `src/data/`.
- **Formularios propios** para mentee (Emplealab, Createwomen) y voluntario, guardados en
  Supabase (hoy apuntan a Google Forms vía `src/lib/constants.ts`).
- **Respuestas de formularios en el panel**: verlas, exportarlas y archivar las antiguas.
