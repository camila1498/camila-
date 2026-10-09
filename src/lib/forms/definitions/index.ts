import type { FormDefinition } from "../types";
import { aliados } from "./aliados";
import { bootcamp } from "./bootcamp";
import { createwomen } from "./createwomen";
import { emplealab } from "./emplealab";
import { voluntariado } from "./voluntariado";

export const formDefinitions: Record<FormDefinition["slug"], FormDefinition> = {
  voluntariado,
  aliados,
  emplealab,
  createwomen,
  bootcamp,
};

export function getFormDefinition(slug: string): FormDefinition | undefined {
  return (formDefinitions as Record<string, FormDefinition>)[slug];
}
