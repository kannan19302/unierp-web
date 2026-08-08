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

export default function HealthcareAllergiesPage() {
  const [allergies, setAllergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const patients = await api.get("/ext/healthcare/deep/patients");
      const allAllergies: any[] = [];
      for (const p of (patients.data || []).slice(0, 20)) {
        const r = await api
          .get(`/ext/healthcare/deep/patients/${p.id}/allergies`)
          .catch(() => ({ data: [] }));
        for (const a of r.data || [])
          allAllergies.push({
            ...a,
            patientName: `${p.firstName} ${p.lastName}`,
          });
      }
      setAllergies(allAllergies);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Patient Allergies</h1>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Patient" , render: (a: any) => (<>{a.patientName}</>) },
                        { key: "col_1", header: "Allergen" , render: (a: any) => (<>{a.allergen}</>) },
                        { key: "col_2", header: "Severity" , render: (a: any) => (<><span
                                            className={`ui-badge ${a.severity === "SEVERE" ? "ui-badge-danger" : a.severity === "MODERATE" ? "ui-badge-warning" : "ui-badge-info"}`}
                                          >
                                            {a.severity}
                                          </span></>) },
                        { key: "col_3", header: "Reaction" , render: (a: any) => (<>{a.reaction || "-"}</>) },
                      ];
                              return <DataTable columns={columns} data={allergies} rowKey={(a: any) => a.id} />;
                          })()}</>
        </div>
      )}
    </div>
  );
}
