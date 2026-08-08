"use client";
import { DataTable } from "@kannan19302/ui";

import React from "react";

export default function ApiRateLimitsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            API Rate Limits & Quotas
          </h1>
          <p className="text-sm text-gray-500">
            Configure rate limit buckets, client app quotas, and burst
            thresholds.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Rate Limit Rule
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Rule Name", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "Endpoint Pattern", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Limit / Min", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Burst Limit", render: (row: any) => (<>{row.col_3}</>) },
                { key: "col_4", header: "Client Tier", render: (row: any) => (<>{row.col_4}</>) },
                { key: "col_5", header: "Status", render: (row: any) => (<>{row.col_5}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>Standard REST API Rule</> ), col_1: ( <>/api/v1/*</> ), col_2: ( <>60 req/min</> ), col_3: ( <>100</> ), col_4: ( <><span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                                STANDARD
                              </span></> ), col_5: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                ACTIVE
                              </span></> ),  },
                { col_0: ( <>High-Throughput Partner API</> ), col_1: ( <>/api/v1/orders/*</> ), col_2: ( <>1,000 req/min</> ), col_3: ( <>2,500</> ), col_4: ( <><span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                                ENTERPRISE
                              </span></> ), col_5: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                ACTIVE
                              </span></> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
