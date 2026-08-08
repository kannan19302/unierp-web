"use client";
import { DataTable } from "@kannan19302/ui";

import React from "react";

export default function StorageBucketsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage Buckets</h1>
          <p className="text-sm text-gray-500">
            Configure S3/Azure cloud storage buckets, quotas, and lifecycle
            policies.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Connect Bucket
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Bucket Name", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "Provider", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Region", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Quota", render: (row: any) => (<>{row.col_3}</>) },
                { key: "col_4", header: "Current Usage", render: (row: any) => (<>{row.col_4}</>) },
                { key: "col_5", header: "Versioning", render: (row: any) => (<>{row.col_5}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>unerp-doc-vault-prod</> ), col_1: ( <><span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                                AWS S3
                              </span></> ), col_2: ( <>us-east-1</> ), col_3: ( <>500 GB</> ), col_4: ( <>124.5 GB (24.9%)</> ), col_5: ( <><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                ENABLED
                              </span></> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
