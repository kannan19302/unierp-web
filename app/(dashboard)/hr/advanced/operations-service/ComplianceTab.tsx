"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Spinner, useToast, DataTable } from "@kannan19302/ui";
import {
  Play,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./ComplianceTab.module.css";

interface ComplianceCheck {
  id: string;
  checkType: string;
  status: string; // PASSED, WARNING, FAILED
  message: string;
  checkedAt: string;
}

export default function ComplianceTab() {
  const client = useApiClient();
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await client.get<
        ComplianceCheck[] | { data?: ComplianceCheck[] }
      >("/advanced-hr/compliance/checks");
      setChecks(Array.isArray(data) ? data : data.data || []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load compliance checks";
      setLoadError(message);
      toast.error("Failed to load compliance checks", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleRunAudit = async () => {
    setScanning(true);
    try {
      const data = await client.post<
        ComplianceCheck[] | { data?: ComplianceCheck[] }
      >("/advanced-hr/compliance/run-checks");
      toast.success("Compliance audit executed successfully.");
      setChecks(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Audit execution error.");
    } finally {
      setScanning(false);
    }
  };

  // Status counters
  const failures = checks.filter((c: any) => c.status === "FAILED").length;
  const warnings = checks.filter((c: any) => c.status === "WARNING").length;
  const passed = checks.filter((c: any) => c.status === "PASSED").length;

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button
          variant="primary"
          onClick={handleRunAudit}
          disabled={scanning}
          className={styles.s0}
        >
          {scanning ? (
            <RefreshCw className="animate-spin" size={14} />
          ) : (
            <Play size={14} />
          )}{" "}
          Run Compliance Scanner
        </Button>
      </div>

      {/* Compliance indicators */}
      <div className={styles.auto0}>
        <Card className={styles.s1}>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Compliance Breaches</span>
            <ShieldAlert size={16} className="text-danger" />
          </div>
          <h4 className={styles.s2}>{failures}</h4>
        </Card>
        <Card className={styles.s3}>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Warnings</span>
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <h4 className={styles.s4}>{warnings}</h4>
        </Card>
        <Card className={styles.s5}>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Passed Checks</span>
            <CheckCircle size={16} className="text-success" />
          </div>
          <h4 className={styles.s6}>{passed}</h4>
        </Card>
      </div>

      {loadError && (
        <div className="ui-alert ui-alert-danger">
          <AlertTriangle size={16} />
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" className="builder-table-wrapper">
          <>{(() => {
                                const columns = [
                        { key: "col_0", header: "Audit Area", render: (c: any) => (<>{c.checkType.replace("_", " ")}</>) },
                        { key: "col_1", header: "Check Message", render: (c: any) => (<>{c.message}</>) },
                        { key: "col_2", header: "Status", render: (c: any) => (<><span
                                              className={styles.dyn0}
                                              style={{
                                                background:
                                                  c.status === "PASSED"
                                                    ? "var(--color-success-light)"
                                                    : c.status === "WARNING"
                                                      ? "var(--color-warning-light)"
                                                      : "var(--color-danger-light)",
                                                color:
                                                  c.status === "PASSED"
                                                    ? "var(--color-success-text)"
                                                    : c.status === "WARNING"
                                                      ? "var(--color-warning-text)"
                                                      : "var(--color-danger-text)",
                                              }}
                                            >
                                              {c.status}
                                            </span></>) },
                        { key: "col_3", header: "Scanned At", render: (c: any) => (<>{new Date(c.checkedAt).toLocaleString()}</>) },
                      ];
                                return <DataTable columns={columns} data={checks} rowKey={(c: any) => c.id} />;
                              })()}</>
        </Card>
      )}
    </div>
  );
}
