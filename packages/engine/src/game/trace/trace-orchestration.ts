import {
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type ChoiceRequest,
  type GameState,
  type LegalAction,
  type ModifierKind,
  type PlayerAction,
  type ServerId,
  type Side,
  type TraceSuccessEffect,
} from "@netgrid/shared";
import type {
  ActivatedCardAbilityImplementation,
  IncreaseTraceLinkEffectImplementation,
} from "../../ability-engine/definition-types";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  assertPostBidLinkPaymentValid,
  assertCorpTraceBidPaymentValid,
  assertRunnerTraceBidPaymentValid,
  corpTracePaymentPublicPayload,
  payCorpTraceBidQuote,
  payPostBidLinkPaymentQuote,
  payRunnerTraceBidQuote,
  postBidLinkPaymentPublicPayload,
  runnerTracePaymentPublicPayload,
  type CorpTracePaymentDependencies,
  type RunnerTracePaymentDependencies,
} from "../payment";
import type { TraceSuccessFollowupResult } from "../run/encounter-printed-effects";
import {
  assertTraceBaseLinkChoiceValid,
  installedTraceBaseLinkCardImplementation,
  quoteTraceBaseLinkChoices,
  traceBaseLinkChoicePublicPayload,
} from "./base-link";
import { describeTraceResultFromTrace } from "./trace-result";
import {
  requireTracePhase,
  traceIsInPhase,
  tracePostBidLinkSourceUsed,
} from "./trace-state";

type CurrentTrace = NonNullable<GameState["trace"]>;

type TracePostBidLinkCandidate = {
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  label: string;
  linkDelta: number;
  creditCost: number;
  limitOncePerTrace: boolean;
  rewardCreditsOnAvoidTrace?: number;
};

export type TraceOrchestrationHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    runnerInstalledCardIds: () => CardInstanceId[];
    hasCardImplementationForDefinition: (
      definitionId: CardDefinitionId,
    ) => boolean;
    activatedTraceAbilities: (
      definition: CardDefinition,
      timing: Extract<
        ActivatedCardAbilityImplementation["timing"],
        "trace_base_link_window" | "trace_post_bid_link_window"
      >,
    ) => Array<{ ability: ActivatedCardAbilityImplementation; index: number }>;
    isSubmarineUplinkSource: (cardId: CardInstanceId) => boolean;
  };
  payment: {
    corpTracePaymentDeps: CorpTracePaymentDependencies;
    runnerTracePaymentDeps: RunnerTracePaymentDependencies;
    runnerTraceLinkCreditSourceIds: () => CardInstanceId[];
    hostedPaymentCredits: (cardId: CardInstanceId) => number;
    spendRunnerCredits: (amount: number) => void;
  };
  runner: {
    identityModifierAmount: (
      side: Side,
      kind: ModifierKind,
      duration: "setup" | "static",
    ) => number;
  };
  corp: {
    rezzedCorpRootCardIds: () => CardInstanceId[];
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: string) => number;
    hackerTrackerCounterTotal: () => number;
    krumzTraceBitTotal: () => number;
  };
  fort: {
    parisCityGridTracePoolSource: () =>
      | {
          cardId: CardInstanceId;
          serverId: Exclude<ServerId, "new_remote">;
        }
      | undefined;
  };
  run: {
    markSubmarineUplinkJackOutAfterEncounter: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    applyPrintedTraceSuccessFollowups: (
      options: {
        trace: CurrentTrace;
        traceStep: "runner_bid" | "post_bid_link";
        legalAction: LegalAction;
        runnerLinkFallback?: number;
        extraPayload?: Record<string, unknown> | undefined;
        deletePendingChoice?: boolean | undefined;
      },
    ) => TraceSuccessFollowupResult;
  };
  trace: {
    supportsTraceSuccessEffect: (effect: TraceSuccessEffect) => boolean;
  };
  callbacks: {
    sanitizeId: (value: string) => string;
  };
  constants: {
    PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID: CardDefinitionId;
  };
};

