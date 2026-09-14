"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      router.replace(`/people/${userId}`);
    } else {
      router.replace("/account?tab=personal");
    }
  }, [router, searchParams]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--color-text-secondary)" }}>
      <p>Redirecting to Account Center...</p>
    </div>
  );
}
