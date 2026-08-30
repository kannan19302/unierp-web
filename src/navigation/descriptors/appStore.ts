import { registerModule } from "@kannan19302/shared/module-registry";

registerModule({
  slug: "apps",
  title: "Applications",
  icon: "LayoutGrid",
  routeSegment: "apps",
  dashboardRoute: "/apps",
  settingsRoute: undefined,
  nav: [
    { label: "Workspace", href: "/apps", icon: "LayoutGrid" },
    { label: "Developer", href: "/apps/developer", icon: "Code2" },
  ],
});
