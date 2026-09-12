import type { ReactNode } from "react";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  eyebrow: string;
  eyebrowColor?: string;
  title: ReactNode;
  description?: ReactNode;
  center?: boolean;
  light?: boolean;
};

export default function SectionHead({
  eyebrow,
  eyebrowColor,
  title,
  description,
  center,
  light,
}: SectionHeadProps) {
  return (
    <div
      className={`${styles.sectionHead} ${center ? styles.center : ""} ${light ? styles.light : ""}`}
    >
      <p className="eyebrow" style={eyebrowColor ? { color: eyebrowColor } : undefined}>
        {eyebrow}
      </p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
