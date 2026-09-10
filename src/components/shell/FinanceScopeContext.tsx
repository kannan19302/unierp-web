"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface FinanceScope {
  entity: string;
  unit: string;
  period: string;
  currency: string;
  periodStatus: "Open" | "Closing" | "Closed";
  setEntity: (entity: string) => void;
  setUnit: (unit: string) => void;
  setPeriod: (period: string) => void;
  setCurrency: (currency: string) => void;
  setPeriodStatus: (status: "Open" | "Closing" | "Closed") => void;
}

const FinanceScopeContext = createContext<FinanceScope | null>(null);

const DEFAULT_SCOPE = {
  entity: "Acme Corp",
  unit: "US Operations",
  period: "Aug 2026",
  currency: "USD",
  periodStatus: "Open" as const,
};

const STORAGE_KEY = "unierp_finance_scope";

export function FinanceScopeProvider({ children }: { children: ReactNode }) {
  const [entity, setEntityState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).entity || DEFAULT_SCOPE.entity;
      } catch {}
    }
    return DEFAULT_SCOPE.entity;
  });

  const [unit, setUnitState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).unit || DEFAULT_SCOPE.unit;
      } catch {}
    }
    return DEFAULT_SCOPE.unit;
  });

  const [period, setPeriodState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).period || DEFAULT_SCOPE.period;
      } catch {}
    }
    return DEFAULT_SCOPE.period;
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).currency || DEFAULT_SCOPE.currency;
      } catch {}
    }
    return DEFAULT_SCOPE.currency;
  });

  const [periodStatus, setPeriodStatusState] = useState<"Open" | "Closing" | "Closed">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).periodStatus || DEFAULT_SCOPE.periodStatus;
      } catch {}
    }
    return DEFAULT_SCOPE.periodStatus;
  });

  // Persist scope changes to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ entity, unit, period, currency, periodStatus })
        );
      } catch {}
    }
  }, [entity, unit, period, currency, periodStatus]);

  const value: FinanceScope = {
    entity,
    unit,
    period,
    currency,
    periodStatus,
    setEntity: setEntityState,
    setUnit: setUnitState,
    setPeriod: setPeriodState,
    setCurrency: setCurrencyState,
    setPeriodStatus: setPeriodStatusState,
  };

  return (
    <FinanceScopeContext.Provider value={value}>
      {children}
    </FinanceScopeContext.Provider>
  );
}

export function useFinanceScope(): FinanceScope {
  const ctx = useContext(FinanceScopeContext);
  if (!ctx) {
    return {
      ...DEFAULT_SCOPE,
      setEntity: () => {},
      setUnit: () => {},
      setPeriod: () => {},
      setCurrency: () => {},
      setPeriodStatus: () => {},
    };
  }
  return ctx;
}
