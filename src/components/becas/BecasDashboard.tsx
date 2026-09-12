"use client";

import { useMemo, useState } from "react";
import { becaFilters, becas } from "@/data/becas";
import styles from "./BecasDashboard.module.css";

type BecasDashboardProps = {
  variant: "page" | "modal";
};

export default function BecasDashboard({ variant }: BecasDashboardProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return becas.filter((beca) => {
      const matchesFilter = activeFilter === "all" || beca.tags.includes(activeFilter);
      const haystack = `${beca.title} ${beca.institution} ${beca.description} ${beca.label}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [query, activeFilter]);

  return (
    <div>
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.icon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por institución, país o área..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {becaFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`${styles.filterBtn} ${activeFilter === filter.value ? styles.active : ""}`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
        {filtered.length !== becas.length && (
          <span className={styles.resultsCount}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.grid} data-variant={variant}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No encontramos becas con esos filtros</h3>
            <p>Prueba con otra búsqueda o quita algún filtro.</p>
          </div>
        ) : (
          filtered.map((beca) => (
            <div className={styles.card} key={beca.id}>
              <div className={styles.cardTop}>
                <span className={`${styles.tag} ${styles[beca.tagVariant] ?? ""}`}>
                  {beca.label}
                </span>
                <span className={styles.estado}>{beca.estado}</span>
              </div>
              <h3>{beca.title}</h3>
              <span className={styles.inst}>{beca.institution}</span>
              <p className={styles.desc}>{beca.description}</p>
              <div className={styles.cardFooter}>
                <span>{beca.deadline}</span>
                {variant === "page" && <a href="#">Ver más →</a>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
