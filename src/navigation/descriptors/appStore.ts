import { registerModule } from "@kannan19302/shared/module-registry";

registerModule({
  slug: "app-store",
  title: "App Store",
  icon: "Store",
  routeSegment: "apps",
  dashboardRoute: "/apps/store",
  settingsRoute: undefined,
  nav: [
    { label: "Browse", href: "/apps/store", icon: "Store" },
    { label: "Installed", href: "/apps", icon: "CheckSquare" },
    { label: "Developer", href: "/apps/developer", icon: "Code2" },
  ],
});
