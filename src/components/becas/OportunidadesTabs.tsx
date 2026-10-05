"use client";

import { useState } from "react";
import { becas, becasRankeadas } from "@/data/becas";
import BecasDashboard from "./BecasDashboard";
import styles from "./OportunidadesTabs.module.css";

const tabs = [
  { id: "database", label: "Database", count: becas.length },
  { id: "rankeadas", label: "Rankeadas", count: becasRankeadas.length },
] as const;

export default function OportunidadesTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("database");

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
            items={becasRankeadas}
            showRank
            emptyMessage="El equipo aún está seleccionando las mejores oportunidades. Mientras tanto, explora la Database completa."
          />
        )}
      </div>
    </div>
  );
}
