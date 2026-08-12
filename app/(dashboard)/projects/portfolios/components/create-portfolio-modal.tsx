"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import styles from "../page.module.css";
import { EMPTY_FORM, type NewPortfolioForm } from "../hooks/use-portfolios";

/**
 * L09 — extracted from PortfoliosPage. The "New Portfolio" create form.
 * Kept local — its fields (strategic alignment, budget allocation) are
 * specific to a portfolio's own shape, not a generic reusable form other
 * pages would compose.
 */
export function CreatePortfolioModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (form: NewPortfolioForm) => Promise<void>;
}) {
  const [form, setForm] = useState<NewPortfolioForm>(EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate(form);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create portfolio");
    }
  };

  return (
    <div className={styles.p24}>
      <form onSubmit={handleSubmit} className={styles.p25}>
        <h3 className={styles.p26}>
          <Sparkles size={18} className="ui-text-primary" />
          Create Portfolio
        </h3>

        <div>
          <label className="ui-text-xs-label">Portfolio Name</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={styles.p27}
          />
        </div>

        <div>
          <label className="ui-text-xs-label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={styles.p28}
          />
        </div>

        <div className="ui-grid-2 ui-gap-3">
          <div>
            <label className="ui-text-xs-label">Strategic Alignment</label>
            <select
              value={form.strategicAlignment}
              onChange={(e) =>
                setForm({ ...form, strategicAlignment: e.target.value })
              }
              className={styles.p29}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="ui-text-xs-label">Budget Allocation</label>
            <input
              type="number"
              placeholder="e.g. 500000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={styles.p30}
            />
          </div>
        </div>

        <div className="ui-flex-end ui-gap-2 mt-2">
          <button type="button" onClick={onClose} className={styles.p31}>
            Cancel
          </button>
          <button type="submit" className={styles.p32}>
            Save Portfolio
          </button>
        </div>
      </form>
    </div>
  );
}
