import {
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type ApplyActionOptions,
  type EngineError,
  type EngineRandomizedIceInstallCandidate,
  type EngineRandomizedIceInstallSelectionCommand,
  type EngineRandomizedIceInstallSelectionQuote,
  type EngineRandomizedIceInstallSelectionQuoteResult,
  type EngineRandomizedIceInstallSelectionRequest,
  type EngineRandomizedIceInstallSelectionResult,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { buildApplyAction, type ApplyActionCoreHost } from "./apply-action";
import { cloneGameStateForAction } from "./apply-action-state";
import { getLegalActions } from "./legal-actions";
import { nextRandom } from "./state/draw-random";

let defaultRandomizedIceInstallSelectionHost: ApplyActionCoreHost | undefined;

export function configureRandomizedIceInstallSelectionHost(
  host: ApplyActionCoreHost | undefined,
): ApplyActionCoreHost | undefined {
  const previous = defaultRandomizedIceInstallSelectionHost;
  defaultRandomizedIceInstallSelectionHost = host;
  return previous;
}

export function quoteRandomizedIceInstallSelection(
  state: GameState,
  request: EngineRandomizedIceInstallSelectionRequest,
): EngineRandomizedIceInstallSelectionQuoteResult {
  if (!isRandomizedIceInstallSelectionRequest(request)) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Zufallsauswahl-Anfrage ist unvollständig.",
    );
  }
  if (
    request.schemaVersion !==
    ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION
  ) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Zufallsauswahl-Version ist ungültig.",
    );
  }
  if (request.matchId !== state.matchId) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Zufallsauswahl gehört nicht zu diesem Spiel.",
    );
  }
  if (request.stateVersion !== state.stateVersion) {
    return quoteFail(
      "ERR_STALE_STATE",
      "Der Spielzustand der Zufallsauswahl ist veraltet.",
    );
  }
  if (request.side !== "corp" || request.timingPoint !== state.timingPoint) {
    return quoteFail(
      request.side === "corp" ? "ERR_UNKNOWN_ACTION" : "ERR_WRONG_SIDE",
      "Die Zufallsauswahl gehört nicht zum aktuellen Timingfenster.",
    );
  }
  if (request.planStepId.trim().length === 0) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Zufallsauswahl benötigt einen gebundenen Plan-Step.",
    );
  }

  const candidates = canonicalCandidates(request.candidates);
  if (
    candidates.length < 2 ||
    candidates.length !== request.candidates.length ||
    new Set(candidates.map((candidate) => candidate.actionId)).size !==
      candidates.length
  ) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Near-Tie-Auswahl benötigt mindestens zwei verschiedene Aktionen.",
    );
  }

  const legalActions = getLegalActions(state, "corp");
  const selectedLegalActions: LegalAction[] = [];
  for (const candidate of candidates) {
    const legalAction = legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    if (!isExactIceInstallCandidate(state, legalAction, candidate)) {
      return quoteFail(
        "ERR_UNKNOWN_ACTION",
        "Mindestens eine ICE-Installationsaktion ist nicht vollständig legal.",
      );
    }
    selectedLegalActions.push(structuredClone(legalAction));
  }

  return {
    ok: true,
    quote: {
      schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
      visibility: "private_to_actor",
      complete: true,
      matchId: state.matchId,
      side: "corp",
      stateVersion: state.stateVersion,
      timingPoint: state.timingPoint,
      planStepId: request.planStepId,
      candidates,
      candidateFingerprint: candidateFingerprint(candidates),
      legalActions: selectedLegalActions,
    },
  };
}

