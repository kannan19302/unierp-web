---
name: tenant-apps-standards
description: Authoritative standards, architectural boundaries, coding anatomy, and verification gates for tenant-apps.
version: 1.0.0
author: UniERP Architecture Governance
---

# UniERP Tenant Business Suite (Dashboard ERP) — AI Agent Guidance & Project Skill

This skill governs all code modification, analysis, and testing within `tenant-apps` (**Layer L4: Presentation**). Every AI agent and software engineer working in this repository MUST follow these rules without exception.

---

## 🏛️ 1. Architectural Position & Boundary Rules

- **Repository**: `tenant-apps`
- **Layer**: **L4 (Presentation)**
- **Package Identity**: `@kannan19302/web`
- **Allowed Inbound Callers**: Tenant business users, accountants, inventory managers, HR
- **Allowed Outbound Dependencies**: @kannan19302/ui (L1); @kannan19302/contracts (L0); @kannan19302/auth (L1); L3 via HTTP/SDK
- **STRICTLY FORBIDDEN DEPENDENCIES**:
  - ❌ Direct database ORM (@kannan19302/database)
  - ❌ Bypassing tenant scope
  - ❌ L5-L7

> **Unidirectional Rule**: You may ONLY import published artifacts from strictly lower layers. Sibling imports within the same layer are prohibited unless mediated through L0 contracts.

---

## 🎯 2. The Platform Goal & Repository Mandate

> **Platform North Star Goal**:  
> "Build the world's premier autonomous, multi-tenant Enterprise SaaS Operating System: 100% Zero-Trust Multi-Tenant Isolation, Absolute Decimal(19,4) Numeric Precision, Atomic Durable Audit Logging, Sub-100ms P99 Latency, and Strata Workbench High-Density UI."

### Repository Responsibility Mandate
Primary ERP application suite (810 pages across 40+ business modules) providing operational workspaces powered by Strata Workbench.

---

## 📐 3. Repository-Specific Coding Standards

### Mandatory Tenant Apps Standards
1. **Single-Source Shell Navigation & Zero Header Duplication (NON-NEGOTIABLE)**:
   - `ContextBar` (`StrataBar`) in `app/(dashboard)/layout.tsx` is the ONE AND ONLY breadcrumb navigation element across the dashboard.
   - `<PageHeader>` MUST NEVER receive a `breadcrumbs` prop or JSX attribute.
   - Module layout files (`app/(dashboard)/<module>/layout.tsx`) MUST NEVER render `ModuleTabLayout`, duplicate module banners, or horizontal tabs. All module navigation belongs exclusively to `AppSidebar`.
2. **Strict Zero-Mock Mandate (Production-Grade Telemetry Only)**:
   - NO hardcoded business metric values (e.g. `$1,428,500`, `148 employees`, `42% Win Rate`).
   - NO fallback mock registries in `catch` blocks (e.g. `setError("Serving local mock fallback registry.")` or dummy objects like "Oscorp" or "Vibranium").
   - On error or empty results, state MUST be set to genuine empty values (`[]`, `null`, `0`) and UI MUST display standard empty states (`ListPageTemplate` emptyTitle/emptyDescription) or explicit error banners with retry buttons.
3. **Strata DL 2.0 Architectural Compliance**:
   - Use design system tokens (`var(--color-*)`, `var(--space-*)`). Zero hardcoded hex colors outside token source files.
   - Density Scaling: Financial, inventory, manufacturing, and supply chain views must use `data-density="ultra-compact"` (24px row height). CRM, analytics, HR, procurement, and projects views must use `data-density="compact"` (32px row height).
   - Canonical Floorplans: Use standard Strata floorplans (`DataWorkspace`, `TransactionWorkspace`, `RecordShell`, `OperationsFloorplan`).

---

## 🛡️ 4. Mandatory Pre-Commit Verification Gate

Before submitting or reporting completion on any change in this repository, run and verify:

```bash
pnpm typecheck
```

All tests must pass with 0 failures and 0 type errors.
