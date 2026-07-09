import type { LegalAction } from "@netgrid/shared";
import type {
  ActionHiddenResourceModel,
  ActionHiddenResourceVirusModel,
  ActionSemanticCandidate,
  ActionVirusCounterModel,
} from "../action-semantic-candidate";

const PURGE_ACTION_TYPES = new Set<LegalAction["type"]>([
  "purge_virus_counters",
  "purge_runner_virus_counters",
]);

export function applyHiddenResourceVirusModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const model = projectHiddenResourceVirusModel(candidate, action);
  return model ? { ...candidate, hiddenResourceVirusModel: model } : candidate;
}

export function projectHiddenResourceVirusModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionHiddenResourceVirusModel | undefined {
  const hiddenResource = projectHiddenResource(candidate, action);
  const virusCounter = projectVirusCounter(candidate, action);
  if (!hiddenResource && !virusCounter) return undefined;
  return {
    ...(hiddenResource ? { hiddenResource } : {}),
    ...(virusCounter ? { virusCounter } : {}),
  };
}

function projectHiddenResource(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionHiddenResourceModel | undefined {
  const terms = semanticTerms(candidate);
  const semanticSignal = hasTerms(terms, "hidden", "resource");
  const available = firstFiniteNumberPayload(action, [
    "ownHiddenResourceAvailable",
    "hiddenResourceAvailable",
  ]);
  const required = firstFiniteNumberPayload(action, [
    "ownHiddenResourceRequired",
    "hiddenResourceRequired",
  ]);
  const hiddenBlocked =
    candidate.primaryProjectionStatus === "hidden_info_blocked" ||
    candidate.projectionIssues.includes("hidden_info_blocked") ||
    candidate.hardGates.some(
      (gate) => gate.gateId === "hidden_info" && gate.status === "block",
    );
  if (
    !semanticSignal &&
    available === undefined &&
    required === undefined &&
    !hiddenBlocked
  ) {
    return undefined;
  }

  const ownPrivate = action.visibility === "private_to_actor" && !hiddenBlocked;
  const perspective = hiddenBlocked
    ? "hidden_info_blocked"
    : ownPrivate
      ? "own_private_constraint"
      : "opponent_abstract_risk";
  const mayExposeOwnAmounts = perspective === "own_private_constraint";
  const safeAvailable = mayExposeOwnAmounts ? available : undefined;
  const safeRequired = mayExposeOwnAmounts ? required : undefined;
  const sufficiency =
    safeAvailable === undefined || safeRequired === undefined
      ? "unknown"
      : safeAvailable >= safeRequired
        ? "sufficient"
        : "insufficient";

  return {
    schemaVersion: "hidden-resource-model-v1",
    perspective,
    ...(safeAvailable !== undefined ? { available: safeAvailable } : {}),
    ...(safeRequired !== undefined ? { required: safeRequired } : {}),
    sufficiency,
    opponentIdentityPreserved: true,
    hiddenInfoPolicy: "actor_private_or_abstract_only",
    evidence: [
      `hidden_resource_perspective:${perspective}`,
      `hidden_resource_sufficiency:${sufficiency}`,
      "hidden_resource_opponent_identity_preserved:true",
    ],
  };
}

function projectVirusCounter(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionVirusCounterModel | undefined {
  const terms = semanticTerms(candidate);
  const counterType = firstStringPayload(action, [
    "virusCounterType",
    "counterType",
  ]);
  const explicitFamily = firstStringPayload(action, ["counterFamily"]);
  const antibody =
    explicitFamily === "corp_antibody" ||
    hasTerms(terms, "antibody") ||
    hasTerms(terms, "proteus", "antibody", "counter", "family");
  const virus =
    explicitFamily === "runner_virus" ||
    counterType !== undefined ||
    hasTerms(terms, "virus") ||
    PURGE_ACTION_TYPES.has(action.type);
  if (!antibody && !virus) return undefined;

  const counterFamily = antibody ? "corp_antibody" : "runner_virus";
  const amountAdded = firstFiniteNumberPayload(action, [
    "virusCounterAdded",
    "counterAmountAdded",
  ]);
  const countersAfter = firstFiniteNumberPayload(action, [
    "virusCountersAfter",
    "countersAfter",
  ]);
  const purgePressure = PURGE_ACTION_TYPES.has(action.type)
    ? "purge_action"
    : booleanPayload(action, "purgeWindowOpen") === true ||
        hasTerms(terms, "purge", "window")
      ? "purge_window"
      : "none";
  const payoutWindow =
    booleanPayload(action, "counterPayoutAvailable") === true ||
    hasTerms(terms, "counter", "payout")
      ? "available"
      : "not_signaled";
  const source = PURGE_ACTION_TYPES.has(action.type)
    ? "action_type"
    : counterType !== undefined ||
        amountAdded !== undefined ||
        countersAfter !== undefined ||
        explicitFamily !== undefined
      ? "legal_action_payload"
      : "side_safe_semantics";

  return {
    schemaVersion: "virus-counter-model-v1",
    counterFamily,
    ...(counterType ? { counterType } : {}),
    ...(amountAdded !== undefined ? { amountAdded } : {}),
    ...(countersAfter !== undefined ? { countersAfter } : {}),
    purgePressure,
    payoutWindow,
    antibodySeparatedFromRunnerVirus: true,
    source,
    evidence: [
      `counter_family:${counterFamily}`,
      `counter_model_source:${source}`,
      `purge_pressure:${purgePressure}`,
      `counter_payout_window:${payoutWindow}`,
      "antibody_separated_from_runner_virus:true",
      ...(counterType ? [`counter_type:${counterType}`] : []),
      ...(amountAdded !== undefined
        ? [`counter_amount_added:${amountAdded}`]
        : []),
      ...(countersAfter !== undefined
        ? [`counters_after:${countersAfter}`]
        : []),
    ],
  };
}

function semanticTerms(candidate: ActionSemanticCandidate): Set<string> {
  return new Set(
    [
      ...candidate.cardContextSignals,
      ...candidate.actionTacticSignals,
      ...candidate.conditions.map((condition) => condition.kind),
      ...candidate.risks.map((risk) => risk.kind),
      ...candidate.constraints.map((constraint) => constraint.kind),
    ].flatMap((value) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  );
}

function hasTerms(terms: ReadonlySet<string>, ...required: string[]): boolean {
  return required.every((term) => terms.has(term));
}

function firstStringPayload(
  action: LegalAction,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = action.payload?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function firstFiniteNumberPayload(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = action.payload?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function booleanPayload(action: LegalAction, key: string): boolean | undefined {
  const value = action.payload?.[key];
  return typeof value === "boolean" ? value : undefined;
}
