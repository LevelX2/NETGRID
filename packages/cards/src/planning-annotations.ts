import { capabilityKey, type CapabilityKey } from "./capability-identity";
import { assertStrictlySerializable } from "./serializable";

export const KNOWN_PLANNING_TACTIC_SIGNALS = [
  "access.punish",
  "corp.remote_protection",
  "coverage.breaker",
  "damage.payoff",
  "draw.card",
  "economy.card",
  "punish.payoff",
  "remote.ambush",
  "tag.payoff",
] as const;

export const KNOWN_PLANNING_TACTIC_USES = [
  "access.punish",
  "corp.remote_protection",
  "coverage.breaker",
  "damage.payoff.runner",
  "draw.card",
  "economy.card",
  "punish.payoff",
  "remote.ambush",
  "tag.payoff",
] as const;

export const KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS = [
  "access.hq_multiaccess",
  "access.rnd_multiaccess",
  "tag.payoff",
  "tag.source",
  "trace.source",
] as const;

export type CardPlanningAnnotations = {
  schemaVersion: "card-planning-annotations-v1";
  card?: readonly PlanningInterpretation[];
  capabilities?: readonly CapabilityPlanningAnnotations[];
};

export type CapabilityPlanningAnnotations = {
  capabilityKey: CapabilityKey;
  annotations: readonly PlanningInterpretation[];
};

export type PlanningInterpretation =
  | {
      kind: "strategy_anchor";
      strategyKey: string;
    }
  | {
      kind: "line_support";
      lineKey: string;
      support: "enables" | "supports" | "conflicts";
    }
  | {
      kind: "strategic_role";
      role: string;
    }
  | {
      kind: "plan_role";
      role: string;
    }
  | {
      kind: "strategic_exchange";
      exchange: string;
    }
  | {
      kind: "strategy_support";
      strategyKey: string;
      role: string;
      roleDetail: string;
      evidenceAnchor?: (typeof KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS)[number];
      confidence: "low" | "medium" | "high";
      rationale?: string;
    }
  | {
      kind: "plan_owner";
      owner: string;
      route?: string;
    }
  | {
      kind: "target_preference";
      purpose: string;
      preferences?: readonly string[];
      avoid?: readonly string[];
    }
  | {
      kind: "value_interpretation";
      axis: string;
      rating: "low" | "medium" | "high" | "very_high" | "critical";
      rationale?: string;
    }
  | {
      kind: "risk_interpretation";
      risk: string;
      severity: "low" | "medium" | "high";
      rationale?: string;
    }
  | {
      kind: "tactic_interpretation";
      signal: (typeof KNOWN_PLANNING_TACTIC_SIGNALS)[number];
      use: (typeof KNOWN_PLANNING_TACTIC_USES)[number];
    }
  | {
      kind: "remote_role";
      role: string;
      threatLevel: "low" | "medium" | "high";
    }
  | {
      kind: "opponent_signal";
      signal: string;
      evidencePolicy: "visible_evidence_only";
    };

export type PlanningAnnotationErrorCode =
  | "planning_unknown_field"
  | "planning_mechanical_field"
  | "planning_invalid_shape"
  | "planning_duplicate_capability_key";

export class PlanningAnnotationError extends Error {
  readonly name = "PlanningAnnotationError";

  constructor(
    readonly code: PlanningAnnotationErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(`${code} at ${path}: ${message}`);
  }
}

const ROOT_KEYS = new Set(["schemaVersion", "card", "capabilities"]);
const CAPABILITY_KEYS = new Set(["capabilityKey", "annotations"]);
const INTERPRETATION_KEYS: Record<
  PlanningInterpretation["kind"],
  Set<string>
