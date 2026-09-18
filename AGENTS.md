<!-- UniERP-Agent-Protocol: 1.1.0 -->
# UniERP Repository Agent Entrypoint: Business Suite (`business-suite`)

This repository is one delivery unit in the UniERP polyrepo. Before analysis, planning, review, or mutation, every
AI agent from every provider MUST read and follow:

1. the workspace entrypoint at [`../AGENTS.md`](../AGENTS.md);
2. the canonical standard at
   [`../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md`](../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md);
3. the owning platform documents selected through
   [`../platform/docs/PLATFORM_CATALOG.md`](../platform/docs/PLATFORM_CATALOG.md).

If the workspace entrypoint or canonical standard is unavailable, the protocol bundle is incomplete. The agent
MUST stop before mutation and report the missing dependency. This bootstrap adds no weaker or conflicting rules.
Repository-specific additions may be appended below only when they narrow implementation behavior without
redefining platform ownership, security, contracts, or cross-platform standards.

---

## 1. Repository Identity & Mission

- **Repository**: `business-suite` (formerly `tenant-apps`)
- **Platform Owner**: `PLT-ERP` (Enterprise Resource Planning Platform)
- **Architectural Layer**: **Layer 4 (Application Presentation)**
- **Runtime Port**: `4002`
- **Mission**: Host the flagship multi-tenant **Enterprise Resource Planning (ERP) Suite** — providing business operations capabilities across General Ledger & Financials, Order Management, Inventory & Warehousing, Supply Chain, Procurement, CRM & Sales, Human Resources & Payroll, and Analytics.

---

## 2. Zero-Trust Security & Tenant Scoping

1. **Strict Server-Side Tenancy**:
   - Every API call must include valid tenant JWT bearer credentials.
   - Client-side code must NEVER assume authority or bypass RLS.
2. **Explicit RBAC Enforcement**:
   - Route and action permissions follow domain standards: `finance.gl.*`, `inventory.stock.*`, `sales.order.*`, `procurement.po.*`.
   - UI elements (buttons, edit actions, approvals) must conditionally reflect permissions while APIs enforce fail-closed rejection.
3. **Data Integrity & Auditability**:
   - Financial transactions, invoice approvals, and stock movements are immutable and auditable. Never implement silent client-side record deletions.
4. **Secret Isolation**:
   - Zero hardcoded tokens or API credentials in client bundles.

---

## 3. Industrial Software Engineering Standards (Anti-Vibe-Coding)

1. **Strict Static Typing**:
   - `tsc --noEmit` must pass with 0 errors.
   - Zero unverified `any` casts in module definitions (`src/modules/*`) or navigation schemas.
   - Financial values must use stringified exact decimal representations to prevent JavaScript 64-bit IEEE-754 float rounding errors.
2. **Zero-Mock Policy**:
   - All dashboards, grids, and summary cards must fetch real backend entities via `@tanstack/react-query` or server components.
   - Prohibited: Mock fallback arrays in `catch` blocks, fake graph sparklines, dummy static metrics.
   - Always display truthful empty states (`FilteredEmptyState`) or real error states (`ErrorState`).
3. **Single-Source Shell Navigation**:
   - `ContextBar` (`StrataBar`) in `app/(dashboard)/layout.tsx` is the sole breadcrumb navigation component.
   - Sub-modules must not inject duplicate horizontal tab bars or secondary breadcrumbs.
4. **Strata DL 2.0 Architectural Compliance**:
   - High-density data workspaces (`DataWorkspace`, `TransactionWorkspace`, `RecordShell`).
   - Use `data-density="compact"` for maximum professional enterprise information density.
   - Zero raw hex values; 100% adherence to `@kannan19302/ui` tokens.
   - WCAG 2.2 AA accessibility: full keyboard navigation, accessible tables, and screen-reader support.

---

## 4. Verification Gates & Mandatory Toolchain

Before declaring any cycle `DONE`, run and verify:

```powershell
pnpm typecheck              # Strict TypeScript verification
pnpm lint                   # ESLint standards check
pnpm test                   # Vitest unit test suite
node scripts/check-layer.mjs # Canonical Layer Gate enforcement
```
