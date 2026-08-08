"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge, DataTable } from "@unerp/ui";
import { Search, Eye, ThumbsUp, Trash2, Edit3 } from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../../_components/api";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  category?: { id: string; name: string };
  createdAt: string;
  publishedAt?: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ data: Article[] }>(
        `/api/crm/support/help-center/articles?limit=100${search ? `&search=${search}` : ""}`,
      );
      setArticles(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const bulkDelete = async (id: string) => {
    await apiSend(`/api/crm/support/help-center/articles/${id}`, "DELETE");
    load();
  };

  const publishArticle = async (id: string) => {
    await apiSend(`/api/crm/support/help-center/articles/${id}`, "PUT", {
      status: "PUBLISHED",
    });
    load();
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="All Articles"
        description="Browse and manage knowledge base articles"
        breadcrumbs={[
          { label: "Help Center", href: "/crm/help-center" },
          { label: "Articles" },
        ]}
      />
      <div className="ui-input-group ui-mb-4" style={{ maxWidth: 400 }}>
        <Search size={16} />
        <input
          className="ui-input"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Title", render: (art: any) => (<><Link
                                                  href={`/crm/help-center/articles/${art.id}`}
                                                  className="ui-link"
                                                >
                                                  {art.title}
                                                </Link></>) },
                            { key: "col_1", header: "Status", render: (art: any) => (<><Badge
                                                  variant={
                                                    art.status === "PUBLISHED"
                                                      ? "success"
                                                      : art.status === "DRAFT"
                                                        ? "warning"
                                                        : "default"
                                                  }
                                                >
                                                  {art.status}
                                                </Badge></>) },
                            { key: "col_2", header: "Category", render: (art: any) => (<>{art.category?.name || "-"}</>) },
                            { key: "col_3", header: "Views", render: (art: any) => (<><Eye size={12} /> {art.viewCount}</>) },
                            { key: "col_4", header: "Helpful", render: (art: any) => (<><ThumbsUp size={12} /> {art.helpfulCount}</>) },
                            { key: "col_5", header: "Actions", render: (art: any) => (<><div className="ui-flex ui-gap-1">
                                                  <Link href={`/crm/help-center/articles/${art.id}`}>
                                                    <button className="ui-btn-icon">
                                                      <Eye size={14} />
                                                    </button>
                                                  </Link>
                                                  {art.status !== "PUBLISHED" && (
                                                    <button
                                                      className="ui-btn-icon"
                                                      onClick={() => publishArticle(art.id)}
                                                      title="Publish"
                                                    >
                                                      <Edit3 size={14} />
                                                    </button>
                                                  )}
                                                  <button
                                                    className="ui-btn-icon"
                                                    onClick={() => bulkDelete(art.id)}
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </div></>) },
                          ];
                                    return <DataTable columns={columns} data={articles} rowKey={(art: any) => art.id} />;
                                  })()}</>
          </div>
        </Card>
      )}
    </div>
  );
}
