export const AI_ACTION_PLAN_OWNERS = [
  "corp.score_agenda",
  "runner.credit_bank",
  "runner.resource_lifecycle",
] as const;

export const AI_ACTION_PLAN_OWNER_ROUTES = ["build", "cash_out"] as const;

export type AiActionPlanOwner = (typeof AI_ACTION_PLAN_OWNERS)[number];
export type AiActionPlanOwnerRoute =
  (typeof AI_ACTION_PLAN_OWNER_ROUTES)[number];

export type AiHintActionPlanOwnerBinding = {
  capabilityKey: string;
  owner: AiActionPlanOwner;
  route?: AiActionPlanOwnerRoute;
};

export type AiHintActionPlanOwnerBindingIssue = {
  severity: "error";
  kind: "invalid_shape";
  path: string;
  message: string;
};

export function validateAiHintActionPlanOwnerBindings(
  bindings: unknown,
  side: unknown,
): {
  valid: boolean;
  issues: AiHintActionPlanOwnerBindingIssue[];
  errors: AiHintActionPlanOwnerBindingIssue[];
  warnings: never[];
} {
  const errors: AiHintActionPlanOwnerBindingIssue[] = [];
  const addError = (path: string, message: string): void => {
    errors.push({ severity: "error", kind: "invalid_shape", path, message });
  };
  const path = "$.actionPlanOwnerBindings";
  if (bindings === undefined)
    return { valid: true, issues: errors, errors, warnings: [] };
  if (!Array.isArray(bindings)) {
    addError(path, "Expected array.");
    return { valid: false, issues: errors, errors, warnings: [] };
  }

  const seenCapabilityKeys = new Set<string>();
  let previousCapabilityKey: string | undefined;
  bindings.forEach((binding, index) => {
    const bindingPath = `${path}[${index}]`;
    if (!isRecord(binding)) {
      addError(bindingPath, "Expected object.");
      return;
    }
    const unknownKeys = Object.keys(binding).filter(
      (key) => !["capabilityKey", "owner", "route"].includes(key),
    );
    if (unknownKeys.length > 0)
      addError(bindingPath, `Unknown fields: ${unknownKeys.join(",")}.`);
    if (
      typeof binding.capabilityKey !== "string" ||
      binding.capabilityKey.length === 0
    )
      addError(`${bindingPath}.capabilityKey`, "Expected non-empty string.");
    else {
      if (seenCapabilityKeys.has(binding.capabilityKey))
        addError(
          `${bindingPath}.capabilityKey`,
          "Duplicate capability binding.",
        );
      if (
        previousCapabilityKey !== undefined &&
        previousCapabilityKey.localeCompare(binding.capabilityKey) >= 0
      )
        addError(
          `${bindingPath}.capabilityKey`,
          "Bindings must be strictly sorted by capabilityKey.",
        );
      seenCapabilityKeys.add(binding.capabilityKey);
      previousCapabilityKey = binding.capabilityKey;
    }
    if (
      typeof binding.owner !== "string" ||
      !(AI_ACTION_PLAN_OWNERS as readonly string[]).includes(binding.owner)
    )
      addError(`${bindingPath}.owner`, "Expected known value.");
    if (
      binding.route !== undefined &&
      (typeof binding.route !== "string" ||
        !(AI_ACTION_PLAN_OWNER_ROUTES as readonly string[]).includes(
          binding.route,
        ))
    )
      addError(`${bindingPath}.route`, "Expected known value.");
    if (binding.owner === "runner.credit_bank" && binding.route === undefined)
      addError(`${bindingPath}.route`, "runner.credit_bank requires a route.");
    if (binding.owner !== "runner.credit_bank" && binding.route !== undefined)
      addError(
        `${bindingPath}.route`,
        "route is only valid for runner.credit_bank.",
      );
    if (
      (side === "runner" || side === "corp") &&
      typeof binding.owner === "string" &&
      !binding.owner.startsWith(`${side}.`)
    )
      addError(`${bindingPath}.owner`, "Owner side must match hint side.");
  });

  return {
    valid: errors.length === 0,
    issues: errors,
    errors,
    warnings: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
