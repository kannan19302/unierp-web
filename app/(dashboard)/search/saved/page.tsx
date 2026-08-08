"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
import { Trash2, Search as SearchIcon } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  scope: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search/saved")
      .then((r: any) => r.json())
      .then((data: any) => {
        setSearches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deleteSearch = async (id: string) => {
    await fetch(`/api/search/saved/${id}`, { method: "DELETE" });
    setSearches((prev: any) => prev.filter((s: any) => s.id !== id));
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Searches</h1>
      <a href="/search" className="ui-btn ui-btn-outline mb-4">
        <SearchIcon className="w-4 h-4 mr-2" /> New Search
      </a>
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && searches.length === 0 && (
        <div className="text-gray-500">No saved searches yet.</div>
      )}
      {searches.length > 0 && (
        <>{(() => {
                      const columns = [
                { key: "col_0", header: "Name" , render: (s: any) => (<>{s.name}</>) },
                { key: "col_1", header: "Query" , render: (s: any) => (<>{s.query}</>) },
                { key: "col_2", header: "Scope" , render: (s: any) => (<>{s.scope}</>) },
                { key: "col_3", header: "Created" , render: (s: any) => (<>{new Date(s.createdAt).toLocaleDateString()}</>) },
                { key: "col_4", header: "Actions" , render: (s: any) => (<><button
                                  className="ui-btn ui-btn-ghost"
                                  onClick={() => deleteSearch(s.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button></>) },
              ];
                      return <DataTable columns={columns} data={searches} rowKey={(s: any) => s.id} />;
                  })()}</>
      )}
    </div>
  );
}
