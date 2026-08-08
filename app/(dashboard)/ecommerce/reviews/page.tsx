"use client";
import React, { useState, useEffect } from "react";
import { Star, Check, X } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast, DataTable } from "@unerp/ui";

export default function EcommerceReviewsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (listingId && storeId) load();
  }, [listingId, storeId, page]);
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const d = await client.get<any>(
        `/ecommerce/exp/${storeId}/listings/${listingId}/reviews?${params}`,
      );
      if (d?.data) {
        setItems(d.data);
        setTotalPages(d.meta?.totalPages || 1);
      }
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load reviews.";
      setLoadError(message);
      notifyError("Failed to load reviews", message);
    }
    setLoading(false);
  };
  const moderate = async (id: string, approved: boolean) => {
    try {
      await client.post(`/ecommerce/exp/reviews/${id}/moderate`, { approved });
      load();
    } catch (err) {
      notifyError(
        "Failed to moderate review",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="ecommerce.listing.read">
      <div className="ui-stack-6">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Star className="ui-text-primary" /> Product Reviews
          </h1>
          <p className="ui-text-sm-muted">Moderate customer reviews.</p>
        </div>
        <div className="ui-card ui-hstack-2">
          <input
            className="ui-input"
            placeholder="Store ID..."
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          />
          <input
            className="ui-input"
            placeholder="Listing ID..."
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
          />
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">{loadError}</div>
        )}
        <div className="ui-card">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Customer", render: (i: any) => (<>{i.customerName || "Anonymous"}</>) },
                    { key: "col_1", header: "Rating", render: (i: any) => (<>{"★".repeat(i.rating)}
                                        {"☆".repeat(5 - i.rating)}</>) },
                    { key: "col_2", header: "Comment", render: (i: any) => (<>{i.comment || "-"}</>) },
                    { key: "col_3", header: "Verified", render: (i: any) => (<>{i.isVerified ? (
                                          <span className="ui-badge-success">Yes</span>
                                        ) : (
                                          "No"
                                        )}</>) },
                    { key: "col_4", header: "Approved", render: (i: any) => (<>{i.isApproved ? (
                                          <span className="ui-badge-success">Yes</span>
                                        ) : (
                                          <span className="ui-badge">No</span>
                                        )}</>) },
                    { key: "col_5", header: "Actions", render: (i: any) => (<>{!i.isApproved && (
                                          <button
                                            className="ui-btn-icon ui-text-success"
                                            onClick={() => moderate(i.id, true)}
                                          >
                                            <Check size={14} />
                                          </button>
                                        )}
                                        <button
                                          className="ui-btn-icon ui-text-error"
                                          onClick={() => moderate(i.id, false)}
                                        >
                                          <X size={14} />
                                        </button></>) },
                  ];
                            return <DataTable columns={columns} data={items} rowKey={(i: any) => i.id} />;
                          })()}</>
        </div>
      </div>
    </RouteGuard>
  );
}
