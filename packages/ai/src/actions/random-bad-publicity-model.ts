import { BAD_PUBLICITY_LOSS_THRESHOLD } from "@netgrid/engine";
import {
  isRandomPurposeCode,
  type LegalAction,
  type RandomPurposeCode,
} from "@netgrid/shared";
import type {
  ActionBadPublicityDecisionModel,
  ActionRandomBadPublicityModel,
  ActionRandomOutcomeModel,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";

const RANDOM_PURPOSE_KEYS = [
  "randomDrawRecordPurpose",
  "randomPurpose",
] as const;

export function applyRandomBadPublicityModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const model = projectRandomBadPublicityModel(candidate, action);
  return model ? { ...candidate, randomBadPublicityModel: model } : candidate;
}

export function projectRandomBadPublicityModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionRandomBadPublicityModel | undefined {
  const randomOutcome = projectRandomOutcome(action);
  const badPublicity = projectBadPublicity(candidate, action);
  if (!randomOutcome && !badPublicity) return undefined;
  return {
    ...(randomOutcome ? { randomOutcome } : {}),
    ...(badPublicity ? { badPublicity } : {}),
  };
}

function projectRandomOutcome(
  action: LegalAction,
): ActionRandomOutcomeModel | undefined {
  const purpose = firstRandomPurposeCodePayload(action, RANDOM_PURPOSE_KEYS);
  const counter = safeIntegerPayload(action, "randomCounterAfter");
  const counterAfter =
    counter !== undefined && counter >= 0 ? counter : undefined;
  const signalsRandomness =
    purpose !== undefined ||
    counterAfter !== undefined ||
    booleanPayload(action, "randomOutcome") === true ||
    booleanPayload(action, "rollDice") === true;
  if (!signalsRandomness) return undefined;

  return {
    schemaVersion: "random-outcome-model-v1",
    outcomeStatus: "not_drawn",
    ...(purpose ? { purpose } : {}),
    ...(counterAfter !== undefined ? { randomCounterAfter: counterAfter } : {}),
    source: "engine_random_draw_records_only",
    futureOutcomeAccess: "forbidden",
    deterministicProjection: true,
    evidence: [
      "random_outcome:not_drawn",
      "random_source:engine_random_draw_records_only",
      "future_random_outcome_access:forbidden",
      ...(purpose ? [`random_purpose:${purpose}`] : []),
      ...(counterAfter !== undefined
        ? [`random_counter_after:${counterAfter}`]
        : []),
    ],
  };
}

function projectBadPublicity(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionBadPublicityDecisionModel | undefined {
  const delta = firstSafeIntegerPayload(action, [
    "badPublicityAdded",
    "badPublicityDelta",
  ]);
  const current = firstSafeIntegerPayload(action, [
    "badPublicityBefore",
    "currentBadPublicity",
  ]);
  const explicitAfter = firstSafeIntegerPayload(action, [
    "badPublicityAfter",
    "resultingBadPublicity",
  ]);
  const after =
    explicitAfter ??
    (current !== undefined && delta !== undefined
      ? current + delta
      : undefined);
  const semanticSupport = hasBadPublicitySemantics(candidate);
  if (
    delta === undefined &&
    current === undefined &&
    explicitAfter === undefined &&
    !semanticSupport
  ) {
    return undefined;
  }

  const thresholdStatus =
    after === undefined
      ? "unknown"
      : after >= BAD_PUBLICITY_LOSS_THRESHOLD
        ? "reached"
        : "not_reached";
  const actorRelevance =
    delta === undefined || delta === 0
      ? "support"
      : delta > 0 === (action.side === "runner")
        ? "payoff"
        : "risk";
  const source =
    delta !== undefined || current !== undefined || explicitAfter !== undefined
      ? "legal_action_payload"
      : "side_safe_semantics";

  return {
    schemaVersion: "bad-publicity-decision-model-v1",
    ...(delta !== undefined ? { delta } : {}),
    ...(current !== undefined ? { current } : {}),
    ...(after !== undefined ? { after } : {}),
    lossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD,
    thresholdStatus,
    actorRelevance,
    source,
    hiddenInfoPolicy: "side_safe_visible_only",
    evidence: [
      `bad_publicity_source:${source}`,
      `bad_publicity_threshold_status:${thresholdStatus}`,
      `bad_publicity_actor_relevance:${actorRelevance}`,
      ...(delta !== undefined ? [`bad_publicity_delta:${delta}`] : []),
      ...(current !== undefined ? [`bad_publicity_current:${current}`] : []),
      ...(after !== undefined ? [`bad_publicity_after:${after}`] : []),
    ],
  };
}

function hasBadPublicitySemantics(candidate: ActionSemanticCandidate): boolean {
  const values = [
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.conditions.map((condition) => condition.kind),
    ...candidate.risks.map((risk) => risk.kind),
    ...candidate.constraints.map((constraint) => constraint.kind),
  ];
  return values.some((value) => {
    const tokens = value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    return tokens.some(
      (token, index) => token === "bad" && tokens[index + 1] === "publicity",
    );
  });
}

function firstRandomPurposeCodePayload(
  action: LegalAction,
  keys: readonly string[],
): RandomPurposeCode | undefined {
  for (const key of keys) {
    const value = action.payload?.[key];
    if (isRandomPurposeCode(value)) return value;
  }
  return undefined;
}

function firstSafeIntegerPayload(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = safeIntegerPayload(action, key);
    if (value !== undefined) return value;
  }
  return undefined;
}

function safeIntegerPayload(
  action: LegalAction,
  key: string,
): number | undefined {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : undefined;
}

function booleanPayload(action: LegalAction, key: string): boolean | undefined {
  const value = action.payload?.[key];
  return typeof value === "boolean" ? value : undefined;
}
