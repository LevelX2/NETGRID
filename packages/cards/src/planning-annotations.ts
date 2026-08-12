import { capabilityKey, type CapabilityKey } from "./capability-identity";
import { assertStrictlySerializable } from "./serializable";

export const KNOWN_PLANNING_TACTIC_SIGNALS = [
  "access.punish",
  "corp.ice_tax",
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
  "corp.ice_tax",
  "corp.remote_protection",
  "coverage.breaker",
  "damage.payoff.runner",
  "draw.card",
  "economy.card",
  "punish.payoff",
  "remote.ambush",
  "tag.payoff",
] as const;

export const KNOWN_PLANNING_PLAN_OWNERS = [
  "corp.score_agenda",
  "runner.credit_bank",
  "runner.resource_lifecycle",
] as const;

export const KNOWN_PLANNING_PLAN_OWNER_ROUTES = ["build", "cash_out"] as const;

export type PlanningPlanOwner = (typeof KNOWN_PLANNING_PLAN_OWNERS)[number];
export type PlanningPlanOwnerRoute =
  (typeof KNOWN_PLANNING_PLAN_OWNER_ROUTES)[number];

export const KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS = [
  "access.hq_multiaccess",
  "access.rnd_multiaccess",
  "corp_ice.runner_action_loss",
  "damage.corp_tagged_meat_payoff",
  "tag.payoff",
  "tag.source",
  "trace.source",
] as const;

export const KNOWN_STRATEGY_SUPPORT_EVIDENCE_PROFILES = [
  "access_counter_credit_loss",
  "access_counter_icebreaker_strength",
  "access_net_damage_payoff_archives",
  "access_net_damage_payoff_rnd",
  "access_tag_ambush",
  "access_tag_source",
  "access_window_advancement_enabler",
  "agenda_net_damage_ambush",
  "black_ops_agenda_difficulty_discount",
  "brain_damage_ice",
  "central_multiaccess_reduction",
  "damage_amplifier",
  "damage_conversion_extra_action_bank",
  "deep_server_damage_payoff_ice",
  "future_strength_tax_ice",
  "gray_ops_agenda_difficulty_discount",
  "ice_order_control",
  "ice_subroutine_repeat_support",
  "install_rez_reserve_counter",
  "install_rez_reserve_temporary",
  "installment_free_rez_ice",
  "multi_program_trash_tax_ice",
  "net_damage_steal_tax",
  "one_card_score_closeout",
  "overadvance_extra_action_payoff",
  "overadvance_recurring_credit_payoff",
  "paid_end_run_subroutine_ice",
  "paid_trace_tag_source",
  "pass_ice_pay_or_end_remote_protection",
  "pass_ice_pay_or_end_tax",
  "pay_or_end_run_ice",
  "position_scaling_etr_ice",
  "position_scaling_net_damage_ice",
  "position_scaling_strength_tax_ice",
  "position_scaling_tax_ice",
  "position_scaling_trace_tag_source",
  "position_scaling_trace_tag_tax_ice",
  "program_bounce_ambush",
  "random_recurring_action_mode",
  "recurring_extra_action_payoff",
  "remote_content_swap_defense",
  "remote_run_control",
  "research_agenda_difficulty_discount",
  "resource_install_retaliatory_trace_tag_source",
  "retaliatory_node_trash_tag_source",
  "rez_paid_scaling_ice",
  "run_spend_cap_tax",
  "run_temporary_credit_reserve",
  "scaling_trace_margin_tag_source",
  "tagged_meat_hand_size_pressure",
  "tagged_runner_punish_payoff",
  "trace_credit_enabler",
  "trace_success_recent_resource_trash",
  "temporary_free_rez_ice",
  "x_strength_trace_ice",
] as const;

export type CardPlanningAnnotations = {
  schemaVersion: "card-planning-annotations-v1";
  card?: readonly CardPlanningInterpretation[];
  capabilities?: readonly CapabilityPlanningAnnotations[];
};

