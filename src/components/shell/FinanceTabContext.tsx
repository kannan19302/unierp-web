"use client";

import React, { createContext, useContext, type ReactNode } from "react";

export interface FinanceTabContextValue {
  openAppTab: (tab: {
    id?: string;
    href: string;
    title: string;
    icon?: ReactNode;
  }) => void;
  closeTab: (tabId: string) => void;
  activeTabId: string;
  tabs: Array<{
    id: string;
    title: string;
    href: string;
    icon?: ReactNode;
    closable?: boolean;
    pinned?: boolean;
  }>;
}

const FinanceTabContext = createContext<FinanceTabContextValue | null>(null);

export const FinanceTabProvider = FinanceTabContext.Provider;

export function useFinanceTabs(): FinanceTabContextValue {
  const context = useContext(FinanceTabContext);
  if (!context) {
    // Fallback if rendered outside provider: navigate using window
    return {
      openAppTab: ({ href }) => {
        if (typeof window !== "undefined") {
          window.location.href = href;
        }
      },
      closeTab: () => {},
      activeTabId: "tab-home",
      tabs: [],
    };
  }
  return context;
}
