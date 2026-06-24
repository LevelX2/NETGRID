import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CardType,
  ChoiceRequest,
  DamageType,
  EventModificationCandidate,
  EventModificationWindow,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  Phase,
  ReplacementCandidate,
  ReplacementWindow,
  Side,
  TimingPointId,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
} from "../view/card-view";
import { maxHandSize } from "../../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
} from "../../mechanics/agenda-operation-effects";
import {
  EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
  RUNTIME_DAMAGE_PREVENTION_PROFILES,
} from "../../mechanics/damage-prevention";
import type {
  CardDamagePreventionSourceImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
} from "../../ability-engine/definition-types";

export type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  runnerGripBefore?: number;
  runnerGripAfter?: number;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

const DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX =
  "damage_prevention_bypass_pay_";

export type DamageCoreHost = {
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
    scoredCorpAgendaIds: (state: GameState) => CardInstanceId[];
    scoredAgendaKindForDefinition: (definition: CardDefinition) => string | undefined;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: string) => void;
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    returnRunnerInstalledCardToGrip: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
  };
  runner: {
    drawRunnerCard: (state: GameState) => unknown;
    ensureRunnerTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
    addFutureActionDebt: (state: GameState, amount: number) => void;
  };
  corp: {
    agendaPointTotal: (state: GameState) => number;
    chooseAgendasForPointCost: (
      state: GameState,
      requiredPoints: number,
    ) => CardInstanceId[];
    agendaPointsForScoredCard: (state: GameState, cardId: CardInstanceId) => number;
    forfeitAgendaForPointCost: (state: GameState, cardId: CardInstanceId) => void;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: string,
    ) => number;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
  };
  credits: {
    gain: (state: GameState, side: "corp" | "runner", amount: number) => void;
    spend: (state: GameState, side: "corp" | "runner", amount: number) => void;
  };
  rng: {
    nextRandom: (state: GameState, purpose: string) => number;
  };
  reactions?: {
    openPostMeatDamageReactionWindow: (
      state: GameState,
      summary: DamageSummary,
    ) => boolean;
  };
};

let configuredDamageCoreHost: DamageCoreHost | undefined;

export function configureDamageCoreHost(host: DamageCoreHost): void {
  configuredDamageCoreHost = host;
}

export function resetDamageCoreHostForTests(): void {
  configuredDamageCoreHost = undefined;
}

function requireDamageCoreHost(): DamageCoreHost {
  if (!configuredDamageCoreHost)
    throw new Error("DamageCoreHost ist nicht konfiguriert.");
  return configuredDamageCoreHost;
}

function definitionFor(state: GameState, cardId: CardInstanceId): CardDefinition {
  return requireDamageCoreHost().cards.definitionFor(state, cardId);
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return requireDamageCoreHost().cards.runnerInstalledCardIds(state);
}

function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return requireDamageCoreHost().cards.scoredCorpAgendaIds(state);
}

function scoredAgendaKindForDefinition(definition: CardDefinition): string | undefined {
  return requireDamageCoreHost().cards.scoredAgendaKindForDefinition(definition);
}

function removeFromAllZones(state: GameState, cardId: string): void {
  requireDamageCoreHost().zones.removeFromAllZones(state, cardId);
}

function trashRunnerInstalledCardToHeap(
  state: GameState,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  requireDamageCoreHost().zones.trashRunnerInstalledCardToHeap(
    state,
    cardId,
    legalAction,
  );
}

function returnRunnerInstalledCardToGrip(
  state: GameState,
  cardId: CardInstanceId,
): void {
  requireDamageCoreHost().zones.returnRunnerInstalledCardToGrip(state, cardId);
}

function drawRunnerCard(state: GameState): unknown {
  return requireDamageCoreHost().runner.drawRunnerCard(state);
}

function ensureRunnerTurnFlags(
  state: GameState,
): NonNullable<GameState["runnerTurnFlags"]> {
  return requireDamageCoreHost().runner.ensureRunnerTurnFlags(state);
}

function addRunnerFutureActionDebt(state: GameState, amount: number): void {
  requireDamageCoreHost().runner.addFutureActionDebt(state, amount);
}

function corpAgendaPointTotal(state: GameState): number {
  return requireDamageCoreHost().corp.agendaPointTotal(state);
}

function chooseCorpAgendasForPointCost(
  state: GameState,
  requiredPoints: number,
): CardInstanceId[] {
  return requireDamageCoreHost().corp.chooseAgendasForPointCost(
    state,
    requiredPoints,
  );
}

function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return requireDamageCoreHost().corp.agendaPointsForScoredCard(state, cardId);
}

function forfeitCorpAgendaForPointCost(
  state: GameState,
  cardId: CardInstanceId,
): void {
  requireDamageCoreHost().corp.forfeitAgendaForPointCost(state, cardId);
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: string,
): number {
  return requireDamageCoreHost().counters.cardCounter(
    state,
    cardId,
    counterType,
  );
}

function spendCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: string,
  amount: number,
): void {
  requireDamageCoreHost().counters.spendCardCounter(
    state,
    cardId,
    counterType,
    amount,
  );
}

function credits(
  state: GameState,
  side: "corp" | "runner",
  amount: number,
): void {
  requireDamageCoreHost().credits.gain(state, side, amount);
}

function spendCredits(
  state: GameState,
  side: "corp" | "runner",
  amount: number,
): void {
  requireDamageCoreHost().credits.spend(state, side, amount);
}

function nextRandom(state: GameState, purpose: string): number {
  return requireDamageCoreHost().rng.nextRandom(state, purpose);
}

function assertPositiveIntegerAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("Damage amount ist ungueltig.");
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  return definition.subtypes?.some(
    (candidate) => candidate.toLowerCase() === subtype.toLowerCase(),
  ) ?? false;
}
export function doDamage(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  },
): DamageSummary {
  assertPositiveIntegerAmount(request.amount);
  const runnerGripBefore = state.runner.grip.length;
  if (request.amount > runnerGripBefore) {
    state.winner = "corp";
    state.gameEndReason = "flatline";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "corp";
    delete state.run;
    return {
      damageType: request.damageType,
      amount: request.amount,
      cardsTrashed: 0,
      flatline: true,
      runnerGripBefore,
      runnerGripAfter: 0,
    };
  }

  const available = state.runner.grip.slice();
  const selected: CardInstanceId[] = [];
  for (let index = 0; index < request.amount; index += 1) {
    const value = nextRandom(
      state,
      `damage:${request.damageId}:${request.damageType}:${request.source}:${request.amount}:selection:${index}`,
    );
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(
      available,
      selectedIndex,
      "Damage-Auswahl fehlt.",
    );
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }

  for (const cardId of selected) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  }

  if (request.damageType === "core") state.runner.coreDamage += request.amount;
  recordRunnerDamageDuringCurrentAction(state);

  const summary = {
    damageType: request.damageType,
    amount: request.amount,
    cardsTrashed: selected.length,
    flatline: false,
    runnerGripBefore,
    runnerGripAfter: state.runner.grip.length,
    ...(request.damageType === "core"
      ? {
          coreDamageAfter: state.runner.coreDamage,
          runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
        }
      : {}),
  };
  if (request.damageType === "meat" && selected.length > 0 && !state.winner)
    requireDamageCoreHost().reactions?.openPostMeatDamageReactionWindow(
      state,
      summary,
    );
  return summary;
}

function isCorpDamageSource(source: string): boolean {
  return (
    source.includes("corp") ||
    source.startsWith("scored_agenda:") ||
    source.startsWith("trace:") ||
    source.startsWith("subroutine:") ||
    source.startsWith("ice:") ||
    source.startsWith("operation:") ||
    source.startsWith("asset:")
  );
}

function scoredPdcaAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea
    .slice()
    .sort()
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        scoredAgendaKindForDefinition(definition) ===
        "corp_damage_replacement_pdca_action_counter"
      );
    });
}

function pdcaEventWithReturnContext(
  state: GameState,
  event: ImminentEvent,
): ImminentEvent {
  return {
    ...event,
    modificationWindowId: `proteus_pdca_${event.eventId}`,
    payload: {
      ...event.payload,
      pdcaReturnPhase: state.phase,
      pdcaReturnTimingPoint: state.timingPoint,
      pdcaReturnActiveSide: state.activeSide,
    },
  };
}

