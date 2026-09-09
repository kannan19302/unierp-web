"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";
import { Card, Button, Badge, DataTable } from "@kannan19302/ui";
import { Search, Calculator, Plus } from "lucide-react";

interface JurisdictionItem {
  id: string;
  country: string;
  state: string;
  county: string;
  city: string;
  postalCode: string;
  stateRatePct: number;
  countyRatePct: number;
  cityRatePct: number;
  specialDistrictRatePct: number;
  combinedRatePct: number;
  hasTenantNexus: boolean;
  status: string;
}

interface TaxLookupResult {
  jurisdictionId?: string;
  country: string;
  state: string;
  county: string;
  city: string;
  postalCode: string;
  taxCategory: string;
  taxableAmount: number;
  stateRatePct: number;
  countyRatePct: number;
  cityRatePct: number;
  specialDistrictRatePct: number;
  effectiveRatePct: number;
  stateTaxAmount: number;
  countyTaxAmount: number;
  cityTaxAmount: number;
  specialDistrictTaxAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  isOverridden: boolean;
}

export function TaxJurisdictionLookupTab() {
  const client = useApiClient();
  const [postalCode, setPostalCode] = useState("90210");
  const [state, setState] = useState("CA");
  const [taxCategory, setTaxCategory] = useState("PHYSICAL_GOODS");
  const [taxableAmount, setTaxableAmount] = useState<number>(1000);
  const [lookupResult, setLookupResult] = useState<TaxLookupResult | null>(
    null,
  );
  const [jurisdictions, setJurisdictions] = useState<JurisdictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideState, setOverrideState] = useState("");
  const [overrideThreshold, setOverrideThreshold] = useState("100000");

  const handleLookup = async () => {
    setLoading(true);
    setLookupError(null);
    try {
      const res = await client.post<TaxLookupResult>(
        "/advanced-finance/tax/lookup-rate",
        {
          postalCode,
          state,
          taxCategory,
          taxableAmount: Number(taxableAmount),
        },
      );
      if (res) setLookupResult(res);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to calculate tax rate for this jurisdiction";
      setLookupError(msg);
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchJurisdictions = async () => {
    try {
      const res = await client.get<JurisdictionItem[]>(
        "/advanced-finance/tax/jurisdiction-overrides",
      );
      if (Array.isArray(res)) setJurisdictions(res);
    } catch {
      setJurisdictions([]);
    }
  };

  useEffect(() => {
    handleLookup();
    fetchJurisdictions();
  }, []);

  const handleCreateOverride = async () => {
    if (!overrideState) return;
    try {
      await client.post("/advanced-finance/tax/jurisdiction-overrides", {
        state: overrideState,
        revenueThreshold: Number(overrideThreshold),
      });
      setShowOverrideModal(false);
      fetchJurisdictions();
    } catch {
      setShowOverrideModal(false);
    }
  };

  return (
    <div className="ui-stack-4 ui-animate-in">
      <div className="ui-card p-6 border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Real-Time Multi-Jurisdiction Tax Lookup
            </h3>
          </div>
          <Button onClick={() => setShowOverrideModal(true)} variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Add Rate Rule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium mb-1">
              State / Region
            </label>
            <input
              type="text"
              className="ui-input w-full"
              value={state}
              onChange={(e: any) => setState(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Postal / ZIP Code
            </label>
            <input
              type="text"
              className="ui-input w-full"
              value={postalCode}
              onChange={(e: any) => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Taxability Category
            </label>
            <select
              className="ui-input w-full"
              value={taxCategory}
              onChange={(e: any) => setTaxCategory(e.target.value)}
            >
              <option value="PHYSICAL_GOODS">
                Physical Goods (100% Taxable)
              </option>
              <option value="SAAS">SaaS / Software Subscriptions</option>
              <option value="DIGITAL_GOODS">Digital Goods & Content</option>
              <option value="EXEMPT_FREIGHT">Exempt Freight / Shipping</option>
              <option value="PROFESSIONAL_SERVICES">
                Professional Services
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Taxable Amount ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="ui-input w-full"
                value={taxableAmount}
                onChange={(e: any) => setTaxableAmount(Number(e.target.value))}
              />
              <Button onClick={handleLookup} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {lookupError && (
          <div className="ui-alert ui-alert-danger mb-4">
            <Search size={16} />
            <span>{lookupError}</span>
          </div>
        )}

        {lookupResult && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                Tax Breakdown for ZIP {lookupResult.postalCode} (
                {lookupResult.state})
              </span>
              <Badge
                variant={lookupResult.isOverridden ? "warning" : "success"}
              >
                Combined Effective Rate:{" "}
                <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                  {lookupResult.effectiveRatePct}%
                </span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2 border rounded bg-background">
                <p className="text-muted-foreground">
                  State Tax ({lookupResult.stateRatePct}%)
                </p>
                <p
                  className="font-bold text-sm"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${lookupResult.stateTaxAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-2 border rounded bg-background">
                <p className="text-muted-foreground">
                  County Tax ({lookupResult.countyRatePct}%)
                </p>
                <p
                  className="font-bold text-sm"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${lookupResult.countyTaxAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-2 border rounded bg-background">
                <p className="text-muted-foreground">
                  City Tax ({lookupResult.cityRatePct}%)
                </p>
                <p
                  className="font-bold text-sm"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${lookupResult.cityTaxAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-2 border rounded bg-background">
                <p className="text-muted-foreground">
                  Special District ({lookupResult.specialDistrictRatePct}%)
                </p>
                <p
                  className="font-bold text-sm"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${lookupResult.specialDistrictTaxAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-2 border rounded bg-primary/10 border-primary/20">
                <p className="text-primary font-medium">Total Tax + Grand</p>
                <p
                  className="font-bold text-sm text-primary"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${lookupResult.totalTaxAmount.toFixed(2)} / $
                  {lookupResult.grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Card padding="md">
        <h4 className="text-md font-semibold mb-3">
          Configured Jurisdiction Rates
        </h4>
        <DataTable
          data={jurisdictions}
          columns={[
            { key: "state", header: "State", sortable: true },
            { key: "postalCode", header: "Postal Code", sortable: true },
            { key: "county", header: "County" },
            { key: "city", header: "City" },
            {
              key: "combinedRatePct",
              header: "Combined Rate",
              sortable: true,
              render: (row: JurisdictionItem) => (
                <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                  {row.combinedRatePct}%
                </span>
              ),
            },
            {
              key: "hasTenantNexus",
              header: "Nexus Status",
              render: (row: JurisdictionItem) =>
                row.hasTenantNexus ? (
                  <Badge variant="success">Registered Nexus</Badge>
                ) : (
                  <Badge variant="info">Default Rate</Badge>
                ),
            },
          ]}
        />
      </Card>

      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl border max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Add Custom Jurisdiction Rule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  State Code (e.g. CA, NY)
                </label>
                <input
                  type="text"
                  className="ui-input w-full"
                  value={overrideState}
                  onChange={(e: any) =>
                    setOverrideState(e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Revenue Threshold ($)
                </label>
                <input
                  type="number"
                  className="ui-input w-full"
                  value={overrideThreshold}
                  onChange={(e: any) => setOverrideThreshold(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowOverrideModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOverride}>Save Rule</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
