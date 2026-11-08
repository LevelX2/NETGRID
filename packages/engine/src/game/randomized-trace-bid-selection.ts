import {
  ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
  type AiTurnPlanRandomDrawRecord,
  type ApplyActionOptions,
  type EngineError,
  type EngineRandomizedTraceBidCandidate,
  type EngineRandomizedTraceBidSelectionCommand,
  type EngineRandomizedTraceBidSelectionQuote,
  type EngineRandomizedTraceBidSelectionQuoteResult,
  type EngineRandomizedTraceBidSelectionRequest,
  type EngineRandomizedTraceBidSelectionResult,
  type GameState,
  type PlayerAction,
} from "@netgrid/shared";
import { buildApplyAction, type ApplyActionCoreHost } from "./apply-action";
import { cloneGameStateForAction } from "./apply-action-state";
import { getLegalActions } from "./legal-actions";
import { deterministicNumber, nextRandom } from "./state/draw-random";

let defaultHost: ApplyActionCoreHost | undefined;

export function configureRandomizedTraceBidSelectionHost(
  host: ApplyActionCoreHost | undefined,
): ApplyActionCoreHost | undefined {
  const previous = defaultHost;
  defaultHost = host;
  return previous;
}

export function quoteRandomizedTraceBidSelection(
  state: GameState,
  request: EngineRandomizedTraceBidSelectionRequest,
): EngineRandomizedTraceBidSelectionQuoteResult {
  if (
    request.schemaVersion !==
      ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION ||
    request.matchId !== state.matchId ||
    request.stateVersion !== state.stateVersion ||
    request.side !== state.activeSide ||
    request.timingPoint !== state.timingPoint ||
    request.actionId.trim().length === 0 ||
    request.choiceId.trim().length === 0 ||
    request.planStepId.trim().length === 0
  ) {
    return fail("ERR_STALE_STATE", "Die Trace-Bid-Auswahl ist nicht aktuell.");
  }
  const choice = state.pendingChoice;
  if (
    !choice ||
    choice.choiceId !== request.choiceId ||
    choice.side !== request.side ||
    choice.kind !== "bid_amount" ||
    choice.stateVersion !== state.stateVersion ||
    choice.visibility !== "hidden_info_barrier"
  ) {
    return fail(
      "ERR_INVALID_CHOICE",
      "Die Trace-Bid-Choice ist nicht mehr exakt gebunden.",
    );
  }
  const legalAction = getLegalActions(state, request.side).find(
    (candidate) =>
      candidate.actionId === request.actionId &&
      candidate.type === "resolve_choice" &&
      candidate.expiresAtStateVersion === state.stateVersion,
  );
  if (!legalAction) {
    return fail(
      "ERR_UNKNOWN_ACTION",
      "Die gebundene Trace-Resolution ist nicht mehr legal.",
    );
  }
  const candidates = canonicalCandidates(request.candidates);
  const totalWeight = candidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  if (
    candidates.length < 2 ||
    candidates.length !== request.candidates.length ||
    new Set(candidates.map((candidate) => candidate.optionId)).size !==
      candidates.length ||
    candidates.some(
      (candidate) =>
        !candidate.optionId.trim() ||
        !Number.isSafeInteger(candidate.bid) ||
        candidate.bid < 0 ||
        !Number.isSafeInteger(candidate.weight) ||
        candidate.weight <= 0 ||
        !Number.isFinite(candidate.utility),
    ) ||
    !Number.isSafeInteger(totalWeight) ||
    totalWeight <= 0
  ) {
    return fail(
      "ERR_INVALID_TARGET",
      "Die Trace-Bid-Auswahl benötigt mehrere legale gewichtete Kandidaten.",
    );
  }
  for (const candidate of candidates) {
    const option = choice.options.find(
      (current) => current.id === candidate.optionId,
    );
    if (option?.value !== candidate.bid) {
      return fail(
        "ERR_INVALID_CHOICE",
        "Mindestens ein Trace-Bid-Kandidat ist nicht Engine-zertifiziert.",
      );
    }
  }
  const assessment = request.assessment;
  if (!assessment || typeof assessment !== "object") {
    return fail("ERR_INVALID_TARGET", "Die Bewertung der Betragswahl fehlt.");
  }
  const rationalRange = [candidates[0]!.bid, candidates.at(-1)!.bid] as const;
  if ("kind" in assessment) {
    if (
      assessment.kind !== "secret_guess" ||
      assessment.policy !== "uniform_access_denial_v1" ||
      request.side !== "corp" ||
      !choice.source.startsWith(
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:",
      ) ||
      choice.source.split(":")[1] !==
        state.secretSpendGuessRunSecret?.sourceCardId ||
      assessment.minimumGuess !== 2 ||
      assessment.maximumGuess !== state.runner.credits ||
      candidates.length !== choice.options.length ||
      candidates.length !== assessment.maximumGuess - 1 ||
      candidates.some(
        (candidate, index) =>
          candidate.bid !== index + 2 ||
          candidate.weight !== 1 ||
          candidate.utility !== 1,
      ) ||
      !Number.isSafeInteger(state.aiTurnPlanRandomCounter) ||
      state.aiTurnPlanRandomCounter! < 0 ||
      state.aiTurnPlanRandomCounter! >= Number.MAX_SAFE_INTEGER ||
      !Array.isArray(state.aiTurnPlanRandomDrawRecords) ||
      state.aiTurnPlanRandomCounter !==
        state.aiTurnPlanRandomDrawRecords.length ||
      state.aiTurnPlanRandomDrawRecords.some(
        (record, index) =>
          record.counter !== index ||
          record.domain !== "ai_turn_plan_selection",
      )
    )
      return fail(
        "ERR_INVALID_TARGET",
        "Die Geheimwahl ist nicht an ihre vollständige aktuelle Optionsmenge und RNG-Domäne gebunden.",
      );
  } else if (
    assessment.traceId !== state.trace?.traceId ||
    assessment.traceRulesProfile !== state.trace?.traceRulesProfile ||
    (assessment.traceRulesProfile !== "classic_blind" &&
      assessment.traceRulesProfile !== "classic_blind_corp_ties") ||
    assessment.printedTrace !== state.trace.traceLimit ||
    assessment.effectiveTraceLimit !==
      (state.trace.effectiveTraceLimit ?? state.trace.traceLimit) ||
    assessment.rationalRange.length !== 2 ||
    assessment.rationalRange.some((value) => !Number.isSafeInteger(value)) ||
    assessment.rationalRange[0] !== rationalRange[0] ||
    assessment.rationalRange[1] !== rationalRange[1] ||
    !Number.isSafeInteger(assessment.rationalTarget) ||
    !candidates.some(
      (candidate) => candidate.bid === assessment.rationalTarget,
    ) ||
    !Number.isSafeInteger(assessment.currentLink) ||
    assessment.currentLink < 0 ||
    !Number.isSafeInteger(assessment.visibleOpponentBidCapacity) ||
    assessment.visibleOpponentBidCapacity < 0 ||
    !Number.isFinite(assessment.outcomeValue) ||
    assessment.outcomeValue < 0 ||
    !Number.isSafeInteger(assessment.reserveTarget) ||
    assessment.reserveTarget < 0 ||
    !TRACE_BID_STAKES.has(assessment.stakes) ||
    !TRACE_BID_BEHAVIORAL_BIASES.has(assessment.behavioralBias)
  ) {
    return fail(
      "ERR_INVALID_TARGET",
      "Die Trace-Bid-Bewertung ist nicht an den aktuellen Trace gebunden.",
    );
  }
  return {
    ok: true,
    quote: {
      ...structuredClone(request),
      candidates,
      visibility: "private_to_actor",
      complete: true,
      candidateFingerprint: traceBidCandidateFingerprint(candidates),
      legalAction: structuredClone(legalAction),
    },
  };
}

