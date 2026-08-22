"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@kannan19302/ui";
import { FileText, Plus, Layout, Settings } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function ReportingTemplatesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const toast = useToast();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/templates-deep/templates",
      );
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Report Templates",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    try {
      if (!title) {
        toast.error("Validation Error", "Template title is required");
        return;
      }
      await client.post("/reporting/templates-deep/templates", {
        title,
        category: "FINANCIAL",
        layoutHtml: "<div><h1>Custom Report Header</h1></div>",
      });
      toast.success(
        "Template Created",
        `Report template "${title}" created successfully.`,
      );
      setTitle("");
      loadTemplates();
    } catch (err) {
      toast.error(
        "Failed to create template",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
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
  }

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Pixel-Perfect Enterprise Report Template Designer"
        description="Build custom HTML/PDF financial report templates, add multi-section SQL queries, and configure corporate styling."
      />

      <Card style={{ padding: "var(--space-5)", margin: "var(--space-6) 0" }}>
        <h3 style={{ fontSize: "var(--space-4)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
          Create New Report Template
        </h3>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <input
            type="text"
            placeholder="Report Template Title (e.g. Executive Balance Sheet & P&L)..."
            value={title}
            onChange={(e: any) => setTitle(e.target.value)}
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Create Template</Button>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "var(--space-5)",
        }}
      >
        {templates.length === 0 ? (
          <Card
            style={{
              padding: "var(--space-8)",
              gridColumn: "1 / -1",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-text-secondary)" }}>
              No custom report templates available.
            </p>
          </Card>
        ) : (
          templates.map((t: any) => (
            <Card key={t.id} style={{ padding: "var(--space-5)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-2)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
                >
                  <FileText size={18} color="var(--color-primary)" />
                  <h4 style={{ fontSize: "15px", fontWeight: 600 }}>
                    {t.title}
                  </h4>
                </div>
                <Badge variant="info">{t.category}</Badge>
              </div>
              <p
                style={{
                  fontSize: "var(--space-3)",
                  color: "var(--color-text-secondary)",
                  margin: "var(--space-2) 0 var(--space-4) 0",
                }}
              >
                Created on {new Date(t.createdAt).toLocaleDateString()}
              </p>
              <Button size="sm" variant="outline" style={{ width: "100%" }}>
                Design Layout
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
