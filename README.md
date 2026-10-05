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
  data/                      Contenido tipado (equipo, programas, becas, testimonios)
  lib/constants.ts           Links externos (Google Forms) y email de contacto
```

### Ranking de oportunidades

La pestaña **Rankeadas** muestra las becas de `src/data/becas.ts` que tengan el campo `rank`
(1 = mejor), ordenadas. Una beca sin `rank` solo aparece en **Database**.

## Próximos pasos

- **Supabase como CMS/dashboard de impacto**: hoy el contenido vive como arrays estáticos en
  `src/data/`; son el punto de enganche para reemplazarlos por datos de Supabase.
- **Formularios propios** para mentee (Emplealab, Createwomen) y voluntario, guardados en
  Supabase (hoy apuntan a Google Forms vía `src/lib/constants.ts`).
- **Panel administrativo** con autenticación real para ver, exportar y archivar respuestas.
