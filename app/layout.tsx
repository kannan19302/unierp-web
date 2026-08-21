import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";
import "@kannan19302/ui/styles";
// The CSS-MODULE bundle — a different file from "…/styles" above, which is only
// tokens + layers. /apps renders <AppWizardGrid>, whose styling moved into
// shell/wizard-grid.module.css; without this it renders unstyled. Same pairing
// provider-admin-os already uses.
import "@kannan19302/ui/styles.css";
// Imported from their subpaths, not the root barrel.
//
// The root barrel re-exports these modules with `export *`, and a star
// re-export does not survive the React Server Components client boundary: the
// names are lost and the import arrives as `undefined`, which React reports as
// "Element type is invalid ... but got: undefined" with no clue which element.
// ThemeProvider happened to work because it is an EXPLICIT named re-export in
// the barrel; ToastProvider is star-exported and was undefined.
//
// Subpath imports address the client module directly, so nothing crosses a
// star re-export. That is what the subpath exports added in § 7.2 are for.
import { ThemeProvider } from "@kannan19302/ui/theme";
import { ToastProvider } from "@kannan19302/ui/notifications";
import { QueryProvider } from "@/lib/query-provider";
import { AppFrameworkProvider } from "@/lib/framework-provider";
import { AuthShell } from "@/components/AuthShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "UniERP — Universal Enterprise Resource Planning",
    template: "%s | UniERP",
  },
  description:
    "A fully-packed, composable, industry-agnostic Enterprise Resource Planning system.",
  keywords: ["ERP", "enterprise", "resource planning", "business management"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider defaultSetting="light">
          <AuthShell>
            <QueryProvider>
              <AppFrameworkProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </AppFrameworkProvider>
            </QueryProvider>
          </AuthShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
