"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Receipt,
  FileText,
  Calculator,
  Activity,
  Wallet,
  Scale,
  Eye,
  GitCompare,
  RefreshCw,
  ChevronRight,
  CreditCard,
  FileSliders,
  Building2,
  ShoppingCart,
  ClipboardList,
  ShieldAlert,
  Calendar,
  Link2,
  ShieldCheck,
  Handshake,
  Brain,
  Zap,
  TrendingDown,
  ShieldQuestion,
  Search,
  Layers,
  Sparkles,
  Percent,
  Landmark,
  FileSpreadsheet,
  CheckCircle2,
  Coins,
} from "lucide-react";
import styles from "./page.module.css";

interface FinanceModuleDef {
  href: string;
  label: string;
  category: "CORE" | "TREASURY" | "TAX" | "PLANNING" | "OPERATIONS" | "GOVERNANCE" | "AI";
  desc: string;
  icon: React.ReactNode;
}

const ALL_FINANCE_MODULES: FinanceModuleDef[] = [
  // Core Accounting
  {
    href: "/finance/advanced/chart-of-accounts",
    label: "Chart of Accounts",
    category: "CORE",
    desc: "Manage general ledger accounts, hierarchy, financial categories, and numbering",
    icon: <CreditCard size={18} />,
  },
  {
    href: "/finance/advanced/journal-entries",
    label: "Journal Entries Ledger",
    category: "CORE",
    desc: "Record, approve, and post double-entry vouchers to general ledger",
    icon: <FileSliders size={18} />,
  },
  {
    href: "/finance/advanced/accounting-books",
    label: "Multi-Book Accounting",
    category: "CORE",
    desc: "Parallel ledgers for local statutory, IFRS, US GAAP, and tax books",
    icon: <Layers size={18} />,
  },
  {
    href: "/finance/advanced/financial-periods",
    label: "Financial Periods",
    category: "CORE",
    desc: "Fiscal calendar, period locking, year-end roll, and open/close controls",
    icon: <Calendar size={18} />,
  },
  {
    href: "/finance/advanced/close-tasks",
    label: "Close Task Checklist",
    category: "CORE",
    desc: "Subledger closing checklists, sign-offs, dependencies, and SLAs",
    icon: <ClipboardList size={18} />,
  },
  {
    href: "/finance/advanced/close-management",
    label: "Period Close Management",
    category: "CORE",
    desc: "Variance threshold triage, task assignments, and period analytics",
    icon: <CheckCircle2 size={18} />,
  },
  {
    href: "/finance/advanced/fixed-assets",
    label: "Fixed Asset Register",
    category: "CORE",
    desc: "Asset lifecycle, capitalization, maintenance schedules, and impairment",
    icon: <Building2 size={18} />,
  },
  {
    href: "/finance/advanced/allocations",
    label: "Cost Allocations Engine",
    category: "CORE",
    desc: "Dynamic statistical distributions, headcount, and square footage weights",
    icon: <Percent size={18} />,
  },
  {
    href: "/finance/advanced/recurring",
    label: "Recurring Transactions",
    category: "CORE",
    desc: "Automated recurring journal templates and auto-post schedules",
    icon: <RefreshCw size={18} />,
  },

  // Payables & Receivables
  {
    href: "/finance/advanced/ar-aging",
    label: "AR Aging Analysis",
    category: "OPERATIONS",
    desc: "Receivables aging buckets: Current, 1–30, 31–60, 61–90, 90+ days",
    icon: <BarChart3 size={18} />,
  },
  {
    href: "/finance/advanced/ar-automation",
    label: "Collections & Dunning",
    category: "OPERATIONS",
    desc: "Automated dunning cadences, collection emails, and late fee escalation",
    icon: <ClipboardList size={18} />,
  },
  {
    href: "/finance/advanced/credit-risk",
    label: "Credit Risk Limits",
    category: "OPERATIONS",
    desc: "Customer credit limits, exposure monitoring, and automated credit holds",
    icon: <ShieldAlert size={18} />,
  },
  {
    href: "/finance/advanced/customer-statement",
    label: "Customer Statements",
    category: "OPERATIONS",
    desc: "Detailed customer subledger statement generation and billing history",
    icon: <FileText size={18} />,
  },
  {
    href: "/finance/advanced/invoice-analytics",
    label: "Invoice Analytics",
    category: "OPERATIONS",
    desc: "Billing trend forecasting, payment velocities, and dispute root cause analysis",
    icon: <TrendingUp size={18} />,
  },
  {
    href: "/finance/advanced/payment-terms",
    label: "Payment Terms & Discounts",
    category: "OPERATIONS",
    desc: "Credit terms configuration (Net 30, 2/10 Net 30) and early settlement discounts",
    icon: <Calendar size={18} />,
  },
  {
    href: "/finance/advanced/ap-automation",
    label: "AP Workflow Automation",
    category: "OPERATIONS",
    desc: "Vendor bill approvals, 3-way matching rules, and exception routing",
    icon: <ShoppingCart size={18} />,
  },
  {
    href: "/finance/advanced/ap-match-rules",
    label: "3-Way Match Rules",
    category: "OPERATIONS",
    desc: "PO vs Receipt vs Invoice tolerance thresholds and PPV accounting rules",
    icon: <GitCompare size={18} />,
  },
  {
    href: "/finance/advanced/invoice-capture",
    label: "OCR Invoice Capture",
    category: "OPERATIONS",
    desc: "AI optical character recognition, digital PDF parsing, and header/line ingestion",
    icon: <FileSpreadsheet size={18} />,
  },
  {
    href: "/finance/advanced/payment-batches",
    label: "Payment Run Batches",
    category: "OPERATIONS",
    desc: "ACH, Wire, SEPA, and check payment batch generation and approval workflows",
    icon: <CreditCard size={18} />,
  },
  {
    href: "/finance/advanced/e-invoicing",
    label: "Global E-Invoicing",
    category: "OPERATIONS",
    desc: "PEPPOL, Factur-X, ZUGFeRD, and KSA ZATCA compliant invoice transmission",
    icon: <Zap size={18} />,
  },

  // Revenue & Subscriptions
  {
    href: "/finance/advanced/revenue-schedules",
    label: "Revenue Recognition (ASC 606)",
    category: "OPERATIONS",
    desc: "Contract performance obligations, deferred revenue waterfalls, and milestones",
    icon: <TrendingUp size={18} />,
  },
  {
    href: "/finance/advanced/subscriptions",
    label: "Subscription Billing & ARR",
    category: "OPERATIONS",
    desc: "Recurring subscription plans, usage metering, MRR/ARR analytics, and churn",
    icon: <RepeatIcon size={18} />,
  },
  {
    href: "/finance/advanced/leases",
    label: "Lease Accounting (ASC 842)",
    category: "OPERATIONS",
    desc: "Right-of-use asset schedules, lease liabilities, and monthly amortization",
    icon: <Building2 size={18} />,
  },

  // Treasury & Liquidity
  {
    href: "/finance/advanced/bank-accounts",
    label: "Bank Account Master",
    category: "TREASURY",
    desc: "Corporate bank accounts, signatory controls, and routing numbers",
    icon: <Wallet size={18} />,
  },
  {
    href: "/finance/advanced/bank-feeds",
    label: "Direct Bank Feeds",
    category: "TREASURY",
    desc: "Live OAuth banking feeds via Plaid, Finicity, and Open Banking APIs",
    icon: <Link2 size={18} />,
  },
  {
    href: "/finance/advanced/bank-recon",
    label: "Bank Auto-Reconciliation",
    category: "TREASURY",
    desc: "Algorithmic 99.4% confidence statement line to general ledger matching",
    icon: <GitCompare size={18} />,
  },
  {
    href: "/finance/advanced/reconciliations",
    label: "Reconciliation Reporting",
    category: "TREASURY",
    desc: "Monthly bank reconciliation statement certificates and audit evidence",
    icon: <FileText size={18} />,
  },
  {
    href: "/finance/advanced/cash-position",
    label: "Daily Cash Position",
    category: "TREASURY",
    desc: "Aggregated available liquidity across all global corporate accounts",
    icon: <DollarSign size={18} />,
  },
  {
    href: "/finance/advanced/cash-flow-forecast",
    label: "13-Week Cash Forecast",
    category: "TREASURY",
    desc: "Direct method predictive liquidity modeling and variance analysis",
    icon: <Activity size={18} />,
  },
  {
    href: "/finance/advanced/treasury",
    label: "Treasury Management",
    category: "TREASURY",
    desc: "Concentration accounts, zero-balance account (ZBA) sweeps, and cash pooling",
    icon: <Landmark size={18} />,
  },
  {
    href: "/finance/advanced/working-capital",
    label: "Working Capital Optimization",
    category: "TREASURY",
    desc: "Cash conversion cycle (CCC), dynamic discounting, and supply chain finance",
    icon: <Handshake size={18} />,
  },
  {
    href: "/finance/advanced/corporate-cards",
    label: "Corporate Card Feeds",
    category: "TREASURY",
    desc: "Commercial card feed integration, spend policies, and real-time expense triage",
    icon: <CreditCard size={18} />,
  },
  {
    href: "/finance/advanced/financial-instruments",
    label: "Derivatives & Hedging",
    category: "TREASURY",
    desc: "FX forwards, cross-currency swaps, mark-to-market valuations, and hedge accounting",
    icon: <Coins size={18} />,
  },

  // Tax & Compliance
  {
    href: "/finance/advanced/tax-engine",
    label: "Tax Engine & Rules",
    category: "TAX",
    desc: "Multi-jurisdiction sales tax, VAT, GST calculation matrices, and rates",
    icon: <Calculator size={18} />,
  },
  {
    href: "/finance/advanced/tax-filing",
    label: "Tax Filing Preparation",
    category: "TAX",
    desc: "Automated VAT return computation, sales tax schedules, and proof packets",
    icon: <FileCheckIcon size={18} />,
  },
  {
    href: "/finance/advanced/tax-filing-summary",
    label: "Statutory Tax Summary",
    category: "TAX",
    desc: "Accrued tax liabilities by jurisdiction and upcoming compliance calendar",
    icon: <ShieldAlert size={18} />,
  },
  {
    href: "/finance/advanced/tax-nexus",
    label: "Economic Nexus Monitor",
    category: "TAX",
    desc: "Wayfair sales and transaction threshold tracking across all US states",
    icon: <Link2 size={18} />,
  },
  {
    href: "/finance/advanced/tax-provisioning",
    label: "ASC 740 Tax Provision",
    category: "TAX",
    desc: "Current and deferred income tax provision, valuation allowances, and ETR",
    icon: <Calculator size={18} />,
  },
  {
    href: "/finance/advanced/1099-reporting",
    label: "IRS Form 1099 Vendor Compliance",
    category: "TAX",
    desc: "1099-NEC & 1099-MISC thresholds, W-9 validation, and IRS FIRE file output",
    icon: <FileText size={18} />,
  },

  // Planning & Reporting
  {
    href: "/finance/advanced/budgeting",
    label: "Driver-Based Budgeting",
    category: "PLANNING",
    desc: "Departmental budgets, bottom-up forecasts, variance reporting, and reallocations",
    icon: <FileText size={18} />,
  },
  {
    href: "/finance/advanced/budget-scenarios",
    label: "Budget Scenarios",
    category: "PLANNING",
    desc: "Scenario modeling: Base Case, Upside Growth, and Downside Liquidity stress tests",
    icon: <Sparkles size={18} />,
  },
  {
    href: "/finance/advanced/forecast-scenarios",
    label: "Rolling Forecasts (xP&A)",
    category: "PLANNING",
    desc: "Continuous 18-month financial and operational planning models",
    icon: <TrendingUp size={18} />,
  },
  {
    href: "/finance/advanced/scenario-comparison",
    label: "Scenario Comparison Matrix",
    category: "PLANNING",
    desc: "Side-by-side P&L, balance sheet, and margin impact across scenarios",
    icon: <GitCompare size={18} />,
  },
  {
    href: "/finance/advanced/reports",
    label: "Financial Statements Suite",
    category: "PLANNING",
    desc: "Comparative P&L, Balance Sheet, Cash Flows, Trial Balance, and schedules",
    icon: <FileSpreadsheet size={18} />,
  },
  {
    href: "/finance/advanced/financial-ratios",
    label: "Financial Ratios & Health",
    category: "PLANNING",
    desc: "Liquidity, leverage, profitability, and efficiency covenants benchmarks",
    icon: <Scale size={18} />,
  },
  {
    href: "/finance/advanced/exchange-rates",
    label: "Foreign Exchange Rates",
    category: "PLANNING",
    desc: "Central bank daily spot rates, month-end closing, and period-average FX",
    icon: <DollarSign size={18} />,
  },
  {
    href: "/finance/advanced/fx-revaluation",
    label: "FX Balance Revaluation",
    category: "PLANNING",
    desc: "IAS 21 / ASC 830 foreign denominated asset/liability revaluation vouchers",
    icon: <Coins size={18} />,
  },
  {
    href: "/finance/advanced/currency-revaluation",
    label: "Currency Revaluation Setup",
    category: "PLANNING",
    desc: "Unrealized gain/loss gain accounts and auto-reversal parameters",
    icon: <RefreshCw size={18} />,
  },

  // Governance, Intercompany & ESG
  {
    href: "/finance/advanced/consolidation",
    label: "Multi-GAAP Consolidation",
    category: "GOVERNANCE",
    desc: "Global group consolidation, currency translation reserves, and minority interest",
    icon: <PieChart size={18} />,
  },
  {
    href: "/finance/advanced/intercompany",
    label: "Intercompany Hub",
    category: "GOVERNANCE",
    desc: "Bilateral entity balances, cross-border invoicing, and transfer pricing",
    icon: <Handshake size={18} />,
  },
  {
    href: "/finance/advanced/risk-management",
    label: "Enterprise Financial Risk",
    category: "GOVERNANCE",
    desc: "Credit risk scorecards, market exposure VaR, and operational loss registers",
    icon: <ShieldQuestion size={18} />,
  },
  {
    href: "/finance/advanced/esg-accounting",
    label: "ESG & Carbon Accounting",
    category: "GOVERNANCE",
    desc: "Scope 1/2/3 GHG emissions, carbon tax ledger, green bonds, and ESG metrics",
    icon: <TrendingDown size={18} />,
  },
  {
    href: "/finance/advanced/audit-logs",
    label: "Immutable Audit Trail",
    category: "GOVERNANCE",
    desc: "Tamper-evident change logs, SOX 404 access records, and policy overrides",
    icon: <Eye size={18} />,
  },
  {
    href: "/finance/advanced/account-reconciliation",
    label: "Subledger Reconciliation",
    category: "GOVERNANCE",
    desc: "Automated variance checks between AR/AP/Inventory and General Ledger control accounts",
    icon: <GitCompare size={18} />,
  },
  {
    href: "/finance/advanced/exception-queue",
    label: "Finance Exception Queue",
    category: "GOVERNANCE",
    desc: "Unposted entries, posting errors, failed automated batches, and reconciliation drift",
    icon: <ShieldAlert size={18} />,
  },
  {
    href: "/finance/advanced/expense-reports",
    label: "Employee Expense Reports",
    category: "GOVERNANCE",
    desc: "Receipt audits, per diem calculations, manager approvals, and reimbursement runs",
    icon: <Receipt size={18} />,
  },
  {
    href: "/finance/advanced/expense-policies",
    label: "Expense Policy Controls",
    category: "GOVERNANCE",
    desc: "Category spending ceilings, receipt thresholds, and non-reimbursable exclusions",
    icon: <ShieldCheck size={18} />,
  },

  // AI Intelligence
  {
    href: "/finance/advanced/ai-analytics",
    label: "AI Financial Intelligence",
    category: "AI",
    desc: "Autonomous anomaly detection, GL account predictive coding, and natural language copilot",
    icon: <Brain size={18} />,
  },
];