const TRACE_BID_STAKES = new Set(["low", "normal", "high", "terminal"]);
const TRACE_BID_BEHAVIORAL_BIASES = new Set([
  "conservative",
  "normal",
  "aggressive",
  "polarized",
]);

export function applyRandomizedTraceBidSelection(
  state: GameState,
  command: EngineRandomizedTraceBidSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedTraceBidSelectionResult {
  if (!defaultHost)
    throw new Error(
      "RandomizedTraceBidSelection-Host ist nicht initialisiert.",
    );
  return buildApplyRandomizedTraceBidSelection(
    defaultHost,
    state,
    command,
    options,
  );
}

export function buildApplyRandomizedTraceBidSelection(
  host: ApplyActionCoreHost,
  state: GameState,
  command: EngineRandomizedTraceBidSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedTraceBidSelectionResult {
  const quote = command?.quote;
  if (
    command?.kind !== "engine_randomized_trace_bid_selection" ||
    quote?.schemaVersion !==
      ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION ||
    quote.visibility !== "private_to_actor" ||
    quote.complete !== true
  ) {
    return applyFail(
      state,
      "ERR_INVALID_TARGET",
      "Der Trace-Bid-Auswahl-Command ist unvollständig.",
    );
  }
  const requoted = quoteRandomizedTraceBidSelection(state, {
    schemaVersion: quote.schemaVersion,
    matchId: quote.matchId,
    side: quote.side,
    stateVersion: quote.stateVersion,
    timingPoint: quote.timingPoint,
    actionId: quote.actionId,
    choiceId: quote.choiceId,
    planStepId: quote.planStepId,
    assessment: quote.assessment,
    candidates: quote.candidates,
  });
  if (!requoted.ok) return { ok: false, error: requoted.error, state };
  if (canonicalValue(requoted.quote) !== canonicalValue(quote)) {
    return applyFail(
      state,
      "ERR_STALE_STATE",
      "Die Trace-Bid-Auswahlquote ist nicht mehr identisch.",
    );
  }

  const next = cloneGameStateForAction(state);
  const secretGuess = "kind" in requoted.quote.assessment;
  const counterBefore = secretGuess
    ? next.aiTurnPlanRandomCounter!
    : next.randomCounter;
  const purpose = traceBidSelectionPurpose(requoted.quote);
  const randomValue = secretGuess
    ? drawSecretGuess(next, purpose).value
    : nextRandom(next, purpose);
  const totalWeight = requoted.quote.candidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  let cursor = randomValue * totalWeight;
  let selectedCandidate = requoted.quote.candidates.at(-1)!;
  for (const candidate of requoted.quote.candidates) {
    cursor -= candidate.weight;
    if (cursor < 0) {
      selectedCandidate = candidate;
      break;
    }
  }
  const playerAction: PlayerAction = {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: quote.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: quote.choiceId,
      selectedOptionIds: [selectedCandidate.optionId],
    },
    ...(command.idempotencyKey
      ? { idempotencyKey: command.idempotencyKey }
      : {}),
  };
  const applied = buildApplyAction(host, next, playerAction, options);
  if (!applied.ok) return { ok: false, error: applied.error, state };
  const randomDraw = (
    secretGuess
      ? applied.state.aiTurnPlanRandomDrawRecords!
      : applied.state.randomDrawRecords
  ).find(
    (record) => record.counter === counterBefore && record.purpose === purpose,
  );
  if (!randomDraw) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Der replaybare Trace-Bid-Zufallsnachweis fehlt.",
    );
  }
  const receipt = {
    schemaVersion: ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
    visibility: "private_to_actor" as const,
    matchId: state.matchId,
    side: state.activeSide,
    stateVersionBefore: state.stateVersion,
    stateVersionAfter: applied.state.stateVersion,
    timingPoint: state.timingPoint,
    actionId: quote.actionId,
    choiceId: quote.choiceId,
    planStepId: quote.planStepId,
    assessment: structuredClone(quote.assessment),
    candidateFingerprint: quote.candidateFingerprint,
    selectedCandidate: structuredClone(selectedCandidate),
    selectedLegalAction: structuredClone(quote.legalAction),
    randomDraw: structuredClone(randomDraw),
  };
  const privatePayload = applied.event.privatePayload?.[state.activeSide];
  if (!privatePayload) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Das private Trace-Bid-Receipt fehlt.",
    );
  }
  privatePayload.action = structuredClone(command);
  privatePayload.randomizedTraceBidSelectionReceipt = structuredClone(receipt);
  return { ...applied, receipt };
}

