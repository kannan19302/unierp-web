"use client";
import styles from "./page.module.css";
import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { usePortfolios, type NewPortfolioForm } from "./hooks/use-portfolios";
import { PortfolioCard } from "./components/portfolio-card";
import { CreatePortfolioModal } from "./components/create-portfolio-modal";

export default function PortfoliosPage() {
  const { portfolios, loading, error, createPortfolio } = usePortfolios();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = async (form: NewPortfolioForm) => {
    await createPortfolio(form);
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Briefcase size={28} className="ui-text-primary" />
            Strategic Portfolios
          </h1>
          <p className={styles.p2}>
            Roll up KPIs, monitor strategic budgets, risk indexes, and strategic
            alignment mapping
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.p3}>
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {loading && <div className="ui-text-muted">Loading portfolios...</div>}
      {error && <div className="ui-text-danger">{error}</div>}

      {!loading && portfolios.length > 0 && (
        <div className={styles.p4}>
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}

      {!loading && portfolios.length === 0 && (
        <div className={styles.p23}>
          No portfolios defined. Create a new portfolio to start rolling up
          project metrics.
        </div>
      )}

      {isModalOpen && (
        <CreatePortfolioModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