export function startTraceFromOperation(
  host: TraceOrchestrationHost,
  sourceDefinitionId: string,
  baseTraceStrength: number,
  legalAction: LegalAction,
  successEffect: TraceSuccessEffect = { type: "add_tag", amount: 1 },
): Record<string, string | number | boolean> {
  const { state } = host;
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0)
    throw new Error("Trace strength ist ungueltig.");
  if (!host.trace.supportsTraceSuccessEffect(successEffect))
    throw new Error("Dieser Trace-Erfolgseffekt wird nicht unterstuetzt.");
  const sourceCardInstanceId = String(legalAction.payload?.cardId ?? "");
  if (!sourceCardInstanceId || !state.cardInstances[sourceCardInstanceId])
    throw new Error("Trace-Operation hat keine gueltige Quellenkarte.");
  const traceId = `op_trace.${state.stateVersion + 1}.${host.callbacks.sanitizeId(sourceDefinitionId)}.${sourceCardInstanceId}`;
  const parisPoolSource = host.fort.parisCityGridTracePoolSource();
  const corpBidMax =
    state.corp.credits +
    host.counters.hackerTrackerCounterTotal() +
    host.counters.krumzTraceBitTotal() +
    (parisPoolSource
      ? host.counters.cardCounter(parisPoolSource.cardId, "bit")
      : 0);
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    baseTraceStrength,
    corpBidMax,
    status: "corp_bid",
    successEffect,
    ...(parisPoolSource
      ? {
          parisCityGridPoolSourceCardInstanceId: parisPoolSource.cardId,
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
    returnPhase: state.phase,
    returnTimingPoint: state.timingPoint,
    returnActiveSide: state.activeSide,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    corpBidMax,
  );
  state.activeSide = "corp";
  const publicPayload = {
    traceStarted: true,
    traceId,
    sourceCardId: sourceCardInstanceId,
    sourceDefinitionId,
    baseTraceStrength,
    ...(parisPoolSource
      ? {
          corpBidMax,
          parisCityGridPoolAvailable: host.counters.cardCounter(
            parisPoolSource.cardId,
            "bit",
          ),
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...publicPayload,
  };
  return publicPayload;
}

export function resolveTraceChoice(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  if (traceIsInPhase(state, "corp_bid")) {
    resolveTraceCorpBid(host, legalAction, playerAction);
    return;
  }
  if (traceIsInPhase(state, "base_link")) {
    resolveTraceBaseLinkChoice(host, legalAction, playerAction);
    return;
  }
  if (traceIsInPhase(state, "post_bid_link")) {
    resolveTracePostBidLinkChoice(host, legalAction, playerAction);
    return;
  }
  resolveTraceRunnerBid(host, legalAction, playerAction);
}

export function handleTraceOrchestrationAction(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
): { handled: boolean } {
  if (legalAction.payload?.v1918UpgradeAbility !== "trace_2_tag")
    return { handled: false };
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf V1.9.18-City-Grid-Traces nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!host.corp.rezzedCorpRootCardIds().includes(sourceCardId))
    throw new Error(
      "Die V1.9.18-City-Grid-Trace-Faehigkeit ist nicht rezzed installiert.",
    );
  const definition = host.cards.definitionFor(sourceCardId);
  if (
    definition.id !== host.constants.PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID ||
    host.cards.hasCardImplementationForDefinition(definition.id)
  )
    throw new Error(
      "Die V1.9.18-City-Grid-Trace-Faehigkeit passt nicht zur Karte.",
    );
  const traceStrength = Number(legalAction.payload?.traceStrength ?? 0);
  if (!Number.isInteger(traceStrength) || traceStrength !== 2)
    throw new Error("Paris City Grid startet in diesem WIP genau Trace 2.");
  startTraceFromOperation(host, definition.id, traceStrength, legalAction);
  return { handled: true };
}

export function traceBidChoice(
  state: GameState,
  side: Side,
  traceId: string,
  prompt: string,
  maxBid: number,
): ChoiceRequest {
  const boundedMax = Math.max(0, Math.floor(maxBid));
  return {
    choiceId: `${traceId}.${side}.bid.${state.stateVersion + 1}`,
    side,
    source: `trace:${traceId}`,
    prompt,
    kind: "bid_amount",
    options: Array.from({ length: boundedMax + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveTraceCorpBid(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "corp_bid");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  const tracePaymentQuote = assertCorpTraceBidPaymentValid(
    host.payment.corpTracePaymentDeps,
    state,
    trace,
    bid,
  );
  const tracePaymentReceipt = payCorpTraceBidQuote(
    host.payment.corpTracePaymentDeps,
    state,
    trace,
    tracePaymentQuote,
  );
  const tracePaymentPayload = corpTracePaymentPublicPayload(
    trace,
    tracePaymentQuote,
    tracePaymentReceipt,
  );
  const traceStrength = trace.baseTraceStrength + bid;
  const runnerLink = calculateRunnerLink(host);
  const cryingCounterCount = host.counters.cardCounter(
    state.runner.identity,
    "crying",
  );
  const baseLinkTrace = {
    ...trace,
    status: "base_link" as const,
    corpBid: bid,
    traceStrength,
    runnerLink,
  };
  if (startTraceBaseLinkChoice(host, baseLinkTrace)) {
    state.trace = baseLinkTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "corp_bid",
      baseTraceStrength: trace.baseTraceStrength,
      sourceDefinitionId: trace.sourceDefinitionId,
      ...(typeof trace.corpBidMax === "number"
        ? { corpBidMax: trace.corpBidMax }
        : {}),
      ...(typeof trace.rabbitTraceLimitReduction === "number"
        ? { rabbitTraceLimitReduction: trace.rabbitTraceLimitReduction }
        : {}),
      ...tracePaymentPayload,
      traceStrength,
      runnerLink,
      traceBaseLinkChoiceOpened: true,
      ...(cryingCounterCount > 0
        ? {
            cryingCounterCount,
            cryingLinkReduction: cryingCounterCount * 2,
          }
        : {}),
    };
    return;
  }
  state.trace = {
    ...baseLinkTrace,
    status: "runner_bid",
  };
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    `Runner Link-Bid wählen (Trace ${traceStrength}, Link ${runnerLink})`,
    state.runner.credits + runnerTraceLinkCredits(host),
  );
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    baseTraceStrength: trace.baseTraceStrength,
    sourceDefinitionId: trace.sourceDefinitionId,
    ...(typeof trace.corpBidMax === "number"
      ? { corpBidMax: trace.corpBidMax }
      : {}),
    ...(typeof trace.rabbitTraceLimitReduction === "number"
      ? { rabbitTraceLimitReduction: trace.rabbitTraceLimitReduction }
      : {}),
    ...tracePaymentPayload,
    traceStrength,
    runnerLink,
    ...(cryingCounterCount > 0
      ? { cryingCounterCount, cryingLinkReduction: cryingCounterCount * 2 }
      : {}),
    traceBaseLinkChoiceOpened: false,
  };
}

function startTraceBaseLinkChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): boolean {
  const { state } = host;
  const candidates = quoteTraceBaseLinkChoices(state, trace);
  if (candidates.length === 0) return false;
  state.pendingChoice = {
    choiceId: `${trace.traceId}.base_link.${state.stateVersion + 1}`,
    side: "runner",
    source: `trace_base_link:${trace.traceId}`,
    prompt: "Base-Link-Karte fuer Trace nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Base-Link-Karte nutzen" },
      ...candidates.map((candidate) => ({
        id: `trace_base_link_${candidate.sourceCardInstanceId}`,
        label: `${candidate.label}: Base Link ${candidate.baseLinkValue}`,
        publicLabel: "Base Link",
        value: candidate.sourceCardInstanceId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "runner";
  return true;
}

function openTraceRunnerBidChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): void {
  const { state } = host;
  state.trace = {
    ...trace,
    status: "runner_bid",
  };
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    `Runner Link-Bid wählen (Trace ${trace.traceStrength ?? trace.baseTraceStrength}, Link ${trace.runnerLink ?? calculateRunnerLink(host)})`,
    state.runner.credits + runnerTraceLinkCredits(host),
  );
  state.activeSide = "runner";
}

function resolveTraceBaseLinkChoice(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "base_link");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const baseRunnerLink = trace.runnerLink ?? calculateRunnerLink(host);
  if (selected === "pass") {
    delete state.pendingChoice;
    const nextTrace = {
      ...trace,
      runnerLink: baseRunnerLink,
    };
    openTraceRunnerBidChoice(host, nextTrace);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "base_link",
      baseTraceStrength: trace.baseTraceStrength,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceStrength: trace.traceStrength ?? trace.baseTraceStrength,
      baseLinkUsed: false,
      runnerLink: baseRunnerLink,
    };
    return;
  }
  const option = state.pendingChoice?.options.find(
    (candidate) => candidate.id === selected,
  );
  const cardId =
    typeof option?.value === "string"
      ? (option.value as CardInstanceId)
      : undefined;
  if (!cardId) throw new Error("Diese Base-Link-Quelle ist nicht legal.");
  const candidate = assertTraceBaseLinkChoiceValid(state, cardId);
  host.payment.spendRunnerCredits(candidate.creditCost);
  host.run.markSubmarineUplinkJackOutAfterEncounter(
    candidate.sourceCardInstanceId,
    legalAction,
  );
  const runnerLink =
    calculateRunnerLinkCore(host) + candidate.baseLinkValue;
  const nextTrace = {
    ...trace,
    baseLinkSourceId: candidate.sourceCardInstanceId,
    baseLinkValue: candidate.baseLinkValue,
    baseLinkCostPaid: candidate.creditCost,
    ...(candidate.rewardCreditsOnAvoidTrace
      ? {
          traceAvoidRewardUsages: [
            ...(trace.traceAvoidRewardUsages ?? []),
            {
              sourceCardInstanceId: candidate.sourceCardInstanceId,
              sourceDefinitionId: candidate.sourceDefinitionId,
              amount: candidate.rewardCreditsOnAvoidTrace,
              timing: "trace_base_link_window" as const,
            },
          ],
        }
      : {}),
    runnerLink,
  };
  delete state.pendingChoice;
  openTraceRunnerBidChoice(host, nextTrace);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "base_link",
    baseTraceStrength: trace.baseTraceStrength,
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceStrength: trace.traceStrength ?? trace.baseTraceStrength,
    ...traceBaseLinkChoicePublicPayload(candidate),
    runnerLink,
    runnerCreditsAfter: state.runner.credits,
  };
}

