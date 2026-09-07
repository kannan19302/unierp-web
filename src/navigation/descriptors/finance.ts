import { registerModule } from "@kannan19302/shared/module-registry";

registerModule({
  slug: "finance",
  title: "Finance & Accounting",
  icon: "CreditCard",
  routeSegment: "finance",
  dashboardRoute: "/finance",
  settingsRoute: "/finance/settings",
  nav: [
    {
      label: "Executive & Core",
      isHeader: true,
      items: [
        { label: "Executive Dashboard", href: "/finance", icon: "Home" },
      ],
    },
    {
      label: "Ledger & Treasury",
      isHeader: true,
      items: [
        { label: "General Ledger", href: "/finance/gl", icon: "BookOpen" },
        { label: "Banking & Cash", href: "/finance/banking", icon: "Wallet" },
        { label: "Fixed Assets", href: "/finance/assets", icon: "Building2" },
      ],
    },
    {
      label: "Operations (AR / AP)",
      isHeader: true,
      items: [
        { label: "Accounts Receivable", href: "/finance/ar", icon: "FileText" },
        { label: "Accounts Payable", href: "/finance/ap", icon: "Building2" },
      ],
    },
    {
      label: "Compliance & FP&A",
      isHeader: true,
      items: [
        { label: "Tax & Compliance", href: "/finance/tax", icon: "Calculator" },
        {
          label: "Budget & Planning",
          href: "/finance/budget-planning",
          icon: "PieChart",
        },
        { label: "Financial Reports", href: "/finance/reports", icon: "BarChart3" },
      ],
    },
    {
      label: "Administration",
      isHeader: true,
      items: [
        { label: "Advanced Finance", href: "/finance/advanced", icon: "Sliders" },
        { label: "Financial Settings", href: "/finance/settings", icon: "Settings" },
      ],
    },
  ],
});
