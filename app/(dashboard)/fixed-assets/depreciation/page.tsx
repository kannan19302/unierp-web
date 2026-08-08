import { DataTable } from "@kannan19302/ui";
"use client";

import React from "react";

export default function AssetDepreciationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Depreciation Schedules
          </h1>
          <p className="text-sm text-gray-500">
            Track book value schedules, accumulated depreciation, and GL posting
            status.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Post Period Depreciation
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Period", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "Asset ID", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Start Book Value", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Depreciation Amount", render: (row: any) => (<>{row.col_3}</>) },
                { key: "col_4", header: "End Book Value", render: (row: any) => (<>{row.col_4}</>) },
                { key: "col_5", header: "Status", render: (row: any) => (<>{row.col_5}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>2026-07</> ), col_1: ( <>AST-10492</> ), col_2: ( <>$45,000.00</> ), col_3: ( <>-$1,250.00</> ), col_4: ( <>$43,750.00</> ), col_5: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                POSTED
                              </span></> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
