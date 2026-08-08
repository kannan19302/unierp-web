import { registerModule } from "@kannan19302/shared/module-registry";

registerModule({
  slug: "ecommerce",
  title: "E-Commerce",
  icon: "Store",
  routeSegment: "ecommerce",
  dashboardRoute: "/ecommerce",
  settingsRoute: undefined,
  nav: [
    { label: "Storefront Settings", href: "/ecommerce", icon: "Settings" },
    { label: "Categories", href: "/ecommerce/categories", icon: "Layers" },
    { label: "Product Listings", href: "/ecommerce/listings", icon: "Package" },
  ],
});
