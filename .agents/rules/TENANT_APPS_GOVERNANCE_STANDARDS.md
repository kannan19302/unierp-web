<!-- UniERP-Agent-Protocol: 1.1.0 -->
# Tenant Applications — Architectural Governance Standards (10/10 Standard)

Every AI agent and software engineer working in `tenant-apps` (`@kannan19302/web`) MUST read and strictly adhere to these governance standards before designing, implementing, refactoring, or reviewing any frontend code.

---

## 1. Single-Source Shell Navigation & Zero Header Duplication (Non-Negotiable)

### 1.1 Canonical Hierarchy of Shell vs. Page Chrome
The frontend architecture enforces a strict division of responsibility between the root layout shell and interior pages:

```
+------------------------------------------------------------------------------------+
| AppHeader (Top Shell) — Global Search, Tenant Switcher, Profile, System Status     |
+------------------------------------------------------------------------------------+
| AppSidebar (Left Shell)       | ContextBar (Top of Content)                       |
|   Module Nav Descriptors      |   Mono breadcrumb path: [Tenant] / [Module] / ...  |
|   Hierarchical section tree   +----------------------------------------------------+
|                               | PageHeader (Page Level)                            |
|                               |   Page Title, Description, Action Buttons ONLY     |
|                               |   *NO BREADCRUMBS JSX ATTRIBUTE ALLOWED*           |
|                               +----------------------------------------------------+
|                               | Page Content (Workspace Floorplan)                 |
|                               |   DataWorkspace / TransactionWorkspace / etc.      |
+-------------------------------+----------------------------------------------------+
```

### 1.2 Prohibitions:
1. **NO `breadcrumbs` Prop on `PageHeader`**: The `ContextBar` (`StrataBar`) in `app/(dashboard)/layout.tsx` is the ONE AND ONLY breadcrumb navigation element across the entire dashboard. Passing `breadcrumbs={[...]}` to `<PageHeader>` is strictly forbidden and causes redundant vertical screen clutter.
2. **NO `ModuleTabLayout` or Sub-Page Horizontal Tabs in Module Layouts**:
   - Module layout files (`app/(dashboard)/<module>/layout.tsx`) MUST NOT wrap children in `ModuleTabLayout` or inject redundant secondary horizontal tab bars or duplicate module headers.
   - All navigation between module features belongs exclusively to the left `AppSidebar`, driven by canonical navigation descriptors in `src/navigation/descriptors/<module>.ts`.
   - Module layouts must only configure layout-level constraints such as `data-density` containers:
     ```tsx
     export default function ModuleLayout({ children }: { children: React.ReactNode }) {
       return <div data-density="compact">{children}</div>;
     }
     ```

---

## 2. Strict Zero-Mock Mandate (Production-Grade Telemetry Only)

### 2.1 Reality Over Fiction
This platform operates exclusively on live, verifiable database and API telemetry. Under no circumstances may AI agents or human developers invent hardcoded numbers, fake mock records, or fictional fallback registries.

### 2.2 Prohibitions:
1. **NO Hardcoded Telemetry or Fictional Numbers**:
   - Do NOT hardcode arbitrary metric values (e.g., `const baseRevenue = 1428500`, `employeeCount = 148`, `pipeline = 3120000`).
   - Every metric card and chart must be wired to real endpoints (`/finance/dashboard`, `/sales/analytics/kpi`, `/hr/employees`, `/supply-chain/analytics/dashboard`).
   - If an account is freshly provisioned and has no transactions, the UI MUST truthfully display `$0`, `0`, or empty telemetry.
2. **NO Fallback Mock Registries in `catch` Blocks**:
   - Intercepting network or API errors with `catch` blocks that assign dummy arrays (e.g. "Oscorp Chemical Supply", "Refined Vibranium Alloy Ingot") or notices such as `setError("Serving local mock fallback registry.")` is strictly prohibited.
   - If an API request fails, the component MUST:
     1. Set state to a genuine empty value (`[]`, `null`, `0`).
     2. Report a clear, user-facing error message (e.g. `setError(err?.message || "Failed to load records.")`).
     3. Provide a retry action button or let `ListPageTemplate` render its standard empty state (`emptyTitle`, `emptyDescription`).

---

## 3. Strata Design Language (DL 2.0) Architecture & Floorplans

### 3.1 Density Governance
- Financial, inventory, manufacturing, supply chain, and warehouse views must apply `data-density="ultra-compact"`.
- CRM, analytics, HR, procurement, and projects views must apply `data-density="compact"`.
- Never use loose, ad-hoc inline styles for spacing or sizing.

### 3.2 Canonical Workspace Floorplans
All dashboard pages MUST implement one of the 4 canonical Strata floorplans:
1. **DataWorkspace**: For high-density data management, inventory registers, ledgers, and transactions.
2. **TransactionWorkspace**: For multi-step business transactions, order fulfillment, and voucher entries.
3. **RecordShell**: For master data inspection, customer 360 views, and deep drilldown inspectors.
4. **OperationsFloorplan**: For real-time telemetry dashboards, shop-floor execution, and logistics tracking.

### 3.3 Token Compliance (Zero Raw Hex Literals)
- All colors MUST resolve via Design Tokens: `var(--color-brand)`, `var(--color-surface-elevated)`, `var(--color-text-primary)`, `var(--color-border)`.
- CI token check (`pnpm run check:tokens`) enforces 0 raw hex literals outside design system sources.
