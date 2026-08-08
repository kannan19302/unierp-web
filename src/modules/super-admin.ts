import { defineModule, defineResource } from "@kannan19302/framework";

export const tenantResource = defineResource({
  name: "platform-tenants",
  labelSingular: "Tenant",
  labelPlural: "Tenants",
  endpoint: "/super-admin/tenants",
  titleField: "name",
  permissions: {
    read: "system.tenant.read",
    create: "system.tenant.create",
    update: "system.tenant.update",
  },
  status: {
    field: "status",
    tones: {
      ACTIVE: "success",
      TRIAL: "info",
      SUSPENDED: "warning",
      CANCELLED: "danger",
    },
  },
  fields: [
    { name: "name", label: "Organization Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    {
      name: "plan",
      label: "Plan",
      type: "select",
      defaultValue: "STARTER",
      options: [
        { value: "STARTER", label: "Starter" },
        { value: "PRO", label: "Pro" },
        { value: "ENTERPRISE", label: "Enterprise" },
      ],
    },
    { name: "adminEmail", label: "Admin Email", type: "email", required: true },
    { name: "status", label: "Status", type: "text", readOnly: true },
    { name: "userCount", label: "Users", type: "number", readOnly: true },
    { name: "createdAt", label: "Created", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["name", "slug", "plan", "status", "userCount", "createdAt"],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: "createdAt", direction: "desc" },
    selectable: true,
  },
});

export const adminUserResource = defineResource({
  name: "platform-admins",
  labelSingular: "Administrator",
  labelPlural: "Administrators",
  endpoint: "/super-admin/admins",
  titleField: "email",
  permissions: { read: "system.superadmin.access" },
  fields: [
    { name: "name", label: "Name", type: "text", readOnly: true },
    { name: "email", label: "Email", type: "email", readOnly: true },
    { name: "role", label: "Role", type: "text", readOnly: true },
    { name: "tenantName", label: "Tenant", type: "text", readOnly: true },
    { name: "status", label: "Status", type: "text", readOnly: true },
    {
      name: "lastLoginAt",
      label: "Last Login",
      type: "datetime",
      readOnly: true,
    },
  ],
  list: {
    columns: ["name", "email", "role", "tenantName", "status", "lastLoginAt"],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: "lastLoginAt", direction: "desc" },
  },
});

export const planResource = defineResource({
  name: "saas-plans",
  labelSingular: "Plan",
  labelPlural: "Plans",
  endpoint: "/platform/v1/plans",
  titleField: "name",
  permissions: {
    read: "system.superadmin.access",
    create: "system.superadmin.access",
    update: "system.superadmin.access",
  },
  status: {
    field: "status",
    tones: {
      ACTIVE: "success",
      ARCHIVED: "neutral",
      GRANDFATHERED: "warning",
      COMING_SOON: "info",
    },
  },
  fields: [
    { name: "name", label: "Plan Name", type: "text", required: true },
    { name: "version", label: "Version", type: "number", readOnly: true },
    { name: "maxUsers", label: "Max Users", type: "number", required: true },
    { name: "maxStorage", label: "Max Storage (MB)", type: "number", required: true },
    { name: "maxApiCalls", label: "Max API Calls", type: "number", required: true },
    { name: "status", label: "Status", type: "text", readOnly: true },
    { name: "isPublic", label: "Is Public", type: "boolean" },
    { name: "createdAt", label: "Created At", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["name", "version", "status", "maxUsers", "maxStorage", "isPublic"],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: "createdAt", direction: "desc" },
  },
});

export const meteringResource = defineResource({
  name: "tenant-metering",
  labelSingular: "Usage Record",
  labelPlural: "Usage Records",
  endpoint: "/platform/v1/metering",
  titleField: "metric",
  permissions: {
    read: "system.superadmin.access",
  },
  fields: [
    { name: "metric", label: "Metric", type: "text", readOnly: true },
    { name: "currentValue", label: "Current Usage", type: "number", readOnly: true },
    { name: "limitValue", label: "Limit", type: "number", readOnly: true },
    { name: "updatedAt", label: "Last Updated", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["metric", "currentValue", "limitValue", "updatedAt"],
    searchable: true,
    pageSize: 50,
    defaultSort: { field: "metric", direction: "asc" },
  },
});

export const subscriptionResource = defineResource({
  name: "tenant-subscriptions",
  labelSingular: "Subscription",
  labelPlural: "Subscriptions",
  endpoint: "/platform/v1/subscriptions",
  titleField: "status",
  permissions: {
    read: "system.superadmin.access",
    create: "system.superadmin.access",
    update: "system.superadmin.access",
  },
  status: {
    field: "status",
    tones: {
      ACTIVE: "success",
      PAUSED: "warning",
      CANCELLED: "danger",
      TRIAL: "info",
    },
  },
  fields: [
    { name: "tenantId", label: "Tenant ID", type: "text", required: true },
    { name: "planId", label: "Plan ID", type: "text", required: true },
    { name: "status", label: "Status", type: "text", readOnly: true },
    { name: "billingPeriod", label: "Billing Period", type: "text", required: true },
    { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
    { name: "startDate", label: "Start Date", type: "datetime", readOnly: true },
    { name: "endDate", label: "End Date", type: "datetime", readOnly: true },
  ],
  list: {
    columns: ["tenantId", "status", "billingPeriod", "currency", "startDate", "endDate"],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: "startDate", direction: "desc" },
  },
});

export const superAdminModule = defineModule({
  id: "super-admin",
  title: "Super Admin",
  basePath: "/settings/super-admin",
  permission: "system.tenant.read",
  resources: [tenantResource, adminUserResource, planResource, meteringResource, subscriptionResource],
});
