"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import {
  Building2,
  FileText,
  TrendingDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button, Card, useToast, Spinner } from "@kannan19302/ui";
import { RouteGuard } from "@kannan19302/framework";
import { apiGet } from "@/lib/api";

const FixedAssetsPage = dynamic(() => import("../advanced/fixed-assets/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const LeasesPage = dynamic(() => import("../advanced/leases/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

interface AssetsSummary {
  totalValue: number;
  assetCount: number;
  monthlyDepreciation: number;
  activeLeases: number;
}

const EMPTY_ASSETS_SUMMARY: AssetsSummary = {
  totalValue: 0,
  assetCount: 0,
  monthlyDepreciation: 0,
  activeLeases: 0,
};

const ASSETS_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/assets",
    icon: Building2,
    description: "Asset management summary",
  },
  {
    id: "fixed-assets",
    label: "Fixed Assets",
    href: "/finance/assets?tab=fixed-assets",
    icon: Building2,
    description: "Fixed asset register",
  },
  {
    id: "lease-accounting",
    label: "Lease Accounting",
    href: "/finance/assets?tab=lease-accounting",
    icon: FileText,
    description: "ASC 842 / IFRS 16 lease management",
  },
  {
    id: "depreciation",
    label: "Depreciation",
    href: "/finance/assets?tab=depreciation",
    icon: TrendingDown,
    description: "Depreciation schedules and runs",
  },
  {
    id: "disposals",
    label: "Disposals",
    href: "/finance/assets?tab=disposals",
    icon: Trash2,
    description: "Asset disposal and retirement",
  },
];

export default function AssetsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<AssetsSummary>(EMPTY_ASSETS_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || activeTab !== "overview") return;
    let cancelled = false;
    Promise.all([
      apiGet<
        Array<{ currentValue: number; usefulLifeYears: number; status: string }>
      >("/fixed-assets"),
      apiGet<{ activeLeases: number }>("/finance/leases/summary").catch(() => ({
        activeLeases: 0,
      })),
    ])
      .then(([assets, leaseSummary]: any) => {
        if (cancelled) return;
        const assetList = Array.isArray(assets) ? assets : (assets?.data ?? []);
        const activeAssets = assetList.filter((a: any) => a.status === "ACTIVE");
        const totalValue = assetList.reduce(
          (s: any, a: any) => s + Number(a.currentValue || 0),
          0,
        );
        const monthlyDepreciation = activeAssets.reduce((s: any, a: any) => {
          const value = Number(a.currentValue || 0);
          const life = Number(a.usefulLifeYears || 0);
          return s + (life > 0 ? value / life / 12 : 0);
        }, 0);
        setSummary({
          totalValue,
          assetCount: assetList.length,
          monthlyDepreciation,
          activeLeases: leaseSummary?.activeLeases ?? 0,
        });
        setSummaryError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load assets summary";
        setSummaryError(message);
        notifyError("Failed to load Assets summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, activeTab, notifyError]);

  return (
    <RouteGuard permission="finance.assets.read">
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load assets summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}

          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md">Fixed Assets &amp; Leases Hub</h2>
              <p className="ui-text-xs-muted">
                Capital asset register, depreciation computation, and ASC 842 / IFRS 16 lease management
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/assets?tab=lease-accounting")}
              >
                Lease Accounting
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/assets?tab=depreciation")}
              >
                Depreciation Run
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/finance/assets?tab=fixed-assets")}
              >
                Asset Register
              </Button>
            </div>
          </div>

          <div className="ui-grid-3">
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/assets?tab=fixed-assets")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Asset Value</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.totalValue.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.assetCount} assets registered · Click to view
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/assets?tab=depreciation")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Monthly Depreciation</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-warning)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.monthlyDepreciation.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">Straight-line method · Click for runs</p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/assets?tab=lease-accounting")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Active Leases</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.activeLeases}
                </p>
                <p className="ui-text-xs-muted">ASC 842 / IFRS 16 · Click to manage</p>
              </div>
            </Card>
          </div>
          <FixedAssetsPage />
        </div>
      )}
      {activeTab === "fixed-assets" && (
        <div className="ui-stack-4 ui-animate-in">
          <FixedAssetsPage />
        </div>
      )}
      {activeTab === "lease-accounting" && (
        <div className="ui-stack-4 ui-animate-in">
          <LeasesPage />
        </div>
      )}
      {activeTab === "depreciation" && (
        <div className="ui-stack-4 ui-animate-in">
          <FixedAssetsPage />
        </div>
      )}
      {activeTab === "disposals" && (
        <div className="ui-stack-4 ui-animate-in">
          <FixedAssetsPage />
        </div>
      )}
    </RouteGuard>
  );
}
