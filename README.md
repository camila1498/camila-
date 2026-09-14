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

## Arquitectura

```
src/
  app/
    page.tsx                Home
    programas/page.tsx       /programas
    voluntarios/page.tsx      /voluntarios
    becas/page.tsx            /becas (dashboard de becas)
    layout.tsx, globals.css   Layout raíz, fuentes y tokens de diseño compartidos

  components/
    layout/                  Header y Footer (compartidos por todas las páginas)
    ui/                       StarIcon, SectionHead
    home/                     Secciones de la landing (Hero, About, Programs, ...)
    programas/, voluntarios/  Componentes específicos de esas páginas
    becas/                    Dashboard de becas + el gate de acceso + el modal de home

  data/                      Contenido tipado (equipo, programas, iniciativas, becas, ...)
  lib/constants.ts           Links externos (Google Forms, email de contacto, clave de becas)
```

### Dashboard de Becas

El dashboard de becas (`/becas`, y también accesible como modal desde home) está protegido
por una clave simple recordada en `sessionStorage` (`src/components/becas/useBecasAccess.ts`).
**No es autenticación real** — es el mismo mecanismo placeholder de la maqueta original, la
clave viaja en texto plano en el bundle del cliente. Reemplazarlo por autenticación real
(Supabase Auth) es parte del roadmap.

## Próximos pasos (fuera del alcance de esta migración)

- **Supabase como CMS/dashboard de impacto**: hoy el equipo, los programas, las iniciativas y
  las becas viven como arrays estáticos en `src/data/`. Son el punto de enganche natural para
  reemplazar por datos de Supabase — el cambio sería acotado a cada archivo de `data/`, sin
  tocar los componentes de UI.
- **Autenticación real** para reemplazar el gate de clave de `/becas`.
- **Formularios propios** para talleres, bootcamps y eventos (hoy todos apuntan a Google Forms
  externos vía `src/lib/constants.ts`).
- **Registro de usuarios y eventos** una vez exista la base de datos.
