"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import FormRenderer from "@/components/forms/FormRenderer";
import PrivacyNotice from "@/components/forms/PrivacyNotice";
import type { SaveDraftResult } from "@/app/plataforma/(panel)/formularios/[slug]/editar/actions";
import type { Condition, Field, FormDefinition, Option } from "@/lib/forms/types";
import styles from "@/app/plataforma/admin.module.css";

type Legal = {
  controllerName: string;
  ruc: string;
  address: string;
  privacyEmail: string;
  storageNotice: string;
};

type FormBuilderProps = {
  slug: string;
  initial: FormDefinition;
  /** Ids de preguntas ya publicadas: se pueden ocultar, no borrar. */
  publishedIds: string[];
  readOnly: boolean;
  legal: Legal;
  saveDraft: (slug: string, json: string) => Promise<SaveDraftResult>;
};

const addableTypes: { value: Field["type"]; label: string }[] = [
  { value: "text", label: "Texto corto" },
  { value: "textarea", label: "Texto largo" },
  { value: "select", label: "Opción única" },
  { value: "multiselect", label: "Opción múltiple" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sí / No" },
  { value: "email", label: "Correo" },
  { value: "tel", label: "Teléfono" },
  { value: "url", label: "Enlace" },
];

const typeLabel: Record<Field["type"], string> = {
  text: "Texto corto",
  textarea: "Texto largo",
  select: "Opción única",
  multiselect: "Opción múltiple",
  number: "Número",
  boolean: "Sí / No",
  email: "Correo",
  tel: "Teléfono",
  url: "Enlace",
  checkbox: "Casilla",
};

function nextId(def: FormDefinition, publishedIds: string[]) {
  const used = new Set([...publishedIds, ...def.sections.flatMap((s) => s.fields.map((f) => f.id))]);
  let n = 1;
  while (used.has(`Q${n}`)) n += 1;
  return `Q${n}`;
}

function newField(type: Field["type"], id: string): Field {
  const base = { id, label: "Nueva pregunta", required: false };
  switch (type) {
    case "select":
    case "multiselect":
      return {
        ...base,
        type,
        options: [
          { value: "Opción 1", label: "Opción 1" },
          { value: "Opción 2", label: "Opción 2" },
        ],
      };
    case "textarea":
      return { ...base, type };
    case "number":
      return { ...base, type };
    default:
      return { ...base, type: type as "text" | "boolean" | "email" | "tel" | "url" };
  }
}

/** Convierte el texto del editor (una opcion por linea) en opciones, conservando los valores existentes. */
function parseOptions(text: string, current: Option[]): Option[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === current.length) {
    return lines.map((label, i) => ({ value: current[i]!.value, label }));
  }
  return lines.map((label) => ({ value: current.find((o) => o.label === label)?.value ?? label, label }));
}

