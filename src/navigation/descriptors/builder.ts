import { registerModule } from "@kannan19302/shared/module-registry";

/**
 * The Studio entry in P3's nav.
 *
 * It used to list four same-origin links — `/builder`, `/builder/erp`,
 * `/builder/web`, `/builder/manage` — none of which exist in this app. The
 * builder routes were in `web-studio` (:4005) and their components were in
 * `unierp-developer` (:4008), so every one of these menu items 404'd.
 *
 * P5 has since been merged into P8, and the Developer Platform is now the one
 * place a tenant builds anything: apps, forms, flows, dashboards, logic,
 * website content and sites. So this is a single link OUT, not a submenu that
 * pretends the Studio lives here. Building and running the business are
 * different platforms on purpose — P3 runs it, P8 builds it.
 */
const STUDIO_URL =
  process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:4008";

registerModule({
  slug: "builder",
  title: "Studio",
  icon: "Cpu",
  routeSegment: "builder",
  dashboardRoute: `${STUDIO_URL}/builder`,
  settingsRoute: undefined,
  nav: [
    {
      label: "Open Developer Platform",
      href: `${STUDIO_URL}/builder`,
      icon: "ExternalLink",
    },
  ],
});
