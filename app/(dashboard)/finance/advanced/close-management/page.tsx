"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList,
  RefreshCw,
  Loader2,
  Plus,
  Calendar,
  AlertTriangle,
  Check,
  BarChart3,
  Flag,
} from "lucide-react";
import { Card, Button, ConfirmDialog, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient, usePermission } from "@kannan19302/framework";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import { buildCloseCalendarInput, type CloseCalendarEvent, type CloseCalendarForm } from "@/modules/finance-close-calendar";

interface TaskDependency {
  id: string;
  taskName: string;
  dependsOn: string;
  dependencyType: string;
  status: string;
}

interface EscalationRule {
  id: string;
  name: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  escalateToRole: string | null;
  escalateToUser: string | null;
  notifyMethod: string;
  isActive: boolean;
}

interface CloseAnalytics {
  total: number;
  done: number;
  overdue: number;
}
interface PeriodAnalytics {
  snapshotCount: number;
  latest: { completedTasks: number; totalTasks: number; overdueTasks: number; breachedSlas: number; capturedAt: string } | null;
}
interface CloseTrends { periodCount: number; totalSnapshots: number; }
interface CriticalPath { criticalDependencies: number; blockedTasks: number; }

interface FinancialPeriod { id: string; name: string; }
interface PeriodEvents { total: number; pending: number; completed: number; completionRate: number; events: CloseCalendarEvent[]; }

interface BreachedCloseSla {
  id: string;
  task: { id: string; name: string } | null;
  deadlineAt: string;
  breachedAt: string | null;
  slaMinutes: number;
  priority: string;
}
interface CloseTaskSla {
  id: string; taskId: string; status: string; priority: string; startedAt: string | null;
  responseDeadlineAt: string | null; deadlineAt: string; policyVersionId: string | null;
}
interface CloseTaskSlaPage { items: CloseTaskSla[]; total: number; page: number; limit: number; totalPages: number; }

interface CloseSlaPolicyVersion {
  id: string; version: number; name: string; taskType: string; priority: string;
  responseTimeMs: number; resolutionTimeMs: number;
  escalationRules?: Array<{ ruleId: string }>;
}
interface CloseSlaPolicy {
  id: string; currentVersion: number; status: string; versions: CloseSlaPolicyVersion[];
}
interface CloseSlaPolicyPage { items: CloseSlaPolicy[]; total: number; page: number; limit: number; totalPages: number; }