> = {
  strategy_anchor: new Set(["kind", "strategyKey"]),
  line_support: new Set(["kind", "lineKey", "support"]),
  strategic_role: new Set(["kind", "role"]),
  plan_role: new Set(["kind", "role"]),
  strategic_exchange: new Set(["kind", "exchange"]),
  strategy_support: new Set([
    "kind",
    "strategyKey",
    "role",
    "roleDetail",
    "evidenceAnchor",
    "confidence",
    "rationale",
  ]),
  plan_owner: new Set(["kind", "owner", "route"]),
  target_preference: new Set(["kind", "purpose", "preferences", "avoid"]),
  value_interpretation: new Set(["kind", "axis", "rating", "rationale"]),
  risk_interpretation: new Set(["kind", "risk", "severity", "rationale"]),
  tactic_interpretation: new Set(["kind", "signal", "use"]),
  remote_role: new Set(["kind", "role", "threatLevel"]),
  opponent_signal: new Set(["kind", "signal", "evidencePolicy"]),
};

const MECHANICAL_FIELD_NAMES = new Set([
  "mechanics",
  "engine",
  "rules",
  "cost",
  "costs",
  "credits",
  "clicks",
  "amount",
  "quantity",
  "timing",
  "condition",
  "conditions",
  "limit",
  "limits",
  "target",
  "targets",
  "targettype",
  "effect",
  "effects",
  "damage",
  "tags",
  "statechange",
  "statechanges",
  "transition",
  "transitions",
  "legality",
  "legalaction",
  "actionid",
  "serverid",
  "serverscope",
  "zone",
  "subtype",
  "subtypes",
  "memory",
  "counter",
  "counters",
  "agendapoints",
]);

/** Runtime guard for unknown/intermediate values; it does not trust TS types. */
export function assertPlanningAnnotations(
  value: unknown,
  path = "planningAnnotations",
): asserts value is CardPlanningAnnotations {
  assertStrictlySerializable(value, path);
  const root = objectRecord(value, path);
  assertAllowedKeys(root, ROOT_KEYS, path);
  if (root.schemaVersion !== "card-planning-annotations-v1")
    invalid(path, "schemaVersion must be card-planning-annotations-v1");
  if (root.card !== undefined) assertInterpretations(root.card, `${path}.card`);
  if (root.capabilities !== undefined) {
    const capabilities = denseArray(root.capabilities, `${path}.capabilities`);
    const seenCapabilityKeys = new Set<CapabilityKey>();
    capabilities.forEach((entry, index) => {
      const entryPath = `${path}.capabilities[${index}]`;
      const record = objectRecord(entry, entryPath);
      assertAllowedKeys(record, CAPABILITY_KEYS, entryPath);
      if (typeof record.capabilityKey !== "string")
        invalid(`${entryPath}.capabilityKey`, "must be a string");
      let key: CapabilityKey;
      try {
        key = capabilityKey(record.capabilityKey);
      } catch {
        invalid(
          `${entryPath}.capabilityKey`,
          "must use lower-case semantic capability-key syntax",
        );
      }
      if (seenCapabilityKeys.has(key))
        throw new PlanningAnnotationError(
          "planning_duplicate_capability_key",
          `${entryPath}.capabilityKey`,
          key,
        );
      seenCapabilityKeys.add(key);
      assertInterpretations(record.annotations, `${entryPath}.annotations`);
    });
  }
}

function assertInterpretations(value: unknown, path: string): void {
  denseArray(value, path).forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    const record = objectRecord(entry, entryPath);
    if (
      typeof record.kind !== "string" ||
      !(record.kind in INTERPRETATION_KEYS)
    )
      invalid(`${entryPath}.kind`, "must be a known planning interpretation");
    assertAllowedKeys(
      record,
      INTERPRETATION_KEYS[record.kind as PlanningInterpretation["kind"]],
      entryPath,
    );
    assertInterpretationShape(
      record as Record<string, unknown> & {
        kind: PlanningInterpretation["kind"];
      },
      entryPath,
    );
  });
}

