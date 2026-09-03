"use client";
import React, { useState } from "react";
import { Card, PageHeader, Button, Input, DataTable } from "@kannan19302/ui";
import { Search, Merge } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

export default function DuplicatesPage() {
  const [entityType, setEntityType] = useState("LEAD");
  const [field, setField] = useState("email");
  const [value, setValue] = useState("");
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterId, setMasterId] = useState("");
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [mergeResult, setMergeResult] = useState("");

  const findDuplicates = async () => {
    if (!value) return;
    setLoading(true);
    try {
      const data = await apiGet<any[]>(
        `/crm/data/duplicates/${entityType}?field=${field}&value=${encodeURIComponent(value)}`,
      );
      setDuplicates(Array.isArray(data) ? data : []);
    } catch {
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMergeId = (id: string) => {
    setMergeIds((prev: any) =>
      prev.includes(id) ? prev.filter((x: any) => x !== id) : [...prev, id],
    );
  };

  const executeMerge = async () => {
    if (!masterId || mergeIds.length === 0)
      return alert("Select a master and at least one record to merge");
    try {
      const result = await apiSend("/crm/data/merge", "POST", {
        entityType,
        masterId,
        mergeIds,
      });
      setMergeResult("Merge completed successfully");
      setDuplicates([]);
      setMergeIds([]);
      setMasterId("");
    } catch (e: any) {
      setMergeResult("Merge failed: " + (e.message || "Unknown error"));
    }
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Duplicate Detection & Merge"
        description="Find and merge duplicate records to keep your data clean"
      />

      <Card title="Find Duplicates">
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={entityType}
              onChange={(e: any) => setEntityType(e.target.value)}
            >
              <option value="LEAD">Lead</option>
              <option value="CONTACT">Contact</option>
              <option value="CUSTOMER">Customer</option>
              <option value="OPPORTUNITY">Opportunity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field
            </label>
            <input
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={field}
              onChange={(e: any) => setField(e.target.value)}
              placeholder="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <Input
              value={value}
              onChange={(e: any) => setValue(e.target.value)}
              placeholder="Search value"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={findDuplicates}
            disabled={loading}
          >
            <Search className="w-4 h-4 mr-1" />
            Find
          </Button>
        </div>
      </Card>

      {duplicates.length > 0 && (
        <Card title={`Found ${duplicates.length} matching records`}>
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Master", render: (dup: any) => (<><input
                                        type="radio"
                                        name="master"
                                        checked={masterId === dup.id}
                                        onChange={() => setMasterId(dup.id)}
                                      /></>) },
                    { key: "col_1", header: "Merge", render: (dup: any) => (<><input
                                        type="checkbox"
                                        checked={mergeIds.includes(dup.id)}
                                        onChange={() => toggleMergeId(dup.id)}
                                        disabled={masterId === dup.id}
                                      /></>) },
                    { key: "col_2", header: "ID", render: (dup: any) => (<>{dup.id}</>) },
                    { key: "col_3", header: "Email", render: (dup: any) => (<>{dup.email || dup.firstName || "—"}</>) },
                  ];
                            return <DataTable columns={columns} data={duplicates} rowKey={(dup: any) => dup.id} />;
                          })()}</>
          <Button
            variant="primary"
            size="sm"
            onClick={executeMerge}
            disabled={!masterId || mergeIds.length === 0}
          >
            <Merge className="w-4 h-4 mr-1" />
            Merge Selected
          </Button>
        </Card>
      )}

      {mergeResult && (
        <div
          className={`p-3 rounded text-sm ${mergeResult.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {mergeResult}
        </div>
      )}
    </div>
  );
}
