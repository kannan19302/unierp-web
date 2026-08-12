"use client";
import { useState, useEffect, useCallback } from "react";
import { useApiClient } from "@kannan19302/framework";

export interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  budget: number | null;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  riskScore: number | null;
  strategicAlignment: string | null;
  budget: number | null;
  projects: Project[];
  totalProjects: number;
  totalBudget: number;
  activeProjects: number;
  totalRisks: number;
  openRisks: number;
}

export interface NewPortfolioForm {
  name: string;
  description: string;
  strategicAlignment: string;
  budget: string;
}

const EMPTY_FORM: NewPortfolioForm = {
  name: "",
  description: "",
  strategicAlignment: "MEDIUM",
  budget: "",
};

/**
 * L09 — extracted from PortfoliosPage. Owns the portfolio list's fetch/
 * create data flow so the page component is left with layout only.
 */
export function usePortfolios() {
  const client = useApiClient();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await client.get<Portfolio[] | { data?: Portfolio[] }>(
        "/projects/portfolios",
      );
      setPortfolios(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchPortfolios();
  }, [fetchPortfolios]);

  const createPortfolio = useCallback(
    async (form: NewPortfolioForm) => {
      await client.post("/projects/portfolios", {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
      });
      await fetchPortfolios();
    },
    [client, fetchPortfolios],
  );

  return { portfolios, loading, error, createPortfolio };
}

export { EMPTY_FORM };
