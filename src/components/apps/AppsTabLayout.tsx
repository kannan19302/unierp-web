"use client";

import {
  ShoppingBag,
  Store,
  Heart,
  Code2,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import React, { type FC } from "react";
import {
  ModuleTabLayout,
  type ModuleTab,
  type ModuleTabLayoutProps,
} from "@kannan19302/ui/layout";

export {
  type ModuleTab as AppsTab,
  type ModuleTabLayoutProps as AppsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@kannan19302/ui/layout";

export const AppsTabLayout: FC<ModuleTabLayoutProps> = (props: any) => {
  return <ModuleTabLayout variant="card" {...props} />;
};

export const APPS_TABS: ModuleTab[] = [
  {
    id: "desk",
    label: "Workspace Desk",
    href: "/apps",
    icon: LayoutGrid,
    description: "Your operational enterprise applications",
  },
  {
    id: "developer",
    label: "Developer Portal",
    href: "/apps/developer",
    icon: Code2,
    description: "Publish and manage developer extensions",
  },
];
