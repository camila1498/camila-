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
4. Aplica también las migraciones `20261006000000_becas_rank.sql` (reordenar el ranking) y
   `20261007000000_members.sql` (miembros con rol; reemplaza a la tabla `admins`).

## Plataforma (`/plataforma`)

Vista administrativa con sidebar: dashboard, becas (crear, editar, eliminar, ocultar/publicar,
rankear) y miembros. Aquí irán también los inscritos en bootcamps, visitantes y demás.

**Acceso**: se ingresa con Google desde el botón "Ingresar" de la landing (o `/plataforma/login`).
Solo entran los correos registrados en la tabla `members`; el resto se desconecta de inmediato.
Cada miembro tiene un rol (`admin`, `team`, `student`); hoy solo `admin` ve contenido, y las
vistas por rol se definen en `src/lib/admin/nav.ts`. Los datos los protege RLS, no la interfaz.

### Configurar Google (una sola vez)

1. En [Google Cloud Console](https://console.cloud.google.com) → APIs y servicios → Credenciales →
   Crear ID de cliente OAuth (tipo *Aplicación web*). En **URI de redireccionamiento autorizados**
   pon `https://<tu-proyecto>.supabase.co/auth/v1/callback`.
2. En Supabase → Authentication → Providers → **Google**: actívalo y pega el Client ID y el
   Client secret.
3. Supabase → Authentication → URL Configuration: **Site URL** = tu dominio de producción y, en
   **Redirect URLs**, `https://TU-DOMINIO/auth/callback` y `http://localhost:3011/auth/callback`
   (más el dominio de Preview de Vercel si quieres probar ahí).
4. Recomendado: en Providers desactiva **Email** para que nadie pueda crear cuentas por correo y
   clave.

### Primer administrador

Antes de su primer ingreso, regístralo en el SQL Editor (los siguientes se agregan desde
`/plataforma/miembros`):

`insert into public.members (email, full_name, role) values ('correo@gmail.com', 'Nombre', 'admin');`

Quien aún no esté registrado puede crear una cuenta de Google en Supabase al intentar entrar,
pero no obtiene ningún acceso: se desconecta y no puede leer ni escribir datos.

## Estructura del sitio

| Ruta | Contenido |
|---|---|
| `/` | Home: reseña, aliados, cifras, testimonios (carrusel), contacto |
| `/programas`, `/programas/[slug]` | Emplealab, Createwomen, Eventos |
| `/equipo` | Voluntarios por área (`/voluntarios` redirige aquí) |
| `/oportunidades` | Becas: pestañas Database y Rankeadas, públicas (`/becas` redirige aquí) |
| `/unete` | Beneficios, roles abiertos y formulario de voluntario |
| `/plataforma` | Plataforma con sidebar (ingreso con Google, solo miembros registrados) |

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
  lib/admin/                 Sesión y roles, navegación del sidebar, validación de becas
  components/admin/          Shell con sidebar, formulario de becas, botón de eliminar
  components/auth/           Botón de inicio de sesión con Google
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
