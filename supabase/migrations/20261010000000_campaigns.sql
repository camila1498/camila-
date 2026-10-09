-- Campañas, formularios editables (versiones + borrador) y configuración legal.
--
-- Cada apertura de un formulario es una CAMPAÑA (edición) con su propia versión congelada y sus
-- propios datos: así la misma persona puede postular a la siguiente convocatoria y las preguntas
-- pueden cambiar sin afectar lo recolectado. El borrador solo se edita mientras no haya una
-- campaña abierta; publicar = abrir la campaña.

-- ------------------------------------------------------------------ Configuración legal
create table public.site_settings (
  id boolean primary key default true check (id),
  controller_name text not null default 'Asociación CreateLatam',
  ruc text not null default '',
  address text not null default '',
  privacy_email text not null default '',
  storage_notice text not null default 'Guardamos la información en Supabase y Vercel, con servidores fuera del Perú (principalmente en EE.UU.).',
  approved_at timestamptz,
  approved_by text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings default values;

-- Cambiar un dato legal invalida la aprobación de Legal (salvo que el mismo cambio la apruebe).
create or replace function public.site_settings_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if (new.controller_name, new.ruc, new.address, new.privacy_email, new.storage_notice)
       is distinct from
     (old.controller_name, old.ruc, old.address, old.privacy_email, old.storage_notice)
     and new.approved_at is not distinct from old.approved_at then
    new.approved_at = null;
    new.approved_by = null;
  end if;
  return new;
end $$;
create trigger site_settings_guard before update on public.site_settings
  for each row execute function public.site_settings_guard();

alter table public.site_settings enable row level security;
create policy "settings: admins leen" on public.site_settings
  for select to authenticated using (public.is_admin());
create policy "settings: admins editan" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Datos completos y aprobados por Legal: sin esto ningún formulario recibe envíos.
create or replace function public.legal_ready()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select btrim(ruc) <> '' and btrim(address) <> '' and btrim(privacy_email) <> ''
           and approved_at is not null
    from public.site_settings limit 1), false);
$$;

-- Lo que muestra el aviso de privacidad (no incluye quién aprobó).
create or replace function public.legal_info()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'controllerName', controller_name, 'ruc', ruc, 'address', address,
    'privacyEmail', privacy_email, 'storageNotice', storage_notice,
    'ready', public.legal_ready())
  from public.site_settings limit 1;
$$;

-- ------------------------------------------------------------------ Versiones y borradores
create table public.form_versions (
  form_slug text not null references public.forms (slug),
  version integer not null check (version > 0),
  definition jsonb not null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (form_slug, version)
);

create or replace function public.immutable_row()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'immutable' using errcode = '42501';
end $$;
create trigger form_versions_immutable before update or delete on public.form_versions
  for each row execute function public.immutable_row();

create table public.form_drafts (
  form_slug text primary key references public.forms (slug),
  definition jsonb not null,
  based_on_version integer not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ Campañas
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  form_slug text not null references public.forms (slug),
  name text not null check (btrim(name) <> ''),
  version integer not null,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  opens_at timestamptz,
  closes_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  foreign key (form_slug, version) references public.form_versions (form_slug, version)
);
-- Un formulario tiene como máximo una campaña abierta.
create unique index campaigns_one_open_per_form on public.campaigns (form_slug) where status = 'open';
create index campaigns_form_idx on public.campaigns (form_slug, opened_at desc);

create or replace function public.campaigns_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.form_slug <> old.form_slug or new.version <> old.version then
    raise exception 'La versión de una campaña no se puede cambiar' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger campaigns_guard before update on public.campaigns
  for each row execute function public.campaigns_guard();

-- El borrador no se toca mientras el formulario recolecta datos.
create or replace function public.form_drafts_lock()
returns trigger language plpgsql set search_path = '' as $$
declare v_slug text := coalesce(new.form_slug, old.form_slug);
begin
  if exists (select 1 from public.campaigns where form_slug = v_slug and status = 'open') then
    raise exception 'form_locked' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger form_drafts_lock before insert or update or delete on public.form_drafts
  for each row execute function public.form_drafts_lock();

