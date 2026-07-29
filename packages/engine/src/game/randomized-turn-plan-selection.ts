import {
  ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
  type AiTurnPlanRandomDrawRecord,
  type ApplyActionOptions,
  type EngineError,
  type EngineRandomizedTurnPlanCandidate,
  type EngineRandomizedTurnPlanSelectionCommand,
  type EngineRandomizedTurnPlanSelectionQuote,
  type EngineRandomizedTurnPlanSelectionQuoteResult,
  type EngineRandomizedTurnPlanSelectionRequest,
  type EngineRandomizedTurnPlanSelectionResult,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { buildApplyAction, type ApplyActionCoreHost } from "./apply-action";
import { cloneGameStateForAction } from "./apply-action-state";
import { getLegalActions } from "./legal-actions";
import { deterministicNumber } from "./state/draw-random";

let defaultHost: ApplyActionCoreHost | undefined;

export function configureRandomizedTurnPlanSelectionHost(
  host: ApplyActionCoreHost | undefined,
): ApplyActionCoreHost | undefined {
  const previous = defaultHost;
  defaultHost = host;
  return previous;
}

export function quoteRandomizedTurnPlanSelection(
  state: GameState,
  request: EngineRandomizedTurnPlanSelectionRequest,
): EngineRandomizedTurnPlanSelectionQuoteResult {
  if (
    request.schemaVersion !==
      ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION ||
    request.matchId !== state.matchId ||
    request.stateVersion !== state.stateVersion ||
    request.side !== state.activeSide ||
    request.timingPoint !== state.timingPoint ||
    !request.opportunityKey.trim()
  ) {
    return fail("ERR_STALE_STATE", "Die TurnPlan-Auswahl ist nicht aktuell.");
  }
  const candidates = canonicalCandidates(request.candidates);
  if (
    candidates.length < 2 ||
    candidates.length !== request.candidates.length ||
    new Set(candidates.map((candidate) => candidate.familyKey)).size !==
      candidates.length ||
    candidates.some(
      (candidate) =>
        !candidate.familyKey.trim() ||
        !candidate.lineId.trim() ||
        !candidate.actionId.trim() ||
        !Number.isSafeInteger(candidate.weight) ||
        candidate.weight <= 0,
    )
  ) {
    return fail(
      "ERR_INVALID_TARGET",
      "Die TurnPlan-Auswahl benötigt verschiedene gewichtete Familien.",
    );
  }
  const legal = getLegalActions(state, request.side);
  const legalActions: LegalAction[] = [];
  for (const candidate of candidates) {
    const action = legal.find(
      (legalAction) =>
        legalAction.actionId === candidate.actionId &&
        legalAction.side === request.side &&
        legalAction.timingPoint === state.timingPoint &&
        legalAction.expiresAtStateVersion === state.stateVersion,
    );
    if (!action) {
      return fail(
        "ERR_UNKNOWN_ACTION",
        "Mindestens ein TurnPlan-Head ist nicht mehr legal.",
      );
    }
    legalActions.push(structuredClone(action));
  }
  return {
    ok: true,
    quote: {
      schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
      visibility: "private_to_actor",
      complete: true,
      matchId: state.matchId,
      side: request.side,
      stateVersion: state.stateVersion,
      timingPoint: state.timingPoint,
      opportunityKey: request.opportunityKey,
      candidates,
      candidateFingerprint: turnPlanCandidateFingerprint(candidates),
      legalActions,
    },
  };
}

export function applyRandomizedTurnPlanSelection(
  state: GameState,
  command: EngineRandomizedTurnPlanSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedTurnPlanSelectionResult {
  if (!defaultHost)
    throw new Error(
      "RandomizedTurnPlanSelection-Host ist nicht initialisiert.",
    );
  return buildApplyRandomizedTurnPlanSelection(
    defaultHost,
    state,
    command,
    options,
  );
}

export function buildApplyRandomizedTurnPlanSelection(
  host: ApplyActionCoreHost,
  state: GameState,
  command: EngineRandomizedTurnPlanSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedTurnPlanSelectionResult {
  const quote = command?.quote;
  if (
    command?.kind !== "engine_randomized_turn_plan_selection" ||
    quote?.schemaVersion !==
      ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION ||
    quote.visibility !== "private_to_actor" ||
    quote.complete !== true
  ) {
    return applyFail(
      state,
      "ERR_INVALID_TARGET",
      "Der TurnPlan-Auswahl-Command ist unvollständig.",
    );
  }
  const requoted = quoteRandomizedTurnPlanSelection(state, {
    schemaVersion: quote.schemaVersion,
    matchId: quote.matchId,
    side: quote.side,
    stateVersion: quote.stateVersion,
    timingPoint: quote.timingPoint,
    opportunityKey: quote.opportunityKey,
    candidates: quote.candidates,
  });
  if (!requoted.ok) return { ok: false, error: requoted.error, state };
  if (canonicalValue(requoted.quote) !== canonicalValue(quote)) {
    return applyFail(
      state,
      "ERR_STALE_STATE",
      "Die TurnPlan-Auswahlquote ist nicht mehr identisch.",
    );
  }

  const next = cloneGameStateForAction(state);
  const counter = next.aiTurnPlanRandomCounter ?? 0;
  const purpose = turnPlanSelectionPurpose(requoted.quote);
  const value = deterministicNumber(
    `${next.seed}:ai_turn_plan_selection:${purpose}:${counter}`,
  );
  const randomDraw: AiTurnPlanRandomDrawRecord = {
    domain: "ai_turn_plan_selection",
    counter,
    purpose,
    value,
  };
  next.aiTurnPlanRandomCounter = counter + 1;
  next.aiTurnPlanRandomDrawRecords = [
    ...(next.aiTurnPlanRandomDrawRecords ?? []),
    randomDraw,
  ];
  const totalWeight = requoted.quote.candidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  let weightedIndex = value * totalWeight;
  let selectedIndex = requoted.quote.candidates.length - 1;
  for (let index = 0; index < requoted.quote.candidates.length; index += 1) {
    weightedIndex -= requoted.quote.candidates[index]!.weight;
    if (weightedIndex < 0) {
      selectedIndex = index;
      break;
    }
  }
  const selectedCandidate = requoted.quote.candidates[selectedIndex]!;
  const selectedLegalAction = requoted.quote.legalActions[selectedIndex]!;
  const action: PlayerAction = {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: selectedCandidate.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(command.idempotencyKey
      ? { idempotencyKey: command.idempotencyKey }
      : {}),
  };
  const applied = buildApplyAction(host, next, action, options);
  if (!applied.ok) return { ok: false, error: applied.error, state };
  const receipt = {
    schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
    visibility: "private_to_actor" as const,
    matchId: state.matchId,
    side: state.activeSide,
    stateVersionBefore: state.stateVersion,
    stateVersionAfter: applied.state.stateVersion,
    timingPoint: state.timingPoint,
    opportunityKey: quote.opportunityKey,
    candidateFingerprint: quote.candidateFingerprint,
    selectedCandidate: structuredClone(selectedCandidate),
    selectedLegalAction: structuredClone(selectedLegalAction),
    randomDraw: structuredClone(randomDraw),
  };
  const privatePayload = applied.event.privatePayload?.[state.activeSide];
  if (!privatePayload) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Das private TurnPlan-Auswahl-Receipt fehlt.",
    );
  }
  privatePayload.action = structuredClone(command);
  privatePayload.randomizedTurnPlanSelectionReceipt = structuredClone(receipt);
  return { ...applied, receipt };
}

export function turnPlanCandidateFingerprint(
  candidates: readonly EngineRandomizedTurnPlanCandidate[],
): string {
  return encodeParts([
    ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
    ...canonicalCandidates(candidates).flatMap((candidate) => [
      candidate.familyKey,
      candidate.lineId,
      candidate.actionId,
      String(candidate.weight),
    ]),
  ]);
}

function canonicalCandidates(
  candidates: readonly EngineRandomizedTurnPlanCandidate[],
): EngineRandomizedTurnPlanCandidate[] {
  return candidates
    .map((candidate) => ({ ...candidate }))
    .sort(
      (left, right) =>
        left.familyKey.localeCompare(right.familyKey) ||
        left.lineId.localeCompare(right.lineId) ||
        left.actionId.localeCompare(right.actionId),
    );
}

function turnPlanSelectionPurpose(
  quote: EngineRandomizedTurnPlanSelectionQuote,
): string {
  return encodeParts([
    quote.opportunityKey,
    quote.candidateFingerprint,
    String(quote.stateVersion),
  ]);
}

function encodeParts(parts: readonly string[]): string {
  return `${parts.length};${parts.map((part) => `${part.length}:${part}`).join("")}`;
}

function canonicalValue(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalValue(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalValue(record[key])}`)
    .join(",")}}`;
}

function fail(
  code: EngineError["code"],
  message: string,
): EngineRandomizedTurnPlanSelectionQuoteResult {
  return { ok: false, error: { code, message } };
}

function applyFail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineRandomizedTurnPlanSelectionResult {
  return { ok: false, error: { code, message }, state };
}