function resolveTraceRunnerBid(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "runner_bid");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  const tracePaymentQuote = assertRunnerTraceBidPaymentValid(
    host.payment.runnerTracePaymentDeps,
    state,
    bid,
  );
  const tracePaymentReceipt = payRunnerTraceBidQuote(
    host.payment.runnerTracePaymentDeps,
    state,
    tracePaymentQuote,
  );
  const tracePaymentPayload =
    runnerTracePaymentPublicPayload(tracePaymentReceipt);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(host);
  const postBidTraceBase = {
    ...trace,
    status: "post_bid_link" as const,
    runnerLink,
    runnerBid: bid,
    postBidLinkBonus: 0,
    postBidLinkSourceIds: [],
  };
  const result = describeTraceResultFromTrace(postBidTraceBase, {
    runnerLinkFallback: runnerLink,
  });
  const traceStrength = result.corpTraceStrength;
  const runnerStrength = result.runnerTraceStrength;
  const postBidTrace = {
    ...postBidTraceBase,
    traceStrength,
    runnerStrength,
  };
  if (startTracePostBidLinkChoice(host, postBidTrace)) {
    state.trace = postBidTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "runner_bid",
      baseTraceStrength: trace.baseTraceStrength,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceStrength,
      runnerLink,
      runnerBid: bid,
      ...tracePaymentPayload,
      runnerStrength,
      postBidTraceLinkChoiceOpened: true,
    };
    return;
  }
  host.run.applyPrintedTraceSuccessFollowups({
    trace: postBidTrace,
    traceStep: "runner_bid",
    legalAction,
    runnerLinkFallback: runnerLink,
    extraPayload: tracePaymentPayload,
    deletePendingChoice: true,
  });
}

