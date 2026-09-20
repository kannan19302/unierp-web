"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataBanner } from "@/components/shell/StrataBanner";
import s from "@/components/shell/strata-home.module.css";

export default function PersonalInformationPage() {
  const { claims } = useSession();

  const email =
    typeof (claims as Record<string, unknown> | null)?.email === "string"
      ? ((claims as Record<string, unknown>).email as string)
      : "alex@example.com";
  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : "Alex Rivera";
  const parts = userName.split(" ");
  const givenName = parts[0] || "Alex";
  const familyName = parts.slice(1).join(" ") || "Rivera";

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Personal information"
      subtitle="Visible across every organization you belong to."
      screenNumber="V2 / 08"
      actions={
        <>
          <button type="button" className={s.btnPrimary}>
            Save changes
          </button>
          <Link href="/account" className={s.btnSecondary}>
            Cancel
          </Link>
        </>
      }
    >
      <StrataPanel>
        <label className={s.field}>
          Given name
          <input
            type="text"
            className={s.fieldInput}
            defaultValue={givenName}
            placeholder="Given name"
          />
        </label>

        <label className={s.field}>
          Family name
          <input
            type="text"
            className={s.fieldInput}
            defaultValue={familyName}
            placeholder="Family name"
          />
        </label>

        <label className={s.field}>
          Display name
          <input
            type="text"
            className={s.fieldInput}
            defaultValue={userName}
            placeholder="Display name"
          />
        </label>

        <label className={s.field}>
          Work email
          <input
            type="email"
            className={s.fieldInput}
            defaultValue={email}
            readOnly
          />
        </label>
      </StrataPanel>

      <StrataBanner>
        Changing your email requires verification of the new address. Your
        current email remains active until the change is confirmed.
      </StrataBanner>
    </StrataPageShell>
  );
}