export function applyRandomizedIceInstallSelection(
  state: GameState,
  command: EngineRandomizedIceInstallSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedIceInstallSelectionResult {
  if (!defaultRandomizedIceInstallSelectionHost) {
    throw new Error(
      "RandomizedIceInstallSelection-Host ist nicht initialisiert.",
    );
  }
  return buildApplyRandomizedIceInstallSelection(
    defaultRandomizedIceInstallSelectionHost,
    state,
    command,
    options,
  );
}

export function buildApplyRandomizedIceInstallSelection(
  host: ApplyActionCoreHost,
  state: GameState,
  command: EngineRandomizedIceInstallSelectionCommand,
  options: ApplyActionOptions = {},
): EngineRandomizedIceInstallSelectionResult {
  if (
    !command ||
    typeof command !== "object" ||
    command.kind !== "engine_randomized_ice_install_selection" ||
    !command.quote ||
    typeof command.quote !== "object" ||
    command.quote.schemaVersion !==
      ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION ||
    command.quote.visibility !== "private_to_actor" ||
    command.quote.complete !== true
  ) {
    return applyFail(
      state,
      "ERR_INVALID_TARGET",
      "Der Zufallsauswahl-Command ist unvollständig.",
    );
  }

  const requoted = quoteRandomizedIceInstallSelection(state, {
    schemaVersion: command.quote.schemaVersion,
    matchId: command.quote.matchId,
    side: command.quote.side,
    stateVersion: command.quote.stateVersion,
    timingPoint: command.quote.timingPoint,
    planStepId: command.quote.planStepId,
    candidates: command.quote.candidates,
  });
  if (!requoted.ok) {
    return { ok: false, error: requoted.error, state };
  }
  if (canonicalValue(requoted.quote) !== canonicalValue(command.quote)) {
    return applyFail(
      state,
      "ERR_STALE_STATE",
      "Die ICE-Installationsquote stimmt nicht mehr exakt mit der Engine überein.",
    );
  }

  const next = cloneGameStateForAction(state);
  const counterBefore = next.randomCounter;
  const purpose = randomizedSelectionPurpose(requoted.quote);
  const randomValue = nextRandom(next, purpose);
  const selectedIndex = Math.floor(
    randomValue * requoted.quote.candidates.length,
  );
  const selectedCandidate = requoted.quote.candidates[selectedIndex];
  const selectedLegalAction = requoted.quote.legalActions[selectedIndex];
  if (!selectedCandidate || !selectedLegalAction) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Die Engine konnte keinen Near-Tie-Kandidaten auswählen.",
    );
  }

  const selectedPlayerAction: PlayerAction = {
    matchId: state.matchId,
    side: "corp",
    actionId: selectedCandidate.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(command.idempotencyKey
      ? { idempotencyKey: command.idempotencyKey }
      : {}),
  };
  const applied = buildApplyAction(host, next, selectedPlayerAction, options);
  if (!applied.ok) {
    return { ok: false, error: applied.error, state };
  }

  const randomDraw = applied.state.randomDrawRecords.find(
    (record) => record.counter === counterBefore,
  );
  if (!randomDraw || randomDraw.purpose !== purpose) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Der Engine-Zufallsnachweis ist unvollständig.",
    );
  }
  const receipt = {
    schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
    visibility: "private_to_actor" as const,
    matchId: state.matchId,
    side: "corp" as const,
    stateVersionBefore: state.stateVersion,
    stateVersionAfter: applied.state.stateVersion,
    timingPoint: state.timingPoint,
    planStepId: requoted.quote.planStepId,
    candidateFingerprint: requoted.quote.candidateFingerprint,
    selectedCandidate: structuredClone(selectedCandidate),
    selectedLegalAction: structuredClone(selectedLegalAction),
    randomDraw: structuredClone(randomDraw),
  };

  const privateActorPayload = applied.event.privatePayload?.corp;
  if (!privateActorPayload) {
    return applyFail(
      state,
      "ERR_INVARIANT_FAILED",
      "Das actor-private Event-Payload fehlt.",
    );
  }
  privateActorPayload.action = structuredClone(command);
  privateActorPayload.randomizedIceInstallSelectionReceipt =
    structuredClone(receipt);

  return { ...applied, receipt };
}

export function candidateFingerprint(
  candidates: readonly EngineRandomizedIceInstallCandidate[],
): string {
  const canonical = canonicalCandidates(candidates);
  return encodeParts([
    ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
    String(canonical.length),
    ...canonical.flatMap((candidate) => [
      candidate.actionId,
      candidate.targetServerId,
    ]),
  ]);
}

function randomizedSelectionPurpose(
  quote: EngineRandomizedIceInstallSelectionQuote,
): string {
  return encodeParts([
    "engine.randomized_ice_install_selection",
    quote.schemaVersion,
    quote.side,
    String(quote.stateVersion),
    quote.timingPoint,
    quote.planStepId,
    quote.candidateFingerprint,
  ]);
}

function canonicalCandidates(
  candidates: readonly EngineRandomizedIceInstallCandidate[],
): EngineRandomizedIceInstallCandidate[] {
  return candidates
    .map((candidate) => ({
      actionId: candidate.actionId,
      targetServerId: candidate.targetServerId,
    }))
    .sort(
      (left, right) =>
        compareCanonicalText(left.actionId, right.actionId) ||
        compareCanonicalText(left.targetServerId, right.targetServerId),
    );
}

function isRandomizedIceInstallSelectionRequest(
  request: unknown,
): request is EngineRandomizedIceInstallSelectionRequest {
  if (!request || typeof request !== "object") return false;
  const record = request as Partial<EngineRandomizedIceInstallSelectionRequest>;
  return (
    record.schemaVersion ===
      ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION &&
    typeof record.matchId === "string" &&
    record.side === "corp" &&
    Number.isSafeInteger(record.stateVersion) &&
    typeof record.timingPoint === "string" &&
    typeof record.planStepId === "string" &&
    Array.isArray(record.candidates) &&
    record.candidates.every(
      (candidate) =>
        candidate !== null &&
        typeof candidate === "object" &&
        typeof candidate.actionId === "string" &&
        candidate.actionId.length > 0 &&
        typeof candidate.targetServerId === "string" &&
        candidate.targetServerId.length > 0,
    )
  );
}

function compareCanonicalText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isExactIceInstallCandidate(
  state: GameState,
  action: LegalAction | undefined,
  candidate: EngineRandomizedIceInstallCandidate,
): action is LegalAction {
  return (
    action !== undefined &&
    action.side === "corp" &&
    action.type === "install_card" &&
    action.timingPoint === state.timingPoint &&
    action.expiresAtStateVersion === state.stateVersion &&
    action.visibility === "private_to_actor" &&
    action.payload?.placement === "ice" &&
    action.payload.serverId === candidate.targetServerId &&
    typeof action.payload.cardId === "string" &&
    action.source === action.payload.cardId &&
    action.targetRequirements.length === 0 &&
    (action.choiceRequirements?.length ?? 0) === 0
  );
}

function encodeParts(parts: readonly string[]): string {
  return `${parts.length};${parts
    .map((part) => `${part.length}:${part}`)
    .join("")}`;
}

function canonicalValue(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalValue(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalValue(record[key])}`)
    .join(",")}}`;
}

function quoteFail(
  code: EngineError["code"],
  message: string,
): EngineRandomizedIceInstallSelectionQuoteResult {
  return { ok: false, error: { code, message } };
}

function applyFail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineRandomizedIceInstallSelectionResult {
  return { ok: false, error: { code, message }, state };
}