export default function FormBuilder({ slug, initial, publishedIds, readOnly, legal, saveDraft }: FormBuilderProps) {
  const [def, setDef] = useState<FormDefinition>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [message, setMessage] = useState<{ type: "ok" | "error"; lines: string[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(def) !== saved, [def, saved]);
  const published = useMemo(() => new Set(publishedIds), [publishedIds]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (changes: Partial<FormDefinition>) => setDef((d) => ({ ...d, ...changes }));
  const patchField = (id: string, fn: (f: Field) => Field) =>
    setDef((d) => ({
      ...d,
      sections: d.sections.map((s) => ({ ...s, fields: s.fields.map((f) => (f.id === id ? fn(f) : f)) })),
    }));
  const patchSection = (index: number, changes: { title?: string; description?: string }) =>
    setDef((d) => ({ ...d, sections: d.sections.map((s, i) => (i === index ? { ...s, ...changes } : s)) }));
  const move = (sectionIndex: number, fieldIndex: number, dir: -1 | 1) =>
    setDef((d) => ({
      ...d,
      sections: d.sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const target = fieldIndex + dir;
        if (target < 0 || target >= s.fields.length) return s;
        const fields = [...s.fields];
        [fields[fieldIndex], fields[target]] = [fields[target]!, fields[fieldIndex]!];
        return { ...s, fields };
      }),
    }));
  const remove = (id: string) =>
    setDef((d) => ({ ...d, sections: d.sections.map((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== id) })) }));
  const addField = (sectionIndex: number, type: Field["type"]) => {
    const id = nextId(def, publishedIds);
    setDef((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === sectionIndex ? { ...s, fields: [...s.fields, newField(type, id)] } : s)),
    }));
    setOpen(id);
  };

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveDraft(slug, JSON.stringify(def));
      if (result.ok) {
        setSaved(JSON.stringify(def));
        setMessage({ type: "ok", lines: ["Borrador guardado."] });
      } else {
        setMessage({ type: "error", lines: result.errors });
      }
    });
  }

  const allFields = def.sections.flatMap((s) => s.fields);

  return (
    <div className={styles.builder}>
      <div className={styles.builderMain}>
        <div className={styles.builderBar}>
          <button type="button" className={styles.btn} onClick={save} disabled={readOnly || pending || !dirty}>
            {pending ? "Guardando…" : "Guardar borrador"}
          </button>
          <span className={styles.hint}>
            {readOnly ? "Solo lectura" : dirty ? "Cambios sin guardar" : "Todo guardado"}
          </span>
        </div>

        {message && (
          <div className={`${styles.flash} ${message.type === "ok" ? styles.ok : styles.error}`} role="alert">
            <ul className={styles.issueList}>
              {message.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <fieldset disabled={readOnly || pending} className={styles.builderFieldset}>
          <section className={styles.bCard}>
            <h2>Datos generales</h2>
            <div className={styles.field}>
              <label htmlFor="b-title">Título del formulario</label>
              <input id="b-title" value={def.title} maxLength={200} onChange={(e) => patch({ title: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label htmlFor="b-intro">Texto introductorio</label>
              <textarea
                id="b-intro"
                value={def.intro}
                maxLength={3000}
                rows={4}
                onChange={(e) => patch({ intro: e.target.value })}
              />
              <span className={styles.hint}>Lo que lee la persona antes de completar el formulario.</span>
            </div>
            <div className={styles.field}>
              <label htmlFor="b-submit">Texto del botón de envío</label>
              <input
                id="b-submit"
                value={def.submitLabel}
                maxLength={80}
                onChange={(e) => patch({ submitLabel: e.target.value })}
              />
            </div>
            {def.endIf && (
              <div className={styles.field}>
                <label htmlFor="b-end">Mensaje si no cumple el requisito inicial</label>
                <textarea
                  id="b-end"
                  rows={3}
                  value={def.endIf.message}
                  onChange={(e) => patch({ endIf: { ...def.endIf!, message: e.target.value } })}
                />
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="b-retention">Plazo de conservación de los datos (aviso de privacidad)</label>
              <textarea
                id="b-retention"
                rows={3}
                value={def.retention}
                maxLength={1000}
                onChange={(e) => patch({ retention: e.target.value })}
              />
              <span className={styles.hint}>Lo debe aprobar Legal.</span>
            </div>
          </section>

          {def.sections.map((section, si) => (
            <section key={si} className={styles.bCard}>
              <div className={styles.field}>
                <label htmlFor={`b-sec-${si}`}>Título de la sección {si + 1}</label>
                <input
                  id={`b-sec-${si}`}
                  value={section.title ?? ""}
                  placeholder="(sin título)"
                  onChange={(e) => patchSection(si, { title: e.target.value })}
                />
              </div>

              <ul className={styles.fieldList}>
                {section.fields.map((field, fi) => {
                  const isOpen = open === field.id;
                  const core = field.locked === "core";
                  const isPublished = published.has(field.id);
                  return (
                    <li key={field.id} className={`${styles.fieldItem} ${field.hidden ? styles.fieldHidden : ""}`}>
                      <div className={styles.fieldHead}>
                        <button
                          type="button"
                          className={styles.fieldTitle}
                          onClick={() => setOpen(isOpen ? null : field.id)}
                          aria-expanded={isOpen}
                        >
                          <span className={styles.fieldId}>{field.id}</span>
                          <span>{field.label}</span>
                          <span className={styles.fieldType}>{typeLabel[field.type]}</span>
                          {field.locked && <span className={styles.badge}>{core ? "Base" : "Opciones fijas"}</span>}
                          {field.hidden && <span className={styles.badge}>Oculta</span>}
                          {field.showIf && <span className={styles.badge}>Condicional</span>}
                        </button>
                        <div className={styles.fieldBtns}>
                          <button type="button" aria-label="Subir" onClick={() => move(si, fi, -1)} disabled={fi === 0}>
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="Bajar"
                            onClick={() => move(si, fi, 1)}
                            disabled={fi === section.fields.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <FieldEditor
                          field={field}
                          earlier={allFields.slice(0, allFields.findIndex((f) => f.id === field.id))}
                          canRemove={!isPublished && !core}
                          onChange={(fn) => patchField(field.id, fn)}
                          onRemove={() => remove(field.id)}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              <AddField onAdd={(type) => addField(si, type)} />
            </section>
          ))}
        </fieldset>
      </div>

      <aside className={styles.builderPreview} aria-label="Vista previa">
        <p className={styles.previewTag}>Vista previa (no envía datos)</p>
        <div className={styles.previewBody}>
          <h2 className={styles.previewTitle}>{def.title}</h2>
          {def.intro && <p className={styles.previewIntro}>{def.intro}</p>}
          <FormRenderer
            definition={def}
            preview
            privacy={<PrivacyNotice title={def.title} retention={def.retention} legal={legal} />}
          />
        </div>
      </aside>
    </div>
  );
}

function AddField({ onAdd }: { onAdd: (type: Field["type"]) => void }) {
  const [type, setType] = useState<Field["type"]>("text");
  return (
    <div className={styles.addField}>
      <select value={type} onChange={(e) => setType(e.target.value as Field["type"])} aria-label="Tipo de pregunta">
        {addableTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <button type="button" className={styles.btnGhost} onClick={() => onAdd(type)}>
        + Agregar pregunta
      </button>
    </div>
  );
}

type FieldEditorProps = {
  field: Field;
  earlier: Field[];
  canRemove: boolean;
  onChange: (fn: (f: Field) => Field) => void;
  onRemove: () => void;
};

function FieldEditor({ field, earlier, canRemove, onChange, onRemove }: FieldEditorProps) {
  const core = field.locked === "core";
  const optionsLocked = field.locked === "options";
  const requiredIsRule = typeof field.required === "object";
  const set = <K extends string>(key: K, value: unknown) =>
    onChange((f) => ({ ...f, [key]: value === "" ? undefined : value }) as Field);

  return (
    <div className={styles.fieldBody}>
      <div className={styles.field}>
        <label htmlFor={`f-label-${field.id}`}>Pregunta</label>
        <input id={`f-label-${field.id}`} value={field.label} maxLength={500} onChange={(e) => set("label", e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor={`f-help-${field.id}`}>Texto de ayuda (opcional)</label>
        <input id={`f-help-${field.id}`} value={field.help ?? ""} maxLength={500} onChange={(e) => set("help", e.target.value)} />
      </div>

      {(field.type === "select" || field.type === "multiselect") && (
        <div className={styles.field}>
          <label htmlFor={`f-opts-${field.id}`}>Opciones (una por línea)</label>
          <textarea
            id={`f-opts-${field.id}`}
            rows={Math.min(10, field.options.length + 1)}
            disabled={optionsLocked}
            value={field.options.map((o) => o.label).join("\n")}
            onChange={(e) => onChange((f) => ({ ...f, options: parseOptions(e.target.value, (f as { options: Option[] }).options) }) as Field)}
          />
          {optionsLocked && <span className={styles.hint}>Estas opciones alimentan el puntaje o las estadísticas y no se editan.</span>}
        </div>
      )}
      {field.type === "multiselect" && (
        <div className={styles.field}>
          <label htmlFor={`f-max-${field.id}`}>Máximo de opciones a elegir (opcional)</label>
          <input
            id={`f-max-${field.id}`}
            type="number"
            min={1}
            value={field.max ?? ""}
            onChange={(e) => set("max", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>
      )}
      {field.type === "textarea" && (
        <div className={styles.inline2}>
          <div className={styles.field}>
            <label htmlFor={`f-minw-${field.id}`}>Mínimo de palabras</label>
            <input
              id={`f-minw-${field.id}`}
              type="number"
              min={1}
              value={field.minWords ?? ""}
              onChange={(e) => set("minWords", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`f-maxw-${field.id}`}>Máximo de palabras</label>
            <input
              id={`f-maxw-${field.id}`}
              type="number"
              min={1}
              value={field.maxWords ?? ""}
              onChange={(e) => set("maxWords", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </div>
        </div>
      )}
      {field.type === "number" && (
        <div className={styles.inline2}>
          <div className={styles.field}>
            <label htmlFor={`f-min-${field.id}`}>Valor mínimo</label>
            <input
              id={`f-min-${field.id}`}
              type="number"
              value={field.min ?? ""}
              onChange={(e) => set("min", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`f-max-${field.id}`}>Valor máximo</label>
            <input
              id={`f-max-${field.id}`}
              type="number"
              value={field.max ?? ""}
              onChange={(e) => set("max", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className={styles.fieldFlags}>
        {field.type !== "checkbox" && (
          <label className={styles.flag}>
            <input
              type="checkbox"
              disabled={core || requiredIsRule}
              checked={field.required === true}
              onChange={(e) => set("required", e.target.checked)}
            />
            {requiredIsRule ? "Obligatoria según otra respuesta" : "Obligatoria"}
          </label>
        )}
        {!core && (
          <label className={styles.flag}>
            <input type="checkbox" checked={Boolean(field.hidden)} onChange={(e) => set("hidden", e.target.checked ? true : undefined)} />
            Ocultar en el formulario
          </label>
        )}
        {field.sensitive && <span className={styles.hint}>Respuesta sensible: se guarda aparte y solo la ve el administrador.</span>}
      </div>

      {!core && (
        <ShowIfEditor
          value={field.showIf}
          earlier={earlier.filter((f) => f.type === "select" || f.type === "multiselect" || f.type === "boolean")}
          onChange={(c) => set("showIf", c)}
        />
      )}

      <div className={styles.fieldFoot}>
        {canRemove ? (
          <button type="button" className={styles.btnDanger} onClick={onRemove}>
            Quitar pregunta
          </button>
        ) : (
          <span className={styles.hint}>
            {core
              ? "Pregunta base: no se puede quitar ni cambiar de tipo."
              : "Ya estuvo publicada: no se borra, solo se oculta, para conservar el historial."}
          </span>
        )}
      </div>
    </div>
  );
}

function ShowIfEditor({
  value,
  earlier,
  onChange,
}: {
  value: Condition | undefined;
  earlier: Field[];
  onChange: (c: Condition | undefined) => void;
}) {
  const source = value ? earlier.find((f) => f.id === value.field) : undefined;

  function pick(id: string) {
    const f = earlier.find((x) => x.id === id);
    if (!f) return onChange(undefined);
    if (f.type === "boolean") onChange({ field: id, equals: true });
    else if (f.type === "select") onChange({ field: id, equals: f.options[0]?.value ?? "" });
    else if (f.type === "multiselect") onChange({ field: id, includesAny: f.options[0] ? [f.options[0].value] : [] });
  }

  return (
    <div className={styles.field}>
      <label>Mostrar solo si…</label>
      <select value={value?.field ?? ""} onChange={(e) => pick(e.target.value)} aria-label="Mostrar solo si">
        <option value="">Siempre visible</option>
        {earlier.map((f) => (
          <option key={f.id} value={f.id}>
            {f.id} · {f.label.slice(0, 60)}
          </option>
        ))}
        {value && !source && <option value={value.field}>{value.field} (regla existente)</option>}
      </select>

      {value && source?.type === "boolean" && "equals" in value && (
        <select value={String(value.equals)} onChange={(e) => onChange({ field: value.field, equals: e.target.value === "true" })} aria-label="Valor">
          <option value="true">es Sí</option>
          <option value="false">es No</option>
        </select>
      )}
      {value && source?.type === "select" && "equals" in value && (
        <select value={String(value.equals)} onChange={(e) => onChange({ field: value.field, equals: e.target.value })} aria-label="Valor">
          {source.options.map((o) => (
            <option key={o.value} value={o.value}>
              es “{o.label}”
            </option>
          ))}
        </select>
      )}
      {value && source?.type === "multiselect" && "includesAny" in value && (
        <div className={styles.choiceList}>
          {source.options.map((o) => (
            <label key={o.value} className={styles.flag}>
              <input
                type="checkbox"
                checked={value.includesAny.includes(o.value)}
                onChange={(e) => {
                  const next = e.target.checked ? [...value.includesAny, o.value] : value.includesAny.filter((v) => v !== o.value);
                  onChange(next.length ? { field: value.field, includesAny: next } : undefined);
                }}
              />
              incluye “{o.label}”
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
