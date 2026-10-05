"use client";

import { useMemo, useState } from "react";
import { type Beca, getRankeadas } from "@/data/becas";
import BecasDashboard from "./BecasDashboard";
import styles from "./OportunidadesTabs.module.css";

type OportunidadesTabsProps = {
  becas: Beca[];
};

export default function OportunidadesTabs({ becas }: OportunidadesTabsProps) {
  const [active, setActive] = useState<"database" | "rankeadas">("database");
  const rankeadas = useMemo(() => getRankeadas(becas), [becas]);
  const tabs = [
    { id: "database", label: "Database", count: becas.length },
    { id: "rankeadas", label: "Rankeadas", count: rankeadas.length },
  ] as const;

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="Vista de oportunidades">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`${styles.tab} ${active === tab.id ? styles.active : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label} <span className={styles.count}>{tab.count}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
        {active === "database" ? (
          <BecasDashboard key="database" items={becas} />
        ) : (
          <BecasDashboard
            key="rankeadas"
            items={rankeadas}
            showRank
            emptyMessage="El equipo aún está seleccionando las mejores oportunidades. Mientras tanto, explora la Database completa."
          />
        )}
      </div>
    </div>
  );
}
