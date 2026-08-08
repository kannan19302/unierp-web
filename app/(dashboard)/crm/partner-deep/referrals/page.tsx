import { DataTable } from "@kannan19302/ui";
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function PartnerReferralsPage() {
  const api = useApiClient();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/referrals")
      .then((res: any) => {
        setReferrals(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading referrals...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Partner Referrals</h1>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Company", render: (r: any) => (<>{r.companyName}</>) },
            { key: "col_1", header: "Contact", render: (r: any) => (<>{r.contactName}</>) },
            { key: "col_2", header: "Email", render: (r: any) => (<>{r.contactEmail}</>) },
            { key: "col_3", header: "Value", render: (r: any) => (<>{r.currency} {r.estimatedValue?.toLocaleString()}</>) },
            { key: "col_4", header: "Status", render: (r: any) => (<>{r.status}</>) },
          ];
                    return <DataTable columns={columns} data={referrals} rowKey={(r: any) => r.id} />;
                  })()}</>
    </div>
  );
}
