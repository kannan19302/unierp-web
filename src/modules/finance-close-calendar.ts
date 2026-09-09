export interface CloseCalendarEvent {
  id: string;
  periodId: string;
  title: string;
  eventType: string;
  dueAt: string;
  description: string | null;
  status: string;
}

export interface CloseCalendarForm {
  periodId: string;
  title: string;
  eventType: string;
  dueAt: string;
  description: string;
}

/** Matches the existing CloseManagementController calendar request. */
export function buildCloseCalendarInput(form: CloseCalendarForm) {
  if (!form.periodId || !form.title.trim() || !form.eventType || !form.dueAt) {
    throw new Error("Choose a financial period and enter an event title, type and due time.");
  }
  const dueAt = new Date(form.dueAt);
  if (!Number.isFinite(dueAt.getTime())) throw new Error("Enter a valid event due time.");
  return {
    periodId: form.periodId,
    title: form.title.trim(),
    eventType: form.eventType,
    dueAt: dueAt.toISOString(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  };
}
