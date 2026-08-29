import type {
  FormField,
  FormCondition,
  ConditionOperator,
} from "@/stores/builderStore";

/** G10 — evaluate one condition's operator against a field's current value. */
export function evaluateOperator(
  operator: ConditionOperator,
  actual: unknown,
  expected: string | undefined,
): boolean {
  const actualStr = actual === undefined || actual === null ? "" : String(actual);
  switch (operator) {
    case "isEmpty":
      return actualStr.trim() === "";
    case "equals":
      return actualStr === (expected ?? "");
    case "notEquals":
      return actualStr !== (expected ?? "");
    case "contains":
      return actualStr.toLowerCase().includes((expected ?? "").toLowerCase());
    case "greaterThan":
      return Number(actualStr) > Number(expected ?? 0);
    case "lessThan":
      return Number(actualStr) < Number(expected ?? 0);
    default:
      return false;
  }
}

export interface FieldConditionState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

/**
 * G10 — resolve every field's effective visible/enabled/required state from
 * its own declaration plus any conditions targeting it. A later condition in
 * declaration order wins over an earlier one for the same (target, aspect)
 * pair, so authoring order is the tie-break — the same rule the builder's
 * own condition list implies by being a reorderable list.
 */
export function resolveConditionStates(
  fields: FormField[],
  conditions: FormCondition[] | undefined,
  formData: Record<string, unknown>,
): Record<string, FieldConditionState> {
  const states: Record<string, FieldConditionState> = {};
  for (const f of fields) {
    states[f.name] = { visible: true, enabled: true, required: !!f.required };
  }
  if (!conditions || conditions.length === 0) return states;

  for (const c of conditions) {
    const state = states[c.targetFieldId];
    if (!state) continue;
    const matched = evaluateOperator(c.operator, formData[c.fieldId], c.value);
    if (!matched) continue;
    if (c.action === "show") state.visible = true;
    if (c.action === "hide") state.visible = false;
    if (c.action === "enable") state.enabled = true;
    if (c.action === "disable") state.enabled = false;
    if (c.action === "require") state.required = true;
  }
  return states;
}
