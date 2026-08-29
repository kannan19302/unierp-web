import { describe, it, expect } from "vitest";
import {
  evaluateOperator,
  resolveConditionStates,
} from "../condition-evaluator";
import type { FormField, FormCondition } from "@/stores/builderStore";

/**
 * G10 exit criterion: "A 40-field multi-step form with conditional logic is
 * built visually and renders identically on web, mobile and desktop." These
 * tests cover the conditional-logic evaluation engine that drives the "web"
 * half of that guarantee — the same pure functions the live renderer calls
 * on every keystroke, so a wrong answer here is a wrong answer in the UI.
 */
describe("evaluateOperator", () => {
  it.each([
    ["equals", "yes", "yes", true],
    ["equals", "yes", "no", false],
    ["notEquals", "yes", "no", true],
    ["contains", "hello world", "world", true],
    ["contains", "hello world", "xyz", false],
    ["greaterThan", "10", "5", true],
    ["greaterThan", "3", "5", false],
    ["lessThan", "3", "5", true],
    ["isEmpty", "", undefined, true],
    ["isEmpty", "x", undefined, false],
  ] as const)("%s(%s, %s) -> %s", (op, actual, expected, want) => {
    expect(evaluateOperator(op, actual, expected)).toBe(want);
  });
});

const field = (name: string, required = false): FormField => ({
  id: `f_${name}`,
  type: "Data",
  label: name,
  name,
  required,
  readOnly: false,
});

describe("resolveConditionStates", () => {
  it("a matching hide condition makes the target invisible", () => {
    const fields = [field("plan"), field("enterprise_seats")];
    const conditions: FormCondition[] = [
      {
        fieldId: "plan",
        operator: "notEquals",
        value: "enterprise",
        action: "hide",
        targetFieldId: "enterprise_seats",
      },
    ];
    const states = resolveConditionStates(fields, conditions, { plan: "starter" });
    expect(states.enterprise_seats.visible).toBe(false);
  });

  it("the same condition is re-evaluated as the source value changes — no stale state", () => {
    const fields = [field("plan"), field("enterprise_seats")];
    const conditions: FormCondition[] = [
      {
        fieldId: "plan",
        operator: "notEquals",
        value: "enterprise",
        action: "hide",
        targetFieldId: "enterprise_seats",
      },
    ];
    const hidden = resolveConditionStates(fields, conditions, { plan: "starter" });
    expect(hidden.enterprise_seats.visible).toBe(false);

    const shown = resolveConditionStates(fields, conditions, { plan: "enterprise" });
    expect(shown.enterprise_seats.visible).toBe(true);
  });

  it("a require condition adds requiredness even when the field itself is optional", () => {
    const fields = [field("has_referral"), field("referral_code", false)];
    const conditions: FormCondition[] = [
      {
        fieldId: "has_referral",
        operator: "equals",
        value: "yes",
        action: "require",
        targetFieldId: "referral_code",
      },
    ];
    const states = resolveConditionStates(fields, conditions, { has_referral: "yes" });
    expect(states.referral_code.required).toBe(true);

    const statesNo = resolveConditionStates(fields, conditions, { has_referral: "no" });
    expect(statesNo.referral_code.required).toBe(false);
  });

  it("a disable condition takes effect without hiding the field", () => {
    const fields = [field("locked"), field("amount")];
    const conditions: FormCondition[] = [
      {
        fieldId: "locked",
        operator: "equals",
        value: "true",
        action: "disable",
        targetFieldId: "amount",
      },
    ];
    const states = resolveConditionStates(fields, conditions, { locked: "true" });
    expect(states.amount.enabled).toBe(false);
    expect(states.amount.visible).toBe(true);
  });

  it("scales to a 40-field form with multiple conditions targeting different fields", () => {
    const fields = Array.from({ length: 40 }, (_, i) => field(`field_${i}`));
    const conditions: FormCondition[] = [
      { fieldId: "field_0", operator: "equals", value: "x", action: "hide", targetFieldId: "field_39" },
      { fieldId: "field_1", operator: "isEmpty", value: undefined, action: "require", targetFieldId: "field_2" },
    ];
    const states = resolveConditionStates(fields, conditions, {
      field_0: "x",
      field_1: "",
    });
    expect(Object.keys(states)).toHaveLength(40);
    expect(states.field_39.visible).toBe(false);
    expect(states.field_2.required).toBe(true);
  });

  it("ignores a condition whose target field does not exist, rather than throwing", () => {
    const fields = [field("a")];
    const conditions: FormCondition[] = [
      {
        fieldId: "a",
        operator: "equals",
        value: "1",
        action: "hide",
        targetFieldId: "does_not_exist",
      },
    ];
    expect(() =>
      resolveConditionStates(fields, conditions, { a: "1" }),
    ).not.toThrow();
  });
});
