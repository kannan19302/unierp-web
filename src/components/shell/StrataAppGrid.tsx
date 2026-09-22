"use client";

import Link from "next/link";
import {
  StrataAppGrid as StrataAppGridUI,
  type AppTile,
  DEFAULT_STRATA_APPS,
} from "@kannan19302/ui/platforms/business-suite";

export type { AppTile };

export interface StrataAppGridProps {
  apps?: AppTile[];
}

export function StrataAppGrid({ apps = DEFAULT_STRATA_APPS }: StrataAppGridProps) {
  return <StrataAppGridUI apps={apps} linkComponent={Link} />;
}
