"use client";
import { DataTable } from "@kannan19302/ui";
import { useState, useEffect } from "react";

export default function MessageHistoryPage() {
  const [entityType, setEntityType] = useState("CUSTOMER");
  const [entityId, setEntityId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const search = async () => {
    if (!entityId) return;
    const r = await fetch(
      `/api/crm/communication-deep/message-history?entityType=${entityType}&entityId=${entityId}`,
    );
    const d = await r.json();
    setMessages(d.data || []);
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Message History</h1>
      <div className="flex gap-3 mb-6 items-end">
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity Type</label>
          <select
            className="ui-input"
            value={entityType}
            onChange={(e: any) => setEntityType(e.target.value)}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="LEAD">Lead</option>
            <option value="CONTACT">Contact</option>
            <option value="OPPORTUNITY">Opportunity</option>
          </select>
        </div>
        <div className="ui-form-group">
          <label className="text-sm font-medium">Entity ID</label>
          <input
            className="ui-input"
            value={entityId}
            onChange={(e: any) => setEntityId(e.target.value)}
            placeholder="e.g. cust-123"
          />
        </div>
        <button className="ui-btn" onClick={search}>
          Search
        </button>
      </div>
      {loaded && (
        <div className="overflow-x-auto">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Date", render: (m: any) => (<>{new Date(m.sentAt).toLocaleString()}</>) },
                    { key: "col_1", header: "Channel", render: (m: any) => (<>{m.channel?.name || m.channelId}</>) },
                    { key: "col_2", header: "Recipient", render: (m: any) => (<>{m.recipient}</>) },
                    { key: "col_3", header: "Subject", render: (m: any) => (<>{m.subject || "-"}</>) },
                    { key: "col_4", header: "Status", render: (m: any) => (<>{m.status}</>) },
                  ];
                            return <DataTable columns={columns} data={messages} rowKey={(m: any) => m.id} />;
                          })()}</>
        </div>
      )}
    </div>
  );
}
