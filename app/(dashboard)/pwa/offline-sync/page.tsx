import { DataTable } from "@kannan19302/ui";
"use client";

import React from "react";

export default function PwaOfflineSyncPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            PWA Offline Sync Queue
          </h1>
          <p className="text-sm text-gray-500">
            Monitor background sync requests captured when technicians or users
            were offline.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Force Re-Sync All
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Action Type", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "User ID", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Retries", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Status", render: (row: any) => (<>{row.col_3}</>) },
                { key: "col_4", header: "Enqueued At", render: (row: any) => (<>{row.col_4}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>TICKET_UPDATE</> ), col_1: ( <>usr_88291</> ), col_2: ( <>0</> ), col_3: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                SYNCED
                              </span></> ), col_4: ( <>2026-07-27 15:30:00</> ),  },
                { col_0: ( <>CREATE_SALES_ORDER</> ), col_1: ( <>usr_10492</> ), col_2: ( <>1</> ), col_3: ( <><span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                                PENDING
                              </span></> ), col_4: ( <>2026-07-27 15:42:10</> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
