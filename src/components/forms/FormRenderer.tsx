"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitForm } from "@/lib/forms/actions";
import type { Answers, Field, FormDefinition } from "@/lib/forms/types";
import { countWords, evaluate, isRequired, isVisible, validateSubmission } from "@/lib/forms/validate";
import styles from "./Forms.module.css";

type FormRendererProps = {
  definition: FormDefinition;
  /** Aviso de privacidad: se muestra justo antes de las casillas de consentimiento. */
  privacy: React.ReactNode;
  /** Vista previa en el editor: valida pero no envia nada. */
  preview?: boolean;
};

export default function FormRenderer({ definition, privacy, preview }: FormRendererProps) {
  const [values, setValues] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState<{ ended?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = (id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Si una condicion de fin se cumple (p. ej. V1 = No), se corta el formulario ahi mismo.
  const endField = definition.endIf && "field" in definition.endIf.condition ? definition.endIf.condition.field : null;
  const ended = definition.endIf ? evaluate(definition.endIf.condition, values) : false;
  const endSectionIndex = endField
    ? definition.sections.findIndex((s) => s.fields.some((f) => f.id === endField))
    : -1;
  const sections = ended ? definition.sections.slice(0, endSectionIndex + 1) : definition.sections;
  const lastIndex = definition.sections.length - 1;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    const result = validateSubmission(definition, values);
    if (!result.ok) {
      setErrors(result.errors);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (result.ended) return;
    if (preview) {
      setFormError("Vista previa: el formulario es válido, pero aquí no se envía nada.");
      return;
    }

    startTransition(async () => {
      const response = await submitForm(definition.slug, values, {
        website: honeypot.current?.value,
        elapsedMs: Date.now() - startedAt.current,
      });
      if (response.ok) {
        setDone({ ended: response.ended });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (response.errors) setErrors(response.errors);
      setFormError(response.message ?? "No pudimos enviar el formulario.");
      requestAnimationFrame(() => summaryRef.current?.focus());
    });
  }

  if (done) {
    return (
      <div className={styles.notice} role="status">
        <h2>{done.ended ? "Gracias por tu interés" : "¡Recibimos tu postulación!"}</h2>
        <p>
          {done.ended ??
            "Te escribiremos al correo y al WhatsApp que indicaste. Si tienes dudas, responde a ese mensaje o escríbenos."}
        </p>
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate>
      <input
        ref={honeypot}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className={styles.honeypot}
      />

      {(formError || errorList.length > 0) && (
        <div className={styles.summary} role="alert" tabIndex={-1} ref={summaryRef}>
          <strong>{formError || "Revisa los campos marcados."}</strong>
          {errorList.length > 0 && formError && <div>Corrige los campos marcados en rojo.</div>}
        </div>
      )}

      {sections.map((section, index) => (
        <div key={index}>
          {index === lastIndex && privacy}
          <section className={styles.section}>
            {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
            {section.fields
              .filter((field) => isVisible(field, values))
              .map((field) => (
                <FieldControl
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  error={errors[field.id]}
                  required={isRequired(field, values)}
                  onChange={(value) => set(field.id, value)}
                />
              ))}
          </section>
        </div>
      ))}

      {ended && definition.endIf ? (
        <div className={styles.ended} role="status">
          {definition.endIf.message}
        </div>
      ) : (
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Enviando…" : `${definition.submitLabel} →`}
        </button>
      )}
    </form>
  );
}

type FieldControlProps = {
  field: Field;
  value: unknown;
  error?: string;
  required: boolean;
  onChange: (value: unknown) => void;
};

function FieldControl({ field, value, error, required, onChange }: FieldControlProps) {
  const id = `f-${field.id}`;
  const describedBy = [field.help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const inputProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };
  const cls = (base = "") => `${base} ${error ? styles.invalid : ""}`;

  const label = (
    <span className={styles.label}>
      {field.label} {required && <span className={styles.req} aria-hidden="true">*</span>}
    </span>
  );
  const help = field.help && (
    <span id={`${id}-help`} className={styles.help}>
      {field.help}
    </span>
  );
  const errorEl = error && (
    <span id={`${id}-error`} className={styles.error}>
      {error}
    </span>
  );

  if (field.type === "checkbox") {
    return (
      <div className={styles.field}>
        <label className={styles.choice}>
          <input
            type="checkbox"
            {...inputProps}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {field.label} {required && <span className={styles.req} aria-hidden="true">*</span>}
          </span>
        </label>
        {errorEl}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <fieldset className={styles.field} aria-describedby={describedBy}>
        <legend className={styles.label}>
          {field.label} {required && <span className={styles.req} aria-hidden="true">*</span>}
        </legend>
        {help}
        <div className={`${styles.choices} ${styles.inline}`}>
          {[
            { v: true, l: "Sí" },
            { v: false, l: "No" },
          ].map((opt) => (
            <label key={opt.l} className={styles.choice}>
              <input type="radio" name={id} checked={value === opt.v} onChange={() => onChange(opt.v)} />
              {opt.l}
            </label>
          ))}
        </div>
        {errorEl}
      </fieldset>
    );
  }

  if (field.type === "select" && field.options.length <= 6) {
    return (
      <fieldset className={styles.field} aria-describedby={describedBy}>
        <legend className={styles.label}>
          {field.label} {required && <span className={styles.req} aria-hidden="true">*</span>}
        </legend>
        {help}
        <div className={styles.choices}>
          {field.options.map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input type="radio" name={id} checked={value === opt.value} onChange={() => onChange(opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
        {errorEl}
      </fieldset>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className={styles.field} aria-describedby={describedBy}>
        <legend className={styles.label}>
          {field.label} {required && <span className={styles.req} aria-hidden="true">*</span>}
        </legend>
        {help}
        <div className={styles.choices}>
          {field.options.map((opt) => (
            <label key={opt.value} className={styles.choice}>
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, opt.value] : selected.filter((v) => v !== opt.value))
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errorEl}
      </fieldset>
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {help}
      {field.type === "select" && (
        <select
          {...inputProps}
          className={cls(styles.select)}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecciona…</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {field.type === "textarea" && (
        <>
          <textarea
            {...inputProps}
            className={cls(styles.textarea)}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {(field.minWords || field.maxWords) && (
            <WordCounter text={typeof value === "string" ? value : ""} min={field.minWords} max={field.maxWords} />
          )}
        </>
      )}
      {(field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "url") && (
        <input
          {...inputProps}
          className={cls(styles.input)}
          type={field.type}
          inputMode={field.type === "tel" ? "tel" : undefined}
          autoComplete={field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined}
          maxLength={field.type === "text" ? (field.maxLength ?? 200) : undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === "number" && (
        <input
          {...inputProps}
          className={cls(styles.input)}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {errorEl}
    </div>
  );
}

function WordCounter({ text, min, max }: { text: string; min?: number; max?: number }) {
  const words = countWords(text);
  const over = (max && words > max) || (min && words > 0 && words < min);
  return (
    <span className={`${styles.counter} ${over ? styles.counterOver : ""}`} aria-live="polite">
      {words} {words === 1 ? "palabra" : "palabras"}
      {min && max ? ` (entre ${min} y ${max})` : max ? ` (máx. ${max})` : ""}
    </span>
  );
}