function restorePdcaReturnContext(state: GameState, event: ImminentEvent): void {
  if (state.winner || state.phase === "game_over") return;
  const phase = event.payload.pdcaReturnPhase;
  const timingPoint = event.payload.pdcaReturnTimingPoint;
  const activeSide = event.payload.pdcaReturnActiveSide;
  if (
    !isPhase(phase) ||
    !isTimingPointId(timingPoint) ||
    !isSide(activeSide)
  )
    return;
  state.phase = phase;
  state.timingPoint = timingPoint;
  state.activeSide = activeSide;
}

function isPhase(value: unknown): value is Phase {
  return (
    value === "setup" ||
    value === "corp_draw_phase" ||
    value === "corp_action_phase" ||
    value === "corp_discard_phase" ||
    value === "runner_action_phase" ||
    value === "runner_discard_phase" ||
    value === "run" ||
    value === "game_over"
  );
}

function isTimingPointId(value: unknown): value is TimingPointId {
  return (
    value === "setup.mulligan.runner" ||
    value === "setup.mulligan.corp" ||
    value === "corp_draw.mandatory_draw" ||
    value === "corp_action.main" ||
    value === "corp_discard.select_cards" ||
    value === "corp_discard.complete" ||
    value === "runner_action.main" ||
    value === "runner_discard.flatline_check" ||
    value === "runner_discard.select_cards" ||
    value === "runner_discard.complete" ||
    value === "run.approach_ice" ||
    value === "run.encounter_ice" ||
    value === "run.jack_out_window" ||
    value === "access.resolve_card" ||
    value === "game.checkpoint"
  );
}

function isSide(value: unknown): value is Side {
  return value === "corp" || value === "runner";
}

export function openPdcaDamageReplacementChoice(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    state.pendingChoice ||
    state.winner
  )
    return false;
  const amount = numberPayload(event, "amount");
  const source = stringPayload(event, "source");
  if (amount <= 0 || !isCorpDamageSource(source)) return false;
  const sourceCardId = scoredPdcaAgendaIds(state)[0];
  if (!sourceCardId) return false;
  const definition = definitionFor(state, sourceCardId);
  state.imminentEvent = pdcaEventWithReturnContext(state, event);
  state.pendingChoice = {
    choiceId: `proteus_pdca_${state.stateVersion + 1}_${sourceCardId}`,
    side: "corp",
    source: `proteus.pdca_damage_replacement:${sourceCardId}:${event.eventId}`,
    prompt: "Please Don't Choke Anyone nutzen",
    kind: "select_option",
    options: [
      {
        id: `replace_${sourceCardId}`,
        label: "Damage durch PDCA-Counter ersetzen",
        publicLabel: "PDCA-Entscheidung",
        value: sourceCardId,
      },
      {
        id: "pass",
        label: "Damage normal anwenden",
        publicLabel: "PDCA-Entscheidung",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "corp";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    pdcaDamageReplacementWindowOpened: true,
    pdcaSourceCardInstanceId: sourceCardId,
    sourceDefinitionId: definition.id,
    originalDamageAmount: amount,
    damageType: damageTypePayload(event),
    imminentEventId: event.eventId,
    replacementModel: "all_or_nothing_damage_slice",
  };
  return true;
}

export function openDamageResolutionWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  return (
    openReplacementWindow(state, event, legalAction) ||
    openEventModificationWindow(state, event, legalAction) ||
    openPdcaDamageReplacementChoice(state, event, legalAction)
  );
}

export function aggregateDamageSummaries(summaries: DamageSummary[]): DamageSummary {
  const first = mustArrayValue(summaries, 0, "Damage-Zusammenfassung fehlt.");
  const lastCoreSummary = summaries
    .slice()
    .reverse()
    .find(
      (summary) =>
        summary.coreDamageAfter !== undefined ||
        summary.runnerMaxHandSizeAfter !== undefined,
    );
  return {
    damageType: first.damageType,
    amount: summaries.reduce((total, summary) => total + summary.amount, 0),
    cardsTrashed: summaries.reduce(
      (total, summary) => total + summary.cardsTrashed,
      0,
    ),
    flatline: summaries.some((summary) => summary.flatline),
    ...(first.runnerGripBefore !== undefined
      ? { runnerGripBefore: first.runnerGripBefore }
      : {}),
    ...(summaries.at(-1)?.runnerGripAfter !== undefined
      ? { runnerGripAfter: summaries.at(-1)!.runnerGripAfter }
      : {}),
    ...(lastCoreSummary?.coreDamageAfter !== undefined
      ? { coreDamageAfter: lastCoreSummary.coreDamageAfter }
      : {}),
    ...(lastCoreSummary?.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: lastCoreSummary.runnerMaxHandSizeAfter }
      : {}),
  };
}

export function setDamagePayload(
  legalAction: LegalAction,
  summary: DamageSummary,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.runnerGripBefore !== undefined
      ? { runnerGripBefore: summary.runnerGripBefore }
      : {}),
    ...(summary.runnerGripAfter !== undefined
      ? { runnerGripAfter: summary.runnerGripAfter }
      : {}),
    ...(summary.coreDamageAfter !== undefined
      ? { coreDamageAfter: summary.coreDamageAfter }
      : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
      : {}),
  };
}

export function resolveDamageOperation(
  state: GameState,
  legalAction: LegalAction,
  damageType: DamageType,
  amount: number,
  source: string,
): void {
  const request = {
    damageId: `${state.matchId}.${state.stateVersion}.${source}`,
    damageType,
    amount,
    source: `operation:${source}`,
  };
  const event = createDamageImminentEvent(state, request);
  if (openDamageResolutionWindow(state, event, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, event);
  setDamagePayload(legalAction, summary);
  const payload = (legalAction.payload ??= {});
  if (typeof event.payload.baseDamageAmount === "number")
    payload.baseDamageAmount = event.payload.baseDamageAmount;
  if (typeof event.payload.damageAmountModifier === "number")
    payload.damageAmountModifier =
      event.payload.damageAmountModifier;
}

export function createDamageImminentEvent(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  },
): ImminentEvent {
  const damageAmountModifier =
    request.damageType === "meat" && corpHasScoredMeatDamageBonusAgenda(state)
      ? 1
      : 0;
  const amount = request.amount + damageAmountModifier;
  return {
    eventId: `imminent_damage_${state.stateVersion + 1}_${sanitizeId(request.damageId)}`,
    eventType: "damage",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      damageId: request.damageId,
      damageType: request.damageType,
      amount,
      ...(damageAmountModifier > 0
        ? {
            baseDamageAmount: request.amount,
            damageAmountModifier: damageAmountModifier,
          }
        : {}),
      source: request.source,
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

function cybertechThinkTankBoostCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    damageTypePayload(event) !== "meat"
  )
    return [];
  const candidates: EventModificationCandidate[] = [];
  for (const server of state.corp.servers.slice().sort((left, right) => left.id.localeCompare(right.id))) {
    for (const cardId of server.root.slice().sort() as CardInstanceId[]) {
      const instance = state.cardInstances[cardId];
      const implementation = instance
        ? cardImplementationForDefinitionId(instance.definitionId)
        : undefined;
      const sourceText = String(event.payload.source ?? "");
      if (
        !instance?.rezzed ||
        instance.controller !== "corp" ||
        implementation?.corpUtility?.kind !== "meat_damage_boost" ||
        Math.floor(instance.advancementCounters ?? 0) <= 0 ||
        sourceText.includes(cardId) ||
        sourceText.includes(instance.definitionId)
      )
        continue;
      candidates.push({
        candidateId: `cybertech_meat_damage_boost_${cardId}`,
        eventId: event.eventId,
        kind: "increase",
        controller: "corp",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: instance.definitionId,
          label: "Meat-Damage-Boost",
        },
        priority: 80,
        visibility: "public",
        optional: true,
        increaseAmount: 1,
      });
    }
  }
  return candidates;
}

function corpHasScoredMeatDamageBonusAgenda(state: GameState): boolean {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      scoredAgendaKindForDefinition(definitionFor(state, cardId)) ===
      "meat_damage_bonus",
  );
}