function postBidTraceLinkCandidates(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): TracePostBidLinkCandidate[] {
  const { state } = host;
  const candidates: TracePostBidLinkCandidate[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = host.cards.definitionFor(cardId);
    for (const { ability } of host.cards.activatedTraceAbilities(
      definition,
      "trace_post_bid_link_window",
    )) {
      const effect = increaseTraceLinkEffect(ability);
      if (!effect) continue;
      if (host.cards.isSubmarineUplinkSource(cardId) && !state.run) continue;
      const creditCost = creditCostForTraceAbility(ability);
      if (state.runner.credits + runnerTraceLinkCredits(host) < creditCost)
        continue;
      const limitOncePerTrace =
        ability.limit?.kind === "once_per_trace_per_source" &&
        ability.limit.scope === "source";
      if (limitOncePerTrace && tracePostBidLinkSourceUsed(trace, cardId))
        continue;
      if (
        !Number.isInteger(effect.amount) ||
        effect.amount <= 0 ||
        effect.visibility !== "public"
      )
        throw new Error("Trace link effect is invalid.");
      candidates.push({
        cardId,
        definitionId: definition.id,
        label: definition.title,
        linkDelta: effect.amount,
        creditCost,
        limitOncePerTrace,
        ...(effect.rewardCreditsOnAvoidTrace
          ? { rewardCreditsOnAvoidTrace: effect.rewardCreditsOnAvoidTrace }
          : {}),
      });
    }
  }
  return candidates;
}

function startTracePostBidLinkChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): boolean {
  const { state } = host;
  const candidates = postBidTraceLinkCandidates(host, trace);
  if (candidates.length === 0) return false;
  state.pendingChoice = {
    choiceId: `${trace.traceId}.post_bid_link.${state.stateVersion + 1}`,
    side: "runner",
    source: `trace_post_bid_link:${trace.traceId}`,
    prompt: "Post-bid Link-Faehigkeit nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      ...candidates.map((candidate) => ({
        id: `trace_link_${candidate.cardId}`,
        label: `${candidate.label}: +${candidate.linkDelta} Link`,
        publicLabel: "Trace Link",
        value: candidate.cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  state.activeSide = "runner";
  return true;
}

function resolveTracePostBidLinkChoice(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "post_bid_link");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected !== "pass") {
    const option = state.pendingChoice?.options.find(
      (candidate) => candidate.id === selected,
    );
    const cardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    const candidate = postBidTraceLinkCandidates(host, trace).find(
      (item) => item.cardId === cardId,
    );
    if (!candidate)
      throw new Error("Diese Post-Bid-Link-Quelle ist nicht legal.");
    const paymentQuote = assertPostBidLinkPaymentValid(
      host.payment.runnerTracePaymentDeps,
      state,
      candidate.creditCost,
    );
    const paymentReceipt = payPostBidLinkPaymentQuote(
      host.payment.runnerTracePaymentDeps,
      state,
      paymentQuote,
    );
    const paymentPayload = postBidLinkPaymentPublicPayload(paymentReceipt);
    host.run.markSubmarineUplinkJackOutAfterEncounter(
      candidate.cardId,
      legalAction,
    );
    const nextTrace = {
      ...trace,
      runnerLink: (trace.runnerLink ?? 0) + candidate.linkDelta,
      runnerStrength: (trace.runnerStrength ?? 0) + candidate.linkDelta,
      postBidLinkBonus: (trace.postBidLinkBonus ?? 0) + candidate.linkDelta,
      postBidLinkSourceIds: [
        ...(trace.postBidLinkSourceIds ?? []),
        candidate.cardId,
      ],
      ...(candidate.rewardCreditsOnAvoidTrace
        ? {
            traceAvoidRewardUsages: [
              ...(trace.traceAvoidRewardUsages ?? []),
              {
                sourceCardInstanceId: candidate.cardId,
                sourceDefinitionId: candidate.definitionId,
                amount: candidate.rewardCreditsOnAvoidTrace,
                timing: "trace_post_bid_link_window" as const,
              },
            ],
          }
        : {}),
    };
    delete state.pendingChoice;
    state.trace = nextTrace;
    const opensNext = startTracePostBidLinkChoice(host, nextTrace);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "post_bid_link",
      eventModificationDecision: "apply",
      sourceDefinitionId: candidate.definitionId,
      postBidTraceLinkSourceDefinitionId: candidate.definitionId,
      postBidTraceLinkCostPaid: candidate.creditCost,
      ...paymentPayload,
      postBidTraceLinkDelta: candidate.linkDelta,
      postBidTraceLinkBonus: nextTrace.postBidLinkBonus ?? 0,
      runnerLink: nextTrace.runnerLink ?? 0,
      runnerStrength: nextTrace.runnerStrength ?? 0,
      postBidTraceLinkChoiceOpened: opensNext,
    };
    if (opensNext) return;
    completeTraceAfterPostBidLink(host, nextTrace, legalAction);
    return;
  }
  delete state.pendingChoice;
  completeTraceAfterPostBidLink(host, trace, legalAction);
}

