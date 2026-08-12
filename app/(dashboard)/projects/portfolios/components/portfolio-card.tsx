"use client";
import { Target, Activity, ShieldAlert } from "lucide-react";
import styles from "../page.module.css";
import type { Portfolio } from "../hooks/use-portfolios";

/**
 * L09 — extracted from PortfoliosPage. Renders one portfolio's rollup
 * card: alignment badge, KPI row, and its associated-projects list.
 * Kept local (not moved to unierp-design-system) — its markup and CSS
 * module classes are specific to this page's own styling, not a generic
 * reusable primitive other pages would compose.
 */
export function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className={["ui-card", styles.p5].filter(Boolean).join(" ")}>
      <div className="ui-flex-between ui-items-start">
        <div>
          <h3 className="ui-heading-lg">{portfolio.name}</h3>
          <p className={styles.p6}>
            {portfolio.description || "No description provided."}
          </p>
        </div>
        <span
          style={{
            background:
              portfolio.strategicAlignment === "HIGH"
                ? "var(--color-success-light)"
                : "var(--color-warning-light)",
            color:
              portfolio.strategicAlignment === "HIGH"
                ? "var(--color-success)"
                : "var(--color-warning)",
          }}
          className={styles.s1}
        >
          Alignment: {portfolio.strategicAlignment}
        </span>
      </div>

      <div className={styles.p7}>
        <div className={styles.p8}>
          <Target size={16} className="ui-text-primary" />
          <span className={styles.p9}>PROJECTS</span>
          <span className={styles.p10}>{portfolio.totalProjects}</span>
        </div>
        <div className={styles.p11}>
          <Activity size={16} className={styles.p12} />
          <span className={styles.p13}>BUDGET ROLLUP</span>
          <span className={styles.p14}>
            ${Number(portfolio.totalBudget).toLocaleString()}
          </span>
        </div>
        <div className={styles.p15}>
          <ShieldAlert size={16} className="ui-text-danger" />
          <span className={styles.p16}>OPEN RISKS</span>
          <span className={styles.p17}>{portfolio.openRisks}</span>
        </div>
      </div>

      <div>
        <h4 className={styles.p18}>Associated Projects</h4>
        {portfolio.projects.length > 0 ? (
          <div className="ui-stack-2">
            {portfolio.projects.map((proj) => (
              <div key={proj.id} className={styles.p19}>
                <div>
                  <span className={styles.p20}>{proj.name}</span>
                  <span className={styles.p21}>({proj.code})</span>
                </div>
                <span
                  style={{
                    background:
                      proj.status === "ACTIVE"
                        ? "var(--color-success-light)"
                        : "var(--color-bg-hover)",
                    color:
                      proj.status === "ACTIVE"
                        ? "var(--color-success)"
                        : "var(--color-text-secondary)",
                  }}
                  className={styles.s2}
                >
                  {proj.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.p22}>
            No projects associated with this portfolio.
          </p>
        )}
      </div>
    </div>
  );
}