-- ------------------------------------------------------------------ Versión 1 de cada formulario
-- (las definiciones que ya estaban en el código; desde ahora se editan desde /plataforma)
insert into public.form_versions (form_slug, version, definition, note) values
  ('voluntariado', 1, $json${"slug":"voluntariado","version":1,"title":"Voluntariado","intro":"Para líderes de área, mentoras, speakers y apoyo general. Solo mayores de 18 años, porque trabajamos con adolescentes.","submitLabel":"Enviar mi postulación","retention":"Mientras dure tu voluntariado y 1 año después.","endIf":{"condition":{"field":"V1","equals":false},"message":"Este formulario es solo para mayores de 18 años, porque el voluntariado trabaja con adolescentes. ¡Gracias por tu interés! Escríbenos y buscamos otra forma de sumarte."},"sections":[{"fields":[{"id":"V1","type":"boolean","label":"¿Tienes 18 años o más?","required":true,"locked":"core"}]},{"title":"Tus datos","fields":[{"id":"C1","type":"text","label":"Nombre y apellidos","required":true,"locked":"core"},{"id":"C2","type":"email","label":"Correo electrónico","required":true,"locked":"core"},{"id":"C3","type":"tel","label":"Número de WhatsApp (con código de país)","help":"Ejemplo: +51 999 999 999","required":true,"locked":"core"},{"id":"C4","type":"select","label":"País de residencia","required":true,"options":[{"value":"Perú","label":"Perú"},{"value":"Argentina","label":"Argentina"},{"value":"Bolivia","label":"Bolivia"},{"value":"Brasil","label":"Brasil"},{"value":"Chile","label":"Chile"},{"value":"Colombia","label":"Colombia"},{"value":"Costa Rica","label":"Costa Rica"},{"value":"Cuba","label":"Cuba"},{"value":"Ecuador","label":"Ecuador"},{"value":"El Salvador","label":"El Salvador"},{"value":"Guatemala","label":"Guatemala"},{"value":"Honduras","label":"Honduras"},{"value":"México","label":"México"},{"value":"Nicaragua","label":"Nicaragua"},{"value":"Panamá","label":"Panamá"},{"value":"Paraguay","label":"Paraguay"},{"value":"República Dominicana","label":"República Dominicana"},{"value":"Uruguay","label":"Uruguay"},{"value":"Venezuela","label":"Venezuela"},{"value":"Otro","label":"Otro"}],"locked":"core"},{"id":"C5","type":"text","label":"Ciudad o región","required":true},{"id":"C6","type":"select","label":"¿Cómo te enteraste de esta convocatoria?","options":[{"value":"Instagram","label":"Instagram"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"TikTok","label":"TikTok"},{"value":"WhatsApp","label":"WhatsApp"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Universidad","label":"Universidad"},{"value":"Una amiga o amigo","label":"Una amiga o amigo"},{"value":"Otro","label":"Otro"}]}]},{"title":"Tu perfil","fields":[{"id":"V2","type":"select","label":"¿Cuál es tu ocupación actual?","required":true,"options":[{"value":"Estudiante universitaria/o","label":"Estudiante universitaria/o"},{"value":"Trabajo a tiempo completo","label":"Trabajo a tiempo completo"},{"value":"Trabajo independiente","label":"Trabajo independiente"},{"value":"Buscando empleo","label":"Buscando empleo"},{"value":"Otro","label":"Otro"}]},{"id":"V3","type":"text","label":"Universidad o empresa"},{"id":"V4","type":"text","label":"Carrera o profesión","required":true},{"id":"V5","type":"multiselect","label":"¿En qué rol te gustaría sumarte?","required":true,"options":[{"value":"Líder de Marketing","label":"Líder de Marketing"},{"value":"Líder de Talento","label":"Líder de Talento"},{"value":"Líder de Seguimiento y Operaciones","label":"Líder de Seguimiento y Operaciones"},{"value":"Líder de Bootcamp","label":"Líder de Bootcamp"},{"value":"Líder de Mentorías EmpleaLab","label":"Líder de Mentorías EmpleaLab"},{"value":"Mentora/mentor","label":"Mentora/mentor"},{"value":"Speaker o facilitadora","label":"Speaker o facilitadora"},{"value":"Voluntaria/o de apoyo","label":"Voluntaria/o de apoyo"}]},{"id":"V6","type":"textarea","label":"¿Por qué quieres ser parte de CreateLatam?","help":"Máximo 150 palabras.","required":true,"maxWords":150},{"id":"V7","type":"textarea","label":"Cuéntanos un proyecto que sacaste adelante y qué hiciste tú","required":true,"showIf":{"field":"V5","includesAny":["Líder de Marketing","Líder de Talento","Líder de Seguimiento y Operaciones","Líder de Bootcamp","Líder de Mentorías EmpleaLab"]}}]},{"title":"Disponibilidad","fields":[{"id":"V8","type":"select","label":"¿Cuántas horas a la semana puedes dedicar?","required":true,"options":[{"value":"1 a 2","label":"1 a 2"},{"value":"3 a 5","label":"3 a 5"},{"value":"6 o más","label":"6 o más"}]},{"id":"V9","type":"select","label":"¿Podrás apoyar durante el Bootcamp (14 al 23 de diciembre de 2026)?","options":[{"value":"Sí","label":"Sí"},{"value":"Parcialmente","label":"Parcialmente"},{"value":"No","label":"No"}]},{"id":"V10","type":"boolean","label":"¿Has trabajado antes con adolescentes?","required":true},{"id":"V11","type":"url","label":"LinkedIn o portafolio"},{"id":"V12","type":"checkbox","label":"Me comprometo a cumplir el código de conducta y la política de protección de menores de CreateLatam","required":true}]},{"fields":[{"id":"C7","type":"checkbox","label":"He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria","required":true,"locked":"core"},{"id":"C8","type":"checkbox","label":"Quiero recibir información de futuras convocatorias de CreateLatam"}]}],"schemaVersion":1}$json$::jsonb, 'Versión inicial'),
  ('aliados', 1, $json${"slug":"aliados","version":1,"title":"Aliados","intro":"Para empresas, ONG, universidades, colegios, UGEL, entidades públicas y personas. Los datos de contacto son los de la persona que nos escribe.","submitLabel":"Enviar propuesta","retention":"Mientras dure la relación y 2 años después.","sections":[{"title":"Persona de contacto","fields":[{"id":"C1","type":"text","label":"Nombre y apellidos de la persona de contacto","required":true,"locked":"core"},{"id":"C2","type":"email","label":"Correo electrónico de la persona de contacto","required":true,"locked":"core"},{"id":"C3","type":"tel","label":"Número de WhatsApp de la persona de contacto (con código de país)","help":"Ejemplo: +51 999 999 999","required":true,"locked":"core"},{"id":"C4","type":"select","label":"País de residencia","required":true,"options":[{"value":"Perú","label":"Perú"},{"value":"Argentina","label":"Argentina"},{"value":"Bolivia","label":"Bolivia"},{"value":"Brasil","label":"Brasil"},{"value":"Chile","label":"Chile"},{"value":"Colombia","label":"Colombia"},{"value":"Costa Rica","label":"Costa Rica"},{"value":"Cuba","label":"Cuba"},{"value":"Ecuador","label":"Ecuador"},{"value":"El Salvador","label":"El Salvador"},{"value":"Guatemala","label":"Guatemala"},{"value":"Honduras","label":"Honduras"},{"value":"México","label":"México"},{"value":"Nicaragua","label":"Nicaragua"},{"value":"Panamá","label":"Panamá"},{"value":"Paraguay","label":"Paraguay"},{"value":"República Dominicana","label":"República Dominicana"},{"value":"Uruguay","label":"Uruguay"},{"value":"Venezuela","label":"Venezuela"},{"value":"Otro","label":"Otro"}],"locked":"core"},{"id":"C5","type":"text","label":"Ciudad o región","required":true},{"id":"C6","type":"select","label":"¿Cómo te enteraste de esta convocatoria?","options":[{"value":"Instagram","label":"Instagram"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"TikTok","label":"TikTok"},{"value":"WhatsApp","label":"WhatsApp"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Universidad","label":"Universidad"},{"value":"Una amiga o amigo","label":"Una amiga o amigo"},{"value":"Otro","label":"Otro"}]}]},{"title":"Tu organización","fields":[{"id":"A1","type":"text","label":"Nombre de la organización","required":true},{"id":"A2","type":"select","label":"Tipo de organización","required":true,"options":[{"value":"Empresa","label":"Empresa"},{"value":"ONG o fundación","label":"ONG o fundación"},{"value":"Universidad o instituto","label":"Universidad o instituto"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Entidad pública","label":"Entidad pública"},{"value":"Comunidad tech","label":"Comunidad tech"},{"value":"Persona natural","label":"Persona natural"},{"value":"Otro","label":"Otro"}]},{"id":"A3","type":"text","label":"Tu cargo","required":true},{"id":"A4","type":"url","label":"Sitio web o LinkedIn de la organización"}]},{"title":"Tu propuesta","fields":[{"id":"A5","type":"multiselect","label":"¿Cómo te gustaría aliarte?","required":true,"options":[{"value":"Patrocinio o financiamiento","label":"Patrocinio o financiamiento"},{"value":"Speakers o mentoras de tu equipo","label":"Speakers o mentoras de tu equipo"},{"value":"Espacio físico","label":"Espacio físico"},{"value":"Difusión de convocatorias","label":"Difusión de convocatorias"},{"value":"Becas o licencias de herramientas","label":"Becas o licencias de herramientas"},{"value":"Equipos (laptops, datos móviles)","label":"Equipos (laptops, datos móviles)"},{"value":"Prácticas o empleo para egresadas","label":"Prácticas o empleo para egresadas"},{"value":"Otro","label":"Otro"}]},{"id":"A6","type":"multiselect","label":"¿Con qué programa?","required":true,"options":[{"value":"Bootcamp CreateWomen","label":"Bootcamp CreateWomen"},{"value":"EmpleaLab","label":"EmpleaLab"},{"value":"Eventos","label":"Eventos"},{"value":"Aún no sé","label":"Aún no sé"}]},{"id":"A7","type":"textarea","label":"Cuéntanos tu propuesta o idea"},{"id":"A8","type":"select","label":"¿Cuándo te gustaría empezar?","options":[{"value":"Este año","label":"Este año"},{"value":"Primer trimestre 2027","label":"Primer trimestre 2027"},{"value":"Por definir","label":"Por definir"}]}]},{"fields":[{"id":"C7","type":"checkbox","label":"He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria","required":true,"locked":"core"},{"id":"C8","type":"checkbox","label":"Quiero recibir información de futuras convocatorias de CreateLatam"}]}],"schemaVersion":1}$json$::jsonb, 'Versión inicial'),
  ('emplealab', 1, $json${"slug":"emplealab","version":1,"title":"Mentee de EmpleaLab","intro":"Para universitarias/os y egresadas/os que buscan su primer empleo o prácticas. Solo mayores de 18 años.","submitLabel":"Enviar mi postulación","retention":"Si no eres seleccionada/o, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.","sections":[{"title":"Tus datos","fields":[{"id":"C1","type":"text","label":"Nombre y apellidos","required":true,"locked":"core"},{"id":"C2","type":"email","label":"Correo electrónico","required":true,"locked":"core"},{"id":"C3","type":"tel","label":"Número de WhatsApp (con código de país)","help":"Ejemplo: +51 999 999 999","required":true,"locked":"core"},{"id":"C4","type":"select","label":"País de residencia","required":true,"options":[{"value":"Perú","label":"Perú"},{"value":"Argentina","label":"Argentina"},{"value":"Bolivia","label":"Bolivia"},{"value":"Brasil","label":"Brasil"},{"value":"Chile","label":"Chile"},{"value":"Colombia","label":"Colombia"},{"value":"Costa Rica","label":"Costa Rica"},{"value":"Cuba","label":"Cuba"},{"value":"Ecuador","label":"Ecuador"},{"value":"El Salvador","label":"El Salvador"},{"value":"Guatemala","label":"Guatemala"},{"value":"Honduras","label":"Honduras"},{"value":"México","label":"México"},{"value":"Nicaragua","label":"Nicaragua"},{"value":"Panamá","label":"Panamá"},{"value":"Paraguay","label":"Paraguay"},{"value":"República Dominicana","label":"República Dominicana"},{"value":"Uruguay","label":"Uruguay"},{"value":"Venezuela","label":"Venezuela"},{"value":"Otro","label":"Otro"}],"locked":"core"},{"id":"C5","type":"text","label":"Ciudad o región","required":true},{"id":"C6","type":"select","label":"¿Cómo te enteraste de esta convocatoria?","options":[{"value":"Instagram","label":"Instagram"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"TikTok","label":"TikTok"},{"value":"WhatsApp","label":"WhatsApp"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Universidad","label":"Universidad"},{"value":"Una amiga o amigo","label":"Una amiga o amigo"},{"value":"Otro","label":"Otro"}]}]},{"title":"Tu situación","fields":[{"id":"E1","type":"number","label":"Edad","required":true,"min":18,"max":99,"locked":"core"},{"id":"E2","type":"select","label":"Situación académica","required":true,"options":[{"value":"Estudiante de últimos ciclos","label":"Estudiante de últimos ciclos"},{"value":"Egresada/o","label":"Egresada/o"},{"value":"Bachiller","label":"Bachiller"},{"value":"Titulada/o","label":"Titulada/o"}]},{"id":"E3","type":"text","label":"Universidad o instituto","required":true},{"id":"E4","type":"text","label":"Carrera","required":true},{"id":"E5","type":"select","label":"Situación laboral actual","required":true,"options":[{"value":"Busco mi primer empleo","label":"Busco mi primer empleo"},{"value":"Busco prácticas","label":"Busco prácticas"},{"value":"Trabajo fuera de mi área","label":"Trabajo fuera de mi área"},{"value":"Estoy sin empleo tras una experiencia previa","label":"Estoy sin empleo tras una experiencia previa"}]},{"id":"E6","type":"select","label":"¿Hace cuánto estás buscando?","required":true,"options":[{"value":"Menos de 3 meses","label":"Menos de 3 meses"},{"value":"3 a 6 meses","label":"3 a 6 meses"},{"value":"6 a 12 meses","label":"6 a 12 meses"},{"value":"Más de 12 meses","label":"Más de 12 meses"}]},{"id":"E7","type":"multiselect","label":"¿En qué área buscas trabajo?","required":true,"options":[{"value":"Diseño UX o de producto","label":"Diseño UX o de producto"},{"value":"Datos","label":"Datos"},{"value":"Desarrollo","label":"Desarrollo"},{"value":"Marketing digital","label":"Marketing digital"},{"value":"Gestión o negocios","label":"Gestión o negocios"},{"value":"Otro","label":"Otro"}]}]},{"title":"Qué buscas en la mentoría","fields":[{"id":"E8","type":"multiselect","label":"¿Con qué necesitas más ayuda?","help":"Elige hasta 2.","required":true,"max":2,"options":[{"value":"CV","label":"CV"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"Entrevistas","label":"Entrevistas"},{"value":"Portafolio","label":"Portafolio"},{"value":"Saber qué rol buscar","label":"Saber qué rol buscar"},{"value":"Networking","label":"Networking"}]},{"id":"E9","type":"textarea","label":"¿Qué te gustaría lograr con la mentoría?","required":true},{"id":"E10","type":"select","label":"¿Puedes asistir a las sesiones del 26 al 30 de diciembre de 2026?","required":true,"options":[{"value":"Sí","label":"Sí"},{"value":"Parcialmente","label":"Parcialmente"},{"value":"No","label":"No"}]},{"id":"E11","type":"url","label":"LinkedIn"},{"id":"E12","type":"url","label":"Enlace a tu CV en PDF","help":"Súbelo a Google Drive y comparte el enlace con permiso de lectura."}]},{"fields":[{"id":"C7","type":"checkbox","label":"He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria","required":true,"locked":"core"},{"id":"C8","type":"checkbox","label":"Quiero recibir información de futuras convocatorias de CreateLatam"}]}],"schemaVersion":1}$json$::jsonb, 'Versión inicial'),
  ('createwomen', 1, $json${"slug":"createwomen","version":1,"title":"Mentee de CreateWomen","intro":"Para chicas que quieren una mentora en tecnología. Si tienes menos de 18 años, te pediremos los datos de tu madre, padre o tutor.","submitLabel":"Enviar mi postulación","retention":"Si no eres seleccionada, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.","minorField":"W10","sections":[{"title":"Tus datos","fields":[{"id":"C1","type":"text","label":"Nombre y apellidos","required":true,"locked":"core"},{"id":"C2","type":"email","label":"Correo electrónico","required":true,"locked":"core"},{"id":"C3","type":"tel","label":"Número de WhatsApp (con código de país)","help":"Ejemplo: +51 999 999 999","required":true,"locked":"core"},{"id":"C4","type":"select","label":"País de residencia","required":true,"options":[{"value":"Perú","label":"Perú"},{"value":"Argentina","label":"Argentina"},{"value":"Bolivia","label":"Bolivia"},{"value":"Brasil","label":"Brasil"},{"value":"Chile","label":"Chile"},{"value":"Colombia","label":"Colombia"},{"value":"Costa Rica","label":"Costa Rica"},{"value":"Cuba","label":"Cuba"},{"value":"Ecuador","label":"Ecuador"},{"value":"El Salvador","label":"El Salvador"},{"value":"Guatemala","label":"Guatemala"},{"value":"Honduras","label":"Honduras"},{"value":"México","label":"México"},{"value":"Nicaragua","label":"Nicaragua"},{"value":"Panamá","label":"Panamá"},{"value":"Paraguay","label":"Paraguay"},{"value":"República Dominicana","label":"República Dominicana"},{"value":"Uruguay","label":"Uruguay"},{"value":"Venezuela","label":"Venezuela"},{"value":"Otro","label":"Otro"}],"locked":"core"},{"id":"C5","type":"text","label":"Ciudad o región","required":true},{"id":"C6","type":"select","label":"¿Cómo te enteraste de esta convocatoria?","options":[{"value":"Instagram","label":"Instagram"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"TikTok","label":"TikTok"},{"value":"WhatsApp","label":"WhatsApp"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Universidad","label":"Universidad"},{"value":"Una amiga o amigo","label":"Una amiga o amigo"},{"value":"Otro","label":"Otro"}]}]},{"title":"Sobre ti","fields":[{"id":"W1","type":"number","label":"Edad","required":true,"min":14,"max":24,"locked":"core"},{"id":"W2","type":"select","label":"¿Con qué género te identificas?","help":"Lo preguntamos porque el programa es para mujeres.","required":true,"options":[{"value":"Mujer","label":"Mujer"},{"value":"No binaria","label":"No binaria"},{"value":"Otro","label":"Otro"},{"value":"Prefiero no decir","label":"Prefiero no decir"}]},{"id":"W3","type":"select","label":"Nivel educativo actual","required":true,"options":[{"value":"Secundaria (3.º a 5.º)","label":"Secundaria (3.º a 5.º)"},{"value":"Instituto","label":"Instituto"},{"value":"Universidad","label":"Universidad"},{"value":"Egresada","label":"Egresada"}]},{"id":"W4","type":"text","label":"Nombre del colegio, instituto o universidad","required":true},{"id":"W5","type":"select","label":"Tu institución es…","help":"Lo preguntamos porque el programa prioriza instituciones públicas.","required":true,"options":[{"value":"Pública","label":"Pública"},{"value":"Privada","label":"Privada"}],"locked":"options"}]},{"title":"Tu mentoría","fields":[{"id":"W6","type":"multiselect","label":"¿Qué área de tecnología te interesa?","required":true,"options":[{"value":"Inteligencia artificial","label":"Inteligencia artificial"},{"value":"Diseño de producto o UX","label":"Diseño de producto o UX"},{"value":"Programación","label":"Programación"},{"value":"Datos","label":"Datos"},{"value":"Emprendimiento tech","label":"Emprendimiento tech"},{"value":"Aún no sé","label":"Aún no sé"}]},{"id":"W7","type":"textarea","label":"¿Qué te gustaría lograr con tu mentora?","required":true},{"id":"W8","type":"select","label":"Modalidad preferida","options":[{"value":"Virtual","label":"Virtual"},{"value":"Presencial en Lima","label":"Presencial en Lima"},{"value":"Me da igual","label":"Me da igual"}]},{"id":"W9","type":"multiselect","label":"Horario preferido","required":true,"options":[{"value":"Mañana","label":"Mañana"},{"value":"Tarde","label":"Tarde"},{"value":"Noche","label":"Noche"},{"value":"Fines de semana","label":"Fines de semana"}]}]},{"title":"Menores de edad","fields":[{"id":"W10","type":"boolean","label":"¿Tienes menos de 18 años?","required":true,"locked":"core"},{"id":"W11","type":"text","label":"Nombre de tu madre, padre o tutor","required":true,"showIf":{"field":"W10","equals":true},"locked":"core"},{"id":"W12","type":"select","label":"Parentesco","required":true,"showIf":{"field":"W10","equals":true},"options":[{"value":"Madre","label":"Madre"},{"value":"Padre","label":"Padre"},{"value":"Tutor/a legal","label":"Tutor/a legal"}],"locked":"core"},{"id":"W13_email","type":"email","label":"Correo de tu madre, padre o tutor","required":true,"showIf":{"field":"W10","equals":true},"locked":"core"},{"id":"W13_whatsapp","type":"tel","label":"WhatsApp de tu madre, padre o tutor (con código de país)","required":true,"showIf":{"field":"W10","equals":true},"locked":"core"}]},{"fields":[{"id":"C7","type":"checkbox","label":"He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria","required":true,"locked":"core"},{"id":"C8","type":"checkbox","label":"Quiero recibir información de futuras convocatorias de CreateLatam"}]}],"schemaVersion":1}$json$::jsonb, 'Versión inicial'),
  ('bootcamp', 1, $json${"slug":"bootcamp","version":1,"title":"Postulación al Bootcamp 2026","intro":"Bootcamp del 14 al 23 de diciembre de 2026. Las preguntas de motivación y disponibilidad nos ayudan a priorizar; la falta de laptop o internet nunca te descarta.","submitLabel":"Enviar mi postulación","retention":"Si no eres seleccionada, 6 meses desde el cierre de la convocatoria (12 si quedas en lista de espera). Si participas, 2 años desde el fin del programa y luego se anonimizan.","minorField":"B14","sections":[{"title":"Tus datos","fields":[{"id":"C1","type":"text","label":"Nombre y apellidos","required":true,"locked":"core"},{"id":"C2","type":"email","label":"Correo electrónico","required":true,"locked":"core"},{"id":"C3","type":"tel","label":"Número de WhatsApp (con código de país)","help":"Ejemplo: +51 999 999 999","required":true,"locked":"core"},{"id":"C4","type":"select","label":"País de residencia","required":true,"options":[{"value":"Perú","label":"Perú"},{"value":"Argentina","label":"Argentina"},{"value":"Bolivia","label":"Bolivia"},{"value":"Brasil","label":"Brasil"},{"value":"Chile","label":"Chile"},{"value":"Colombia","label":"Colombia"},{"value":"Costa Rica","label":"Costa Rica"},{"value":"Cuba","label":"Cuba"},{"value":"Ecuador","label":"Ecuador"},{"value":"El Salvador","label":"El Salvador"},{"value":"Guatemala","label":"Guatemala"},{"value":"Honduras","label":"Honduras"},{"value":"México","label":"México"},{"value":"Nicaragua","label":"Nicaragua"},{"value":"Panamá","label":"Panamá"},{"value":"Paraguay","label":"Paraguay"},{"value":"República Dominicana","label":"República Dominicana"},{"value":"Uruguay","label":"Uruguay"},{"value":"Venezuela","label":"Venezuela"},{"value":"Otro","label":"Otro"}],"locked":"core"},{"id":"C5","type":"text","label":"Ciudad o región","required":true},{"id":"C6","type":"select","label":"¿Cómo te enteraste de esta convocatoria?","options":[{"value":"Instagram","label":"Instagram"},{"value":"LinkedIn","label":"LinkedIn"},{"value":"TikTok","label":"TikTok"},{"value":"WhatsApp","label":"WhatsApp"},{"value":"Colegio o UGEL","label":"Colegio o UGEL"},{"value":"Universidad","label":"Universidad"},{"value":"Una amiga o amigo","label":"Una amiga o amigo"},{"value":"Otro","label":"Otro"}]}]},{"title":"Sobre ti","fields":[{"id":"B1","type":"number","label":"Edad","required":true,"min":14,"max":24,"locked":"core"},{"id":"B2","type":"select","label":"¿Con qué género te identificas?","help":"Lo preguntamos porque el programa es para mujeres.","required":true,"options":[{"value":"Mujer","label":"Mujer"},{"value":"No binaria","label":"No binaria"},{"value":"Otro","label":"Otro"},{"value":"Prefiero no decir","label":"Prefiero no decir"}]},{"id":"B3","type":"select","label":"Nivel educativo actual","required":true,"options":[{"value":"Secundaria (3.º a 5.º)","label":"Secundaria (3.º a 5.º)"},{"value":"Instituto","label":"Instituto"},{"value":"Universidad","label":"Universidad"},{"value":"Egresada","label":"Egresada"}]},{"id":"B4","type":"text","label":"Nombre del colegio, instituto o universidad","required":true},{"id":"B5","type":"select","label":"Tu institución es…","help":"Lo preguntamos porque el programa prioriza instituciones públicas.","required":true,"options":[{"value":"Pública","label":"Pública"},{"value":"Privada","label":"Privada"}],"locked":"options"},{"id":"B6","type":"text","label":"Grado, año o ciclo","required":true},{"id":"B7","type":"select","label":"¿Has llevado algún curso de tecnología, programación o diseño?","required":true,"options":[{"value":"Nunca","label":"Nunca"},{"value":"Uno corto","label":"Uno corto"},{"value":"Varios","label":"Varios"}],"locked":"options"}]},{"title":"Tu motivación","fields":[{"id":"B8","type":"textarea","label":"¿Por qué quieres participar en el Bootcamp?","help":"Entre 80 y 200 palabras.","required":true,"minWords":80,"maxWords":200},{"id":"B9","type":"textarea","label":"Cuéntanos un problema de tu comunidad que te gustaría resolver con tecnología","required":true}]},{"title":"Disponibilidad y equipo","fields":[{"id":"B10","type":"select","label":"¿Puedes asistir a todas las sesiones del 14 al 23 de diciembre de 2026, de [horario por confirmar]?","required":true,"options":[{"value":"Sí, a todas","label":"Sí, a todas"},{"value":"A la mayoría","label":"A la mayoría (puedo faltar a 1 o 2)"},{"value":"No","label":"No"}],"locked":"options"},{"id":"B11","type":"select","label":"¿Tendrás una laptop o computadora durante el Bootcamp?","help":"No te descarta: si no tienes, buscamos cómo conseguirte una.","required":true,"options":[{"value":"Sí, propia","label":"Sí, propia"},{"value":"Sí, compartida o prestada","label":"Sí, compartida o prestada"},{"value":"Solo celular","label":"Solo celular"},{"value":"No","label":"No"}],"locked":"options"},{"id":"B12","type":"select","label":"¿Qué conexión a internet tendrás?","help":"No te descarta: si no tienes, buscamos cómo apoyarte.","required":true,"options":[{"value":"Wifi estable en casa","label":"Wifi estable en casa"},{"value":"Solo datos móviles","label":"Solo datos móviles"},{"value":"Cabina o lugar público","label":"Cabina o lugar público"},{"value":"No tengo","label":"No tengo"}],"locked":"options"},{"id":"B13","type":"textarea","label":"¿Hay algo que debamos saber para que puedas participar?","help":"Opcional. Solo la líder del Bootcamp podrá leer esta respuesta.","sensitive":true}]},{"title":"Menores de edad","fields":[{"id":"B14","type":"boolean","label":"¿Tienes menos de 18 años?","required":true,"locked":"core"},{"id":"B15","type":"text","label":"Nombre de tu madre, padre o tutor","required":true,"showIf":{"field":"B14","equals":true},"locked":"core"},{"id":"B16","type":"select","label":"Parentesco","required":true,"showIf":{"field":"B14","equals":true},"options":[{"value":"Madre","label":"Madre"},{"value":"Padre","label":"Padre"},{"value":"Tutor/a legal","label":"Tutor/a legal"}],"locked":"core"},{"id":"B17_email","type":"email","label":"Correo de tu madre, padre o tutor","required":true,"showIf":{"field":"B14","equals":true},"locked":"core"},{"id":"B17_whatsapp","type":"tel","label":"WhatsApp de tu madre, padre o tutor (con código de país)","required":true,"showIf":{"field":"B14","equals":true},"locked":"core"},{"id":"B18","type":"boolean","label":"¿Autorizas que aparezcas en fotos y videos de difusión de CreateLatam?","help":"Cualquier respuesta es válida y no afecta tu postulación.","required":true}]},{"fields":[{"id":"C7","type":"checkbox","label":"He leído el aviso de privacidad y autorizo el tratamiento de mis datos para esta convocatoria","required":true,"locked":"core"},{"id":"C8","type":"checkbox","label":"Quiero recibir información de futuras convocatorias de CreateLatam"}]}],"schemaVersion":1}$json$::jsonb, 'Versión inicial');

insert into public.form_drafts (form_slug, definition, based_on_version)
select form_slug, definition, 1 from public.form_versions where version = 1;

-- ------------------------------------------------------------------ Postulaciones por campaña
alter table public.submissions add column campaign_id uuid references public.campaigns (id);

-- Postulaciones que ya existían: se agrupan en una campaña inicial por formulario.
insert into public.campaigns (form_slug, name, version, status, opens_at, closes_at, capacity, closed_at)
select f.slug, f.title || ' (inicial)', 1,
       case when f.status = 'open' then 'open' else 'closed' end,
       f.opens_at, f.closes_at, f.capacity,
       case when f.status = 'open' then null else now() end
from public.forms f
where exists (select 1 from public.submissions s where s.form_slug = f.slug);

update public.submissions s
set campaign_id = (select c.id from public.campaigns c where c.form_slug = s.form_slug limit 1);

alter table public.submissions alter column campaign_id set not null;
alter table public.submissions drop constraint submissions_form_slug_email_key;
alter table public.submissions add constraint submissions_campaign_email_key unique (campaign_id, email);
create index submissions_campaign_idx on public.submissions (campaign_id, status);

-- El estado y la ventana ahora viven en la campaña.
alter table public.forms drop column status, drop column opens_at, drop column closes_at, drop column capacity;

-- ------------------------------------------------------------------ Seguridad (RLS)
alter table public.form_versions enable row level security;
alter table public.form_drafts enable row level security;
alter table public.campaigns enable row level security;

create policy "versiones: lectura pública" on public.form_versions
  for select to anon, authenticated using (true);
create policy "versiones: admins publican" on public.form_versions
  for insert to authenticated with check (public.is_admin());

create policy "borradores: admins leen" on public.form_drafts
  for select to authenticated using (public.is_admin());
create policy "borradores: admins crean" on public.form_drafts
  for insert to authenticated with check (public.is_admin());
create policy "borradores: admins editan" on public.form_drafts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "borradores: admins eliminan" on public.form_drafts
  for delete to authenticated using (public.is_admin());

create policy "campañas: lectura pública" on public.campaigns
  for select to anon, authenticated using (true);
create policy "campañas: admins crean" on public.campaigns
  for insert to authenticated with check (public.is_admin());
create policy "campañas: admins editan" on public.campaigns
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------ Funciones
-- Lo que necesita la web pública de un formulario: estado y, si está abierto, su definición.
create or replace function public.get_public_form(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  c public.campaigns;
  v_title text;
  v_state text;
begin
  select title into v_title from public.forms where slug = p_slug;
  if v_title is null then
    return null;
  end if;

  select * into c from public.campaigns where form_slug = p_slug and status = 'open';
  if not found then
    return jsonb_build_object(
      'state',
      case when exists (select 1 from public.campaigns where form_slug = p_slug) then 'closed' else 'soon' end,
      'title', v_title);
  end if;

  if not public.legal_ready() or (c.opens_at is not null and now() < c.opens_at) then
    v_state := 'soon';
  elsif c.closes_at is not null and now() > c.closes_at then
    v_state := 'closed';
  else
    v_state := 'open';
  end if;

  return jsonb_build_object(
    'state', v_state, 'title', v_title,
    'campaignId', c.id, 'campaignName', c.name, 'version', c.version,
    'capacity', c.capacity, 'opensAt', c.opens_at, 'closesAt', c.closes_at,
    'definition', case when v_state = 'open'
      then (select definition from public.form_versions where form_slug = p_slug and version = c.version)
      end);
end $$;

-- Publicar = congelar el borrador como versión (si cambió) y abrir una campaña.
create or replace function public.publish_form(
  p_slug text, p_name text, p_opens_at timestamptz, p_closes_at timestamptz, p_capacity integer)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  d public.form_drafts;
  v_last integer;
  v_version integer;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if not public.legal_ready() then
    raise exception 'legal_pending';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'name_required';
  end if;
  if p_closes_at is not null and (p_closes_at <= now() or (p_opens_at is not null and p_closes_at <= p_opens_at)) then
    raise exception 'invalid_window';
  end if;
  if exists (select 1 from public.campaigns where form_slug = p_slug and status = 'open') then
    raise exception 'already_open';
  end if;

  select * into d from public.form_drafts where form_slug = p_slug;
  if not found then
    raise exception 'no_draft';
  end if;

  select max(version) into v_last from public.form_versions where form_slug = p_slug;
  if v_last is not null and d.definition = (
       select definition from public.form_versions where form_slug = p_slug and version = v_last) then
    v_version := v_last;
  else
    v_version := coalesce(v_last, 0) + 1;
    insert into public.form_versions (form_slug, version, definition, created_by)
    values (p_slug, v_version, d.definition, (select auth.uid()));
  end if;

  insert into public.campaigns (form_slug, name, version, opens_at, closes_at, capacity, created_by)
  values (p_slug, btrim(p_name), v_version, p_opens_at, p_closes_at, p_capacity, (select auth.uid()))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.close_campaign(p_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  update public.campaigns set status = 'closed', closed_at = now() where id = p_id and status = 'open';
  if not found then
    raise exception 'not_open';
  end if;
end $$;

-- Envío público: valida la campaña abierta y guarda la postulación en ella.
drop function public.submit_form(text, jsonb, jsonb, boolean, boolean, integer);

create or replace function public.submit_form(
  p_slug text,
  p_answers jsonb,
  p_sensitive jsonb default '{}'::jsonb,
  p_is_minor boolean default false,
  p_marketing boolean default false
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  c public.campaigns;
  v_email text;
  v_name text;
  v_id uuid;
begin
  select * into c from public.campaigns where form_slug = p_slug and status = 'open';
  if not found
     or not public.legal_ready()
     or (c.opens_at is not null and now() < c.opens_at)
     or (c.closes_at is not null and now() > c.closes_at) then
    raise exception 'form_closed';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'object'
     or jsonb_typeof(p_sensitive) is distinct from 'object'
     or octet_length(p_answers::text) > 60000
     or octet_length(p_sensitive::text) > 20000 then
    raise exception 'invalid_payload';
  end if;

  v_email := lower(btrim(coalesce(p_answers ->> 'C2', '')));
  v_name := btrim(coalesce(p_answers ->> 'C1', ''));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 200
     or v_name = '' or length(v_name) > 200 then
    raise exception 'invalid_payload';
  end if;

  if (p_answers ->> 'C7') is distinct from 'true' then
    raise exception 'consent_required';
  end if;

  begin
    insert into public.submissions
      (campaign_id, form_slug, form_version, email, full_name, answers, is_minor,
       consent_privacy_at, consent_marketing)
    values
      (c.id, p_slug, c.version, v_email, v_name, p_answers, coalesce(p_is_minor, false),
       now(), coalesce(p_marketing, false))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'duplicate';
  end;

  if p_sensitive <> '{}'::jsonb then
    insert into public.submission_sensitive (submission_id, data) values (v_id, p_sensitive);
  end if;
end $$;

revoke all on function public.submit_form(text, jsonb, jsonb, boolean, boolean) from public;
revoke all on function public.get_public_form(text) from public;
revoke all on function public.legal_info() from public;
revoke all on function public.legal_ready() from public;
revoke all on function public.publish_form(text, text, timestamptz, timestamptz, integer) from public, anon;
revoke all on function public.close_campaign(uuid) from public, anon;
grant execute on function public.submit_form(text, jsonb, jsonb, boolean, boolean) to anon, authenticated;
grant execute on function public.get_public_form(text) to anon, authenticated;
grant execute on function public.legal_info() to anon, authenticated;
grant execute on function public.legal_ready() to anon, authenticated;
grant execute on function public.publish_form(text, text, timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.close_campaign(uuid) to authenticated;
