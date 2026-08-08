import { DataTable } from "@kannan19302/ui";
"use client";

import React from "react";

export default function PeopleSuccessionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Succession Planning
          </h1>
          <p className="text-sm text-gray-500">
            Pipeline readiness, key position bench strength, and talent risk
            analysis.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Succession Plan
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Position", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "Readiness", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Risk of Loss", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Impact of Loss", render: (row: any) => (<>{row.col_3}</>) },
                { key: "col_4", header: "Successor Bench", render: (row: any) => (<>{row.col_4}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>Chief Technology Officer</> ), col_1: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                READY_NOW
                              </span></> ), col_2: ( <><span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                                MEDIUM
                              </span></> ), col_3: ( <><span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                                CRITICAL
                              </span></> ), col_4: ( <>2 Candidates Identified</> ),  },
                { col_0: ( <>VP of Global Sales</> ), col_1: ( <><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                1_YEAR
                              </span></> ), col_2: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                LOW
                              </span></> ), col_3: ( <><span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-medium">
                                HIGH
                              </span></> ), col_4: ( <>3 Candidates Identified</> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