export function createAddTagImminentEvent(
  state: GameState,
  amount: number,
  source: string,
  publicContext: Record<string, unknown> = {},
): ImminentEvent {
  return {
    eventId: `imminent_tag_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "add_tag",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      amount,
      source,
      ...publicContext,
    },
    visibility: "public",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

function addTagPublicContextFromPayload(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  if (!payload) return context;
  if (payload.hiddenZoneBarrier === true) context.hiddenZoneBarrier = true;
  for (const key of [
    "hiddenZoneAction",
    "ambushDefinitionId",
    "accessEffectSourceDefinitionId",
    "accessedFromZone",
  ] as const) {
    const value = payload[key];
    if (typeof value === "string") context[key] = value;
  }
  return context;
}

export function addRunnerTagsWithPrevention(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
  source: string,
): void {
  if (amount <= 0) return;
  const oneShotAvoidance = Math.max(
    0,
    Math.floor(state.runnerTagAvoidanceCredits ?? 0),
  );
  if (oneShotAvoidance > 0) {
    state.runnerTagAvoidanceCredits = oneShotAvoidance - 1;
    const tagsAdded = Math.max(0, amount - 1);
    state.runner.tags += tagsAdded;
    recordRunnerReceivedTags(state, tagsAdded);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tagsAdded,
      preventedTags: 1,
      runnerTagsAfter: state.runner.tags,
      tagAvoidanceCreditsAfter: state.runnerTagAvoidanceCredits,
    };
    return;
  }
  const event = createAddTagImminentEvent(
    state,
    amount,
    source,
    addTagPublicContextFromPayload(legalAction.payload),
  );
  if (openEventModificationWindow(state, event, legalAction)) return;
  resolveAddTagImminentEvent(state, event, legalAction);
}

function resolveAddTagImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTags = 0,
): void {
  if (event.eventType !== "add_tag")
    throw new Error("Nur Add-Tag-ImminentEvents koennen Tags geben.");
  const amount = numberPayload(event, "amount");
  const tagsAdded = Math.max(0, amount - preventedTags);
  state.runner.tags += tagsAdded;
  recordRunnerReceivedTags(state, tagsAdded);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    tagsAdded,
    ...(preventedTags > 0 ? { preventedTags } : {}),
    runnerTagsAfter: state.runner.tags,
  };
}

function recordRunnerReceivedTags(state: GameState, amount: number): void {
  if (amount > 0) ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = true;
}

export function openEventModificationWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectEventModificationCandidates(state, event);
  if (candidates.length === 0) return false;
  const sorted = candidates.slice().sort(compareEventModificationCandidate);
  if (hasEventModificationConflict(sorted))
    throw new Error("Event-Modification-Konflikt blockiert.");
  const candidate = sorted[0];
  if (!candidate) return false;
  const windowId = `v120_window_${event.eventId}`;
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: event.eventType,
    kind: candidate.kind,
    side: candidate.controller,
    candidates: sorted,
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(
    state,
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowOpened: true,
    eventModificationKind: window.kind,
    eventModificationWindowId: window.windowId,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    candidateCount: window.candidates.length,
    redactedKind: "event_modification",
  };
  return true;
}

function collectEventModificationCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  if (event.payload.cannotBePrevented === true) return [];
  if (event.eventType === "damage") {
    const cybertech = cybertechThinkTankBoostCandidates(state, event);
    if (cybertech.length > 0) return cybertech;
    const runtime = collectRuntimeDamagePreventionCandidates(state, event);
    const harness = collectHarnessDamagePreventionCandidates(state, event);
    return [...runtime, ...harness];
  }
  if (event.eventType === "add_tag")
    return collectRuntimeTagPreventionCandidates(state, event);
  if (event.eventType === "runner_installed_trash")
    return collectRuntimeTrashPreventionCandidates(state, event);
  return [];
}

function collectRuntimeDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const installed = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
  const candidates: EventModificationCandidate[] = [];
  const runPool = state.run?.damagePreventionPool;
  if (runPool && runPool.remaining > 0) {
    const preventAmount = Math.min(amount, Math.max(0, Math.floor(runPool.remaining)));
    if (preventAmount > 0) {
      candidates.push({
        candidateId: `run_damage_prevent_${sanitizeId(runPool.sourceDefinitionId)}_${preventAmount}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: { kind: "game_rule", label: "Run damage prevention" },
        priority: 145,
        visibility: "hidden_info_barrier",
        optional: true,
        preventAmount,
      });
    }
  }
  if (
    state.runnerPermanentMeatDamagePrevention === true &&
    damageType === "meat"
  ) {
    candidates.push({
      candidateId: `card_implementation_permanent_meat_prevent_${amount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "game_rule",
        label: "Emergency Self-Construct",
      },
      priority: 141,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount: amount,
    });
  }
  for (const cardId of installed) {
    if (
      state.cancelledDamagePreventionSourceIdsUntilEndOfTurn?.includes(cardId)
    )
      continue;
    const definition = definitionFor(state, cardId);
    const cardImplementationPreventionSources =
      damagePreventionSourcesForDefinition(definition);
    if (cardImplementationPreventionSources.length > 0) {
      candidates.push(
        ...cardImplementationDamagePreventionCandidates(
          state,
          event,
          cardId,
          definition,
          cardImplementationPreventionSources,
        ),
      );
      continue;
    }
    const profile = RUNTIME_DAMAGE_PREVENTION_PROFILES[definition.id];
    if (!profile || !profile.damageTypes.includes(damageType)) continue;
    const used = damagePreventionUsedThisTurn(state, cardId);
    const remaining = Math.max(0, profile.maxPerTurn - used);
    if (remaining <= 0) continue;
    const preventAmount = Math.min(amount, remaining);
    candidates.push({
      candidateId: `v161_damage_prevent_${sanitizeId(cardId)}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title,
      },
      priority: profile.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount,
    });
  }
  return candidates;
}

export function damagePreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardDamagePreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.damagePreventionSources ?? []
  );
}

function tagPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTagPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.tagPreventionSources ?? []
  );
}

function trashPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTrashPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.trashPreventionSources ?? []
  );
}

function flatlineReplacementSourcesForDefinition(
  definition: CardDefinition,
): readonly CardFlatlineReplacementSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.flatlineReplacementSources ??
    []
  );
}

export function isRunnerHardwareDeckDefinition(definition: CardDefinition): boolean {
  return (
    definition.type === "hardware" &&
    (cardHasSubtype(definition, "deck") ||
      cardImplementationForDefinitionId(definition.id)?.hardwareDeck === true)
  );
}

function cardImplementationDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
  cardId: CardInstanceId,
  definition: CardDefinition,
  sources: readonly CardDamagePreventionSourceImplementation[],
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  const candidates: EventModificationCandidate[] = [];
  sources.forEach((source, sourceIndex) => {
    if (
      source.kind !== "damage_prevention" ||
      source.visibility !== "public" ||
      !source.damageTypes.includes(damageType)
    )
      return;
    if (!cardImplementationDamagePreventionSourceCanPay(state, cardId, source))
      return;
    const sourceAmount = source.amount === "all" ? amount : source.amount;
    const preventAmount =
      source.limit?.kind === "per_turn"
        ? Math.min(
            amount,
            Math.max(
              0,
              source.limit.amount - damagePreventionUsedThisTurn(state, cardId),
            ),
          )
        : Math.min(amount, sourceAmount);
    if (preventAmount <= 0) return;
    candidates.push({
      candidateId: `card_implementation_damage_prevent_${sanitizeId(cardId)}_${sourceIndex}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: source.corpMayPayToBypass
        ? "corp"
        : source.corpMayCancelUntilEndOfTurn &&
            corpAgendaPointTotal(state) >=
              source.corpMayCancelUntilEndOfTurn.agendaPointCost
          ? "corp"
          : "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title,
      },
      priority: source.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount,
      preventionSourceIndex: sourceIndex,
      ...(source.corpMayPayToBypass
        ? {
            bypassCostPerDamage: source.corpMayPayToBypass.costPerDamage,
            bypassPaymentSide: "corp" as const,
          }
        : {}),
    });
  });
  return candidates;
}

function cardImplementationDamagePreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardDamagePreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "none") return true;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "tap_source")
    return state.cardInstances[cardId]?.tapped !== true;
  if (source.cost.kind === "credit_and_tap_source")
    return (
      state.runner.credits >= source.cost.amount &&
      state.cardInstances[cardId]?.tapped !== true
    );
  if (source.cost.kind === "credit")
    return state.runner.credits >= source.cost.amount;
  return cardCounter(state, cardId, source.cost.counterType) >= source.cost.amount;
}

function collectRuntimeTagPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = tagPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "avoid_tag" ||
        source.visibility !== "public" ||
        !cardImplementationTagPreventionSourceCanPay(state, cardId, source)
      )
        return;
      candidates.push({
        candidateId: `card_implementation_avoid_tag_${sanitizeId(cardId)}_${sourceIndex}`,
        eventId: event.eventId,
        kind: "avoid",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTags: Math.min(amount, source.amount),
        tagPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

function collectRuntimeTrashPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const targetIds = trashTargetIdsFromEvent(event);
  if (targetIds.length === 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = trashPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "prevent_installed_card_trash" ||
        source.visibility !== "public" ||
        (source.activeOnlyDuring === "corp_turn" &&
          !(
            state.phase === "corp_draw_phase" ||
            state.phase === "corp_action_phase" ||
            state.phase === "corp_discard_phase"
          )) ||
        !cardImplementationTrashPreventionSourceCanPay(state, cardId, source)
      )
        return;
      const protectedTargets = targetIds.filter((targetId) =>
        cardImplementationTrashPreventionProtectsTarget(
          state,
          cardId,
          source,
          targetId,
        ),
      );
      const preventedTrashTargetIds =
        source.mode === "one_card"
          ? protectedTargets.slice(0, 1)
          : protectedTargets;
      if (preventedTrashTargetIds.length === 0) return;
      candidates.push({
        candidateId: `card_implementation_prevent_trash_${sanitizeId(cardId)}_${sourceIndex}_${preventedTrashTargetIds.length}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTrashTargetIds,
        trashPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

function cardImplementationTagPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTagPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "credit_and_tap_source")
    return (
      state.runner.credits >= source.cost.amount &&
      state.cardInstances[cardId]?.tapped !== true
    );
  return state.runner.credits >= source.cost.amount;
}

function cardImplementationTrashPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "tap_source")
    return state.cardInstances[cardId]?.tapped !== true;
  return state.runner.credits >= source.cost.amount;
}

