import { DataTable } from "@kannan19302/ui";
"use client";
import { useState, useEffect } from "react";

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/social-posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Social Media Posts</h1>
        <button className="ui-btn">+ New Post</button>
      </div>
      <div className="overflow-x-auto">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Platform", render: (p: any) => (<>{p.platform}</>) },
                { key: "col_1", header: "Content", render: (p: any) => (<>{p.content}</>) },
                { key: "col_2", header: "Status", render: (p: any) => (<><span
                                  className={`px-2 py-0.5 rounded text-xs ${p.status === "PUBLISHED" ? "bg-green-100 text-green-700" : p.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                                >
                                  {p.status}
                                </span></>) },
                { key: "col_3", header: "Scheduled", render: (p: any) => (<>{p.scheduledAt
                                  ? new Date(p.scheduledAt).toLocaleDateString()
                                  : "-"}</>) },
                { key: "col_4", header: "Published", render: (p: any) => (<>{p.publishedAt
                                  ? new Date(p.publishedAt).toLocaleDateString()
                                  : "-"}</>) },
                { key: "col_5", header: "Actions", render: (p: any) => (<><button className="text-blue-600 hover:underline">
                                  Edit
                                </button>
                                <button className="text-green-600 hover:underline">
                                  Publish
                                </button>
                                <button className="text-red-600 hover:underline">
                                  Delete
                                </button></>) },
              ];
                        return <DataTable columns={columns} data={posts} rowKey={(p: any) => p.id} />;
                      })()}</>
      </div>
    </div>
  );
}
