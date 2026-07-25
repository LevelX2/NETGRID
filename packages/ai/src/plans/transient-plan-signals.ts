import type { Side } from "@netgrid/shared";
import type { PlanModuleId, PlanTargetRef } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export const TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION =
  "transient-plan-signal-v1" as const;

export type TransientPlanSignalGuarantee =
  | "rules_proven"
  | "visible_state_forced"
  | "robust_but_reactive";

export type TransientPlanSignal = {
  schemaVersion: typeof TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION;
  signalId: string;
  side: Side;
  observedAtStateVersion: number;
  planModuleId: PlanModuleId;
  planDedupeKey: string;
  kind: "goal" | "threat";
  scope: "strategic" | "tactical";
  evidenceCode: string;
  guarantee: TransientPlanSignalGuarantee;
  target?: PlanTargetRef;
};

export type TransientPlanSignalContext = {
  side: Side;
  stateVersion: number;
  timingPoint?: string;
};

const ALLOWED_SIGNAL_KEYS = new Set<keyof TransientPlanSignal>([
  "schemaVersion",
  "signalId",
  "side",
  "observedAtStateVersion",
  "planModuleId",
  "planDedupeKey",
  "kind",
  "scope",
  "evidenceCode",
  "guarantee",
  "target",
]);

const TARGET_KINDS = new Set<PlanTargetRef["kind"]>([
  "server",
  "card",
  "ice",
  "capability",
  "bank",
  "window",
  "player",
]);

const GUARANTEES = new Set<TransientPlanSignalGuarantee>([
  "rules_proven",
  "visible_state_forced",
  "robust_but_reactive",
]);

export function requireCurrentTransientPlanSignals(
  signals: readonly TransientPlanSignal[] | undefined,
  context: TransientPlanSignalContext,
): TransientPlanSignal[] {
  if (!signals || signals.length === 0) return [];
  const seenIds = new Set<string>();
  const validated = signals.map((signal) => {
    const invalidReason = transientPlanSignalInvalidReason(signal, context);
    if (invalidReason) {
      throw invalidTransientPlanSignal(context, signal, invalidReason);
    }
    if (seenIds.has(signal.signalId)) {
      throw invalidTransientPlanSignal(
        context,
        signal,
        "duplicate_signal_id",
      );
    }
    seenIds.add(signal.signalId);
    return structuredClone(signal);
  });
  return validated.sort((left, right) =>
    left.signalId.localeCompare(right.signalId),
  );
}

export function transientPlanSignalEvidenceCodes(
  signals: readonly TransientPlanSignal[],
): string[] {
  return signals.flatMap((signal) => [
    `transient_plan_signal:${signal.kind}:${signal.scope}:${signal.signalId}`,
    `transient_plan_signal_plan:${signal.planModuleId}`,
    `transient_plan_signal_evidence:${signal.evidenceCode}`,
    `transient_plan_signal_guarantee:${signal.guarantee}`,
  ]);
}

export function transientPlanSignalsForExactPlanTarget(
  signals: readonly TransientPlanSignal[] | undefined,
  planModuleId: PlanModuleId,
  planDedupeKey: string,
  target: PlanTargetRef | undefined,
): TransientPlanSignal[] {
  if (!signals || signals.length === 0 || !target) return [];
  return signals
    .filter(
      (signal) =>
        signal.planModuleId === planModuleId &&
        signal.planDedupeKey === planDedupeKey &&
        signal.target?.kind === target.kind &&
        signal.target.id === target.id,
    )
    .map((signal) => structuredClone(signal));
}

export function hasExplicitTacticalTransientEvidence(
  signals: readonly TransientPlanSignal[] | undefined,
): boolean {
  return (
    signals?.some(
      (signal) =>
        signal.scope === "tactical" &&
        signal.target !== undefined &&
        signal.evidenceCode.length > 0 &&
        GUARANTEES.has(signal.guarantee),
    ) === true
  );
}

function transientPlanSignalInvalidReason(
  signal: TransientPlanSignal,
  context: TransientPlanSignalContext,
): string | undefined {
  if (!signal || typeof signal !== "object") return "signal_not_object";
  const unknownKey = Object.keys(signal).find(
    (key) => !ALLOWED_SIGNAL_KEYS.has(key as keyof TransientPlanSignal),
  );
  if (unknownKey) return `unknown_or_authority_field:${unknownKey}`;
  if (signal.schemaVersion !== TRANSIENT_PLAN_SIGNAL_SCHEMA_VERSION) {
    return "schema_version_mismatch";
  }
  if (signal.side !== context.side) return "side_mismatch";
  if (
    !nonEmptyToken(signal.planModuleId) ||
    !signal.planModuleId.startsWith(`${signal.side}.`)
  ) {
    return "invalid_or_side_mismatched_plan_module";
  }
  if (!nonEmptyToken(signal.planDedupeKey)) return "invalid_plan_dedupe_key";
  if (
    !Number.isSafeInteger(signal.observedAtStateVersion) ||
    signal.observedAtStateVersion < 0
  ) {
    return "invalid_observed_state_version";
  }
  if (signal.observedAtStateVersion < context.stateVersion) {
    return "stale_state_version";
  }
  if (signal.observedAtStateVersion > context.stateVersion) {
    return "future_state_version";
  }
  if (signal.kind !== "goal" && signal.kind !== "threat") {
    return "invalid_signal_kind";
  }
  if (signal.scope !== "strategic" && signal.scope !== "tactical") {
    return "invalid_signal_scope";
  }
  if (!nonEmptyToken(signal.signalId)) return "invalid_signal_id";
  if (!nonEmptyToken(signal.evidenceCode)) return "missing_evidence";
  if (!GUARANTEES.has(signal.guarantee)) return "weak_or_invalid_guarantee";
  if (signal.target && !validTarget(signal.target)) return "invalid_target";
  return undefined;
}

function validTarget(target: PlanTargetRef): boolean {
  if (!target || typeof target !== "object") return false;
  const keys = Object.keys(target);
  if (keys.some((key) => key !== "kind" && key !== "id" && key !== "label")) {
    return false;
  }
  return (
    TARGET_KINDS.has(target.kind) &&
    nonEmptyToken(target.id) &&
    (target.label === undefined || nonEmptyToken(target.label))
  );
}

function nonEmptyToken(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function invalidTransientPlanSignal(
  context: TransientPlanSignalContext,
  signal: TransientPlanSignal,
  reason: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("invalid_plan_identity", {
    side: context.side,
    stateVersion: context.stateVersion,
    timingPoint: context.timingPoint ?? "plan_discovery",
    legalActionTypes: [],
    owner: "priority_policy",
    removalCondition: `Reject transient goal/threat signal ${nonEmptyToken(signal?.signalId) ? signal.signalId : "unknown"}: ${reason}. Signals must be current-state, side-bound, evidence-bearing and contain no action authority.`,
  });
}