function cardImplementationTrashPreventionProtectsTarget(
  state: GameState,
  sourceCardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
  targetCardId: CardInstanceId,
): boolean {
  if (source.excludesSelf === true && sourceCardId === targetCardId)
    return false;
  if (!runnerInstalledCardIds(state).includes(targetCardId)) return false;
  const targetDefinition = definitionFor(state, targetCardId);
  return source.protectsCardTypes.includes(
    targetDefinition.type as Extract<CardType, "program" | "hardware" | "resource">,
  );
}

function collectHarnessDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const harness = state.eventModificationHarness?.damagePrevention;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const preventAmount = Math.min(harness.preventAmount, amount);
  if (!Number.isInteger(preventAmount) || preventAmount <= 0) return [];
  return [
    {
      candidateId: `v120_damage_prevent_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: harness.side,
      sourceRef: {
        kind: "test_harness",
        label: harness.sourceLabel ?? "Test-only Damage Prevention",
      },
      priority: 100,
      visibility: harness.visibility ?? "hidden_info_barrier",
      optional: harness.optional ?? true,
      preventAmount,
    },
  ];
}

export function openReplacementWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectReplacementCandidates(state, event).sort(
    compareReplacementCandidate,
  );
  if (candidates.length === 0) return false;
  if (hasReplacementConflict(candidates))
    throw new Error("Replacement-Konflikt blockiert.");
  const candidate = candidates[0];
  if (!candidate) return false;
  const windowId = `v121_window_${event.eventId}`;
  const window: ReplacementWindow = {
    windowId,
    originalEventId: event.eventId,
    eventType: event.eventType,
    candidates,
    consumedCandidateIds: [],
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.replacementWindow = window;
  state.pendingChoice = replacementChoice(
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementWindowOpened: true,
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    replacementCandidateCount: window.candidates.length,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  return true;
}

function collectReplacementCandidates(
  state: GameState,
  event: ImminentEvent,
): ReplacementCandidate[] {
  if (event.eventType !== "damage") return [];
  if (event.payload.cannotBePrevented === true) return [];
  const candidates: ReplacementCandidate[] = [];
  const damageAmount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (
    event.affectedSide === "runner" &&
    damageAmount > 0 &&
    damageType === "meat" &&
    isCorpTurnDamageWindow(state)
  ) {
    const identityDonorId = state.runner.grip.find((cardId) => {
      const definition = definitionFor(state, cardId);
      return flatlineReplacementSourcesForDefinition(definition).some(
        (source) =>
          source.kind === "damage_replacement_from_grip" &&
          source.replacement === "prevent_meat_damage_add_bad_publicity" &&
          source.damageType === "meat" &&
          source.activeOnlyDuring === "corp_turn" &&
          source.badPublicity === 2 &&
          source.visibility === "public",
      );
    });
    if (identityDonorId) {
      const definition = definitionFor(state, identityDonorId);
      candidates.push({
        candidateId: `grip_meat_damage_replacement_${identityDonorId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: identityDonorId,
          definitionId: definition.id,
          label: "Meat-Damage-Replacement",
        },
        replacesEventType: "damage",
        replacementEventType: "prevent_damage",
        priority: 81,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
  }
  if (
    event.affectedSide === "runner" &&
    damageAmount > state.runner.grip.length
  ) {
    const gripFlatlineReplacementId = state.runner.grip.find(
      (cardId) => {
        const definition = definitionFor(state, cardId);
        return flatlineReplacementSourcesForDefinition(definition).some(
          (source) =>
            source.kind === "flatline_replacement_from_grip" &&
            source.replacement === "flatline_tag_replacement" &&
            source.visibility === "public",
        );
      },
    );
    if (gripFlatlineReplacementId) {
      const definition = definitionFor(state, gripFlatlineReplacementId);
      candidates.push({
        candidateId: `flatline_tag_replacement_from_grip_${gripFlatlineReplacementId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: gripFlatlineReplacementId,
          definitionId: definition.id,
          label: definition.title,
        },
        replacesEventType: "damage",
        replacementEventType: "add_tag",
        priority: 80,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
    const installedFlatlinePreventionId = state.runner.rig.programs.find(
      (cardId) => {
        const definition = definitionFor(state, cardId);
        return flatlineReplacementSourcesForDefinition(definition).some(
          (source) =>
            source.kind === "flatline_replacement_installed" &&
            source.replacement === "installed_flatline_prevention" &&
            source.visibility === "public",
        );
      },
    );
    if (installedFlatlinePreventionId) {
      const definition = definitionFor(state, installedFlatlinePreventionId);
      candidates.push({
        candidateId: `installed_flatline_prevention_${installedFlatlinePreventionId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: installedFlatlinePreventionId,
          definitionId: definition.id,
          label: definition.title,
        },
        replacesEventType: "damage",
        replacementEventType: "prevent_damage",
        priority: 82,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
  }
  const harness = state.eventModificationHarness?.damageReplacement;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return candidates;
  const base: ReplacementCandidate = {
    candidateId: `v121_damage_replace_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${harness.tagAmount}`,
    controller: harness.side,
    sourceRef: {
      kind: "test_harness",
      label: harness.sourceLabel ?? "Test-only Damage Replacement",
    },
    replacesEventType: "damage",
    replacementEventType: "add_tag",
    priority: harness.priority ?? 100,
    visibility: harness.visibility ?? "hidden_info_barrier",
    optional: harness.optional ?? true,
    tagAmount: harness.tagAmount,
  };
  if (!state.eventModificationHarness?.damageReplacementConflict)
    return [...candidates, base];
  return [
    ...candidates,
    base,
    {
      ...base,
      candidateId: `${base.candidateId}_conflict`,
      tagAmount: base.tagAmount ? base.tagAmount + 1 : 2,
    },
  ];
}

function isCorpTurnDamageWindow(state: GameState): boolean {
  return (
    state.phase === "corp_draw_phase" ||
    state.phase === "corp_action_phase" ||
    state.phase === "corp_discard_phase"
  );
}

function replacementChoice(
  window: ReplacementWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Replacement-Kandidat fehlt.",
  );
  return {
    choiceId: `v121_choice_${window.windowId}`,
    side: candidate.controller,
    source: "v121.replacement.damage",
    prompt: "Damage Replacement",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nicht ersetzen", publicLabel: "Replacement" },
      {
        id: candidate.candidateId,
        label:
          candidate.sourceRef.definitionId ===
          ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID
            ? "Arasaka Owns You spielen"
            : candidate.sourceRef.definitionId ===
                EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID
              ? "Emergency Self-Construct ausloesen"
              : isIdentityDonorReplacementCandidateForChoice(candidate)
                ? "Identity Donor spielen"
                : `Damage durch ${candidate.tagAmount ?? 1} Tag ersetzen`,
        publicLabel: "Replacement",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

function isIdentityDonorReplacementCandidateForChoice(
  candidate: ReplacementCandidate,
): boolean {
  return (
    candidate.replacementEventType === "prevent_damage" &&
    candidate.candidateId.startsWith("grip_meat_damage_replacement_")
  );
}

function eventModificationChoice(
  state: GameState,
  window: EventModificationWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Event-Modification-Kandidat fehlt.",
  );
  const amount = numberPayload(event, "amount");
  const corpDamagePreventionCancel = isCorpDamagePreventionCancelCandidate(
    state,
    candidate,
  );
  if (isCorpDamagePreventionBypassCandidate(state, candidate)) {
    const maxBypass = Math.min(amount, state.corp.credits);
    const options: ChoiceRequest["options"] = [];
    for (let paid = 0; paid <= maxBypass; paid += 1) {
      options.push({
        id: `${DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX}${paid}`,
        label:
          paid === 0
            ? "0 Credits zahlen: 0 Meat Damage durchlassen"
            : `${paid} Credits zahlen: ${paid} Meat Damage durchlassen`,
        publicLabel: "Event Modification",
        value: paid,
      });
    }
    return {
      choiceId: `v120_choice_${window.windowId}`,
      side: window.side,
      source: `v120.event_modification.${window.kind}`,
      prompt: "Damage Prevention",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion,
      visibility: candidate.visibility,
    };
  }
  const options = [
    {
      id: "pass",
      label: corpDamagePreventionCancel
        ? "1 Agenda-Punkt zahlen und Prevention canceln"
        : event.eventType === "add_tag"
          ? "Tag nicht vermeiden"
          : event.eventType === "runner_installed_trash"
            ? "Trash nicht verhindern"
            : window.kind === "increase"
              ? "Nicht erhöhen"
              : "Nicht verhindern",
      publicLabel: "Event Modification",
    },
    {
      id: candidate.candidateId,
      label:
        corpDamagePreventionCancel
          ? "Prevention wirken lassen"
          : event.eventType === "add_tag"
            ? `${candidate.sourceRef.label}: ${candidate.preventedTags ?? 1} Tag vermeiden`
            : event.eventType === "runner_installed_trash"
              ? `${candidate.sourceRef.label}: ${candidate.preventedTrashTargetIds?.length ?? 1} Trash verhindern`
            : window.kind === "increase"
              ? `${candidate.sourceRef.label}: Schaden um ${candidate.increaseAmount ?? 1} erhöhen`
              : candidate.sourceRef.kind === "card"
                ? `${candidate.sourceRef.label}: ${candidate.preventAmount ?? amount} Schaden verhindern`
                : `${candidate.preventAmount ?? amount} Schaden verhindern`,
      publicLabel: "Event Modification",
    },
  ];
  return {
    choiceId: `v120_choice_${window.windowId}`,
    side: window.side,
    source: `v120.event_modification.${window.kind}`,
    prompt: "Damage Prevention",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

export function resolveEventModificationChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.eventModificationWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Event-Modification-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected)
    throw new Error("Es wurde keine Event-Modification-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    ...addTagPublicContextFromPayload(event.payload),
    eventModificationWindowId: window.windowId,
    eventModificationKind: window.kind,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "event_modification",
  };
  if (selected === "pass") {
    if (event.eventType === "add_tag") {
      resolveAddTagImminentEvent(state, event, legalAction);
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: numberPayload(event, "amount"),
      };
      clearEventModificationState(state);
      return;
    }
    if (event.eventType === "runner_installed_trash") {
      const summary = resolveRunnerInstalledTrashImminentEvent(
        state,
        event,
        legalAction,
        [],
      );
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: summary.originalCount,
      };
      clearEventModificationState(state);
      return;
    }
    const cancelCandidate = window.candidates[0];
    const corpDamagePreventionCancel =
      !!cancelCandidate &&
      window.side === "corp" &&
      isCorpDamagePreventionCancelCandidate(state, cancelCandidate);
    let agendaPointCost = 0;
    let agendaPointCostPaid = 0;
    let forfeitedAgendaDefinitionIds = "";
    if (corpDamagePreventionCancel) {
      agendaPointCost =
        damagePreventionSourceForEventCandidate(
          state,
          cancelCandidate,
        )?.corpMayCancelUntilEndOfTurn?.agendaPointCost ?? 1;
      const forfeitedAgendaIds = chooseCorpAgendasForPointCost(
        state,
        agendaPointCost,
      );
      agendaPointCostPaid = forfeitedAgendaIds.reduce(
        (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
        0,
      );
      if (agendaPointCostPaid < agendaPointCost)
        throw new Error("Damage Prevention kann nicht gecancelt werden.");
      forfeitedAgendaDefinitionIds = forfeitedAgendaIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(",");
      for (const agendaId of forfeitedAgendaIds)
        forfeitCorpAgendaForPointCost(state, agendaId);
      const sourceInstanceId = cancelCandidate.sourceRef.instanceId;
      if (sourceInstanceId) {
        state.cancelledDamagePreventionSourceIdsUntilEndOfTurn = [
          ...new Set([
            ...(state.cancelledDamagePreventionSourceIdsUntilEndOfTurn ?? []),
            sourceInstanceId,
          ]),
        ];
      }
    }
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: corpDamagePreventionCancel ? "cancel" : "pass",
      eventModificationOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
      ...(corpDamagePreventionCancel
        ? {
            sourceDefinitionId: cancelCandidate.sourceRef.definitionId,
            agendaPointCost,
            agendaPointCostPaid,
            forfeitedAgendaDefinitionIds,
            specialZone: "removed_from_game",
            specialZoneVisibility: "public",
            specialZoneReason: "damage_prevention_cancel",
          }
        : {}),
    };
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, event, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, event);
    setDamagePayload(legalAction, summary);
    return;
  }
  if (selected.startsWith(DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX)) {
    const candidate = window.candidates[0];
    if (
      !candidate ||
      !isCorpDamagePreventionBypassCandidate(state, candidate) ||
      window.side !== "corp" ||
      event.eventType !== "damage" ||
      event.affectedSide !== "runner" ||
      damageTypePayload(event) !== "meat"
    ) {
      throw new Error("Damage-Prevention-Bypass passt nicht zum Fenster.");
    }
    const bypassPaid = Number(
      selected.replace(DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX, ""),
    );
    const originalAmount = numberPayload(event, "amount");
    if (
      !Number.isInteger(bypassPaid) ||
      bypassPaid < 0 ||
      bypassPaid > originalAmount ||
      bypassPaid > state.corp.credits
    ) {
      throw new Error("Damage-Prevention-Bypass ist nicht bezahlbar.");
    }
    revalidateDamagePreventionCandidateSource(state, candidate);
    const bypassCostPerDamage = candidate.bypassCostPerDamage ?? 0;
    spendCredits(state, "corp", bypassPaid);
    const preventedAmount = Math.max(0, originalAmount - bypassPaid);
    const finalAmount = bypassPaid;
    const finalEvent = {
      ...event,
      payload: { ...event.payload, amount: finalAmount },
    };
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "apply",
      eventModificationOutcome:
        finalAmount === 0
          ? "prevented"
          : finalAmount === originalAmount
            ? "original_resolved"
            : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedAmount,
      finalAmount,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      damagePreventionBypassPaid: bypassPaid,
      damagePreventionBypassCostPerDamage: bypassCostPerDamage,
    };
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, finalEvent);
    setDamagePayload(legalAction, summary);
    return;
  }
  const candidate = window.candidates.find(
    (item) => item.candidateId === selected,
  );
  if (!candidate)
    throw new Error("Dieser Event-Modification-Kandidat ist nicht legal.");
  if (
    candidate.eventId !== event.eventId ||
    !(
      candidate.kind === "prevent" ||
      candidate.kind === "increase" ||
      (event.eventType === "add_tag" && candidate.kind === "avoid")
    )
  )
    throw new Error(
      "Dieser Event-Modification-Kandidat passt nicht zum Fenster.",
    );
  if (event.eventType === "add_tag") {
    revalidateTagPreventionCandidateSource(state, candidate);
    const originalAmount = numberPayload(event, "amount");
    const preventedTags = Math.min(
      candidate.preventedTags ?? 0,
      originalAmount,
    );
    const preventionCostPayload = applyRuntimeTagPreventionCost(
      state,
      candidate,
      preventedTags,
    );
    resolveAddTagImminentEvent(state, event, legalAction, preventedTags);
    legalAction.payload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        originalAmount === preventedTags ? "avoided" : "partially_avoided",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedTags,
      finalAmount: Math.max(0, originalAmount - preventedTags),
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    clearEventModificationState(state);
    return;
  }
  if (event.eventType === "runner_installed_trash") {
    revalidateTrashPreventionCandidateSource(state, candidate, event);
    const preventedTrashTargetIds = candidate.preventedTrashTargetIds ?? [];
    const preventionCostPayload = applyRuntimeTrashPreventionCost(
      state,
      candidate,
      preventedTrashTargetIds.length,
    );
    const summary = resolveRunnerInstalledTrashImminentEvent(
      state,
      event,
      legalAction,
      preventedTrashTargetIds,
    );
    legalAction.payload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        summary.trashedCount === 0 ? "prevented" : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount: summary.originalCount,
      preventedTrashCount: summary.preventedCount,
      trashedCount: summary.trashedCount,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    clearEventModificationState(state);
    return;
  }
  if (candidate.kind === "increase") {
    const sourceId = candidate.sourceRef.instanceId;
    const source = sourceId ? state.cardInstances[sourceId] : undefined;
    const implementation = source
      ? cardImplementationForDefinitionId(source.definitionId)
      : undefined;
    if (
      event.eventType !== "damage" ||
      event.affectedSide !== "runner" ||
      damageTypePayload(event) !== "meat" ||
      implementation?.corpUtility?.kind !== "meat_damage_boost"
    )
      throw new Error("Dieser Damage-Boost passt nicht zum Fenster.");
    if (
      !sourceId ||
      !source?.rezzed ||
      source.controller !== "corp" ||
      Math.floor(source.advancementCounters ?? 0) <= 0
    )
      throw new Error("Cybertech Think Tank ist nicht mehr legal.");
    source.advancementCounters = Math.max(
      0,
      Math.floor(source.advancementCounters ?? 0) - 1,
    );
    const originalAmount = numberPayload(event, "amount");
    const increaseAmount = Math.max(1, Math.floor(candidate.increaseAmount ?? 1));
    const finalAmount = originalAmount + increaseAmount;
    const finalEvent = {
      ...event,
      payload: {
        ...event.payload,
        amount: finalAmount,
        baseDamageAmount: originalAmount,
        cybertechThinkTankModifier: increaseAmount,
        cybertechThinkTankSourceCardId: sourceId,
        cybertechThinkTankSourceDefinitionId: source.definitionId,
      },
    };
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "apply",
      eventModificationOutcome: "increased",
      candidateId: candidate.candidateId,
      originalAmount,
      increaseAmount,
      finalAmount,
      sourceKind: candidate.sourceRef.kind,
      sourceDefinitionId: source.definitionId,
      sourceCardId: sourceId,
      remainingCounters: source.advancementCounters,
    };
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, finalEvent);
    setDamagePayload(legalAction, summary);
    return;
  }
  revalidateDamagePreventionCandidateSource(state, candidate);
  const originalAmount = numberPayload(event, "amount");
  const preventedAmount = Math.min(
    candidate.preventAmount ?? 0,
    originalAmount,
  );
  const finalAmount = Math.max(0, originalAmount - preventedAmount);
  registerDamagePreventionUsage(state, candidate, preventedAmount);
  if (candidate.candidateId.startsWith("run_damage_prevent_") && state.run?.damagePreventionPool) {
    state.run.damagePreventionPool.remaining = Math.max(
      0,
      Math.floor(state.run.damagePreventionPool.remaining) - preventedAmount,
    );
  }
  const preventionCostPayload = applyRuntimeDamagePreventionCost(
    state,
    candidate,
    preventedAmount,
  );
  const finalEvent = {
    ...event,
    payload: { ...event.payload, amount: finalAmount },
  };
  legalAction.payload = {
    ...basePayload,
    eventModificationDecision: "apply",
    eventModificationOutcome:
      finalAmount === 0 ? "prevented" : "partially_prevented",
    candidateId: candidate.candidateId,
    originalAmount,
    preventedAmount,
    finalAmount,
    sourceKind: candidate.sourceRef.kind,
    ...(candidate.sourceRef.definitionId
      ? { sourceDefinitionId: candidate.sourceRef.definitionId }
      : {}),
    ...preventionCostPayload,
  };
  clearEventModificationState(state);
  if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, finalEvent);
  setDamagePayload(legalAction, summary);
}

function isCorpDamagePreventionCancelCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): boolean {
  return (
    candidate.controller === "corp" &&
    damagePreventionSourceForEventCandidate(state, candidate)
      ?.corpMayCancelUntilEndOfTurn !== undefined
  );
}

function isCorpDamagePreventionBypassCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): boolean {
  const source = damagePreventionSourceForEventCandidate(
    state,
    candidate,
  );
  return (
    source?.corpMayPayToBypass !== undefined &&
    candidate.bypassPaymentSide === "corp" &&
    candidate.bypassCostPerDamage === source.corpMayPayToBypass.costPerDamage
  );
}

function damagePreventionSourceForEventCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): CardDamagePreventionSourceImplementation | undefined {
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!sourceCardId || !state.cardInstances[sourceCardId]) return undefined;
  return cardImplementationDamagePreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
}

export function resolveReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.replacementWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Replacement-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected) throw new Error("Es wurde keine Replacement-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  if (selected === "pass") {
    legalAction.payload = {
      ...basePayload,
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
    };
    clearReplacementState(state);
    if (openPdcaDamageReplacementChoice(state, event, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, event);
    setDamagePayload(legalAction, summary);
    return;
  }
  const candidate = window.candidates.find(
    (item) => item.candidateId === selected,
  );
  if (!candidate)
    throw new Error("Dieser Replacement-Kandidat ist nicht legal.");
  if (window.consumedCandidateIds.includes(candidate.candidateId))
    throw new Error(
      "Dieser Replacement-Kandidat wurde in diesem Fenster bereits genutzt.",
    );
  if (
    candidate.sourceRef.definitionId ===
    ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID
  ) {
    resolveGripFlatlineTagReplacement(state, legalAction, event, candidate);
    clearReplacementState(state);
    return;
  }
  if (candidate.sourceRef.definitionId === EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID) {
    resolveInstalledFlatlinePreventionReplacement(
      state,
      legalAction,
      event,
      candidate,
    );
    clearReplacementState(state);
    return;
  }
  if (isIdentityDonorReplacementCandidate(state, candidate)) {
    resolveIdentityDonorReplacement(state, legalAction, event, candidate);
    clearReplacementState(state);
    return;
  }
  if (
    candidate.replacesEventType !== event.eventType ||
    candidate.replacementEventType !== "add_tag"
  ) {
    throw new Error(
      "Dieser Replacement-Kandidat passt nicht zum Originalevent.",
    );
  }
  window.consumedCandidateIds.push(candidate.candidateId);
  const tagAmount = candidate.tagAmount ?? 1;
  state.runner.tags += tagAmount;
  legalAction.payload = {
    ...basePayload,
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "add_tag",
    originalAmount: numberPayload(event, "amount"),
    tagsAdded: tagAmount,
    sourceKind: candidate.sourceRef.kind,
  };
  clearReplacementState(state);
}

