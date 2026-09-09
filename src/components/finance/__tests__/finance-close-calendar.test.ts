import { describe, expect, it } from "vitest";
import { buildCloseCalendarInput } from "@/modules/finance-close-calendar";

const form = {
  periodId: "00000000-0000-0000-0000-000000000010",
  title: " Month end review ",
  eventType: "REVIEW",
  dueAt: "2026-09-30T15:30:00+05:30",
  description: " Review outstanding journals ",
};

describe("Close calendar request boundary", () => {
  it("preserves the selected period and converts the due instant to UTC", () => {
    expect(buildCloseCalendarInput(form)).toEqual({
      periodId: form.periodId,
      title: "Month end review",
      eventType: "REVIEW",
      dueAt: "2026-09-30T10:00:00.000Z",
      description: "Review outstanding journals",
    });
  });

  it.each(["periodId", "title", "eventType", "dueAt"])("rejects missing %s before sending", (field) => {
    expect(() => buildCloseCalendarInput({ ...form, [field]: "" })).toThrow();
  });

  it("rejects invalid due dates instead of posting an invalid timestamp", () => {
    expect(() => buildCloseCalendarInput({ ...form, dueAt: "not-a-date" })).toThrow("valid event due time");
  });

  it("omits an empty optional description", () => {
    expect(buildCloseCalendarInput({ ...form, description: " " })).not.toHaveProperty("description");
  });
});
