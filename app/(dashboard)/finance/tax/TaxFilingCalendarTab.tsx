"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";
import { Card, Button, Badge, DataTable } from "@kannan19302/ui";
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  state: string;
  stateName: string;
  period: string;
  frequency: string;
  dueDate: string;
  status: "UPCOMING" | "DUE_SOON" | "OVERDUE" | "FILED" | "EXTENDED";
  estimatedTaxLiability: number;
  penaltyAmount: number;
  interestAmount: number;
  totalAmountDue: number;
  daysRemaining: number;
  isOverdue: boolean;
}

interface FilingReminder {
  id: string;
  state: string;
  title: string;
  message: string;
  dueDate: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  isAcknowledged: boolean;
  amountDue: number;
}

export function TaxFilingCalendarTab() {
  const client = useApiClient();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [reminders, setReminders] = useState<FilingReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilingCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, remData] = await Promise.all([
        client.get<ScheduleItem[]>("/advanced-finance/tax/filing-calendar"),
        client.get<FilingReminder[]>("/advanced-finance/tax/filing-reminders"),
      ]);
      if (Array.isArray(resData)) setSchedules(resData);
      if (Array.isArray(remData)) setReminders(remData);
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : "Failed to load tax filing calendar";
      setError(msg);
      setSchedules([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilingCalendar();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax/filing-reminders/${id}/acknowledge`,
        {},
      );
      setReminders((prev: any) =>
        prev.map((r: any) => (r.id === id ? { ...r, isAcknowledged: true } : r)),
      );
    } catch {
      // Invariant check
    }
  };

  const handleRecalculate = async () => {
    try {
      await client.post(
        "/advanced-finance/tax/filing-calendar/recalculate",
        {},
      );
      fetchFilingCalendar();
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : "Failed to recalculate filing calendar";
      setError(msg);
    }
  };

  const getStatusBadge = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="danger">Overdue</Badge>;
      case "DUE_SOON":
        return <Badge variant="warning">Due Soon</Badge>;
      case "FILED":
        return <Badge variant="success">Filed</Badge>;
      default:
        return <Badge variant="info">Upcoming</Badge>;
    }
  };

  return (
    <div className="ui-stack-4 ui-animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Tax Return Filing Calendar &amp; Penalty Estimator
          </h3>
        </div>
        <Button
          onClick={handleRecalculate}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Recalculate Calendar
        </Button>
      </div>

      {error && (
        <div className="ui-alert ui-alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {reminders.some(
        (r: any) => !r.isAcknowledged && r.severity === "CRITICAL",
      ) && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                Critical Past-Due Filing Reminders
              </p>
              <p className="text-xs">
                Action required to avoid accruing interest and state late filing
                fees.
              </p>
            </div>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <p className="ui-text-sm-muted">
            No tax return filing schedules currently registered. Click &quot;Recalculate Calendar&quot; to synthesize filing deadlines from active nexus jurisdictions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schedules.map((item: any) => (
            <Card key={item.id} padding="md" className="border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base">
                  {item.stateName} ({item.state})
                </span>
                {getStatusBadge(item.status)}
              </div>
              <div className="space-y-1 text-xs mb-3 text-muted-foreground">
                <p>
                  Filing Period:{" "}
                  <span className="font-medium text-foreground">
                    {item.period}
                  </span>
                </p>
                <p>
                  Due Date:{" "}
                  <span
                    className="font-medium text-foreground"
                    style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                  >
                    {item.dueDate}
                  </span>
                </p>
                <p>
                  Frequency:{" "}
                  <span className="font-medium text-foreground">
                    {item.frequency}
                  </span>
                </p>
              </div>
              <div className="p-2 rounded bg-muted/30 border text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Est. Tax Liability:</span>
                  <span
                    className="font-semibold"
                    style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                  >
                    ${Number(item.estimatedTaxLiability || 0).toLocaleString()}
                  </span>
                </div>
                {item.penaltyAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Penalty &amp; Interest:</span>
                    <span
                      className="font-semibold"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      +${(Number(item.penaltyAmount || 0) + Number(item.interestAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1 text-sm text-primary">
                  <span>Total Due:</span>
                  <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                    ${Number(item.totalAmountDue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card padding="md">
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> State Tax Filing Reminders &amp; Alert Queue
        </h4>
        <DataTable
          data={reminders}
          columns={[
            { key: "state", header: "State", sortable: true },
            { key: "title", header: "Reminder Title" },
            { key: "message", header: "Details" },
            {
              key: "dueDate",
              header: "Due Date",
              sortable: true,
              render: (row: FilingReminder) => (
                <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                  {row.dueDate}
                </span>
              ),
            },
            {
              key: "severity",
              header: "Severity",
              render: (row: FilingReminder) => (
                <Badge
                  variant={
                    row.severity === "CRITICAL"
                      ? "danger"
                      : row.severity === "HIGH"
                        ? "warning"
                        : "info"
                  }
                >
                  {row.severity}
                </Badge>
              ),
            },
            {
              key: "isAcknowledged",
              header: "Status",
              render: (row: FilingReminder) =>
                row.isAcknowledged ? (
                  <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3" /> Acknowledged
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAcknowledge(row.id)}
                  >
                    Acknowledge
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