function isIdentityDonorReplacementCandidate(
  state: GameState,
  candidate: ReplacementCandidate,
): boolean {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.grip.includes(cardId)) return false;
  return flatlineReplacementSourcesForDefinition(definitionFor(state, cardId)).some(
    (source) =>
      source.kind === "damage_replacement_from_grip" &&
      source.replacement === "prevent_meat_damage_add_bad_publicity" &&
      source.damageType === "meat" &&
      source.activeOnlyDuring === "corp_turn" &&
      source.badPublicity === 2,
  );
}

function resolveIdentityDonorReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (
    !cardId ||
    !state.runner.grip.includes(cardId) ||
    !isIdentityDonorReplacementCandidate(state, candidate)
  )
    throw new Error("Identity Donor ist nicht in der Grip verfuegbar.");
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    damageTypePayload(event) !== "meat" ||
    !isCorpTurnDamageWindow(state)
  )
    throw new Error("Identity Donor passt nicht zu diesem Damage-Event.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const definition = definitionFor(state, cardId);
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  const before = state.corp.badPublicity;
  state.corp.badPublicity += 2;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    runnerEventAbility: "grip_meat_damage_replacement",
    sourceDefinitionId: definition.id,
    cardDefinitionId: definition.id,
    trashedCardDefinitionId: definition.id,
    badPublicityAdded: 2,
    corpBadPublicityBefore: before,
    corpBadPublicityAfter: state.corp.badPublicity,
    sourceKind: "card",
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: `${event.eventId}.${cardId}.identity_donor_bad_publicity`,
      kind: "add_bad_publicity",
      visibility: "public",
      side: "corp",
      amount: 2,
      reason: "identity_donor_replacement",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
    },
  ];
}

function resolveGripFlatlineTagReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.grip.includes(cardId))
    throw new Error("Arasaka Owns You ist nicht in der Grip verfuegbar.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const removedTags = state.runner.tags;
  const coreDamageRemoved = state.runner.coreDamage;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  state.runner.coreDamage = 0;
  const targetHandSize = maxHandSize(state, "runner");
  let drawnCards = 0;
  while (state.runner.grip.length < targetHandSize && state.runner.stack.length > 0) {
    drawRunnerCard(state);
    if (state.winner) break;
    drawnCards += 1;
  }
  credits(state, "runner", 10);
  state.runner.tags = 0;
  addRunnerFutureActionDebt(state, 4);
  state.runnerAgendaPointsToForfeit =
    Math.max(0, Math.floor(state.runnerAgendaPointsToForfeit ?? 0)) + 3;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    flatlineReplacementAbility: "flatline_tag_replacement_from_grip",
    sourceDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    cardDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    trashedCardDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    coreDamageRemoved,
    drawnCards,
    gainedCredits: 10,
    removedTags,
    runnerTagsAfter: state.runner.tags,
    futureActionDebtAdded: 4,
    futureAgendaPointForfeitAdded: 3,
    futureAgendaPointForfeitPending: state.runnerAgendaPointsToForfeit,
    sourceKind: "card",
  };
}

function resolveInstalledFlatlinePreventionReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.rig.programs.includes(cardId))
    throw new Error("Die installierte Flatline-Prevention ist nicht installiert.");
  if (definitionFor(state, cardId).id !== EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID)
    throw new Error("Die installierte Flatline-Prevention-Quelle passt nicht.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const coreDamageRemoved = state.runner.coreDamage;
  const gripCardsLost = state.runner.grip.length;
  for (const gripCardId of state.runner.grip.slice()) {
    removeFromAllZones(state, gripCardId);
    state.runner.heap.push(gripCardId);
    state.cardInstances[gripCardId] = {
      ...mustInstance(state.cardInstances, gripCardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  }
  state.runner.coreDamage = 0;
  state.runner.maxHandSize = Math.max(0, state.runner.maxHandSize - 1);
  state.runnerActionsPerTurnOverride = 3;
  state.runnerPermanentMeatDamagePrevention = true;
  trashRunnerInstalledCardToHeap(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    flatlineReplacementAbility: "installed_flatline_prevention",
    sourceDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    cardDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    trashedCardDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    coreDamageRemoved,
    gripCardsLost,
    runnerActionsPerTurnOverride: state.runnerActionsPerTurnOverride,
    permanentMeatDamagePrevention: true,
    runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
    sourceKind: "card",
  };
}

function windowConsumeReplacementCandidate(
  state: GameState,
  candidateId: string,
): void {
  const consumed = state.replacementWindow?.consumedCandidateIds;
  if (consumed && !consumed.includes(candidateId)) consumed.push(candidateId);
}

export function resolveDamageImminentEvent(
  state: GameState,
  event: ImminentEvent,
): DamageSummary {
  if (event.eventType !== "damage")
    throw new Error("Nur Damage-ImminentEvents sind in V1.2.0 auflösbar.");
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0)
    return { damageType, amount: 0, cardsTrashed: 0, flatline: false };
  return doDamage(state, {
    damageId: stringPayload(event, "damageId"),
    damageType,
    amount,
    source: stringPayload(event, "source"),
  });
}

export function resolvePdcaDamageReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  const event = state.imminentEvent;
  if (
    !choice ||
    !choice.source.startsWith("proteus.pdca_damage_replacement:") ||
    !event
  )
    throw new Error("Es ist kein PDCA-Damage-Replacement-Fenster offen.");
  if (choice.side !== "corp" || legalAction.side !== "corp")
    throw new Error("Nur die Korp darf PDCA-Damage ersetzen.");
  if (event.eventType !== "damage" || event.affectedSide !== "runner")
    throw new Error("PDCA passt nicht zu diesem Event.");
  const amount = numberPayload(event, "amount");
  if (amount <= 0 || !isCorpDamageSource(stringPayload(event, "source")))
    throw new Error("PDCA passt nicht zu diesem Damage-Event.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const sourceId = choice.source.split(":")[1] as CardInstanceId | undefined;
  if (!sourceId || !scoredPdcaAgendaIds(state).includes(sourceId))
    throw new Error("Die PDCA-Quelle ist nicht mehr gescored.");
  const source = mustInstance(state.cardInstances, sourceId);
  const basePayload = {
    ...(legalAction.payload ?? {}),
    pdcaDamageReplacementChoiceResolved: true,
    pdcaSourceCardInstanceId: sourceId,
    sourceDefinitionId: source.definitionId,
    originalDamageAmount: amount,
    damageType: damageTypePayload(event),
    imminentEventId: event.eventId,
    replacementModel: "all_or_nothing_damage_slice",
  };
  if (selected === "pass") {
    delete state.pendingChoice;
    delete state.imminentEvent;
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      pdcaDecision: "pass",
      replacementOutcome: "original_resolved",
    };
    setDamagePayload(legalAction, summary);
    restorePdcaReturnContext(state, event);
    return;
  }
  if (selected !== `replace_${sourceId}`)
    throw new Error("Die PDCA-Auswahl ist nicht legal.");
  source.counters = {
    ...(source.counters ?? {}),
    pdca: Math.max(0, Math.floor(source.counters?.pdca ?? 0)) + amount,
  };
  const remainingCounters = Math.max(0, Math.floor(source.counters.pdca ?? 0));
  delete state.pendingChoice;
  delete state.imminentEvent;
  legalAction.payload = {
    ...basePayload,
    pdcaDecision: "replace",
    replacementOutcome: "replaced",
    preventedAmount: amount,
    addedCounterAmount: amount,
    counterType: "pdca",
    remainingCounters,
    damageResolved: true,
    damageAmount: 0,
    cardsTrashed: 0,
    flatline: false,
  };
  restorePdcaReturnContext(state, event);
}

function trashTargetIdsFromEvent(event: ImminentEvent): CardInstanceId[] {
  const raw = stringPayload(event, "targetCardIds");
  if (!raw) return [];
  return raw.split(",").filter((cardId) => cardId.length > 0);
}

