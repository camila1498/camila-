"use client";

import { useMemo, useState } from "react";
import { type Beca, becaFilters } from "@/data/becas";
import styles from "./BecasDashboard.module.css";

type BecasDashboardProps = {
  items: Beca[];
  emptyMessage?: string;
  showRank?: boolean;
};

export default function BecasDashboard({ items, emptyMessage, showRank }: BecasDashboardProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((beca) => {
      const matchesFilter = activeFilter === "all" || beca.tags.includes(activeFilter);
      const haystack = `${beca.title} ${beca.institution} ${beca.description} ${beca.label}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, query, activeFilter]);

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
        {filtered.length !== items.length && (
          <span className={styles.resultsCount}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {items.length === 0 ? (
              <>
                <h3>Todavía no hay becas rankeadas</h3>
                <p>{emptyMessage}</p>
              </>
            ) : (
              <>
                <h3>No encontramos becas con esos filtros</h3>
                <p>Prueba con otra búsqueda o quita algún filtro.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((beca) => (
            <div className={styles.card} key={beca.id}>
              <div className={styles.cardTop}>
                <span className={`${styles.tag} ${styles[beca.tagVariant] ?? ""}`}>
                  {showRank && beca.rank !== undefined ? `#${beca.rank} · ` : ""}
                  {beca.label}
                </span>
                <span className={styles.estado}>{beca.estado}</span>
              </div>
              <h3>{beca.title}</h3>
              <span className={styles.inst}>{beca.institution}</span>
              <p className={styles.desc}>{beca.description}</p>
              <div className={styles.cardFooter}>
                <span>{beca.deadline}</span>
                <a href="#">Ver más →</a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
