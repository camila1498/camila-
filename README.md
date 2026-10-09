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
   `20261007000000_members.sql` (miembros con rol; reemplaza a la tabla `admins`) y
   `20261009000000_forms.sql` (formularios propios y sus respuestas) y
   `20261010000000_campaigns.sql` (campañas, versiones editables y configuración legal) y
   `20261011000000_create_form.sql` (crear y eliminar formularios nuevos) y
   `20261012000000_reviews.sql` (historial de postulaciones y plantillas de mensajes).

## Plataforma (`/plataforma`)

Vista administrativa con sidebar: dashboard, becas (crear, editar, eliminar, ocultar/publicar,
rankear), formularios (editar, publicar y cerrar campañas), respuestas (revisar y avisar por WhatsApp), mensajes, miembros y configuración legal. Aquí irán también los inscritos en bootcamps, visitantes y demás.

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

## Formularios y campañas

Cinco formularios propios (voluntariado, aliados, mentee de EmpleaLab, mentee de CreateWomen y
postulación al Bootcamp 2026) reemplazan a los Google Forms. Vienen del documento *Formularios
CreateLatam 2026*. **Se editan y se publican desde `/plataforma/formularios`**, sin tocar código.

**Formularios nuevos.** "+ Nuevo formulario" crea otro (para un taller, un evento, una encuesta…):
se parte **en blanco** (siempre con nombre, correo, teléfono, país y consentimiento, que son
obligatorios en cualquier formulario) o **copiando** uno existente. Vive en `/formularios/<enlace>`
(el enlace se elige al crearlo y no cambia) y pasa por el mismo flujo de edición, publicación y
campañas. Mientras nunca se haya publicado se puede eliminar; después se conserva por su historial.

| Ruta pública | Formulario |
|---|---|
| `/unete/voluntariado`, `/unete/aliados` | Voluntariado y Aliados (los dos CTAs de Únete) |
| `/programas/emplealab/postular`, `/programas/createwomen/postular` | Mentees |
| `/bootcamp/postular` | Postulación al Bootcamp 2026 |

**Editar (solo antes de publicar).** El editor modifica un *borrador*: título, texto introductorio,
botón, plazo de conservación y, por pregunta, texto, ayuda, obligatoriedad, opciones, límites, orden,
visibilidad y condiciones; también se pueden agregar preguntas. Las preguntas *base* (nombre, correo,
teléfono, país, consentimiento, edad y datos del tutor) no se quitan ni cambian de tipo, y las que
alimentan el puntaje tienen opciones fijas. Una pregunta ya publicada no se borra: se oculta, para
no perder el historial. La vista previa del editor es la misma que verá la persona.

**Publicar = abrir una campaña.** "Publicar…" muestra una alerta de revisión (resumen, cambios desde
la versión anterior, requisitos) y exige confirmar. Al publicar, el borrador se congela como una
*versión* inmutable y se abre una *campaña* (una edición: "Bootcamp 2026") con su ventana de fechas
(hora de Lima) y cupos. **Mientras la campaña está abierta, el formulario no admite cambios** (lo
impiden la interfaz, el servidor y la base de datos). Para corregir algo hay que *cerrar la campaña*,
editar y volver a publicar: la nueva campaña usa la versión nueva y las respuestas anteriores
conservan la suya. Cada correo puede postular una vez **por campaña**.

**Requisitos para publicar y recibir envíos** (también los exige la base de datos): datos legales
completos y **aprobados por Legal** en `/plataforma/configuracion` (RUC, domicilio, correo de
privacidad; cambiar un dato retira la aprobación) y ningún marcador pendiente tipo `[horario]` o
`[●]` en los textos. El aviso de privacidad es un borrador pendiente de aprobación de Legal.

Las respuestas las guarda la función `submit_form` (valida que haya campaña abierta, que Legal haya
aprobado y rechaza duplicados); solo los admins pueden leerlas. Lo que pueda traer datos de salud
(B13) va en una tabla aparte. Las definiciones viven en la base de datos (`form_drafts`,
`form_versions`, `campaigns`); la versión 1 sale de `supabase/migrations/20261010000000_campaigns.sql`.

Compilar mientras corre `npm run dev`: `NEXT_DIST_DIR=.next-build npm run build` (usa otra carpeta de salida).

## Respuestas y mensajes

**Revisar postulaciones** (`/plataforma/campanas`). Cada campaña muestra cuántas postulaciones hay por estado
y, al abrirla, una tabla con filtros (estado, búsqueda por nombre o correo, solo menores) y paginación.
**"Ver"** abre la postulación con todas las respuestas, escritas con las preguntas de **la versión con que se
respondió** (aunque el formulario haya cambiado después), el tutor si es menor de edad, y la respuesta sensible
(B13) marcada. Desde ahí se marca como **Aprobada**, **Lista de espera**, **Pendiente** o **Descartada**, con una
nota opcional; todo queda en el **historial** (quién, cuándo, de qué estado a cuál) y no se puede editar ni borrar.
Hay navegación anterior/siguiente que respeta los filtros, y notas internas.

**Avisar por WhatsApp (sin API).** Junto a la revisión aparece el botón verde de WhatsApp: abre `wa.me` con el
chat del número de la persona (y el de su tutor, si es menor) y el mensaje de la plantilla correspondiente al
estado ya escrito; una persona del equipo lo envía desde su propio WhatsApp. Cada apertura queda en el historial.
Si el número no trae código de país, se le agrega el del país indicado y se avisa para que se revise.

**Plantillas** (`/plataforma/mensajes`): aprobada, lista de espera y no seleccionada. Admiten las variables
`{{nombre}}`, `{{nombre_completo}}`, `{{formulario}}` y `{{campana}}` (una lista cerrada; cualquier otra se rechaza
al guardar).

## Estructura del sitio

| Ruta | Contenido |
|---|---|
| `/` | Home: reseña, aliados, cifras, testimonios (carrusel), contacto |
| `/programas`, `/programas/[slug]` | Emplealab, Createwomen, Eventos |
| `/equipo` | Voluntarios por área (`/voluntarios` redirige aquí) |
| `/oportunidades` | Becas: pestañas Database y Rankeadas, públicas (`/becas` redirige aquí) |
| `/unete` | Beneficios, roles abiertos y los CTAs de voluntariado y aliados |
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
- **Cierre de campaña y datos para la web**: cifras agregadas (p. ej. 500 postulaciones para 50 cupos), exportación y
  archivado de las antiguas; **puntaje del Bootcamp** (reglas del PDF §6).
- **Consentimiento del tutor** para menores y contador de cupos del Bootcamp.
