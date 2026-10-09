import type { LegalInfo } from "@/lib/forms/store";
import styles from "./Forms.module.css";

/**
 * Borrador del aviso de privacidad (documento "Formularios CreateLatam 2026", seccion 7).
 * Pendiente de aprobacion de Legal; los datos del responsable salen de /plataforma/configuracion.
 */
type LegalData = Pick<LegalInfo, "controllerName" | "ruc" | "address" | "privacyEmail" | "storageNotice">;

export default function PrivacyNotice({
  title,
  retention,
  legal,
}: {
  title: string;
  retention: string;
  legal: LegalData;
}) {
  return (
    <div className={styles.privacy} role="region" aria-label="Aviso de privacidad">
      <h3>Aviso de privacidad — {title}</h3>
      <p>
        <strong>Responsable:</strong> {legal.controllerName}, RUC {legal.ruc}, domicilio en{" "}
        {legal.address}, Lima, Perú. <strong>Contacto:</strong> {legal.privacyEmail}.
      </p>
      <p>
        <strong>Para qué:</strong> evaluar tu postulación, comunicarnos contigo sobre esta
        convocatoria y, si eres seleccionada, organizar tu participación y medir el impacto del
        programa. Preguntamos género y tipo de institución porque el programa es para mujeres y
        prioriza instituciones públicas. Solo si marcas la casilla correspondiente te escribiremos
        sobre futuras convocatorias.
      </p>
      <p>
        <strong>Qué datos:</strong> los de este formulario. Sin las respuestas obligatorias no
        podemos evaluar tu postulación.
      </p>
      <p>
        <strong>Menores de edad:</strong> si tienes menos de 18 años, pediremos la autorización de
        tu madre, padre o tutor antes de confirmar tu vacante.
      </p>
      <p>
        <strong>Quién accede:</strong> solo el equipo de CreateLatam que gestiona esta convocatoria.{" "}
        {legal.storageNotice} No vendemos ni cedemos tus datos.
      </p>
      <p>
        <strong>Cuánto tiempo:</strong> {retention}
      </p>
      <p>
        <strong>Tus derechos:</strong> puedes pedir acceso, rectificación, cancelación u oposición
        escribiendo a {legal.privacyEmail}. Si no estás conforme con la respuesta, puedes acudir a
        la Autoridad Nacional de Protección de Datos Personales.
      </p>
      <p>
        <strong>Base legal:</strong> Ley N.º 29733 y su Reglamento (D.S. 016-2024-JUS).
      </p>
    </div>
  );
}