export function traceBidCandidateFingerprint(
  candidates: readonly EngineRandomizedTraceBidCandidate[],
): string {
  return encodeParts([
    ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
    ...canonicalCandidates(candidates).flatMap((candidate) => [
      candidate.optionId,
      String(candidate.bid),
      String(candidate.weight),
      String(candidate.utility),
    ]),
  ]);
}

function canonicalCandidates(
  candidates: readonly EngineRandomizedTraceBidCandidate[],
): EngineRandomizedTraceBidCandidate[] {
  return candidates
    .map((candidate) => ({ ...candidate }))
    .sort(
      (left, right) =>
        left.bid - right.bid || left.optionId.localeCompare(right.optionId),
    );
}

function traceBidSelectionPurpose(
  quote: EngineRandomizedTraceBidSelectionQuote,
): string {
  return encodeParts([
    "engine.randomized_trace_bid_selection",
    quote.side,
    "kind" in quote.assessment
      ? quote.assessment.kind
      : quote.assessment.traceId,
    quote.choiceId,
    quote.planStepId,
    quote.candidateFingerprint,
  ]);
}

function drawSecretGuess(
  state: GameState,
  purpose: string,
): AiTurnPlanRandomDrawRecord {
  const counter = state.aiTurnPlanRandomCounter!;
  const record: AiTurnPlanRandomDrawRecord = {
    domain: "ai_turn_plan_selection",
    counter,
    purpose,
    value: deterministicNumber(
      `${state.seed}:ai_turn_plan_selection:${purpose}:${counter}`,
    ),
  };
  state.aiTurnPlanRandomCounter = counter + 1;
  state.aiTurnPlanRandomDrawRecords = [
    ...state.aiTurnPlanRandomDrawRecords!,
    record,
  ];
  return record;
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
): EngineRandomizedTraceBidSelectionQuoteResult {
  return { ok: false, error: { code, message } };
}

function applyFail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineRandomizedTraceBidSelectionResult {
  return { ok: false, error: { code, message }, state };
}