function createRunnerInstalledTrashImminentEvent(
  state: GameState,
  targetCardIds: CardInstanceId[],
  source: string,
): ImminentEvent {
  return {
    eventId: `imminent_runner_trash_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "runner_installed_trash",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      targetCardIds: targetCardIds.join(","),
      targetDefinitionIds: targetCardIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(","),
      amount: targetCardIds.length,
      source,
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

export function openRunnerInstalledTrashPreventionWindow(
  state: GameState,
  legalAction: LegalAction,
  targetCardIds: CardInstanceId[],
  source: string,
): boolean {
  const installedTargets = targetCardIds.filter((cardId) =>
    runnerInstalledCardIds(state).includes(cardId),
  );
  if (installedTargets.length === 0) return false;
  const event = createRunnerInstalledTrashImminentEvent(
    state,
    installedTargets,
    source,
  );
  return openEventModificationWindow(state, event, legalAction);
}

export function resolveRunnerInstalledTrashImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTargetIds: CardInstanceId[],
): { originalCount: number; preventedCount: number; trashedCount: number } {
  if (event.eventType !== "runner_installed_trash")
    throw new Error("Nur Runner-Trash-ImminentEvents koennen Trash aufloesen.");
  const targetIds = trashTargetIdsFromEvent(event);
  const prevented = new Set(preventedTargetIds);
  const trashedDefinitionIds: CardDefinitionId[] = [];
  let trashedCount = 0;
  for (const targetId of targetIds) {
    if (prevented.has(targetId)) continue;
    if (!runnerInstalledCardIds(state).includes(targetId)) continue;
    trashedDefinitionIds.push(definitionFor(state, targetId).id);
    trashRunnerInstalledCardToHeap(state, targetId, legalAction);
    trashedCount += 1;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    preventedTrashCount: preventedTargetIds.length,
    trashedCount,
    trashedCardDefinitionId: trashedDefinitionIds[0] ?? "",
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
  };
  return {
    originalCount: targetIds.length,
    preventedCount: preventedTargetIds.length,
    trashedCount,
  };
}

function clearEventModificationState(state: GameState): void {
  delete state.pendingChoice;
  delete state.eventModificationWindow;
  delete state.imminentEvent;
}

function clearReplacementState(state: GameState): void {
  delete state.pendingChoice;
  delete state.replacementWindow;
  delete state.imminentEvent;
}

function compareEventModificationCandidate(
  left: EventModificationCandidate,
  right: EventModificationCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function hasEventModificationConflict(
  candidates: EventModificationCandidate[],
): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority && candidate.kind !== first.kind,
  );
}

function compareReplacementCandidate(
  left: ReplacementCandidate,
  right: ReplacementCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    (left.sourceRef.instanceId ?? "").localeCompare(
      right.sourceRef.instanceId ?? "",
    ) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function hasReplacementConflict(candidates: ReplacementCandidate[]): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority &&
      (candidate.replacementEventType !== first.replacementEventType ||
        candidate.tagAmount !== first.tagAmount ||
        candidate.controller !== first.controller),
  );
}

function numberPayload(event: ImminentEvent, key: string): number {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringPayload(event: ImminentEvent, key: string): string {
  const value = event.payload[key];
  return typeof value === "string" ? value : "";
}

function damageTypePayload(event: ImminentEvent): DamageType {
  const value = event.payload.damageType;
  return value === "meat" || value === "core" ? value : "net";
}

function damagePreventionUsedThisTurn(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const flags = ensureRunnerTurnFlags(state);
  return flags.damagePreventionUsage?.[cardId] ?? 0;
}

function registerDamagePreventionUsage(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): void {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return;
  const flags = ensureRunnerTurnFlags(state);
  const usage = (flags.damagePreventionUsage ??= {});
  usage[candidate.sourceRef.instanceId] =
    (usage[candidate.sourceRef.instanceId] ?? 0) + preventedAmount;
}

function applyRuntimeDamagePreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  ) {
    return {};
  }
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const implementationSource = cardImplementationDamagePreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (implementationSource) {
    if (implementationSource.cost.kind === "none") return {};
    if (implementationSource.cost.kind === "trash_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      trashRunnerInstalledCardToHeap(state, sourceCardId);
      return {
        ...hiddenRevealPayload,
        sourceTrashed: true,
        trashedCardDefinitionId: definition.id,
      };
    }
    if (implementationSource.cost.kind === "credit") {
      spendCredits(state, "runner", implementationSource.cost.amount);
      return {
        paidCredits: implementationSource.cost.amount,
        runnerCreditsAfter: state.runner.credits,
      };
    }
    if (implementationSource.cost.kind === "tap_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
      if (sourceInstance.tapped)
        throw new Error("Die Prevention-Quelle ist bereits getappt.");
      sourceInstance.faceup = true;
      sourceInstance.rezzed = true;
      sourceInstance.tapped = true;
      return {
        ...hiddenRevealPayload,
        sourceTapped: true,
      };
    }
    if (implementationSource.cost.kind === "credit_and_tap_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
      if (sourceInstance.tapped)
        throw new Error("Die Prevention-Quelle ist bereits getappt.");
      spendCredits(state, "runner", implementationSource.cost.amount);
      sourceInstance.faceup = true;
      sourceInstance.rezzed = true;
      sourceInstance.tapped = true;
      return {
        ...hiddenRevealPayload,
        paidCredits: implementationSource.cost.amount,
        runnerCreditsAfter: state.runner.credits,
        sourceTapped: true,
      };
    }
    const { counterType, amount, trashSourceWhenEmpty } =
      implementationSource.cost;
    if (cardCounter(state, sourceCardId, counterType) < amount)
      throw new Error("Die Prevention-Quelle hat nicht genug Counter.");
    spendCardCounter(state, sourceCardId, counterType, amount);
    const remainingCounters = cardCounter(state, sourceCardId, counterType);
    const sourceTrashed =
      trashSourceWhenEmpty === true && remainingCounters <= 0;
    if (sourceTrashed) trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      counterType,
      removedCounterAmount: amount,
      remainingCounters,
      sourceTrashed,
      ...(sourceTrashed ? { trashedCardDefinitionId: definition.id } : {}),
    };
  }
  return {};
}

function applyRuntimeTagPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTagPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      ...hiddenRevealPayload,
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  if (source.cost.kind === "credit_and_tap_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
    if (sourceInstance.tapped)
      throw new Error("Die Tag-Prevention-Quelle ist bereits getappt.");
    spendCredits(state, "runner", source.cost.amount);
    sourceInstance.faceup = true;
    sourceInstance.rezzed = true;
    sourceInstance.tapped = true;
    return {
      ...hiddenRevealPayload,
      paidCredits: source.cost.amount,
      runnerCreditsAfter: state.runner.credits,
      sourceTapped: true,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  return {
    paidCredits: source.cost.amount,
    runnerCreditsAfter: state.runner.credits,
  };
}

function applyRuntimeTrashPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedCount: number,
): Record<string, unknown> {
  if (
    preventedCount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      ...hiddenRevealPayload,
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  if (source.cost.kind === "tap_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
    if (sourceInstance.tapped)
      throw new Error("Die Trash-Prevention-Quelle ist bereits getappt.");
    sourceInstance.faceup = true;
    sourceInstance.rezzed = true;
    sourceInstance.tapped = true;
    return {
      ...hiddenRevealPayload,
      sourceTapped: true,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  returnRunnerInstalledCardToGrip(state, sourceCardId);
  return {
    paidCredits: source.cost.amount,
    returnedSourceToGrip: true,
    runnerCreditsAfter: state.runner.credits,
  };
}

export function hiddenRunnerResourceRevealPayload(
  state: GameState,
  cardId: CardInstanceId,
): Record<string, string | number | boolean> {
  if (!isConcealedRunnerResource(state, cardId)) return {};
  const definition = definitionFor(state, cardId);
  return {
    hiddenRunnerResource: true,
    hiddenRunnerResourceRevealed: true,
    hiddenResourceSlotId: hiddenRunnerResourceSlotId(cardId),
    publicRevealDefinitionId: definition.id,
  };
}

function cardImplementationDamagePreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardDamagePreventionSourceImplementation | undefined {
  const sourceIndex = candidate.preventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return damagePreventionSourcesForDefinition(definition)[sourceIndex];
}

function cardImplementationTagPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTagPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.tagPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return tagPreventionSourcesForDefinition(definition)[sourceIndex];
}

function cardImplementationTrashPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTrashPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.trashPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return trashPreventionSourcesForDefinition(definition)[sourceIndex];
}

function revalidateDamagePreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    return;
  const sourceCardId = candidate.sourceRef.instanceId;
  const expectedDefinitionId = candidate.sourceRef.definitionId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Prevention-Quelle ist nicht mehr installiert.");
  if (
    expectedDefinitionId &&
    definitionFor(state, sourceCardId).id !== expectedDefinitionId
  ) {
    throw new Error("Die Prevention-Quelle passt nicht mehr zur Karte.");
  }
  const implementationSource = cardImplementationDamagePreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    implementationSource &&
    !cardImplementationDamagePreventionSourceCanPay(
      state,
      sourceCardId,
      implementationSource,
    )
  )
    throw new Error("Die Prevention-Quelle kann die Kosten nicht mehr zahlen.");
}

function revalidateTagPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Tag-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Tag-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Tag-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTagPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    !source ||
    !cardImplementationTagPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Tag-Prevention-Quelle kann nicht mehr zahlen.");
}

function revalidateTrashPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
  event: ImminentEvent,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Trash-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Trash-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Trash-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    source?.activeOnlyDuring === "corp_turn" &&
    !(
      state.phase === "corp_draw_phase" ||
      state.phase === "corp_action_phase" ||
      state.phase === "corp_discard_phase"
    )
  )
    throw new Error("Die Trash-Prevention ist nur im Korp-Zug nutzbar.");
  if (
    !source ||
    !cardImplementationTrashPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Trash-Prevention-Quelle kann nicht mehr zahlen.");
  const legalTargets = new Set(trashTargetIdsFromEvent(event));
  const protectedIds = candidate.preventedTrashTargetIds ?? [];
  if (
    protectedIds.length === 0 ||
    protectedIds.some(
      (targetId) =>
        !legalTargets.has(targetId) ||
        !cardImplementationTrashPreventionProtectsTarget(
          state,
          sourceCardId,
          source,
          targetId,
        ),
    )
  )
    throw new Error("Die Trash-Prevention-Ziele sind nicht mehr gueltig.");
}


function recordRunnerDamageDuringCurrentAction(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const currentOrdinal = Math.floor(flags.runnerActionsTakenThisTurn ?? 0);
  if (state.activeSide !== "runner" || currentOrdinal <= 0) return;
  flags.lastDamageRunnerActionOrdinal = currentOrdinal;
}
