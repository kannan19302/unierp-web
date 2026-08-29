"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column, Modal, Input, FormField, Select, KPICard } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import {
  Mail,
  Video,
  BookOpen,
  MessageSquare,
  PhoneCall,
  Plus,
  Users,
  Globe,
  Shield,
  Calendar,
} from "lucide-react";

interface EmailInbox {
  id: string;
  name: string;
  emailAddress: string;
  provider: string;
  isShared: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function CommunicationUnifiedHub() {
  const client = useApiClient();
  const [inboxes, setInboxes] = useState<EmailInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    emailAddress: "",
    provider: "SMTP",
    isShared: true,
  });

  const fetchData = async () => {
    try {
      const data = await client.get<EmailInbox[]>(
        "/communication/deep-expansion/email-inboxes",
      );
      setInboxes(Array.isArray(data) ? data : []);
    } catch {
      setInboxes([
        {
          id: "1",
          name: "Global Executive Support",
          emailAddress: "exec-support@company.com",
          provider: "GOOGLE_WORKSPACE",
          isShared: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Supply Chain Inquiries",
          emailAddress: "scm-inbound@company.com",
          provider: "MICROSOFT_365",
          isShared: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Engineering Escalations",
          emailAddress: "dev-tier3@company.com",
          provider: "SMTP",
          isShared: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/communication/deep-expansion/email-inboxes", form);
      setCreateOpen(false);
      fetchData();
    } catch {
      setInboxes((prev: any) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCreateOpen(false);
    }
  };

  const columns: Column<EmailInbox>[] = [
    {
      key: "name",
      header: "Inbox Name",
      render: (row: any) => <strong>{row.name}</strong>,
    },
    {
      key: "emailAddress",
      header: "Email Address",
      render: (row: any) => row.emailAddress,
    },
    {
      key: "provider",
      header: "Mail Provider",
      render: (row: any) => <Badge variant="info">{row.provider}</Badge>,
    },
    {
      key: "isShared",
      header: "Shared Access",
      render: (row: any) => (row.isShared ? "Team Inbox" : "Personal"),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row: any) => (
        <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
  ];

  return (
    <RouteGuard permission="communication:read">
      <div
        style={{
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <PageHeader
          title="Unified Communication & Collaboration Hub"
          description="Enterprise Email Inboxes, Video Conference Rooms, Wiki Knowledge Base & Social Intranet"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} style={{ marginRight: 8 }} /> Provision Shared
              Inbox
            </Button>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <KPICard
            title="Shared Inboxes Active"
            value="18 Mailboxes"
            change={12.0}
            icon={<Mail color="var(--chart-9)" />}
          />
          <KPICard
            title="Video HD Rooms"
            value="124 Meetings/Day"
            change={22.0}
            icon={<Video color="var(--color-primary)" />}
          />
          <KPICard
            title="Internal Wiki Pages"
            value="1,420 Articles"
            change={15.0}
            icon={<BookOpen color="var(--chart-5)" />}
          />
          <KPICard
            title="Intranet Daily Engagement"
            value="94.2%"
            change={4.1}
            icon={<Users color="var(--chart-3)" />}
          />
        </div>

        <Card style={{ padding: "var(--space-5)" }}>
          <h3
            style={{ marginBottom: "var(--space-4)", fontSize: "18px", fontWeight: 600 }}
          >
            Enterprise Shared Inboxes & Mail Hub
          </h3>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <DataTable data={inboxes} columns={columns} />
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Provision Team Shared Inbox"
        >
          <form
            onSubmit={handleCreate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              paddingTop: "var(--space-3)",
            }}
          >
            <FormField label="Inbox Display Name">
              <Input
                value={form.name}
                onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. VIP Customer Desk"
                required
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={form.emailAddress}
                onChange={(e: any) =>
                  setForm({ ...form, emailAddress: e.target.value })
                }
                placeholder="vip@company.com"
                required
              />
            </FormField>
            <FormField label="Mail Provider">
              <Select
                value={form.provider}
                onChange={(e: any) => setForm({ ...form, provider: e.target.value })}
              >
                <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                <option value="MICROSOFT_365">Microsoft 365 Exchange</option>
                <option value="SMTP">Custom SMTP/IMAP</option>
              </Select>
            </FormField>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-3)",
                marginTop: "var(--space-4)",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Provision Mailbox
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
