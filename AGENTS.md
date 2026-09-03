<!-- UniERP-Agent-Protocol: 1.1.0 -->
# UniERP Repository Agent Entrypoint

This repository is one delivery unit in the UniERP polyrepo. Before analysis, planning, review, or mutation, every
AI agent from every provider MUST read and follow:

1. the workspace entrypoint at [`../AGENTS.md`](../AGENTS.md);
2. the canonical standard at
   [`../unierp-platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md`](../unierp-platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md);
3. the owning platform documents selected through
   [`../unierp-platform/docs/PLATFORM_CATALOG.md`](../unierp-platform/docs/PLATFORM_CATALOG.md).

If the workspace entrypoint or canonical standard is unavailable, the protocol bundle is incomplete. The agent
MUST stop before mutation and report the missing dependency. This bootstrap adds no weaker or conflicting rules.
Repository-specific additions may be appended below only when they narrow implementation behavior without
redefining platform ownership, security, contracts, or cross-platform standards.

---

## Tenant Applications — Architecture Governance Standards (10/10 Standard)

Every AI agent and software engineer working in this repository MUST read and adhere to the following standards under `.agents/rules/` before designing, implementing, or modifying code:

1. **Tenant Apps Governance & UI Architecture:** [`.agents/rules/TENANT_APPS_GOVERNANCE_STANDARDS.md`](.agents/rules/TENANT_APPS_GOVERNANCE_STANDARDS.md)
   - **Single-Source Shell Navigation:** `ContextBar` (`StrataBar`) in `app/(dashboard)/layout.tsx` is the ONE AND ONLY breadcrumb navigation element across the dashboard. Pages MUST NOT pass `breadcrumbs` to `PageHeader`. Module layouts MUST NOT inject `ModuleTabLayout` or duplicate horizontal tabs.
   - **Strict Zero-Mock Mandate:** All views, cards, and charts must display real database/API data only. Hardcoded metrics, fallback mock registries in `catch` blocks, and dummy mock entities are strictly prohibited. Always render truthful empty states or real error banners.
   - **Strata DL 2.0 Architectural Compliance:** Mandatory `data-density="compact"` or `ultra-compact`. Mandatory canonical floorplans (`DataWorkspace`, `TransactionWorkspace`, `RecordShell`, `OperationsFloorplan`). Zero raw hex literals outside design tokens.

