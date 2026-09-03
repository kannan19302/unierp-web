"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge, DataTable } from "@kannan19302/ui";
import {
  Users,
  ArrowLeft,
  Plus,
  DollarSign,
  Target,
  Gift,
  HelpCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useApiClient, RouteGuard } from "@kannan19302/framework";
import styles from "./page.module.css";

interface PartnerPerf {
  partnerId: string;
  partnerName: string;
  totalRevenue: number;
  totalOrders: number;
  wonOrders: number;
  conversionRate: number;
  commissionEarned: number;
  contactsCount: number;
  lastOrderDate: string | null;
}

export default function PartnerManagementPage() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerPerf[]>([]);
  const [mdfSummary, setMdfSummary] = useState<any>(null);
  const [showRegisterLead, setShowRegisterLead] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    partnerId: "",
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const client = useApiClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const perfData = await client.get<any>("/crm/partners/performance");
      const list = perfData?.data || [];
      setPartners(list);
      if (list.length > 0) {
        setRegisterForm((prev: any) => ({ ...prev, partnerId: list[0].partnerId }));
        // Load MDF for first partner
        try {
          const mdfData = await client.get<any>(
            `/crm/partners/${list[0].partnerId}/mdf`,
          );
          setMdfSummary(mdfData?.data || null);
        } catch {
          setMdfSummary(null);
        }
      } else {
        setMdfSummary(null);
      }
    } catch {
      setPartners([]);
      setMdfSummary(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegisterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    try {
      await client.post("/crm/partners/lead", registerForm);
      setShowRegisterLead(false);
      setRegisterForm({
        partnerId: partners[0]?.partnerId || "",
        firstName: "",
        lastName: "",
        company: "",
        email: "",
        phone: "",
        notes: "",
      });
    } catch {
      /* ignore */
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading)
    return (
      <RouteGuard permission="crm.read">
        <div className="ui-page">
          <Spinner />
        </div>
      </RouteGuard>
    );

  const columns = [
    { key: "partnerName", header: "Partner Name" },
    {
      key: "totalRevenue",
      header: "Referred Revenue",
      render: (r: PartnerPerf) => `$${r.totalRevenue.toLocaleString()}`,
    },
    {
      key: "wonOrders",
      header: "Won / Total Deals",
      render: (r: PartnerPerf) => `${r.wonOrders} / ${r.totalOrders}`,
    },
    {
      key: "conversionRate",
      header: "Deal Win Rate",
      render: (r: PartnerPerf) => `${r.conversionRate}%`,
    },
    {
      key: "commissionEarned",
      header: "Commissions Paid",
      render: (r: PartnerPerf) => `$${r.commissionEarned.toLocaleString()}`,
    },
  ];

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Partner Management"
          description="Monitor affiliate reselling performance, commission allocations, and market development funds (MDF)"
          actions={
            <div className="ui-hstack-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRegisterLead(true)}
              >
                <Plus size={14} className="mr-1" /> Register Lead
              </Button>
              <Link href="/crm/intelligence">
                <Button variant="outline" size="sm">
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
              </Link>
            </div>
          }
        />

        <div className={styles.contentGrid}>
          {/* Left: Partner performance tables */}
          <div className="ui-stack-6">
            <Card>
              <div className="ui-card-header">
                <h3 className="ui-card-title">Reseller Performance Overview</h3>
              </div>
              <div className="ui-card-body">
                <DataTable columns={columns} data={partners} />
              </div>
            </Card>
          </div>

          {/* Right: MDF Details */}
          {mdfSummary && (
            <Card padding="md">
              <div className="ui-hstack-2 mb-4">
                <Users size={18} className="ui-text-primary" />
                <h4 className="m-0 font-semibold">MDF Allocation Details</h4>
              </div>

              <div className={styles.budgetGrid}>
                <div className={styles.budgetCard}>
                  <div className="ui-text-xs-muted">TOTAL BUDGET</div>
                  <div className={styles.budgetValue}>
                    ${mdfSummary.totalBudget?.toLocaleString()}
                  </div>
                </div>
                <div className={styles.budgetCard}>
                  <div className="ui-text-xs-muted">UTILIZED BUDGET</div>
                  <div className={styles.budgetValue}>
                    ${mdfSummary.utilized?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={`ui-stack-2 ${styles.balanceRow}`}>
                <div className="ui-flex-between text-xs">
                  <span className="ui-text-muted">Remaining Balance</span>
                  <span className="font-bold">
                    ${mdfSummary.remaining?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={styles.claimsSection}>
                <span className="ui-text-xs-bold-muted">RECENT MDF CLAIMS</span>
                <div className={styles.claimList}>
                  {mdfSummary.claims?.map((claim: any) => (
                    <div key={claim.id} className={styles.claimRow}>
                      <div>
                        <div className="font-bold">{claim.name}</div>
                        <div className="ui-text-tertiary">{claim.date}</div>
                      </div>
                      <div className={styles.claimAmount}>
                        <span className="font-bold">
                          ${claim.amount.toLocaleString()}
                        </span>
                        <Badge
                          variant={
                            claim.status === "APPROVED" ||
                            claim.status === "PAID"
                              ? "success"
                              : "warning"
                          }
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {showRegisterLead && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className="m-0 font-semibold">Register Lead Referral</h3>
                <button
                  onClick={() => setShowRegisterLead(false)}
                  className={styles.modalClose}
                  aria-label="Close register lead dialog"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleRegisterLead} className="ui-stack-3">
                <div>
                  <label className="ui-text-xs-bold-muted">
                    REFERRING PARTNER
                  </label>
                  <select
                    value={registerForm.partnerId}
                    onChange={(e: any) =>
                      setRegisterForm({
                        ...registerForm,
                        partnerId: e.target.value,
                      })
                    }
                    className={styles.formControl}
                  >
                    {partners.map((p: any) => (
                      <option key={p.partnerId} value={p.partnerId}>
                        {p.partnerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ui-grid-2 ui-gap-3">
                  <input
                    type="text"
                    placeholder="First Name *"
                    required
                    value={registerForm.firstName}
                    onChange={(e: any) =>
                      setRegisterForm({
                        ...registerForm,
                        firstName: e.target.value,
                      })
                    }
                    className={styles.formControl}
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    required
                    value={registerForm.lastName}
                    onChange={(e: any) =>
                      setRegisterForm({
                        ...registerForm,
                        lastName: e.target.value,
                      })
                    }
                    className={styles.formControl}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Company Name *"
                  required
                  value={registerForm.company}
                  onChange={(e: any) =>
                    setRegisterForm({
                      ...registerForm,
                      company: e.target.value,
                    })
                  }
                  className={styles.formControl}
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  required
                  value={registerForm.email}
                  onChange={(e: any) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  className={styles.formControl}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={registerForm.phone}
                  onChange={(e: any) =>
                    setRegisterForm({ ...registerForm, phone: e.target.value })
                  }
                  className={styles.formControl}
                />
                <textarea
                  placeholder="Referral Notes (budget, timeline, requirements...)"
                  value={registerForm.notes}
                  onChange={(e: any) =>
                    setRegisterForm({ ...registerForm, notes: e.target.value })
                  }
                  rows={3}
                  className={`${styles.formControl} ${styles.notesField}`}
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submittingLead}
                >
                  {submittingLead
                    ? "Submitting referral..."
                    : "Submit Referral"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
