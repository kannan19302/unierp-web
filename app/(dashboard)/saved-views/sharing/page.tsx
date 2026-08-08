import { DataTable } from "@unerp/ui";
"use client";

import React from "react";

export default function SavedViewSharingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Saved View Permissions
          </h1>
          <p className="text-sm text-gray-500">
            Manage view sharing rules, role-level visibility, and default layout
            preferences.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + Share View
        </button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "View ID", render: (row: any) => (<>{row.col_0}</>) },
                { key: "col_1", header: "Shared With", render: (row: any) => (<>{row.col_1}</>) },
                { key: "col_2", header: "Permission", render: (row: any) => (<>{row.col_2}</>) },
                { key: "col_3", header: "Shared At", render: (row: any) => (<>{row.col_3}</>) },
              ];
                        return <DataTable columns={columns} data={[
                { col_0: ( <>vw_q1_pipeline_open</> ), col_1: ( <>role:SALES_MANAGER</> ), col_2: ( <><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                EDIT
                              </span></> ), col_3: ( <>2026-07-26</> ),  },
              ]} rowKey={(row: any, i: any) => String(i)} />;
                      })()}</>
      </div>
    </div>
  );
}