export type CapabilityPlanningAnnotations = {
  capabilityKey: CapabilityKey;
  annotations: readonly CapabilityPlanningInterpretation[];
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
      evidenceProfile?: (typeof KNOWN_STRATEGY_SUPPORT_EVIDENCE_PROFILES)[number];
      evidenceAnchor?: (typeof KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS)[number];
      confidence: "low" | "medium" | "high";
      rationale?: string;
    }
  | {
      kind: "plan_owner";
      owner: PlanningPlanOwner;
      route?: PlanningPlanOwnerRoute;
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

type StrategySupportInterpretation = Extract<
  PlanningInterpretation,
  { kind: "strategy_support" }
>;

export type CardPlanningInterpretation =
  | Exclude<PlanningInterpretation, StrategySupportInterpretation>
  | (Omit<
      StrategySupportInterpretation,
      "evidenceProfile" | "evidenceAnchor"
    > & {
      evidenceProfile?: (typeof KNOWN_STRATEGY_SUPPORT_EVIDENCE_PROFILES)[number];
      evidenceAnchor?: never;
    });

export type CapabilityPlanningInterpretation =
  | Exclude<PlanningInterpretation, StrategySupportInterpretation>
  | (Omit<
      StrategySupportInterpretation,
      "evidenceProfile" | "evidenceAnchor"
    > & {
      evidenceProfile?: never;
      evidenceAnchor?: (typeof KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS)[number];
    });

export type PlanningAnnotationErrorCode =
  | "planning_unknown_field"
  | "planning_mechanical_field"
  | "planning_invalid_shape"
  | "planning_duplicate_capability_key"
  | "planning_duplicate_plan_owner";

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
    "evidenceProfile",
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
  if (root.card !== undefined)
    assertInterpretations(root.card, `${path}.card`, "card");
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
      assertInterpretations(
        record.annotations,
        `${entryPath}.annotations`,
        "capability",
      );
    });
  }
}

function assertInterpretations(
  value: unknown,
  path: string,
  context: "card" | "capability",
): void {
  const interpretations = denseArray(value, path);
  if (
    interpretations.filter(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        !Array.isArray(entry) &&
        Object.getOwnPropertyDescriptor(entry, "kind")?.value === "plan_owner",
    ).length > 1
  )
    throw new PlanningAnnotationError(
      "planning_duplicate_plan_owner",
      path,
      "a capability may declare at most one plan_owner",
    );
  interpretations.forEach((entry, index) => {
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
      context,
    );
  });
}

function assertInterpretationShape(
  record: Record<string, unknown> & {
    kind: PlanningInterpretation["kind"];
  },
  path: string,
  context: "card" | "capability",
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
      if (record.evidenceProfile !== undefined)
        enumField(
          record,
          "evidenceProfile",
          KNOWN_STRATEGY_SUPPORT_EVIDENCE_PROFILES,
          path,
        );
      if (record.evidenceAnchor !== undefined)
        enumField(
          record,
          "evidenceAnchor",
          KNOWN_STRATEGY_SUPPORT_EVIDENCE_ANCHORS,
          path,
        );
      if (context === "card" && record.evidenceAnchor !== undefined)
        invalid(
          `${path}.evidenceAnchor`,
          "is capability-bound and forbidden on card annotations",
        );
      if (context === "capability" && record.evidenceProfile !== undefined)
        invalid(
          `${path}.evidenceProfile`,
          "is card-bound and forbidden on capability annotations",
        );
      enumField(record, "confidence", ["low", "medium", "high"], path);
      optionalStringField(record, "rationale", path);
      return;
    case "plan_owner":
      if (context !== "capability")
        invalid(path, "plan_owner is capability-bound");
      enumField(record, "owner", KNOWN_PLANNING_PLAN_OWNERS, path);
      if (record.route !== undefined)
        enumField(record, "route", KNOWN_PLANNING_PLAN_OWNER_ROUTES, path);
      if (record.owner === "runner.credit_bank" && record.route === undefined)
        invalid(`${path}.route`, "is required for runner.credit_bank");
      if (record.owner !== "runner.credit_bank" && record.route !== undefined)
        invalid(`${path}.route`, "is only valid for runner.credit_bank");
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