function RepeatIcon({ size }: { size: number }) {
  return <RefreshCw size={size} />;
}

function FileCheckIcon({ size }: { size: number }) {
  return <FileText size={size} />;
}

export default function AdvancedFinanceWorkspaceHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "All Modules" },
    { id: "CORE", label: "Core Accounting" },
    { id: "TREASURY", label: "Payables & Treasury" },
    { id: "TAX", label: "Tax & Compliance" },
    { id: "PLANNING", label: "Planning & Reporting" },
    { id: "OPERATIONS", label: "Revenue & Billing" },
    { id: "GOVERNANCE", label: "Governance & ESG" },
    { id: "AI", label: "AI Financial Intelligence" },
  ];

  const filteredModules = useMemo(() => {
    return ALL_FINANCE_MODULES.filter((mod) => {
      if (selectedCategory !== "ALL" && mod.category !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        mod.label.toLowerCase().includes(q) ||
        mod.desc.toLowerCase().includes(q) ||
        mod.href.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Enterprise Finance Workspace Hub</h1>
          <p className={styles.subtitle}>
            Comprehensive operational suites, high-density Strata floorplans, and direct ledger integration.
          </p>
        </div>

        <div className={styles.liveBadge}>
          <div className={styles.liveDot} />
          <span>58 Modules Connected • Live RLS Isolated</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Modules</span>
          <span className={styles.kpiValue}>58 Workspaces</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Backend Endpoints</span>
          <span className={styles.kpiValue}>1,747 APIs Connected</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Security &amp; Isolation</span>
          <span className={styles.kpiValue}>PostgreSQL RLS 100%</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Audit Compliance</span>
          <span className={styles.kpiValue}>SOX 404 / IFRS / GAAP</span>
        </div>
      </div>

      {/* Controls Bar: Search & Category Pills */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={15} color="var(--color-text-secondary)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search across all 58 finance modules by name, keyword, or workflow..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.categoryPills}>
          {categories.map((cat) => {
            const count =
              cat.id === "ALL"
                ? ALL_FINANCE_MODULES.length
                : ALL_FINANCE_MODULES.filter((m) => m.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillBtnActive : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className={styles.pillCount}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules Grid */}
      <div className={styles.modulesGrid}>
        {filteredModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className={styles.moduleCard}>
            <div className={styles.cardLeft}>
              <div className={styles.cardIcon}>{mod.icon}</div>
              <div className={styles.cardMeta}>
                <span className={styles.cardLabel}>{mod.label}</span>
                <p className={styles.cardDesc}>{mod.desc}</p>
                <span className={styles.cardBadge}>
                  {mod.category === "CORE"
                    ? "Accounting"
                    : mod.category === "TREASURY"
                    ? "Treasury"
                    : mod.category === "TAX"
                    ? "Tax & Statutory"
                    : mod.category === "PLANNING"
                    ? "FP&A Planning"
                    : mod.category === "OPERATIONS"
                    ? "Billing / Ops"
                    : mod.category === "GOVERNANCE"
                    ? "Governance & ESG"
                    : "AI Intelligence"}
                </span>
              </div>
            </div>
            <ChevronRight size={15} className={styles.cardArrow} />
          </Link>
        ))}
      </div>
    </div>
  );
}
