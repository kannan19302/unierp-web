"use client";

import {
  BarChart3,
  BookOpen,
  DollarSign,
  Users,
  Package,
  Factory,
  Truck,
  Briefcase,
  Folder,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  Wrench,
  Building2,
  Store,
  LineChart,
  Sparkles,
  Grid,
  MessageSquare,
  Settings,
  Cloud,
  TrendingUp,
} from "lucide-react";
import {
  ProjectsTabLayout,
  PROJECTS_TABS,
} from "@/components/projects/ProjectsTabLayout";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-density="compact">
      <ProjectsTabLayout
        tabs={PROJECTS_TABS}
        moduleId="projects"
        moduleLabel="Projects"
        moduleIcon={Briefcase}
        moduleDescription="Project management, resources, workloads, and portfolios"
      >
        {children}
      </ProjectsTabLayout>
    </div>
  );
}
