"use client";
import { DataTable } from "@kannan19302/ui";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => {
    const r = await fetch(`${BASE}${p}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

export default function HealthcareMedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const patients = await api.get("/ext/healthcare/deep/patients");
      const allRecords: any[] = [];
      for (const p of (patients.data || []).slice(0, 10)) {
        const r = await api
          .get(`/ext/healthcare/deep/patients/${p.id}/medical-records`)
          .catch(() => ({ data: [] }));
        for (const rec of r.data || [])
          allRecords.push({
            ...rec,
            patientName: `${p.firstName} ${p.lastName}`,
          });
      }
      setRecords(allRecords);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Medical Records (EHR)</h1>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Patient" , render: (r: any) => (<>{r.patientName}</>) },
                        { key: "col_1", header: "Title" , render: (r: any) => (<>{r.title}</>) },
                        { key: "col_2", header: "Type" , render: (r: any) => (<><span className="ui-badge ui-badge-info">
                                            {r.recordType}
                                          </span></>) },
                        { key: "col_3", header: "Diagnosis" , render: (r: any) => (<>{r.diagnosis || "-"}</>) },
                        { key: "col_4", header: "Signed" , render: (r: any) => (<>{r.signedBy
                                            ? `${r.signedBy} ${r.signedAt ? new Date(r.signedAt).toLocaleDateString() : ""}`
                                            : "Unsigned"}</>) },
                        { key: "col_5", header: "Date" , render: (r: any) => (<>{new Date(r.createdAt).toLocaleDateString()}</>) },
                      ];
                              return <DataTable columns={columns} data={records} rowKey={(r: any) => r.id} />;
                          })()}</>
        </div>
      )}
    </div>
  );
}
