"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { DollarSign, Layers, Shield } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedHrCompensationPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [bands, setBands] = useState<any[]>([]);
  const [bandName, setBandName] = useState("");
  const [jobLevel, setJobLevel] = useState("IC4");
  const toast = useToast();

  const loadBands = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/advanced-hr/compensation-bands-deep/bands",
      );
      setBands(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load compensation bands",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBands();
  }, []);

  const handleCreate = async () => {
    try {
      if (!bandName) {
        toast.error("Validation", "Band name required");
        return;
      }
      await client.post("/advanced-hr/compensation-bands-deep/bands", {
        bandName,
        jobLevel,
        minSalary: 100000,
        midSalary: 130000,
        maxSalary: 160000,
        effectiveDate: "2026-01-01",
      });
      toast.success("Band Created", `Compensation band "${bandName}" saved.`);
      setBandName("");
      loadBands();
    } catch (err) {
      toast.error(
        "Failed to create band",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Pay Equity Compensation Band Designer & Salary Range Manager"
        description="Define fair compensation ranges by job level, ensure pay equity, and benchmark salaries against market data."
      />
      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Band name (e.g. IC4 — Senior Engineer)"
            value={bandName}
            onChange={(e: any) => setBandName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <select
            value={jobLevel}
            onChange={(e: any) => setJobLevel(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          >
            {[
              "IC2",
              "IC3",
              "IC4",
              "IC5",
              "IC6",
              "M1",
              "M2",
              "M3",
              "VP",
              "SVP",
            ].map((l: any) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <Button onClick={handleCreate}>Create Band</Button>
        </div>
      </Card>
      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Compensation Salary Bands
        </h3>
        {bands.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No compensation bands defined.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Band Name" , render: (b: any) => (<>{b.bandName}</>) },
                        { key: "col_1", header: "Level" , render: (b: any) => (<><Badge variant="info">{b.jobLevel}</Badge></>) },
                        { key: "col_2", header: "Min" , render: (b: any) => (<>${Number(b.minSalary).toLocaleString()}</>) },
                        { key: "col_3", header: "Mid" , render: (b: any) => (<>${Number(b.midSalary).toLocaleString()}</>) },
                        { key: "col_4", header: "Max" , render: (b: any) => (<>${Number(b.maxSalary).toLocaleString()}</>) },
                      ];
                              return <DataTable columns={columns} data={bands} rowKey={(b: any) => b.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
