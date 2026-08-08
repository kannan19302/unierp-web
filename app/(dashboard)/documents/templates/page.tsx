"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Spinner, useToast } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import { Plus } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string | null;
  content: string;
  variables: { key: string; label: string; type: string }[];
  createdAt: string;
}

export default function TemplatesPage() {
  const client = useApiClient();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get<Template[]>("/documents/templates")
      .then((res: any) => setTemplates((res as any) || []))
      .catch((e: any) =>
        toast({
          title: "Failed to load templates",
          description: e.message,
          variant: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [client, toast]);

  const columns: Column<Template>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r: any) => <span className="ui-text-medium">{r.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (r: any) => r.category || <span className="ui-text-muted">—</span>,
    },
    {
      key: "variables",
      header: "Variables",
      render: (r: any) => <span>{r.variables?.length || 0} vars</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (r: any) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Document Templates"
        description="Manage reusable document templates with variable substitution"
      />
      <Card>
        <div className="ui-flex-end p-4">
          <Button leftIcon={<Plus size={16} />}>New Template</Button>
        </div>
        <DataTable columns={columns} data={templates} />
      </Card>
    </>
  );
}