function assertInterpretationShape(
  record: Record<string, unknown> & {
    kind: PlanningInterpretation["kind"];
  },
  path: string,
): void {
  switch (record.kind) {
    case "strategy_anchor":
      stringField(record, "strategyKey", path);
      return;
    case "line_support":
      stringField(record, "lineKey", path);
      enumField(record, "support", ["enables", "supports", "conflicts"], path);
      return;
    case "strategic_role":
      stringField(record, "role", path);
      return;
    case "plan_role":
      stringField(record, "role", path);
      return;
    case "strategic_exchange":
      stringField(record, "exchange", path);
      return;
    case "strategy_support":
      stringField(record, "strategyKey", path);
      stringField(record, "role", path);
      stringField(record, "roleDetail", path);
      if (record.evidenceAnchor !== undefined)
        enumField(
          record,
          "evidenceAnchor",
          KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS,
          path,
        );
      enumField(record, "confidence", ["low", "medium", "high"], path);
      optionalStringField(record, "rationale", path);
      return;
    case "plan_owner":
      stringField(record, "owner", path);
      optionalStringField(record, "route", path);
      return;
    case "target_preference":
      stringField(record, "purpose", path);
      optionalStringArrayField(record, "preferences", path);
      optionalStringArrayField(record, "avoid", path);
      return;
    case "value_interpretation":
      stringField(record, "axis", path);
      enumField(
        record,
        "rating",
        ["low", "medium", "high", "very_high", "critical"],
        path,
      );
      optionalStringField(record, "rationale", path);
      return;
    case "risk_interpretation":
      stringField(record, "risk", path);
      enumField(record, "severity", ["low", "medium", "high"], path);
      optionalStringField(record, "rationale", path);
      return;
    case "tactic_interpretation":
      enumField(record, "signal", KNOWN_PLANNING_TACTIC_SIGNALS, path);
      enumField(record, "use", KNOWN_PLANNING_TACTIC_USES, path);
      return;
    case "remote_role":
      stringField(record, "role", path);
      enumField(record, "threatLevel", ["low", "medium", "high"], path);
      return;
    case "opponent_signal":
      stringField(record, "signal", path);
      enumField(record, "evidencePolicy", ["visible_evidence_only"], path);
      return;
  }
}

function stringField(
  record: Record<string, unknown>,
  field: string,
  path: string,
): void {
  if (typeof record[field] !== "string" || record[field].trim().length === 0)
    invalid(`${path}.${field}`, "must be a non-empty string");
}

function optionalStringField(
  record: Record<string, unknown>,
  field: string,
  path: string,
): void {
  if (record[field] !== undefined) stringField(record, field, path);
}

function optionalStringArrayField(
  record: Record<string, unknown>,
  field: string,
  path: string,
): void {
  if (record[field] === undefined) return;
  denseArray(record[field], `${path}.${field}`).forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      invalid(`${path}.${field}[${index}]`, "must be a non-empty string");
  });
}

function enumField(
  record: Record<string, unknown>,
  field: string,
  allowed: readonly string[],
  path: string,
): void {
  if (typeof record[field] !== "string" || !allowed.includes(record[field]))
    invalid(`${path}.${field}`, `must be one of ${allowed.join(", ")}`);
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  for (const key of Object.keys(record)) {
    const normalized = key.replaceAll(/[_-]/g, "").toLowerCase();
    if (MECHANICAL_FIELD_NAMES.has(normalized))
      throw new PlanningAnnotationError(
        "planning_mechanical_field",
        `${path}.${key}`,
        "mechanical fields belong exclusively to CardSpec.engine",
      );
    if (!allowed.has(key))
      throw new PlanningAnnotationError(
        "planning_unknown_field",
        `${path}.${key}`,
        "field is not part of the closed planning annotation schema",
      );
  }
}

function objectRecord(value: unknown, path: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    invalid(path, "must be a plain object");
  return value as Record<string, unknown>;
}

function denseArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(path, "must be an array");
  for (let index = 0; index < value.length; index += 1)
    if (!Object.hasOwn(value, index))
      invalid(`${path}[${index}]`, "array hole");
  return value;
}

function invalid(path: string, message: string): never {
  throw new PlanningAnnotationError("planning_invalid_shape", path, message);
}