export default function CloseManagementPage() {
  const client = useApiClient();
  const loadSequence = useRef(0);
  const calendarActionPending = useRef(false);
  const dependencyActionPending = useRef(false);
  const slaActionPending = useRef(false);
  const escalationActionPending = useRef(false);
  const [pendingRemoval, setPendingRemoval] = useState<TaskDependency | null>(null);
  const [pendingRetirement, setPendingRetirement] = useState<CloseSlaPolicy | null>(null);
  const [pendingRuleRetirement, setPendingRuleRetirement] = useState<EscalationRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null);
  const [removalError, setRemovalError] = useState("");
  const canRead = usePermission("finance.close.read");
  const canManage = usePermission("finance.close.manage");
  const canReadTasks = usePermission("finance.fpa.read");
  const [dependencyPeriodId, setDependencyPeriodId] = useState("");
  const [taskChoices, setTaskChoices] = useState<Array<{ id: string; name: string }>>([]);
  const canReadPeriods = usePermission("finance.period.read");
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "tasks") as string;

  const [tasks, setTasks] = useState<TaskDependency[]>([]);
  const [breachedSlas, setBreachedSlas] = useState<BreachedCloseSla[]>([]);
  const [taskSlas, setTaskSlas] = useState<CloseTaskSla[]>([]);
  const [taskSlaPage, setTaskSlaPage] = useState(1);
  const [taskSlaPageInfo, setTaskSlaPageInfo] = useState({ total: 0, totalPages: 0 });
  const [slaPolicies, setSlaPolicies] = useState<CloseSlaPolicy[]>([]);
  const [policyPage, setPolicyPage] = useState(1);
  const [policyPageInfo, setPolicyPageInfo] = useState({ total: 0, totalPages: 0 });
  const [events, setEvents] = useState<CloseCalendarEvent[]>([]);
  const [calendarPeriodId, setCalendarPeriodId] = useState("");
  const [calendarPeriodSummary, setCalendarPeriodSummary] = useState<PeriodEvents | null>(null);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [analytics, setAnalytics] = useState<CloseAnalytics | null>(null);
  const [periodAnalytics, setPeriodAnalytics] = useState<PeriodAnalytics | null>(null);
  const [trends, setTrends] = useState<CloseTrends | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPath | null>(null);
  const [analyticsPeriodId, setAnalyticsPeriodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSlaForm, setShowSlaForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [revisionPolicy, setRevisionPolicy] = useState<CloseSlaPolicy | null>(null);
  const [assignmentPeriodId, setAssignmentPeriodId] = useState("");
  const [assignmentTasks, setAssignmentTasks] = useState<Array<{ id: string; name: string }>>([]);

  const [taskForm, setTaskForm] = useState({
    successorTaskId: "",
    predecessorTaskId: "",
    dependencyType: "FINISH_TO_START",
  });
  const [slaForm, setSlaForm] = useState({
    name: "",
    taskType: "APPROVAL",
    priority: "NORMAL",
    responseHours: "1",
    resolutionHours: "24",
    escalationRuleIds: [] as string[],
  });
  const [eventForm, setEventForm] = useState<CloseCalendarForm>({
    periodId: "", title: "", dueAt: "", eventType: "REVIEW", description: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    mode: "POLICY" as "POLICY" | "MANUAL", taskId: "", policyVersionId: "",
    startedAt: "", deadlineAt: "", responseDeadlineAt: "", priority: "NORMAL",
  });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    conditionField: "status",
    conditionOperator: "EQUALS",
    conditionValue: "SLA_BREACH",
    escalateToRole: "FINANCE_MANAGER",
    notifyMethod: "EMAIL",
  });

  const fetchData = useCallback(async () => {
    if (!canRead) return;
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      if (activeTab === "calendar") {
        const records = await client.get<CloseCalendarEvent[]>("/advanced-finance/close-management/calendar/events");
        if (sequence === loadSequence.current) setEvents(records);
      } else if (activeTab === "tasks") {
        const records = await client.get<TaskDependency[]>("/advanced-finance/close-management/task-dependencies");
        if (sequence === loadSequence.current) setTasks(records);
      } else if (activeTab === "breached-slas") {
        const records = await client.get<BreachedCloseSla[]>("/advanced-finance/close-management/slas/breached");
        if (sequence === loadSequence.current) setBreachedSlas(records);
      } else if (activeTab === "task-slas") {
        const result = await client.get<CloseTaskSlaPage>(`/advanced-finance/close-management/slas?page=${taskSlaPage}&limit=20`);
        if (sequence === loadSequence.current) {
          setTaskSlas(result.items); setTaskSlaPageInfo({ total: result.total, totalPages: result.totalPages });
        }
      } else if (activeTab === "sla-policies") {
        const result = await client.get<CloseSlaPolicyPage>(`/advanced-finance/close-management/sla-policies?page=${policyPage}&limit=20`);
        if (sequence === loadSequence.current) {
          setSlaPolicies(result.items);
          setPolicyPageInfo({ total: result.total, totalPages: result.totalPages });
        }
      } else if (activeTab === "escalations") {
        const records = await client.get<EscalationRule[]>("/advanced-finance/close-management/escalation-rules");
        if (sequence === loadSequence.current) setRules(records);
      } else if (activeTab === "analytics") {
        const [summary, trendData, critical] = await Promise.all([
          analyticsPeriodId
            ? client.get<CloseAnalytics>(`/advanced-finance/close-management/status-summary?periodId=${encodeURIComponent(analyticsPeriodId)}`)
            : client.get<CloseAnalytics>("/advanced-finance/close-management/status-summary"),
          client.get<CloseTrends>("/advanced-finance/close-management/trends"),
          analyticsPeriodId
            ? client.get<CriticalPath>(`/advanced-finance/close-management/critical-path?periodId=${encodeURIComponent(analyticsPeriodId)}`)
            : client.get<CriticalPath>("/advanced-finance/close-management/critical-path"),
        ]);
        const periodData = analyticsPeriodId
          ? await client.get<PeriodAnalytics>(`/advanced-finance/close-management/analytics/${encodeURIComponent(analyticsPeriodId)}`)
          : null;
        if (sequence === loadSequence.current) {
          setAnalytics(summary); setTrends(trendData); setCriticalPath(critical); setPeriodAnalytics(periodData);
        }
      }
    } catch (error) {
      if (sequence === loadSequence.current) setError(error instanceof Error ? error.message : "Failed to load close management data.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [client, activeTab, canRead, policyPage, taskSlaPage, analyticsPeriodId]);

  useEffect(() => {
    void fetchData();
    return () => { loadSequence.current += 1; };
  }, [fetchData]);

  useEffect(() => {
    if ((!showEventForm && !showTaskForm && !showAssignmentForm && activeTab !== "analytics" && activeTab !== "calendar") || !canReadPeriods) return;
    let active = true;
    client.get<FinancialPeriod[]>("/advanced-finance/financial-periods").then((records) => {
      if (active) setPeriods(records);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : "Failed to load financial periods.");
    });
    return () => { active = false; };
  }, [client, showEventForm, showTaskForm, showAssignmentForm, activeTab, canReadPeriods]);

  useEffect(() => {
    if (activeTab !== "calendar" || !calendarPeriodId || !canRead) {
      setCalendarPeriodSummary(null);
      return;
    }
    let active = true;
    client.get<PeriodEvents>(`/advanced-finance/close-management/calendar/period-events/${encodeURIComponent(calendarPeriodId)}`)
      .then((summary) => { if (active) { setCalendarPeriodSummary(summary); setEvents(summary.events); } })
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : "Failed to load period calendar.");
      });
    return () => { active = false; };
  }, [client, activeTab, calendarPeriodId, canRead]);

  useEffect(() => {
    if ((!showSlaForm && !revisionPolicy) || !canRead) return;
    let active = true;
    client.get<EscalationRule[]>("/advanced-finance/close-management/escalation-rules?isActive=true")
      .then((records) => { if (active) setRules(records); })
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : "Failed to load escalation rules.");
      });
    return () => { active = false; };
  }, [client, showSlaForm, revisionPolicy, canRead]);

  useEffect(() => {
    if (!showAssignmentForm || !canRead) return;
    let active = true;
    client.get<CloseSlaPolicyPage>("/advanced-finance/close-management/sla-policies?page=1&limit=100").then((result) => {
      if (active) setSlaPolicies(result.items);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : "Failed to load SLA policies.");
    });
    return () => { active = false; };
  }, [client, showAssignmentForm, canRead]);

  useEffect(() => {
    setAssignmentTasks([]);
    if (!assignmentPeriodId || !canReadTasks) return;
    let active = true;
    client.get<Array<{ id: string; name: string }>>(`/advanced-finance/close-tasks?periodId=${encodeURIComponent(assignmentPeriodId)}`).then((records) => {
      if (active) setAssignmentTasks(records);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : "Failed to load close tasks.");
    });
    return () => { active = false; };
  }, [client, assignmentPeriodId, canReadTasks]);

  useEffect(() => {
    setTaskChoices([]);
    if (!dependencyPeriodId || !canReadTasks) return;
    let active = true;
    client.get<Array<{ id: string; name: string }>>(`/advanced-finance/close-tasks?periodId=${encodeURIComponent(dependencyPeriodId)}`).then((records) => {
      if (active) setTaskChoices(records);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : "Failed to load close tasks.");
    });
    return () => { active = false; };
  }, [client, dependencyPeriodId, canReadTasks]);

  const handleCreateTask = async () => {
    if (!canManage || actionLoading) return;
    if (!taskForm.successorTaskId || !taskForm.predecessorTaskId || taskForm.successorTaskId === taskForm.predecessorTaskId) {
      setError("Choose two different close tasks.");
      return;
    }
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/close-management/task-dependencies",
        taskForm,
      );
      setSuccess("Task dependency added.");
      setShowTaskForm(false);
      setTaskForm({
        successorTaskId: "",
        predecessorTaskId: "",
        dependencyType: "FINISH_TO_START",
      });
      fetchData();
    } catch {
      setError("Failed to add dependency.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDependency = async () => {
    if (!canManage || !pendingRemoval || actionLoading || dependencyActionPending.current) return;
    dependencyActionPending.current = true;
    setActionLoading(true);
    setRemovalError("");
    setError("");
    setSuccess("");
    try {
      await client.delete(`/advanced-finance/close-management/task-dependencies/${encodeURIComponent(pendingRemoval.id)}`);
      setPendingRemoval(null);
      setSuccess("Task dependency removed.");
      await fetchData();
    } catch (error) {
      setRemovalError(error instanceof Error ? error.message : "Failed to remove dependency.");
    } finally {
      dependencyActionPending.current = false;
      setActionLoading(false);
    }
  };

  const handleCreateSla = async () => {
    if (!canManage || slaActionPending.current) return;
    const responseTimeMs = Number(slaForm.responseHours) * 3_600_000;
    const resolutionTimeMs = Number(slaForm.resolutionHours) * 3_600_000;
    if (!slaForm.name.trim() || !Number.isSafeInteger(responseTimeMs) || responseTimeMs <= 0 ||
      !Number.isSafeInteger(resolutionTimeMs) || resolutionTimeMs < responseTimeMs) {
      setError("Enter a name and valid response/resolution hours; resolution must not be shorter than response.");
      return;
    }
    slaActionPending.current = true;
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/close-management/sla-policies", {
        name: slaForm.name.trim(), taskType: slaForm.taskType, priority: slaForm.priority,
        timeBasis: "ELAPSED", responseTimeMs, resolutionTimeMs, escalationRuleIds: slaForm.escalationRuleIds,
      });
      setSuccess("SLA policy created.");
      setShowSlaForm(false);
      setSlaForm({
        name: "",
        taskType: "APPROVAL",
        priority: "NORMAL",
        responseHours: "1",
        resolutionHours: "24",
        escalationRuleIds: [],
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create SLA policy.");
    } finally {
      slaActionPending.current = false;
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!canManage || calendarActionPending.current) return;
    calendarActionPending.current = true;
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      await client.post("/advanced-finance/close-management/calendar/events", buildCloseCalendarInput(eventForm));
      setSuccess("Calendar event added.");
      setShowEventForm(false);
      setEventForm({ periodId: "", title: "", dueAt: "", eventType: "REVIEW", description: "" });
      await fetchData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add calendar event.");
    } finally {
      calendarActionPending.current = false;
      setActionLoading(false);
    }
  };

  const localInstant = (value: string) => {
    const instant = new Date(value);
    if (!value || Number.isNaN(instant.getTime())) throw new Error("Enter valid date and time values.");
    return instant.toISOString();
  };

  const handleAssignSla = async () => {
    if (!canManage || slaActionPending.current || !assignmentForm.taskId) return;
    slaActionPending.current = true;
    setActionLoading(true); setError(""); setSuccess("");
    try {
      if (assignmentForm.mode === "POLICY" && !assignmentForm.policyVersionId) throw new Error("Choose an SLA policy.");
      const common = { taskId: assignmentForm.taskId, startedAt: localInstant(assignmentForm.startedAt),
        idempotencyKey: crypto.randomUUID() };
      const body = assignmentForm.mode === "POLICY"
        ? { ...common, mode: "POLICY", policyVersionId: assignmentForm.policyVersionId }
        : { ...common, mode: "MANUAL", deadlineAt: localInstant(assignmentForm.deadlineAt),
            ...(assignmentForm.responseDeadlineAt ? { responseDeadlineAt: localInstant(assignmentForm.responseDeadlineAt) } : {}),
            priority: assignmentForm.priority };
      await client.post("/advanced-finance/close-management/task-slas", body);
      setSuccess("Task SLA assigned."); setShowAssignmentForm(false);
      setAssignmentForm({ mode: "POLICY", taskId: "", policyVersionId: "", startedAt: "",
        deadlineAt: "", responseDeadlineAt: "", priority: "NORMAL" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to assign task SLA.");
    } finally { slaActionPending.current = false; setActionLoading(false); }
  };

  const handleRevisePolicy = async () => {
    if (!canManage || !revisionPolicy || slaActionPending.current) return;
    const latest = revisionPolicy.versions[0];
    if (!latest) return;
    slaActionPending.current = true; setActionLoading(true); setError(""); setSuccess("");
    try {
      const responseTimeMs = Number(slaForm.responseHours) * 3_600_000;
      const resolutionTimeMs = Number(slaForm.resolutionHours) * 3_600_000;
      if (!slaForm.name.trim() || !Number.isSafeInteger(responseTimeMs) || responseTimeMs <= 0 ||
        !Number.isSafeInteger(resolutionTimeMs) || resolutionTimeMs < responseTimeMs) {
        throw new Error("Enter valid response/resolution hours; resolution must not be shorter than response.");
      }
      await client.post(`/advanced-finance/close-management/sla-policies/${encodeURIComponent(revisionPolicy.id)}/versions`, {
        name: slaForm.name.trim(), taskType: slaForm.taskType, priority: slaForm.priority, timeBasis: "ELAPSED",
        responseTimeMs, resolutionTimeMs,
        escalationRuleIds: slaForm.escalationRuleIds, expectedVersion: revisionPolicy.currentVersion,
      });
      setRevisionPolicy(null); setSuccess("SLA policy revised."); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to revise SLA policy."); }
    finally { slaActionPending.current = false; setActionLoading(false); }
  };

  const handleRetirePolicy = async () => {
    if (!canManage || !pendingRetirement || slaActionPending.current) return;
    slaActionPending.current = true; setActionLoading(true); setError(""); setSuccess("");
    try {
      await client.post(`/advanced-finance/close-management/sla-policies/${encodeURIComponent(pendingRetirement.id)}/retire`, {
        expectedVersion: pendingRetirement.currentVersion,
      });
      setPendingRetirement(null); setSuccess("SLA policy retired."); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to retire SLA policy."); }
    finally { slaActionPending.current = false; setActionLoading(false); }
  };

  const handleCompleteEvent = async (id: string) => {
    if (!canManage || calendarActionPending.current) return;
    calendarActionPending.current = true;
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      await client.post(`/advanced-finance/close-management/calendar/events/${encodeURIComponent(id)}/complete`, {});
      setSuccess("Calendar event completed.");
      await fetchData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to complete calendar event.");
    } finally {
      calendarActionPending.current = false;
      setActionLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!canManage || escalationActionPending.current || !ruleForm.name.trim() || !ruleForm.escalateToRole.trim()) return;
    escalationActionPending.current = true;
    setActionLoading(true);
    try {
      await client.post(
        "/advanced-finance/close-management/escalation-rules",
        ruleForm,
      );
      setSuccess("Escalation rule created.");
      setShowRuleForm(false);
      setRuleForm({ name: "", conditionField: "status", conditionOperator: "EQUALS",
        conditionValue: "SLA_BREACH", escalateToRole: "FINANCE_MANAGER", notifyMethod: "EMAIL" });
      fetchData();
    } catch {
      setError("Failed to create escalation rule.");
    } finally {
      escalationActionPending.current = false;
      setActionLoading(false);
    }
  };

  const handleToggleRule = async (rule: EscalationRule) => {
    if (!canManage || escalationActionPending.current) return;
    escalationActionPending.current = true; setActionLoading(true); setError(""); setSuccess("");
    try {
      await client.patch(`/advanced-finance/close-management/escalation-rules/${encodeURIComponent(rule.id)}`, {
        isActive: !rule.isActive,
      });
      setSuccess(`Escalation rule ${rule.isActive ? "disabled" : "enabled"}.`); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to update escalation rule."); }
    finally { escalationActionPending.current = false; setActionLoading(false); }
  };

  const handleViewRule = async (rule: EscalationRule) => {
    setError("");
    try {
      setSelectedRule(await client.get<EscalationRule>(
        `/advanced-finance/close-management/escalation-rules/${encodeURIComponent(rule.id)}`,
      ));
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to load escalation rule."); }
  };

  const handleRetireRule = async () => {
    if (!canManage || !pendingRuleRetirement || escalationActionPending.current) return;
    escalationActionPending.current = true; setActionLoading(true); setError(""); setSuccess("");
    try {
      await client.delete(`/advanced-finance/close-management/escalation-rules/${encodeURIComponent(pendingRuleRetirement.id)}`);
      setPendingRuleRetirement(null); setSuccess("Escalation rule retired."); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to retire escalation rule."); }
    finally { escalationActionPending.current = false; setActionLoading(false); }
  };

  const handleCaptureSnapshot = async () => {
    if (!canManage || !analyticsPeriodId || actionLoading) return;
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await client.post("/advanced-finance/close-management/snapshots", { periodId: analyticsPeriodId });
      setSuccess("Close analytics snapshot captured."); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to capture close snapshot."); }
    finally { setActionLoading(false); }
  };

  const handleResolveTaskSla = async (sla: CloseTaskSla) => {
    if (!canManage || slaActionPending.current || sla.status === "RESOLVED") return;
    slaActionPending.current = true; setActionLoading(true); setError(""); setSuccess("");
    try {
      await client.patch(`/advanced-finance/close-management/slas/${encodeURIComponent(sla.id)}/status`, { status: "RESOLVED" });
      setSuccess("Task SLA resolved."); await fetchData();
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to resolve task SLA."); }
    finally { slaActionPending.current = false; setActionLoading(false); }
  };

  return (
    <RouteGuard permission="finance.close.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <div className="ui-title-section">
              <ClipboardList className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Advanced Close Management</h1>
            </div>
            <p className="ui-page-subtitle">
              Task dependencies, SLAs, close calendar, escalations, and close
              analytics.
            </p>
          </div>
          <div className="ui-page-actions">
            <Button variant="outline" aria-label="Refresh close management" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert-error mb-4" role="alert">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="ui-alert ui-alert-success mb-4" role="status">
            <Check size={16} /> {success}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div
            className="ui-grid-3 mb-4"
            style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
          >
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                Total Tasks
              </h3>
              <p className="text-2xl font-bold mt-1">
                {analytics.total}
              </p>
            </Card>
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                Overdue Tasks
              </h3>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {analytics.overdue}
              </p>
            </Card>
            <Card className="ui-card p-4">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">
                Tasks Completed
              </h3>
              <p className="text-2xl font-bold mt-1">
                {analytics.done}
              </p>
            </Card>
          </div>
        )}

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "tasks",
                  label: "Tasks / SLAs",
                  href: "/finance/advanced/close-management?subtab=tasks",
                  icon: ClipboardList,
                },
                {
                  id: "calendar",
                  label: "Close Calendar",
                  href: "/finance/advanced/close-management?subtab=calendar",
                  icon: Calendar,
                },
                {
                  id: "breached-slas",
                  label: "Breached SLAs",
                  href: "/finance/advanced/close-management?subtab=breached-slas",
                  icon: AlertTriangle,
                },
                {
                  id: "task-slas",
                  label: "Task SLAs",
                  href: "/finance/advanced/close-management?subtab=task-slas",
                  icon: Check,
                },
                {
                  id: "sla-policies",
                  label: "SLA Policies",
                  href: "/finance/advanced/close-management?subtab=sla-policies",
                  icon: Flag,
                },
                {
                  id: "escalations",
                  label: "Escalations",
                  href: "/finance/advanced/close-management?subtab=escalations",
                  icon: Flag,
                },
                {
                  id: "analytics",
                  label: "Close Analytics",
                  href: "/finance/advanced/close-management?subtab=analytics",
                  icon: BarChart3,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab === "tasks" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button disabled={!canManage || !canReadPeriods || !canReadTasks} onClick={() => setShowTaskForm(!showTaskForm)}>
                  <Plus size={16} className="mr-1" /> Add Dependency
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSlaForm(!showSlaForm)}
                >
                  <Plus size={16} className="mr-1" /> Configure SLA
                </Button>
                <Button variant="secondary" disabled={!canManage || !canReadPeriods || !canReadTasks}
                  onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                  <Plus size={16} className="mr-1" /> Assign SLA
                </Button>
              </div>
            </div>

            {showTaskForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Add Task Dependency</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="dependency-period">Financial period</label>
                    <select id="dependency-period" className="ui-input" value={dependencyPeriodId} onChange={(event) => {
                      setDependencyPeriodId(event.target.value);
                      setTaskForm({ ...taskForm, successorTaskId: "", predecessorTaskId: "" });
                    }}>
                      <option value="">Choose a period</option>
                      {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="dependency-successor">Task</label>
                    <select id="dependency-successor" className="ui-input" value={taskForm.successorTaskId} onChange={(event) => setTaskForm({ ...taskForm, successorTaskId: event.target.value })}>
                      <option value="">Choose the dependent task</option>
                      {taskChoices.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="dependency-predecessor">Depends on</label>
                    <select id="dependency-predecessor" className="ui-input" value={taskForm.predecessorTaskId} onChange={(event) => setTaskForm({ ...taskForm, predecessorTaskId: event.target.value })}>
                      <option value="">Choose the prerequisite task</option>
                      {taskChoices.filter((task) => task.id !== taskForm.successorTaskId).map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="dependency-type">Dependency Type</label>
                    <select
                      id="dependency-type"
                      className="ui-input"
                      value={taskForm.dependencyType}
                      onChange={(e: any) =>
                        setTaskForm({
                          ...taskForm,
                          dependencyType: e.target.value,
                        })
                      }
                    >
                      <option value="FINISH_TO_START">Finish → Start</option>
                      <option value="START_TO_START">Start → Start</option>
                      <option value="FINISH_TO_FINISH">Finish → Finish</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateTask} disabled={actionLoading || !canManage || !taskForm.predecessorTaskId || !taskForm.successorTaskId}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Add
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowTaskForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {showSlaForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Create reusable SLA policy</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-policy-name">Policy name</label>
                    <input
                      id="sla-policy-name"
                      className="ui-input"
                      value={slaForm.name}
                      onChange={(e: any) =>
                        setSlaForm({ ...slaForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-task-type">Task type</label>
                    <select
                      id="sla-task-type"
                      className="ui-input"
                      value={slaForm.taskType}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, taskType: e.target.value })
                      }
                    >
                      <option value="RECONCILIATION">Reconciliation</option>
                      <option value="ACCRUALS">Accruals</option>
                      <option value="REPORTING">Reporting</option>
                      <option value="APPROVAL">Approval</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-response-hours">Response hours</label>
                    <input
                      id="sla-response-hours"
                      className="ui-input"
                      type="number"
                      min="0.000000277777778"
                      step="any"
                      value={slaForm.responseHours}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, responseHours: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-resolution-hours">Resolution hours</label>
                    <input
                      id="sla-resolution-hours"
                      className="ui-input"
                      type="number"
                      min="0.000000277777778"
                      step="any"
                      value={slaForm.resolutionHours}
                      onChange={(e) =>
                        setSlaForm({ ...slaForm, resolutionHours: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-priority">Priority</label>
                    <select id="sla-priority" className="ui-input" value={slaForm.priority}
                      onChange={(e) => setSlaForm({ ...slaForm, priority: e.target.value })}>
                      <option value="LOW">Low</option><option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="sla-escalation-rules">Escalation rules</label>
                    <select id="sla-escalation-rules" className="ui-input" multiple
                      value={slaForm.escalationRuleIds}
                      onChange={(event) => setSlaForm({ ...slaForm,
                        escalationRuleIds: Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                      })}>
                      {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateSla} disabled={actionLoading || !canManage}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create policy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowSlaForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <Card className="ui-list-card">
              <h3 className="font-semibold text-sm p-4 border-b border-gray-100">
                Task Dependencies
              </h3>
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "taskName",
                        header: "Task",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "dependsOn",
                        header: "Depends On",
                        render: (v: any) => String(v),
                      },
                      {
                        key: "dependencyType",
                        header: "Type",
                        render: (v: any) => (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {String(v).replace(/_/g, " → ")}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v: any) => (
                          <span
                            className={`ui-badge ${v === "DONE" ? "ui-badge-green" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (_value, row) => canManage ? (
                          <Button variant="outline" disabled={actionLoading}
                            aria-label={`Remove dependency for ${String(row.taskName)}`}
                            onClick={() => {
                              const dependency = tasks.find((task) => task.id === row.id);
                              if (dependency) { setRemovalError(""); setPendingRemoval(dependency); }
                            }}>
                            Remove
                          </Button>
                        ) : null,
                      },
                    ] as ListColumn[]
                  }
                  data={tasks as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No task dependencies"
                  emptyDescription="Add task dependencies to manage close workflows."
                />
              )}
            </Card>
            {pendingRemoval && (
              <ConfirmDialog open title="Remove task dependency" confirmLabel="Remove dependency"
                variant="danger" isLoading={actionLoading}
                onClose={() => { if (!dependencyActionPending.current) setPendingRemoval(null); }}
                onConfirm={handleRemoveDependency}
                message={<>
                  <p>Remove the dependency of “{pendingRemoval.taskName}” on “{pendingRemoval.dependsOn}”?</p>
                  {removalError && <p role="alert" className="ui-alert ui-alert-error">{removalError}</p>}
                </>}
              />
            )}

            {showAssignmentForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Assign task SLA</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="assignment-period">Financial period</label>
                    <select id="assignment-period" className="ui-input" value={assignmentPeriodId}
                      onChange={(e) => { setAssignmentPeriodId(e.target.value); setAssignmentForm({ ...assignmentForm, taskId: "" }); }}>
                      <option value="">Choose a period</option>
                      {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="assignment-task">Close task</label>
                    <select id="assignment-task" className="ui-input" value={assignmentForm.taskId}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, taskId: e.target.value })}>
                      <option value="">Choose a task</option>
                      {assignmentTasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="assignment-mode">Assignment mode</label>
                    <select id="assignment-mode" className="ui-input" value={assignmentForm.mode}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, mode: e.target.value as "POLICY" | "MANUAL" })}>
                      <option value="POLICY">Reusable policy</option><option value="MANUAL">Manual deadlines</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="assignment-start">Starts at (local time)</label>
                    <input id="assignment-start" className="ui-input" type="datetime-local" value={assignmentForm.startedAt}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, startedAt: e.target.value })} />
                  </div>
                  {assignmentForm.mode === "POLICY" ? (
                    <div className="ui-form-group">
                      <label className="ui-label" htmlFor="assignment-policy">SLA policy version</label>
                      <select id="assignment-policy" className="ui-input" value={assignmentForm.policyVersionId}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, policyVersionId: e.target.value })}>
                        <option value="">Choose a policy</option>
                        {(slaPolicies || []).filter((policy) => policy.status === "ACTIVE").map((policy) => {
                          const version = policy.versions[0];
                          return version ? <option key={version.id} value={version.id}>{version.name} · v{version.version}</option> : null;
                        })}
                      </select>
                    </div>
                  ) : <>
                    <div className="ui-form-group">
                      <label className="ui-label" htmlFor="assignment-response">Response deadline (local, optional)</label>
                      <input id="assignment-response" className="ui-input" type="datetime-local" value={assignmentForm.responseDeadlineAt}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, responseDeadlineAt: e.target.value })} />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label" htmlFor="assignment-deadline">Resolution deadline (local)</label>
                      <input id="assignment-deadline" className="ui-input" type="datetime-local" value={assignmentForm.deadlineAt}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, deadlineAt: e.target.value })} />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label" htmlFor="assignment-priority">Priority</label>
                      <select id="assignment-priority" className="ui-input" value={assignmentForm.priority}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, priority: e.target.value })}>
                        <option value="LOW">Low</option><option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </>}
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleAssignSla} disabled={actionLoading || !assignmentForm.taskId || !assignmentForm.startedAt}>Assign SLA</Button>
                  <Button variant="secondary" onClick={() => setShowAssignmentForm(false)}>Cancel</Button>
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === "breached-slas" && (
          <Card className="ui-list-card">
            <h2 className="ui-form-title">Breached task SLAs</h2>
            <ListPageTemplate
              columns={[
                { key: "task", header: "Task", render: (_value, row) => {
                  const task = row.task as BreachedCloseSla["task"];
                  return task?.name ?? "Unavailable task";
                } },
                { key: "deadlineAt", header: "Deadline", render: (value) => value ? new Date(String(value)).toLocaleString() : "Unavailable" },
                { key: "breachedAt", header: "Breached at", render: (value) => value ? new Date(String(value)).toLocaleString() : "Not recorded" },
                { key: "slaMinutes", header: "SLA (minutes)" },
                { key: "priority", header: "Priority" },
              ] as ListColumn[]}
              data={breachedSlas as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle={error ? "SLA breaches could not be loaded" : "No breached task SLAs"}
              emptyDescription={error ? "Use Refresh to try again." : "No breached task SLA records were returned."}
            />
          </Card>
        )}

        {activeTab === "task-slas" && (
          <Card className="ui-list-card">
            <ListPageTemplate columns={[
              { key: "taskId", header: "Task ID" },
              { key: "policyVersionId", header: "Source", render: (value) => value ? "Policy version" : "Manual deadline" },
              { key: "startedAt", header: "Started", render: (value) => value ? new Date(String(value)).toLocaleString() : "Legacy assignment" },
              { key: "responseDeadlineAt", header: "Response deadline", render: (value) => value ? new Date(String(value)).toLocaleString() : "None" },
              { key: "deadlineAt", header: "Resolution deadline", render: (value) => new Date(String(value)).toLocaleString() },
              { key: "priority", header: "Priority" },
              { key: "status", header: "Status" },
              { key: "actions", header: "Actions", render: (_value, row) => canManage && row.status !== "RESOLVED" ?
                <Button variant="outline" disabled={actionLoading}
                  onClick={() => void handleResolveTaskSla(taskSlas.find((sla) => sla.id === row.id)!)}>Resolve</Button> : null },
            ] as ListColumn[]} data={taskSlas as unknown as Record<string, unknown>[]}
              loading={loading} emptyTitle={error ? "Task SLAs could not be loaded" : "No task SLAs"}
              emptyDescription={error ? "Use Refresh to try again." : "Assign a policy or manual deadline from Tasks / SLAs."} />
            {taskSlaPageInfo.totalPages > 1 && <div className="ui-form-actions" aria-label="Task SLA pagination">
              <Button variant="secondary" disabled={taskSlaPage <= 1 || loading} onClick={() => setTaskSlaPage((page) => page - 1)}>Previous</Button>
              <span>Page {taskSlaPage} of {taskSlaPageInfo.totalPages} · {taskSlaPageInfo.total} task SLAs</span>
              <Button variant="secondary" disabled={taskSlaPage >= taskSlaPageInfo.totalPages || loading} onClick={() => setTaskSlaPage((page) => page + 1)}>Next</Button>
            </div>}
          </Card>
        )}

        {activeTab === "sla-policies" && (
          <Card className="ui-list-card">
            <h2 className="ui-form-title">Reusable close SLA policies</h2>
            <ListPageTemplate columns={[
              { key: "name", header: "Policy", render: (_value, row) => (row.versions as CloseSlaPolicyVersion[])?.[0]?.name ?? "Unavailable policy" },
              { key: "currentVersion", header: "Version" },
              { key: "taskType", header: "Task type", render: (_value, row) => (row.versions as CloseSlaPolicyVersion[])?.[0]?.taskType ?? "Unavailable" },
              { key: "resolution", header: "Resolution", render: (_value, row) => {
                const ms = (row.versions as CloseSlaPolicyVersion[])?.[0]?.resolutionTimeMs;
                return ms == null ? "Unavailable" : `${ms / 3_600_000} hours`;
              } },
              { key: "status", header: "Status" },
              { key: "actions", header: "Actions", render: (_value, row) => canManage ? (
                <div className="ui-hstack-2"><Button variant="outline" disabled={actionLoading || row.status !== "ACTIVE" || !(row.versions as CloseSlaPolicyVersion[])?.[0]}
                  aria-label={`Revise ${(row.versions as CloseSlaPolicyVersion[])?.[0]?.name ?? "SLA policy"}`}
                  onClick={() => {
                    const policy = slaPolicies.find((item) => item.id === row.id); const latest = policy?.versions[0];
                    if (policy && latest) {
                      setRevisionPolicy(policy); setSlaForm({ name: latest.name, taskType: latest.taskType,
                        priority: latest.priority, responseHours: String(latest.responseTimeMs / 3_600_000),
                        resolutionHours: String(latest.resolutionTimeMs / 3_600_000),
                        escalationRuleIds: latest.escalationRules?.map((link) => link.ruleId) ?? [] });
                    }
                  }}>Revise</Button>
                  <Button variant="danger" disabled={actionLoading || row.status !== "ACTIVE"}
                    onClick={() => setPendingRetirement(slaPolicies.find((item) => item.id === row.id) ?? null)}>
                    Retire
                  </Button></div>
              ) : null },
            ] as ListColumn[]} data={slaPolicies as unknown as Record<string, unknown>[]}
              loading={loading} emptyTitle={error ? "SLA policies could not be loaded" : "No SLA policies"}
              emptyDescription={error ? "Use Refresh to try again." : "Create a reusable policy from Tasks / SLAs."} />
            {policyPageInfo.totalPages > 1 && <div className="ui-form-actions" aria-label="SLA policy pagination">
              <Button variant="secondary" disabled={policyPage <= 1 || loading} onClick={() => setPolicyPage((page) => page - 1)}>Previous</Button>
              <span>Page {policyPage} of {policyPageInfo.totalPages} · {policyPageInfo.total} policies</span>
              <Button variant="secondary" disabled={policyPage >= policyPageInfo.totalPages || loading} onClick={() => setPolicyPage((page) => page + 1)}>Next</Button>
            </div>}
            {pendingRetirement && <ConfirmDialog open title="Retire SLA policy" confirmLabel="Retire policy"
              variant="danger" isLoading={actionLoading} onClose={() => { if (!slaActionPending.current) setPendingRetirement(null); }}
              onConfirm={handleRetirePolicy}
              message={`Retire “${pendingRetirement.versions[0]?.name ?? "this SLA policy"}”? Existing task deadlines remain unchanged, but new tasks cannot use it.`} />}
            {revisionPolicy && <div className="ui-form-card mt-4">
              <h3 className="ui-form-title">Revise {revisionPolicy.versions[0]?.name}</h3>
              <p>Submitting creates version {revisionPolicy.currentVersion + 1}; earlier versions remain unchanged.</p>
              <div className="ui-form-grid">
                <label className="ui-label" htmlFor="revision-name">Policy name</label>
                <input id="revision-name" className="ui-input" value={slaForm.name} onChange={(e) => setSlaForm({ ...slaForm, name: e.target.value })} />
                <label className="ui-label" htmlFor="revision-response">Response hours</label>
                <input id="revision-response" className="ui-input" type="number" step="any" value={slaForm.responseHours} onChange={(e) => setSlaForm({ ...slaForm, responseHours: e.target.value })} />
                <label className="ui-label" htmlFor="revision-resolution">Resolution hours</label>
                <input id="revision-resolution" className="ui-input" type="number" step="any" value={slaForm.resolutionHours} onChange={(e) => setSlaForm({ ...slaForm, resolutionHours: e.target.value })} />
                <label className="ui-label" htmlFor="revision-escalation-rules">Escalation rules</label>
                <select id="revision-escalation-rules" className="ui-input" multiple value={slaForm.escalationRuleIds}
                  onChange={(event) => setSlaForm({ ...slaForm,
                    escalationRuleIds: Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                  })}>
                  {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                </select>
              </div>
              <div className="ui-form-actions">
                <Button onClick={handleRevisePolicy} disabled={actionLoading}>Create revision</Button>
                <Button variant="secondary" onClick={() => setRevisionPolicy(null)}>Cancel</Button>
              </div>
            </div>}
          </Card>
        )}

        {activeTab === "calendar" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button disabled={!canManage || !canReadPeriods} onClick={() => setShowEventForm(!showEventForm)}>
                <Plus size={16} className="mr-1" /> Add Calendar Event
              </Button>
            </div>
            <Card className="ui-form-card mb-4">
              <label className="ui-label" htmlFor="calendar-period-filter">Calendar period</label>
              <select id="calendar-period-filter" className="ui-input" value={calendarPeriodId}
                onChange={(event) => {
                  setCalendarPeriodId(event.target.value);
                  if (!event.target.value) void fetchData();
                }}>
                <option value="">All periods</option>
                {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
              {calendarPeriodSummary && <p className="ui-text-sm-muted">
                {calendarPeriodSummary.completed} of {calendarPeriodSummary.total} completed · {calendarPeriodSummary.completionRate}%
              </p>}
            </Card>
            {showEventForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Calendar Event</h3>
                <label className="ui-label" htmlFor="close-event-period">Financial period</label>
                <select id="close-event-period" className="ui-input" value={eventForm.periodId} onChange={(event) => setEventForm({ ...eventForm, periodId: event.target.value })}>
                  <option value="">Choose a financial period</option>
                  {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
                </select>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="close-event-title">Title</label>
                    <input
                      className="ui-input"
                      id="close-event-title"
                      value={eventForm.title}
                      onChange={(e: any) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="close-event-due">Due time (local time)</label>
                    <input
                      className="ui-input"
                      type="datetime-local" id="close-event-due"
                      value={eventForm.dueAt}
                      onChange={(e: any) =>
                        setEventForm({
                          ...eventForm,
                          dueAt: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="close-event-type">Type</label>
                    <select
                      className="ui-input"
                      id="close-event-type"
                      value={eventForm.eventType}
                      onChange={(e: any) =>
                        setEventForm({
                          ...eventForm,
                          eventType: e.target.value,
                        })
                      }
                    >
                      <option value="REVIEW">Review</option>
                      <option value="DEADLINE">Deadline</option>
                      <option value="MEETING">Meeting</option>
                      <option value="APPROVAL">Approval</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="close-event-description">Description</label>
                    <input
                      className="ui-input"
                      id="close-event-description"
                      value={eventForm.description}
                      onChange={(e: any) =>
                        setEventForm({ ...eventForm, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateEvent} disabled={actionLoading || !canManage || !eventForm.periodId}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Add
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "title",
                        header: "Event",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "dueAt",
                        header: "Date",
                        render: (v: any) => new Date(String(v)).toLocaleString(),
                      },
                      {
                        key: "eventType",
                        header: "Type",
                        render: (v: any) => (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v: any) => String(v) || "—",
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (_value: unknown, row: Record<string, unknown>) => canManage && row.status !== "COMPLETED" ? (
                          <Button disabled={actionLoading} onClick={() => void handleCompleteEvent(String(row.id))} aria-label={`Complete ${String(row.title)}`}>Complete event</Button>
                        ) : null,
                      },
                    ] as ListColumn[]
                  }
                  data={events as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No calendar events"
                  emptyDescription="Add close calendar events to stay on track."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "escalations" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button disabled={!canManage} onClick={() => setShowRuleForm(!showRuleForm)}>
                <Plus size={16} className="mr-1" /> Create Escalation Rule
              </Button>
            </div>
            {showRuleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Escalation Rule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="escalation-rule-name">Rule Name</label>
                    <input
                      id="escalation-rule-name"
                      className="ui-input"
                      value={ruleForm.name}
                      onChange={(e: any) =>
                        setRuleForm({ ...ruleForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="escalation-condition-value">Trigger</label>
                    <select
                      id="escalation-condition-value"
                      className="ui-input"
                      value={ruleForm.conditionValue}
                      onChange={(e: any) =>
                        setRuleForm({
                          ...ruleForm,
                          conditionValue: e.target.value,
                        })
                      }
                    >
                      <option value="SLA_BREACH">SLA Breach</option>
                      <option value="TASK_OVERDUE">Task Overdue</option>
                      <option value="MANUAL">Manual Trigger</option>
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="escalation-role">Escalate to role</label>
                    <input
                      id="escalation-role"
                      className="ui-input"
                      value={ruleForm.escalateToRole}
                      onChange={(e: any) =>
                        setRuleForm({ ...ruleForm, escalateToRole: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="escalation-notification">Notification</label>
                    <select
                      id="escalation-notification"
                      className="ui-input"
                      value={ruleForm.notifyMethod}
                      onChange={(e: any) =>
                        setRuleForm({ ...ruleForm, notifyMethod: e.target.value })
                      }
                    >
                      <option value="EMAIL">Email</option>
                      <option value="IN_APP">In app</option>
                      <option value="BOTH">Email and in app</option>
                    </select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateRule} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRuleForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "name",
                        header: "Rule",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "conditionValue",
                        header: "Trigger",
                        render: (v: any) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "escalateToRole",
                        header: "Escalates To",
                        render: (v: any) => String(v),
                      },
                      {
                        key: "notifyMethod",
                        header: "Notification",
                        render: (v: any) => String(v).replace(/_/g, " "),
                      },
                      {
                        key: "isActive",
                        header: "Active",
                        render: (v: any) =>
                          v ? (
                            <span className="text-green-600 font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          ),
                      },
                      {
                        key: "actions",
                        header: "Actions",
                        render: (_value: unknown, row: Record<string, unknown>) => <div className="ui-hstack-2">
                          <Button variant="secondary" onClick={() => void handleViewRule(rules.find((rule) => rule.id === row.id)!)}>View</Button>
                          {canManage && <><Button variant="outline" disabled={actionLoading}
                            onClick={() => void handleToggleRule(rules.find((rule) => rule.id === row.id)!)}>
                            {row.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button variant="danger" disabled={actionLoading || !row.isActive}
                            onClick={() => setPendingRuleRetirement(rules.find((rule) => rule.id === row.id) ?? null)}>
                            Retire
                          </Button></>}
                        </div>,
                      },
                    ] as ListColumn[]
                  }
                  data={rules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No escalation rules"
                  emptyDescription="Create escalation rules to automate close issue resolution."
                />
              )}
            </Card>
            {selectedRule && <Card className="ui-form-card">
              <div className="ui-flex-between"><h3 className="ui-form-title">{selectedRule.name}</h3>
                <Button variant="secondary" onClick={() => setSelectedRule(null)}>Close details</Button></div>
              <p>{selectedRule.conditionField} {selectedRule.conditionOperator.replace(/_/g, " ")} {selectedRule.conditionValue}</p>
              <p>Target: {selectedRule.escalateToRole ?? selectedRule.escalateToUser ?? "Unavailable"} · Notification: {selectedRule.notifyMethod.replace(/_/g, " ")}</p>
            </Card>}
            {pendingRuleRetirement && <ConfirmDialog open title="Retire escalation rule" confirmLabel="Retire rule"
              variant="danger" isLoading={actionLoading}
              onClose={() => { if (!escalationActionPending.current) setPendingRuleRetirement(null); }}
              onConfirm={handleRetireRule}
              message={`Retire “${pendingRuleRetirement.name}”? Historical policy versions keep their reference, and new policies cannot select it.`} />}
          </>
        )}

        {activeTab === "analytics" && (
          <div className="ui-stack-4">
            <Card className="ui-card p-6">
              <div className="ui-form-grid">
                <div className="ui-form-group">
                  <label className="ui-label" htmlFor="analytics-period">Financial period</label>
                  <select id="analytics-period" className="ui-input" value={analyticsPeriodId}
                    onChange={(event) => setAnalyticsPeriodId(event.target.value)}>
                    <option value="">All periods</option>
                    {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
                  </select>
                </div>
                <Button disabled={!canManage || !analyticsPeriodId || actionLoading} onClick={handleCaptureSnapshot}>
                  Capture current snapshot
                </Button>
              </div>
              <p className="ui-text-sm-muted">{trends?.totalSnapshots ?? 0} snapshots across {trends?.periodCount ?? 0} periods · {criticalPath?.criticalDependencies ?? 0} critical dependencies · {criticalPath?.blockedTasks ?? 0} blocked tasks</p>
              {analyticsPeriodId && <p className="ui-text-sm-muted">
                {periodAnalytics?.snapshotCount ?? 0} snapshots for this period
                {periodAnalytics?.latest ? ` · latest: ${periodAnalytics.latest.completedTasks}/${periodAnalytics.latest.totalTasks} complete, ${periodAnalytics.latest.overdueTasks} overdue, ${periodAnalytics.latest.breachedSlas} SLA breaches` : " · no snapshot captured"}
              </p>}
            </Card>
            <Card className="ui-card p-6">
              <h3 className="font-semibold text-lg mb-4">
                Close Process Analytics
              </h3>
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading
                  analytics...
                </div>
              ) : analytics ? (
                <div
                  className="ui-grid-3"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {analytics.total}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">Total Tasks</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {analytics.done}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Tasks Completed
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-700">
                      {analytics.overdue}
                    </p>
                    <p className="text-sm text-red-600 mt-1">Overdue Tasks</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No analytics data available.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
