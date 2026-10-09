export type Option = { value: string; label: string };

/** Condicion sobre otra respuesta: igualdad, o que una opcion multiple incluya alguno de los valores. */
export type Condition =
  | { field: string; equals: string | boolean }
  | { field: string; includesAny: string[] };

type FieldBase = {
  /** Identificador del documento (C1, V1, B8…). Es la clave en `answers`. */
  id: string;
  label: string;
  help?: string;
  /** true, o una condicion (requerido solo si se cumple). */
  required?: boolean | Condition;
  /** Solo se muestra (y valida) si se cumple. */
  showIf?: Condition;
  /** Se guarda aparte, con acceso mas estricto (puede traer datos de salud). */
  sensitive?: boolean;
};

export type Field = FieldBase &
  (
    | { type: "text"; maxLength?: number }
    | { type: "email" }
    | { type: "tel" }
    | { type: "url" }
    | { type: "textarea"; minWords?: number; maxWords?: number }
    | { type: "number"; min?: number; max?: number }
    | { type: "select"; options: Option[] }
    | { type: "multiselect"; options: Option[]; max?: number }
    | { type: "boolean" }
    | { type: "checkbox" }
  );

export type Section = { title?: string; description?: string; fields: Field[] };

export type FormDefinition = {
  slug: "voluntariado" | "aliados" | "emplealab" | "createwomen" | "bootcamp";
  /** Subir al cambiar preguntas: se guarda con cada respuesta para exportar con las etiquetas correctas. */
  version: number;
  title: string;
  intro: string;
  submitLabel: string;
  sections: Section[];
  /** Si se cumple, el formulario termina sin guardar nada (p. ej. V1 = No). */
  endIf?: { condition: Condition; message: string };
  /** Pregunta "¿tienes menos de 18 años?" que marca la postulacion como de menor. */
  minorField?: string;
  /** Texto de plazo de conservacion para el aviso de privacidad. */
  retention: string;
  /** Formulario anterior en Google Forms; se ofrece mientras el nuevo este cerrado. */
  legacyUrl?: string;
};

export type Answers = Record<string, unknown>;
