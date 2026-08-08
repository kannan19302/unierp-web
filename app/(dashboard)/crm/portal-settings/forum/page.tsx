"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge, DataTable } from "@kannan19302/ui";
import {
  MessageSquare,
  Plus,
  Lock,
  Trash2,
  CheckCircle,
  MessageCircle,
  Eye,
} from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface Topic {
  id: string;
  customerId: string;
  title: string;
  content: string;
  category?: string;
  status: string;
  viewCount: number;
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  _count?: { replies: number };
}

export default function PortalForumPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    content: "",
    category: "GENERAL",
  });
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet("/api/crm/portal/forum/topics?limit=50");
      setTopics(Array.isArray(res) ? res : (res as any)?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTopic = async () => {
    await apiSend("/api/crm/portal/forum/topics", "POST", form);
    setShowForm(false);
    setForm({ customerId: "", title: "", content: "", category: "GENERAL" });
    load();
  };

  const closeTopic = async (id: string) => {
    await apiSend(`/api/crm/portal/forum/topics/${id}/close`, "POST");
    load();
  };

  const loadReplies = async (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }
    try {
      const res = await apiGet(
        `/api/crm/portal/forum/topics/${topicId}/replies`,
      );
      setReplies((prev: any) => ({
        ...prev,
        [topicId]: Array.isArray(res) ? res : (res as any)?.data || [],
      }));
      setExpandedTopic(topicId);
    } catch {
      setExpandedTopic(null);
    }
  };

  const markAnswer = async (replyId: string) => {
    await apiSend(
      `/api/crm/portal/forum/replies/${replyId}/mark-answer`,
      "POST",
    );
    if (expandedTopic) loadReplies(expandedTopic);
  };

  const statusBadge: Record<string, "success" | "warning" | "default"> = {
    OPEN: "warning",
    ANSWERED: "success",
    CLOSED: "default",
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Portal Forum"
        description="Manage community forum topics and replies"
        breadcrumbs={[
          { label: "Portal Settings", href: "/crm/portal-settings" },
          { label: "Forum" },
        ]}
      />
      <div className="ui-mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus size={14} /> New Topic
        </Button>
      </div>

      {showForm && (
        <Card className="ui-mb-4">
          <div className="ui-card-body">
            <h3 className="ui-card-title">New Forum Topic</h3>
            <div className="ui-form-group">
              <label className="ui-label">Customer ID</label>
              <input
                className="ui-input"
                value={form.customerId}
                onChange={(e: any) =>
                  setForm({ ...form, customerId: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={form.title}
                onChange={(e: any) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Content</label>
              <textarea
                className="ui-input"
                rows={4}
                value={form.content}
                onChange={(e: any) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Category</label>
              <select
                className="ui-input"
                value={form.category}
                onChange={(e: any) => setForm({ ...form, category: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="BUG_REPORT">Bug Report</option>
                <option value="QUESTION">Question</option>
              </select>
            </div>
            <div className="ui-flex ui-gap-2">
              <Button onClick={createTopic}>Create</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Title", render: (t: any) => (<><strong>
                                                    {t.isPinned && "📌 "}
                                                    {t.title}
                                                  </strong></>) },
                            { key: "col_1", header: "Customer", render: (t: any) => (<>{t.customerId.substring(0, 8)}</>) },
                            { key: "col_2", header: "Category", render: (t: any) => (<><Badge>{t.category || "General"}</Badge></>) },
                            { key: "col_3", header: "Status", render: (t: any) => (<><Badge variant={statusBadge[t.status] || "default"}>
                                                    {t.status}
                                                  </Badge></>) },
                            { key: "col_4", header: "Replies", render: (t: any) => (<>{t._count?.replies || 0}</>) },
                            { key: "col_5", header: "Views", render: (t: any) => (<><Eye size={12} /> {t.viewCount}</>) },
                            { key: "col_6", header: "Actions", render: (t: any) => (<><div className="ui-flex ui-gap-1">
                                                    <button
                                                      className="ui-btn-icon"
                                                      onClick={() => loadReplies(t.id)}
                                                      title="Replies"
                                                    >
                                                      <MessageCircle size={14} />
                                                    </button>
                                                    {t.status !== "CLOSED" && (
                                                      <button
                                                        className="ui-btn-icon"
                                                        onClick={() => closeTopic(t.id)}
                                                        title="Close"
                                                      >
                                                        <Lock size={14} />
                                                      </button>
                                                    )}
                                                  </div></>) },
                          ];
                                    return <DataTable columns={columns} data={topics} rowKey={(t: any, i: any) => String(i)} />;
                                  })()}</>
          </div>
        </Card>
      )}
    </div>
  );
}