function completeTraceAfterPostBidLink(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
  legalAction: LegalAction,
): void {
  host.run.applyPrintedTraceSuccessFollowups({
    trace,
    traceStep: "post_bid_link",
    legalAction,
    runnerLinkFallback: calculateRunnerLink(host),
  });
}

function runnerTraceLinkCredits(host: TraceOrchestrationHost): number {
  return host.payment.runnerTraceLinkCreditSourceIds().reduce(
    (sum, cardId) => sum + host.payment.hostedPaymentCredits(cardId),
    0,
  );
}

function selectedBidAmount(
  choice: ChoiceRequest | undefined,
  playerAction: PlayerAction,
): number {
  if (!choice) throw new Error("Es ist keine Bid-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  const amount =
    typeof selected?.value === "number" ? selected.value : Number.NaN;
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Der Trace-Bid ist ungueltig.");
  return amount;
}

export function calculateRunnerLinkCore(
  host: TraceOrchestrationHost,
): number {
  const { state } = host;
  const identity = host.cards.definitionFor(state.runner.identity);
  const baseLink = identity.baseLink ?? 0;
  if (!Number.isInteger(baseLink) || baseLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  const modifier = host.runner.identityModifierAmount(
    "runner",
    "base_link",
    "static",
  );
  const cryingReduction =
    host.counters.cardCounter(state.runner.identity, "crying") * 2;
  const link = Math.max(0, baseLink + modifier - cryingReduction);
  if (!Number.isInteger(link) || link < 0)
    throw new Error("Runner-Link ist ungueltig.");
  return link;
}

export function calculateRunnerLink(host: TraceOrchestrationHost): number {
  const { state } = host;
  const coreLink = calculateRunnerLinkCore(host);
  const traceBaseLink = state.trace?.baseLinkValue ?? 0;
  if (!Number.isInteger(traceBaseLink) || traceBaseLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  const installedLink =
    traceBaseLink > 0
      ? 0
      : host.cards.runnerInstalledCardIds().reduce((best, cardId) => {
          const definition = host.cards.definitionFor(cardId);
          if (installedTraceBaseLinkCardImplementation(definition)) return best;
          const cardLink = definition.baseLink ?? 0;
          if (!Number.isInteger(cardLink) || cardLink < 0)
            throw new Error("Runner-Link ist ungueltig.");
          return Math.max(best, cardLink);
        }, 0);
  const link = Math.max(0, coreLink + installedLink + traceBaseLink);
  const runTraceLinkBonus = Math.max(
    0,
    Math.floor(state.run?.runTraceLinkBonus ?? 0),
  );
  const effectiveLink = link + runTraceLinkBonus;
  if (!Number.isInteger(effectiveLink) || effectiveLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  return effectiveLink;
}

function creditCostForTraceAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  if (
    ability.costs.length !== 1 ||
    creditCosts.length !== 1 ||
    !Number.isInteger(creditCosts[0]?.amount) ||
    (creditCosts[0]?.amount ?? 0) < 0
  ) {
    throw new Error(
      "Trace CardImplementation ability supports exactly one nonnegative credit cost.",
    );
  }
  return creditCosts[0]!.amount;
}

function increaseTraceLinkEffect(
  ability: ActivatedCardAbilityImplementation,
): IncreaseTraceLinkEffectImplementation | undefined {
  const effects = ability.effects.filter(
    (effect): effect is IncreaseTraceLinkEffectImplementation =>
      effect.kind === "increase_trace_link",
  );
  if (effects.length > 1)
    throw new Error(
      "Trace link ability has multiple increase_trace_link effects.",
    );
  return effects[0];
}
