import type { LegalAction } from "@netgrid/shared";
import type {
  ActionCapacityProjection,
  ActionCapacityRestriction,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";

export function applyActionCapacityProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const actionCapacityProjection = actionCapacityProjectionFor(
    candidate,
    action,
  );
  return {
    ...candidate,
    actionCapacityProjection,
    evidence: [
      ...candidate.evidence,
      "AI action capacity projected from side-safe LegalAction facts",
      ...actionCapacityProjection.evidence.map(
        (entry) => `action_capacity:${entry}`,
      ),
    ],
  };
}

export function actionCapacityProjectionFor(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionCapacityProjection {
  const listedActionCost = Math.max(0, candidate.costProfile.clickCost ?? 0);
  return actionCapacityProjectionWithListedCost(action, listedActionCost);
}

export function actionCapacityProjectionForLegalAction(
  action: LegalAction,
): ActionCapacityProjection {
  const listedActionCost = (action.costs ?? []).reduce(
    (sum, cost) => sum + Math.max(0, Math.floor(cost.clicks ?? 0)),
    0,
  );
  return actionCapacityProjectionWithListedCost(action, listedActionCost);
}

function actionCapacityProjectionWithListedCost(
  action: LegalAction,
  listedActionCost: number,
): ActionCapacityProjection {
  const grossActionsGained = nonNegativeInteger(
    action.payload?.gainActionsAmount,
  );
  const timing = actionCapacityTiming(action, grossActionsGained);
  const restriction = actionCapacityRestriction(action);
  const selfFinancing =
    action.payload?.actionCapacitySelfFinancing === true ||
    action.payload?.restrictedActionGrantCostProfile === "extra_click";
  const generatedActionsConsumedByCurrentAction = selfFinancing
    ? Math.min(listedActionCost, grossActionsGained)
    : 0;
  const preExistingActionCost = Math.max(
    0,
    listedActionCost - generatedActionsConsumedByCurrentAction,
  );
  const followupActionCapacity = Math.max(
    0,
    grossActionsGained - generatedActionsConsumedByCurrentAction,
  );
  const actionDebt =
    action.type === "forgo_action"
      ? Math.max(1, nonNegativeInteger(action.payload?.forgoActionsPending))
      : 0;
  const gainAmountPerTurn = positiveInteger(
    action.payload?.actionCapacityGainAmountPerTurn,
  );
  const durationTurns = positiveInteger(
    action.payload?.actionCapacityDurationTurns,
  );
  const source =
    grossActionsGained > 0 || gainAmountPerTurn !== undefined
      ? "legal_action_payload"
      : actionDebt > 0
        ? "action_debt_contract"
        : "unknown";
  const kind =
    actionDebt > 0
      ? "action_debt"
      : timing === "future_turn_start" && gainAmountPerTurn !== undefined
        ? "future_recurring_gain"
        : grossActionsGained > 0 && restriction !== "unrestricted"
          ? "immediate_restricted_gain"
          : grossActionsGained > 0
            ? "immediate_unrestricted_gain"
            : "non_action_capacity";
  const allowedActionTypes = allowedActionTypesFor(action, restriction);
  const reliability = actionCapacityReliability(action, source);
  const explicitSourceCounterType = stringPayload(
    action,
    "cardImplementationSourceCounterType",
  );
  const advancementCounterCost = positiveInteger(
    action.payload?.cardImplementationAdvancementCounterCost,
  );
  const sourceCounterType =
    explicitSourceCounterType ??
    (advancementCounterCost !== undefined ? "advancement" : undefined);
  const sourceCounterCost =
    positiveInteger(action.payload?.cardImplementationSourceCounterCost) ??
    advancementCounterCost;
  const netCurrentTurnActionDelta =
    timing === "immediate" ? grossActionsGained - listedActionCost : 0;
  const evidence = [
    `kind:${kind}`,
    `timing:${timing}`,
    `restriction:${restriction}`,
    `listed_action_cost:${listedActionCost}`,
    `pre_existing_action_cost:${preExistingActionCost}`,
    `gross_actions_gained:${grossActionsGained}`,
    `generated_actions_consumed_by_current_action:${generatedActionsConsumedByCurrentAction}`,
    `followup_action_capacity:${followupActionCapacity}`,
    `net_current_turn_action_delta:${netCurrentTurnActionDelta}`,
    `action_debt:${actionDebt}`,
    `self_financing:${selfFinancing}`,
    `source:${source}`,
    ...(allowedActionTypes.length > 0
      ? [`allowed_action_types:${allowedActionTypes.join(",")}`]
      : []),
    ...(gainAmountPerTurn !== undefined
      ? [`gain_amount_per_turn:${gainAmountPerTurn}`]
      : []),
    ...(durationTurns !== undefined ? [`duration_turns:${durationTurns}`] : []),
    ...(sourceCounterType !== undefined
      ? [`source_counter_type:${sourceCounterType}`]
      : []),
    ...(sourceCounterCost !== undefined
      ? [`source_counter_cost:${sourceCounterCost}`]
      : []),
  ];

  return {
    schemaVersion: "action-capacity-projection-v1",
    kind,
    timing,
    restriction,
    allowedActionTypes,
    listedActionCost,
    preExistingActionCost,
    grossActionsGained,
    generatedActionsConsumedByCurrentAction,
    followupActionCapacity,
    netCurrentTurnActionDelta,
    actionDebt,
    ...(gainAmountPerTurn !== undefined ? { gainAmountPerTurn } : {}),
    ...(durationTurns !== undefined ? { durationTurns } : {}),
    ...(timing === "immediate"
      ? { expiresAt: "side_turn_end" as const }
      : timing === "future_turn_start"
        ? { expiresAt: "duration_end" as const }
        : {}),
    selfFinancing,
    repeatable: "unknown",
    reliability,
    ...(sourceCounterType !== undefined ? { sourceCounterType } : {}),
    ...(sourceCounterCost !== undefined ? { sourceCounterCost } : {}),
    source,
    confidence:
      source === "legal_action_payload"
        ? "high"
        : source === "action_debt_contract"
          ? "medium"
          : "none",
    evidence,
  };
}

function actionCapacityTiming(
  action: LegalAction,
  grossActionsGained: number,
): ActionCapacityProjection["timing"] {
  const timing = stringPayload(action, "actionCapacityTiming");
  if (timing === "immediate" || timing === "future_turn_start") return timing;
  if (action.type === "forgo_action") return "debt";
  if (grossActionsGained > 0) return "immediate";
  return "unknown";
}

function actionCapacityRestriction(
  action: LegalAction,
): ActionCapacityRestriction {
  const restriction = stringPayload(action, "actionCapacityRestriction");
  if (
    restriction === "unrestricted" ||
    restriction === "install_only" ||
    restriction === "program_install_only" ||
    restriction === "run_only"
  )
    return restriction;
  const actionType = stringPayload(action, "restrictedActionGrantActionType");
  if (actionType === "start_run") return "run_only";
  if (actionType === "install_card") return "install_only";
  return grossGainOrFutureGain(action) ? "unrestricted" : "unknown";
}

function allowedActionTypesFor(
  action: LegalAction,
  restriction: ActionCapacityRestriction,
): string[] {
  const explicit = stringPayload(action, "actionCapacityAllowedActionType");
  if (explicit) return [explicit];
  const existing = stringPayload(action, "restrictedActionGrantActionType");
  if (existing) return [existing];
  if (restriction === "program_install_only" || restriction === "install_only")
    return ["install_card"];
  if (restriction === "run_only") return ["start_run"];
  return [];
}

function actionCapacityReliability(
  action: LegalAction,
  source: ActionCapacityProjection["source"],
): ActionCapacityProjection["reliability"] {
  const reliability = stringPayload(action, "actionCapacityReliability");
  if (
    reliability === "guaranteed" ||
    reliability === "conditional" ||
    reliability === "random"
  )
    return reliability;
  return source === "legal_action_payload" || source === "action_debt_contract"
    ? "guaranteed"
    : "unknown";
}

function grossGainOrFutureGain(action: LegalAction): boolean {
  return (
    nonNegativeInteger(action.payload?.gainActionsAmount) > 0 ||
    positiveInteger(action.payload?.actionCapacityGainAmountPerTurn) !==
      undefined
  );
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function positiveInteger(value: unknown): number | undefined {
  const amount = nonNegativeInteger(value);
  return amount > 0 ? amount : undefined;
}
