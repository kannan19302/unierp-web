/**
 * Comprehensive index of all searchable application pages across UniERP.
 * Enables instant in-sidebar cross-application navigation following top enterprise ERP standards.
 */

export interface NavigationSearchItem {
  name: string;
  href: string;
  module: string;
  section?: string;
  keywords?: string[];
}

export const ALL_APPLICATION_PAGES: NavigationSearchItem[] = [
  {
    "name": "Analytics & Cockpit",
    "href": "/analytics",
    "module": "Analytics",
    "section": "Analytics",
    "keywords": [
      "kpi",
      "bi",
      "metrics",
      "charts"
    ]
  },
  {
    "name": "Finance & Accounting",
    "href": "/finance",
    "module": "Finance",
    "section": "Finance",
    "keywords": [
      "accounting",
      "ledger",
      "gl",
      "ar",
      "ap",
      "money"
    ]
  },
  {
    "name": "Human Resources",
    "href": "/hr",
    "module": "Human Resources",
    "section": "HR",
    "keywords": [
      "staff",
      "employees",
      "payroll",
      "people",
      "jobs"
    ]
  },
  {
    "name": "CRM & Sales",
    "href": "/crm",
    "module": "CRM",
    "section": "CRM",
    "keywords": [
      "sales",
      "leads",
      "deals",
      "contacts",
      "accounts",
      "pipeline"
    ]
  },
  {
    "name": "Inventory & Stock",
    "href": "/inventory",
    "module": "Inventory",
    "section": "Inventory",
    "keywords": [
      "stock",
      "warehouse",
      "items",
      "products",
      "skus"
    ]
  },
  {
    "name": "Procurement",
    "href": "/procurement",
    "module": "Procurement",
    "section": "Procurement",
    "keywords": [
      "purchase",
      "po",
      "vendors",
      "suppliers",
      "rfq"
    ]
  },
  {
    "name": "Sales & Orders",
    "href": "/sales",
    "module": "Sales",
    "section": "Sales",
    "keywords": [
      "orders",
      "invoices",
      "quotations",
      "customers"
    ]
  },
  {
    "name": "Supply Chain",
    "href": "/supply-chain",
    "module": "Supply Chain",
    "section": "Supply Chain",
    "keywords": [
      "logistics",
      "shipping",
      "freight",
      "routes",
      "tracking"
    ]
  },
  {
    "name": "Project Management",
    "href": "/projects",
    "module": "Projects",
    "section": "Projects",
    "keywords": [
      "tasks",
      "milestones",
      "gantt",
      "agile",
      "sprints"
    ]
  },
  {
    "name": "Manufacturing",
    "href": "/manufacturing",
    "module": "Manufacturing",
    "section": "Manufacturing",
    "keywords": [
      "production",
      "bom",
      "work orders",
      "shop floor"
    ]
  },
  {
    "name": "Workflow Automation",
    "href": "/workflow",
    "module": "Workflows",
    "section": "Workflows",
    "keywords": [
      "automation",
      "approvals",
      "bpmn",
      "rules"
    ]
  },
  {
    "name": "AI Copilot",
    "href": "/ai",
    "module": "AI",
    "section": "AI",
    "keywords": [
      "chat",
      "assistant",
      "generate",
      "copilot",
      "llm"
    ]
  },
  {
    "name": "Drive & Cloud Storage",
    "href": "/drive",
    "module": "Drive",
    "section": "Drive",
    "keywords": [
      "files",
      "documents",
      "storage",
      "folders"
    ]
  },
  {
    "name": "Connect & Team Chat",
    "href": "/connect",
    "module": "Connect",
    "section": "Connect",
    "keywords": [
      "messages",
      "chat",
      "channels",
      "communication"
    ]
  },
  {
    "name": "POS & Retail",
    "href": "/pos",
    "module": "POS",
    "section": "POS",
    "keywords": [
      "register",
      "cashier",
      "terminal",
      "retail",
      "store"
    ]
  },
  {
    "name": "Healthcare Management",
    "href": "/healthcare",
    "module": "Healthcare",
    "section": "Healthcare",
    "keywords": [
      "patients",
      "clinic",
      "medical",
      "doctor",
      "prescriptions"
    ]
  },
  {
    "name": "Education System",
    "href": "/education",
    "module": "Education",
    "section": "Education",
    "keywords": [
      "students",
      "courses",
      "school",
      "classes",
      "teachers"
    ]
  },
  {
    "name": "Real Estate & Property",
    "href": "/real-estate",
    "module": "Real Estate",
    "section": "Real Estate",
    "keywords": [
      "properties",
      "units",
      "leases",
      "tenants",
      "rent"
    ]
  },
  {
    "name": "Field Service Management",
    "href": "/field-service",
    "module": "Field Service",
    "section": "Field Service",
    "keywords": [
      "technicians",
      "work orders",
      "dispatch",
      "service"
    ]
  },
  {
    "name": "Blockchain Explorer",
    "href": "/blockchain",
    "module": "Blockchain",
    "section": "Blockchain",
    "keywords": [
      "crypto",
      "ledger",
      "audit",
      "contracts",
      "verify"
    ]
  },
  {
    "name": "Platform Settings & SaaS Portal",
    "href": "/saas/portal",
    "module": "Platform",
    "section": "Settings",
    "keywords": [
      "tenant",
      "admin",
      "security",
      "users",
      "billing"
    ]
  },
  {
    "name": "General Ledger",
    "href": "/finance/gl",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": [
      "gl",
      "journal",
      "chart of accounts"
    ]
  },
  {
    "name": "Accounts Receivable",
    "href": "/finance/ar",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": []
  },
  {
    "name": "Accounts Payable",
    "href": "/finance/ap",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": []
  },
  {
    "name": "Banking",
    "href": "/finance/banking",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": []
  },
  {
    "name": "Assets",
    "href": "/finance/assets",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": []
  },
  {
    "name": "Tax",
    "href": "/finance/tax",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": [
      "vat",
      "gst",
      "compliance"
    ]
  },
  {
    "name": "Reports",
    "href": "/finance/reports",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": [
      "analytics",
      "statements",
      "summary"
    ]
  },
  {
    "name": "Settings",
    "href": "/finance/settings",
    "module": "Finance & Accounting",
    "section": "Finance & Accounting",
    "keywords": [
      "configuration",
      "setup",
      "preferences"
    ]
  },
  {
    "name": "Goals & OKRs",
    "href": "/hr/advanced/goals",
    "module": "Human Resources",
    "section": "Human Resources",
    "keywords": []
  },
  {
    "name": "Skills Matrix",
    "href": "/hr/advanced/skills",
    "module": "Human Resources",
    "section": "Human Resources",
    "keywords": []
  },
  {
    "name": "Leads",
    "href": "/crm/leads",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Customers",
    "href": "/crm/customers",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Contacts",
    "href": "/crm/contacts",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Contracts",
    "href": "/crm/contracts",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Quotations",
    "href": "/crm/quotations",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Price Books",
    "href": "/crm/price-books",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Cases & SLA",
    "href": "/crm/cases",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Territories",
    "href": "/crm/territories",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Commissions",
    "href": "/crm/commissions",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Forecasting",
    "href": "/crm/forecasting",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Workflows & Rules",
    "href": "/crm/workflows",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": []
  },
  {
    "name": "Settings",
    "href": "/crm/settings",
    "module": "CRM & Sales",
    "section": "CRM & Sales",
    "keywords": [
      "configuration",
      "setup",
      "preferences"
    ]
  },
  {
    "name": "Kits & Assembly",
    "href": "/inventory/kits",
    "module": "Inventory & Stock",
    "section": "Inventory & Stock",
    "keywords": []
  },
  {
    "name": "Hazmat",
    "href": "/inventory/hazmat",
    "module": "Inventory & Stock",
    "section": "Inventory & Stock",
    "keywords": []
  },
  {
    "name": "Supplier Portal",
    "href": "/procurement/portal",
    "module": "Procurement",
    "section": "Procurement",
    "keywords": []
  },
  {
    "name": "Sales Orders",
    "href": "/sales/orders",
    "module": "Sales & Orders",
    "section": "Sales & Orders",
    "keywords": [
      "sales",
      "purchase",
      "fulfillment"
    ]
  },
  {
    "name": "CPQ Pricing",
    "href": "/sales/cpq",
    "module": "Sales & Orders",
    "section": "Sales & Orders",
    "keywords": []
  },
  {
    "name": "Fulfillment & SLAs",
    "href": "/sales/fulfillment",
    "module": "Sales & Orders",
    "section": "Sales & Orders",
    "keywords": []
  },
  {
    "name": "Delivery Notes",
    "href": "/sales/delivery-notes",
    "module": "Sales & Orders",
    "section": "Sales & Orders",
    "keywords": []
  },
  {
    "name": "Customer Returns",
    "href": "/sales/returns",
    "module": "Sales & Orders",
    "section": "Sales & Orders",
    "keywords": []
  },
  {
    "name": "Containers",
    "href": "/supply-chain/containers",
    "module": "Supply Chain",
    "section": "Supply Chain",
    "keywords": []
  },
  {
    "name": "Customs",
    "href": "/supply-chain/customs",
    "module": "Supply Chain",
    "section": "Supply Chain",
    "keywords": []
  },
  {
    "name": "Portfolio Hub",
    "href": "/projects/portfolios",
    "module": "Project Management",
    "section": "Project Management",
    "keywords": []
  },
  {
    "name": "Client Portal",
    "href": "/projects/client-portal",
    "module": "Project Management",
    "section": "Project Management",
    "keywords": []
  },
  {
    "name": "MRP Replenishment",
    "href": "/manufacturing/mrp",
    "module": "Manufacturing",
    "section": "Manufacturing",
    "keywords": []
  },
  {
    "name": "Shared with me",
    "href": "/drive?view=shared",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Recent",
    "href": "/drive?view=recent",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Starred",
    "href": "/drive?view=starred",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Trash",
    "href": "/drive?view=trash",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Storage Quotas",
    "href": "/drive/quotas",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Media Conversion",
    "href": "/drive/media",
    "module": "Drive",
    "section": "Drive",
    "keywords": []
  },
  {
    "name": "Files Explorer",
    "href": "/storage",
    "module": "Files & Storage",
    "section": "Files & Storage",
    "keywords": []
  },
  {
    "name": "POS Orders",
    "href": "/pos/orders",
    "module": "POS & Retail",
    "section": "POS & Retail",
    "keywords": [
      "sales",
      "purchase",
      "fulfillment"
    ]
  },
  {
    "name": "Customers & Loyalty",
    "href": "/pos/customers",
    "module": "POS & Retail",
    "section": "POS & Retail",
    "keywords": []
  },
  {
    "name": "Sales Analytics",
    "href": "/pos/reports",
    "module": "POS & Retail",
    "section": "POS & Retail",
    "keywords": []
  },
  {
    "name": "Layaway Plans",
    "href": "/pos/layaway",
    "module": "POS & Retail",
    "section": "POS & Retail",
    "keywords": []
  },
  {
    "name": "Receipt Designer",
    "href": "/pos/designer",
    "module": "POS & Retail",
    "section": "POS & Retail",
    "keywords": []
  },
  {
    "name": "Storefront Settings",
    "href": "/ecommerce",
    "module": "E-Commerce",
    "section": "E-Commerce",
    "keywords": [
      "configuration",
      "setup",
      "preferences"
    ]
  },
  {
    "name": "Categories",
    "href": "/ecommerce/categories",
    "module": "E-Commerce",
    "section": "E-Commerce",
    "keywords": []
  },
  {
    "name": "Approval Workflows",
    "href": "/workflows",
    "module": "Workflows",
    "section": "Workflows",
    "keywords": []
  },
  {
    "name": "Timetable",
    "href": "/education/timetable",
    "module": "Education",
    "section": "Education",
    "keywords": []
  },
  {
    "name": "Grade Book",
    "href": "/education/grades",
    "module": "Education",
    "section": "Education",
    "keywords": []
  },
  {
    "name": "Library",
    "href": "/education/library",
    "module": "Education",
    "section": "Education",
    "keywords": []
  },
  {
    "name": "FHIR / SMART",
    "href": "/healthcare/fhir",
    "module": "Healthcare",
    "section": "Healthcare",
    "keywords": []
  },
  {
    "name": "Reports",
    "href": "/healthcare/reports",
    "module": "Healthcare",
    "section": "Healthcare",
    "keywords": [
      "analytics",
      "statements",
      "summary"
    ]
  },
  {
    "name": "Leases",
    "href": "/real-estate/leases",
    "module": "Real Estate",
    "section": "Real Estate",
    "keywords": []
  },
  {
    "name": "Reports",
    "href": "/real-estate/reports",
    "module": "Real Estate",
    "section": "Real Estate",
    "keywords": [
      "analytics",
      "statements",
      "summary"
    ]
  },
  {
    "name": "Dashboard",
    "href": "/communication",
    "module": "Connect",
    "section": "Connect",
    "keywords": []
  },
  {
    "name": "Meetings",
    "href": "/communication/meetings",
    "module": "Connect",
    "section": "Connect",
    "keywords": []
  },
  {
    "name": "Applications Suite",
    "href": "/apps",
    "module": "Connect",
    "section": "Connect",
    "keywords": []
  },
  {
    "name": "API Platform Hub",
    "href": "/saas/api-keys",
    "module": "Connect",
    "section": "Connect",
    "keywords": []
  },
  {
    "name": "Import / Export Hub",
    "href": "/saas/exports",
    "module": "Connect",
    "section": "Connect",
    "keywords": []
  },
  {
    "name": "Dashboard",
    "href": "/super-admin",
    "module": "Super Admin",
    "section": "Super Admin",
    "keywords": []
  },
  {
    "name": "Tenants",
    "href": "/super-admin/tenants",
    "module": "Super Admin",
    "section": "Super Admin",
    "keywords": []
  },
  {
    "name": "Admin Users",
    "href": "/super-admin/admins",
    "module": "Super Admin",
    "section": "Super Admin",
    "keywords": []
  },
  {
    "name": "System Health",
    "href": "/super-admin/health",
    "module": "Super Admin",
    "section": "Super Admin",
    "keywords": []
  },
  {
    "name": "Studio Home",
    "href": "/builder",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "App Studio Overview",
    "href": "/builder/erp",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Business Logic",
    "href": "/builder/erp/logic",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Data & Import",
    "href": "/builder/erp/data",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Web Studio Overview",
    "href": "/builder/web",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Sites",
    "href": "/builder/web/sites",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Blog Posts",
    "href": "/builder/web/blog",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Asset Manager",
    "href": "/builder/web/assets",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Templates",
    "href": "/builder/web/templates",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "SEO Manager",
    "href": "/builder/web/seo",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Orders",
    "href": "/builder/web/orders",
    "module": "Studio",
    "section": "Studio",
    "keywords": [
      "sales",
      "purchase",
      "fulfillment"
    ]
  },
  {
    "name": "Developer Portal",
    "href": "/apps/developer",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Manage Overview",
    "href": "/builder/manage",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Run Logs",
    "href": "/builder/manage/logs",
    "module": "Studio",
    "section": "Studio",
    "keywords": []
  },
  {
    "name": "Asset Registry",
    "href": "/fixed-assets",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Disposals",
    "href": "/fixed-assets/disposals",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Insurance",
    "href": "/fixed-assets/insurance",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Groups",
    "href": "/fixed-assets/groups",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Audits",
    "href": "/fixed-assets/audits",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Transfers",
    "href": "/fixed-assets/transfers",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": []
  },
  {
    "name": "Reports",
    "href": "/fixed-assets/reports",
    "module": "Fixed Assets",
    "section": "Fixed Assets",
    "keywords": [
      "analytics",
      "statements",
      "summary"
    ]
  },
  {
    "name": "Reports",
    "href": "/reporting",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": [
      "analytics",
      "statements",
      "summary"
    ]
  },
  {
    "name": "Templates",
    "href": "/reporting/templates",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Scheduled Jobs",
    "href": "/reporting/jobs",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Exports",
    "href": "/reporting/exports",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Viewer",
    "href": "/reporting/viewer",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Drilldown",
    "href": "/reporting/drilldown",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Bookmarks",
    "href": "/reporting/bookmarks",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Alerts",
    "href": "/reporting/alerts",
    "module": "Reporting",
    "section": "Reporting",
    "keywords": []
  },
  {
    "name": "Locales",
    "href": "/localization",
    "module": "Localization",
    "section": "Localization",
    "keywords": []
  },
  {
    "name": "Glossary",
    "href": "/localization/glossary",
    "module": "Localization",
    "section": "Localization",
    "keywords": []
  },
  {
    "name": "Context",
    "href": "/localization/context",
    "module": "Localization",
    "section": "Localization",
    "keywords": []
  },
  {
    "name": "Regions",
    "href": "/localization/regions",
    "module": "Localization",
    "section": "Localization",
    "keywords": []
  },
  {
    "name": "Fallback",
    "href": "/localization/fallback",
    "module": "Localization",
    "section": "Localization",
    "keywords": []
  },
  {
    "name": "Subscriptions",
    "href": "/subscriptions",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  },
  {
    "name": "Plans",
    "href": "/subscriptions/plans",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  },
  {
    "name": "Tiers",
    "href": "/subscriptions/tiers",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  },
  {
    "name": "Dunning",
    "href": "/subscriptions/dunning",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  },
  {
    "name": "Usage",
    "href": "/subscriptions/usage",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  },
  {
    "name": "Migrations",
    "href": "/subscriptions/migrations",
    "module": "Subscriptions",
    "section": "Subscriptions",
    "keywords": []
  }
];
