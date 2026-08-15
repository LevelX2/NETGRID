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
  AddBadPublicityIfCancelledTraceHasNonTagEffectImplementation,
  CancelSuccessfulTraceEffectImplementation,
  IncreaseTraceLinkEffectImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { selectedChoiceIds } from "../choices/choice-validation";
import { credits } from "../state/economy-mutation";
import {
  assertPostBidLinkPaymentValid,
  assertCorpTraceBidPaymentValid,
  assertRunnerTraceBidPaymentValid,
  corpTracePaymentPublicPayload,
  corpTraceSpecializedPaymentSources,
  payCorpTraceBidQuote,
  payPostBidLinkPaymentQuote,
  payRunnerTraceBidQuote,
  postBidLinkPaymentPublicPayload,
  quoteRunnerTraceBidPayment,
  quoteCorpTraceBidPayment,
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
  runnerCostPenaltySupportCreditCapacity,
  runnerTracePaymentPublicPayload,
  type CorpTracePaymentDependencies,
  type CorpTracePaymentSelection,
  type RunnerTraceLinkCreditSelection,
  type RunnerTracePaymentDependencies,
  type RunnerTracePaymentQuote,
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
  traceCorpBaseStrength,
  traceRulesDefinitionForState,
  traceRulesDefinitionForTrace,
} from "./trace-rules-profile";
import { returnUnusedCorpTraceWindowCredits } from "./temporary-trace-credit-lifecycle";
import {
  requireTracePhase,
  traceIsInPhase,
  tracePostBidLinkSourceUsed,
} from "./trace-state";
import { hiddenRunnerResourceRevealPayload } from "../damage/damage-core";

type CurrentTrace = NonNullable<GameState["trace"]>;

type TracePostBidLinkCandidate = {
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  label: string;
  linkDelta: number;
  creditCost: number;
  tapSource: boolean;
  trashSource: boolean;
  limitOncePerTrace: boolean;
  rewardCreditsOnAvoidTrace?: number;
  badPublicityIfCancelledTraceHasNonTagEffect?: number;
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
        | "trace_base_link_window"
        | "trace_post_bid_link_window"
        | "trace_success_cancel_window"
      >,
    ) => Array<{ ability: ActivatedCardAbilityImplementation; index: number }>;
    isTraceLinkForceJackOutSource: (cardId: CardInstanceId) => boolean;
  };
  payment: {
    corpTracePaymentDeps: CorpTracePaymentDependencies;
    runnerTracePaymentDeps: RunnerTracePaymentDependencies;
    runnerTraceLinkCreditSourceIds: () => CardInstanceId[];
    hostedPaymentCredits: (cardId: CardInstanceId) => number;
    spendRunnerCredits: (amount: number) => void;
    recordRunActionSpendingCapSpend: (amount: number) => void;
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
    corpTraceCounterPoolTotal: () => number;
    recurringTraceCreditPoolTotal: () => number;
  };
  fort: {
    fortTraceBitPoolSource: () =>
      | {
          cardId: CardInstanceId;
          serverId: Exclude<ServerId, "new_remote">;
        }
      | undefined;
  };
  run: {
    markTraceLinkForceJackOutAfterEncounter: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    applyPrintedTraceSuccessFollowups: (options: {
      trace: CurrentTrace;
      traceStep: "runner_bid" | "post_bid_link";
      legalAction: LegalAction;
      runnerLinkFallback?: number;
      extraPayload?: Record<string, unknown> | undefined;
      additionalTagAmount?: number | undefined;
      deletePendingChoice?: boolean | undefined;
    }) => TraceSuccessFollowupResult;
  };
  trace: {
    supportsTraceSuccessEffect: (effect: TraceSuccessEffect) => boolean;
  };
  zones: {
    trashRunnerInstalledCardToHeap: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  callbacks: {
    sanitizeId: (value: string) => string;
    addCorpTraceCounterPoolCounters: () => number;
    addRunnerTagsWithPrevention: (
      legalAction: LegalAction,
      amount: number,
      source: string,
    ) => boolean;
    resolveTraceTrashRunnerResourceSuccess: (
      sourceDefinitionId: CardDefinitionId,
      sourceCardInstanceId: CardInstanceId,
      traceId: string,
      targetCardId: CardInstanceId | undefined,
    ) => Record<string, unknown>;
  };
};

export function startTraceFromOperation(
  host: TraceOrchestrationHost,
  sourceDefinitionId: string,
  traceLimit: number,
  legalAction: LegalAction,
  successEffect: TraceSuccessEffect = { type: "add_tag", amount: 1 },
): Record<string, string | number | boolean> {
  const { state } = host;
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  if (!Number.isInteger(traceLimit) || traceLimit < 0)
    throw new Error("Trace-Limit ist ungueltig.");
  if (!host.trace.supportsTraceSuccessEffect(successEffect))
    throw new Error("Dieser Trace-Erfolgseffekt wird nicht unterstuetzt.");
  const sourceCardInstanceId = String(legalAction.payload?.cardId ?? "");
  if (!sourceCardInstanceId || !state.cardInstances[sourceCardInstanceId])
    throw new Error("Trace-Operation hat keine gueltige Quellenkarte.");
  const traceId = `op_trace.${state.stateVersion + 1}.${host.callbacks.sanitizeId(sourceDefinitionId)}.${sourceCardInstanceId}`;
  const fortTraceBitPoolSource = host.fort.fortTraceBitPoolSource();
  const corpTraceCounterPool = host.counters.corpTraceCounterPoolTotal();
  const paymentCapacity =
    state.corp.credits +
    corpTraceCounterPool +
    host.counters.recurringTraceCreditPoolTotal() +
    (fortTraceBitPoolSource
      ? host.counters.cardCounter(fortTraceBitPoolSource.cardId, "bit")
      : 0);
  const rules = traceRulesDefinitionForState(state);
  const corpBidMax =
    rules.corpBidLimitMode === "payment_capacity"
      ? paymentCapacity
      : Math.min(paymentCapacity, traceLimit + corpTraceCounterPool);
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    traceRulesProfile: rules.profile,
    traceLimit,
    effectiveTraceLimit: traceLimit,
    corpBidMax,
    status: "corp_bid",
    successEffect,
    ...(fortTraceBitPoolSource
      ? {
          fortTraceBitPoolSourceCardInstanceId: fortTraceBitPoolSource.cardId,
          fortTraceBitPoolServerId: fortTraceBitPoolSource.serverId,
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
    rules.resolutionMode === "hidden_commit_reveal"
      ? `Verdecktes Korp-Gebot wählen (Trace-Limit ${traceLimit})`
      : `Offenes Korp-Payment wählen (Basisstärke ${traceLimit})`,
    corpBidMax,
  );
  state.activeSide = "corp";
  const publicPayload = {
    traceStarted: true,
    traceId,
    sourceCardId: sourceCardInstanceId,
    sourceDefinitionId,
    traceLimit,
    effectiveTraceLimit: traceLimit,
    traceRulesProfile: rules.profile,
    ...(fortTraceBitPoolSource
      ? {
          corpBidMax,
          fortTraceBitPoolAvailable: host.counters.cardCounter(
            fortTraceBitPoolSource.cardId,
            "bit",
          ),
          fortTraceBitPoolServerId: fortTraceBitPoolSource.serverId,
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
  if (traceIsInPhase(state, "trace_success_cancel")) {
    resolveTraceSuccessCancelChoice(host, legalAction, playerAction);
    return;
  }
  resolveTraceRunnerBid(host, legalAction, playerAction);
}

export function handleTraceOrchestrationAction(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
): { handled: boolean } {
  return { handled: false };
}

export function traceBidChoice(
  state: GameState,
  side: Side,
  traceId: string,
  prompt: string,
  maxBid: number,
  optionUnit = "Credits",
): ChoiceRequest {
  const boundedMax = Math.max(0, Math.floor(maxBid));
  const rules = state.trace
    ? traceRulesDefinitionForTrace(state.trace)
    : traceRulesDefinitionForState(state);
  return {
    choiceId: `${traceId}.${side}.bid.${state.stateVersion + 1}`,
    side,
    source: `trace:${traceId}`,
    prompt,
    kind: "bid_amount",
    options: Array.from({ length: boundedMax + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} ${optionUnit}`,
      publicLabel: `${amount} ${optionUnit}`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility:
      rules.resolutionMode === "hidden_commit_reveal"
        ? "hidden_info_barrier"
        : "public",
  };
}

function resolveTraceCorpBid(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "corp_bid");
  const pendingPaymentSelection = trace.corpBidPaymentSelection;
  const bid =
    pendingPaymentSelection?.bid ??
    selectedBidAmount(state.pendingChoice, playerAction);
  if (
    !pendingPaymentSelection &&
    startCorpBidPaymentChoice(host, trace, bid, legalAction)
  )
    return;
  const specializedSelections = pendingPaymentSelection
    ? selectedCorpTracePaymentAllocation(state.pendingChoice, playerAction)
    : undefined;
  const tracePaymentQuote = specializedSelections
    ? quoteCorpTraceBidPayment(
        host.payment.corpTracePaymentDeps,
        state,
        trace,
        bid,
        specializedSelections,
      )
    : assertCorpTraceBidPaymentValid(
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
  const rules = traceRulesDefinitionForTrace(trace);
  const traceValue = traceCorpBaseStrength(trace) + bid;
  const effectiveTraceLimit =
    Math.max(0, trace.traceLimit - (trace.rabbitTraceLimitReduction ?? 0)) +
    tracePaymentReceipt.corpTraceCountersSpent;
  const runnerLink = calculateRunnerLink(host);
  const cryingCounterCount = host.counters.cardCounter(
    state.runner.identity,
    "crying",
  );
  const {
    corpBidPaymentSelection: _corpBidPaymentSelection,
    ...traceWithoutCorpPaymentSelection
  } = trace;
  const baseLinkTrace = {
    ...traceWithoutCorpPaymentSelection,
    status: "base_link" as const,
    corpBid: bid,
    traceValue,
    bidsRevealed: rules.corpBidVisibility === "immediate",
    effectiveTraceLimit,
    runnerLink,
  };
  if (startTraceBaseLinkChoice(host, baseLinkTrace)) {
    state.trace = baseLinkTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "corp_bid",
      traceLimit: trace.traceLimit,
      effectiveTraceLimit,
      sourceDefinitionId: trace.sourceDefinitionId,
      ...(typeof trace.corpBidMax === "number"
        ? { corpBidMax: trace.corpBidMax }
        : {}),
      ...(typeof trace.rabbitTraceLimitReduction === "number"
        ? { rabbitTraceLimitReduction: trace.rabbitTraceLimitReduction }
        : {}),
      ...tracePaymentPayload,
      corpBid: bid,
      traceValue,
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
  const runnerTraceLinkCreditCapacity = runnerTraceLinkCredits(host);
  const runnerSupportCreditCapacity =
    runnerCostPenaltySupportCreditCapacity(state);
  const runnerBidCapacity =
    state.runner.credits +
    runnerTraceLinkCreditCapacity +
    runnerSupportCreditCapacity;
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    runnerTraceBidPrompt({
      trace,
      traceValue,
      runnerLink,
      runnerCredits: state.runner.credits,
      runnerTraceLinkCreditCapacity,
      runnerSupportCreditCapacity,
    }),
    runnerBidCapacity,
    runnerTraceLinkCreditCapacity > 0 || runnerSupportCreditCapacity > 0
      ? "Gesamtbid"
      : "Credits",
  );
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    traceLimit: trace.traceLimit,
    effectiveTraceLimit,
    sourceDefinitionId: trace.sourceDefinitionId,
    ...(typeof trace.corpBidMax === "number"
      ? { corpBidMax: trace.corpBidMax }
      : {}),
    ...(typeof trace.rabbitTraceLimitReduction === "number"
      ? { rabbitTraceLimitReduction: trace.rabbitTraceLimitReduction }
      : {}),
    ...tracePaymentPayload,
    corpBid: bid,
    traceValue,
    runnerLink,
    ...(cryingCounterCount > 0
      ? { cryingCounterCount, cryingLinkReduction: cryingCounterCount * 2 }
      : {}),
    traceBaseLinkChoiceOpened: false,
  };
}

function startCorpBidPaymentChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
  bid: number,
  legalAction: LegalAction,
): boolean {
  if (bid <= 0) return false;
  const sources = corpTraceSpecializedPaymentSources(
    host.payment.corpTracePaymentDeps,
    host.state,
  );
  if (sources.length === 0) return false;
  const allocations: CorpTracePaymentSelection[][] = [];
  function collect(
    sourceIndex: number,
    current: CorpTracePaymentSelection[],
    allocated: number,
  ): void {
    const source = sources[sourceIndex];
    if (!source) {
      const quote = quoteCorpTraceBidPayment(
        host.payment.corpTracePaymentDeps,
        host.state,
        trace,
        bid,
        current,
      );
      if (quote.canPay) allocations.push(current);
      return;
    }
    const max = Math.min(source.available, bid - allocated);
    for (let amount = 0; amount <= max; amount += 1) {
      collect(
        sourceIndex + 1,
        [
          ...current,
          {
            kind: source.kind,
            sourceCardInstanceId: source.sourceCardInstanceId,
            amount,
          },
        ],
        allocated + amount,
      );
    }
  }
  collect(0, [], 0);
  if (allocations.length <= 1) return false;
  host.state.trace = {
    ...trace,
    corpBidPaymentSelection: { bid },
  };
  host.state.pendingChoice = {
    choiceId: `${trace.traceId}.corp.payment.${host.state.stateVersion + 1}`,
    side: "corp",
    source: `trace:${trace.traceId}:corp_payment`,
    prompt: `Zahlungsquellen für Trace-Bid ${bid} wählen`,
    kind: "select_option",
    options: allocations.map((allocation, index) => ({
      id: `corp_payment_${index}`,
      label: corpTraceAllocationLabel(host, allocation, bid),
      value: JSON.stringify(allocation),
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility:
      traceRulesDefinitionForTrace(trace).resolutionMode ===
      "hidden_commit_reveal"
        ? "hidden_info_barrier"
        : "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    corpBid: bid,
    corpTracePaymentChoiceOpened: true,
  };
  return true;
}

function selectedCorpTracePaymentAllocation(
  choice: ChoiceRequest | undefined,
  playerAction: PlayerAction,
): CorpTracePaymentSelection[] {
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice?.options.find((candidate) => candidate.id === selected);
  if (!option || typeof option.value !== "string")
    throw new Error("Die Trace-Zahlungsquellen-Auswahl ist ungültig.");
  const parsed = JSON.parse(option.value) as CorpTracePaymentSelection[];
  if (!Array.isArray(parsed))
    throw new Error("Die Trace-Zahlungsquellen-Auswahl ist ungültig.");
  return parsed;
}

function corpTraceAllocationLabel(
  host: TraceOrchestrationHost,
  allocation: CorpTracePaymentSelection[],
  bid: number,
): string {
  const specialized = allocation
    .filter((entry) => entry.amount > 0)
    .map((entry) => {
      const title = host.cards.definitionFor(entry.sourceCardInstanceId).title;
      return `${entry.amount} aus ${title}`;
    });
  const specializedTotal = allocation.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const normal = bid - specializedTotal;
  return (
    [...specialized, ...(normal > 0 ? [`${normal} übrige Quellen`] : [])].join(
      ", ",
    ) || "Keine Zahlung"
  );
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
    visibility:
      traceRulesDefinitionForTrace(trace).resolutionMode ===
      "hidden_commit_reveal"
        ? "hidden_info_barrier"
        : "public",
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
  const runnerTraceLinkCreditCapacity = runnerTraceLinkCredits(host);
  const runnerSupportCreditCapacity =
    runnerCostPenaltySupportCreditCapacity(state);
  const runnerBidCapacity =
    state.runner.credits +
    runnerTraceLinkCreditCapacity +
    runnerSupportCreditCapacity;
  const traceValue =
    trace.traceValue ?? traceCorpBaseStrength(trace) + (trace.corpBid ?? 0);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(host);
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    runnerTraceBidPrompt({
      trace,
      traceValue,
      runnerLink,
      runnerCredits: state.runner.credits,
      runnerTraceLinkCreditCapacity,
      runnerSupportCreditCapacity,
    }),
    runnerBidCapacity,
    runnerTraceLinkCreditCapacity > 0 || runnerSupportCreditCapacity > 0
      ? "Gesamtbid"
      : "Credits",
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
      traceLimit: trace.traceLimit,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceValue:
        trace.traceValue ?? traceCorpBaseStrength(trace) + (trace.corpBid ?? 0),
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
  host.payment.recordRunActionSpendingCapSpend(candidate.creditCost);
  host.payment.spendRunnerCredits(candidate.creditCost);
  if (state.run)
    host.run.markTraceLinkForceJackOutAfterEncounter(
      candidate.sourceCardInstanceId,
      legalAction,
    );
  const runnerLink = calculateRunnerLinkCore(host) + candidate.baseLinkValue;
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
    traceLimit: trace.traceLimit,
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceValue:
      trace.traceValue ?? traceCorpBaseStrength(trace) + (trace.corpBid ?? 0),
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
  if (isRunnerBidPaymentChoice(state.pendingChoice)) {
    resolveTraceRunnerBidPaymentChoice(host, legalAction, playerAction);
    return;
  }
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  if (startRunnerBidPaymentChoice(host, trace, bid, legalAction)) return;
  const tracePaymentPreview = quoteRunnerTraceBidPayment(
    host.payment.runnerTracePaymentDeps,
    state,
    bid,
  );
  if (
    !tracePaymentPreview.canPay &&
    maybeOpenRunnerTraceBidSupportWindow(
      host,
      legalAction,
      bid,
      tracePaymentPreview.traceLinkCreditsToPay,
    )
  )
    return;
  const tracePaymentQuote = assertRunnerTraceBidPaymentValid(
    host.payment.runnerTracePaymentDeps,
    state,
    bid,
  );
  finishTraceRunnerBid(host, legalAction, trace, bid, tracePaymentQuote);
}

function finishTraceRunnerBid(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  trace: CurrentTrace,
  bid: number,
  tracePaymentQuote: RunnerTracePaymentQuote,
): void {
  const { state } = host;
  const {
    runnerBidPaymentSelection: _runnerBidPaymentSelection,
    ...traceWithoutPaymentSelection
  } = trace;
  closeRunnerCostPenaltySupportWindowForPayment(
    state,
    legalAction,
    tracePaymentQuote.normalCreditsToPay,
  );
  const tracePaymentReceipt = payRunnerTraceBidQuote(
    host.payment.runnerTracePaymentDeps,
    state,
    tracePaymentQuote,
  );
  const tracePaymentPayload =
    runnerTracePaymentPublicPayload(tracePaymentReceipt);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceRulesProfile: traceRulesDefinitionForTrace(trace).profile,
    traceBidsRevealed: true,
  };
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(host);
  const postBidTraceBase = {
    ...traceWithoutPaymentSelection,
    status: "post_bid_link" as const,
    runnerLink,
    runnerBid: bid,
    bidsRevealed: true,
    postBidLinkBonus: 0,
    postBidLinkSourceIds: [],
  };
  const result = describeTraceResultFromTrace(postBidTraceBase, {
    runnerLinkFallback: runnerLink,
  });
  const traceValue = result.traceValue;
  const runnerStrength = result.runnerStrength;
  const postBidTrace = {
    ...postBidTraceBase,
    traceValue,
    runnerStrength,
  };
  const crashSpaceSource = traceAutoSuccessSource(host);
  if (crashSpaceSource) {
    const forcedTrace = forceTraceSuccessful(postBidTrace);
    const extraPayload = traceAutoSuccessAdditionalTagPayload(crashSpaceSource);
    if (!state.run) {
      completeTraceWithoutRun(host, forcedTrace, "runner_bid", legalAction, {
        runnerLinkFallback: runnerLink,
        extraPayload: { ...tracePaymentPayload, ...extraPayload },
        additionalTagAmount: 1,
        deletePendingChoice: true,
      });
      return;
    }
    host.run.applyPrintedTraceSuccessFollowups({
      trace: forcedTrace,
      traceStep: "runner_bid",
      legalAction,
      runnerLinkFallback: runnerLink,
      extraPayload: { ...tracePaymentPayload, ...extraPayload },
      additionalTagAmount: 1,
      deletePendingChoice: true,
    });
    return;
  }
  if (startTracePostBidLinkChoice(host, postBidTrace)) {
    state.trace = postBidTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "runner_bid",
      traceLimit: trace.traceLimit,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceValue,
      runnerLink,
      runnerBid: bid,
      ...tracePaymentPayload,
      runnerStrength,
      postBidTraceLinkChoiceOpened: true,
    };
    return;
  }
  if (startTraceSuccessCancelChoice(host, postBidTrace)) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "runner_bid",
      traceLimit: trace.traceLimit,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceValue,
      runnerLink,
      runnerBid: bid,
      ...tracePaymentPayload,
      runnerStrength,
      postBidTraceLinkChoiceOpened: false,
      traceSuccessCancelChoiceOpened: true,
    };
    return;
  }
  if (!state.run) {
    completeTraceWithoutRun(host, postBidTrace, "runner_bid", legalAction, {
      runnerLinkFallback: runnerLink,
      extraPayload: tracePaymentPayload,
      deletePendingChoice: true,
    });
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

function runnerTraceBidPrompt(input: {
  trace: CurrentTrace;
  traceValue: number;
  runnerLink: number;
  runnerCredits: number;
  runnerTraceLinkCreditCapacity: number;
  runnerSupportCreditCapacity: number;
}): string {
  const rules = traceRulesDefinitionForTrace(input.trace);
  const available = [
    `${input.runnerCredits} Credits`,
    ...(input.runnerTraceLinkCreditCapacity > 0
      ? [`${input.runnerTraceLinkCreditCapacity} Link-Bits`]
      : []),
    ...(input.runnerSupportCreditCapacity > 0
      ? [`${input.runnerSupportCreditCapacity} Support`]
      : []),
  ].join(" + ");
  return rules.resolutionMode === "hidden_commit_reveal"
    ? `Verdecktes Runner-Gebot wählen (Link ${input.runnerLink}; öffentliches Korp-Limit ${Math.max(0, input.trace.traceLimit - (input.trace.rabbitTraceLimitReduction ?? 0))}; ${available} verfügbar)`
    : `Runner Link-Payment wählen (Trace-Stärke ${input.traceValue}, Link ${input.runnerLink}; ${available} verfügbar)`;
}

function startRunnerBidPaymentChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
  bid: number,
  legalAction: LegalAction,
): boolean {
  if (bid <= 0) return false;
  const sourceCardInstanceIds = runnerTraceLinkPaymentSourceIds(host);
  if (sourceCardInstanceIds.length <= 1) return false;
  host.state.trace = {
    ...trace,
    runnerBidPaymentSelection: {
      bid,
      sourceCardInstanceIds,
      sourceIndex: 0,
      allocations: [],
    },
  };
  openRunnerBidPaymentChoice(host);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "runner_bid",
    sourceDefinitionId: trace.sourceDefinitionId,
    traceLimit: trace.traceLimit,
    corpBid: trace.corpBid ?? 0,
    traceValue:
      trace.traceValue ?? traceCorpBaseStrength(trace) + (trace.corpBid ?? 0),
    runnerLink: trace.runnerLink ?? calculateRunnerLink(host),
    runnerBid: bid,
    traceLinkPaymentChoiceOpened: true,
  };
  return true;
}

function resolveTraceRunnerBidPaymentChoice(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const { state } = host;
  const trace = requireTracePhase(state, "runner_bid");
  const selection = trace.runnerBidPaymentSelection;
  if (!selection)
    throw new Error("Es ist keine Runner-Trace-Zahlungswahl offen.");
  const sourceCardInstanceId =
    selection.sourceCardInstanceIds[selection.sourceIndex];
  if (!sourceCardInstanceId)
    throw new Error("Die Runner-Trace-Zahlungsquelle fehlt.");
  const amount = selectedBidAmount(state.pendingChoice, playerAction);
  const allocation = {
    sourceCardInstanceId,
    amount,
  };
  const nextSelection = {
    ...selection,
    sourceIndex: selection.sourceIndex + 1,
    allocations: [...selection.allocations, allocation],
  };
  const nextTrace = {
    ...trace,
    runnerBidPaymentSelection: nextSelection,
  };
  const sourceDefinitionId =
    state.cardInstances[sourceCardInstanceId]?.definitionId;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "runner_bid_payment",
    sourceDefinitionId: trace.sourceDefinitionId,
    runnerBid: selection.bid,
    ...(sourceDefinitionId
      ? { traceLinkPaymentSourceDefinitionId: sourceDefinitionId }
      : {}),
    traceLinkPaymentAmount: amount,
  };
  if (nextSelection.sourceIndex < nextSelection.sourceCardInstanceIds.length) {
    state.trace = nextTrace;
    openRunnerBidPaymentChoice(host);
    return;
  }
  const {
    runnerBidPaymentSelection: _finishedRunnerBidPaymentSelection,
    ...finishedTrace
  } = nextTrace;
  const quote = quoteRunnerTraceBidPayment(
    host.payment.runnerTracePaymentDeps,
    state,
    selection.bid,
    nextSelection.allocations,
  );
  if (
    !quote.canPay &&
    maybeOpenRunnerTraceBidSupportWindow(
      host,
      legalAction,
      selection.bid,
      quote.traceLinkCreditsToPay,
    )
  )
    return;
  state.trace = finishedTrace;
  delete state.pendingChoice;
  finishTraceRunnerBid(host, legalAction, trace, selection.bid, quote);
}

function maybeOpenRunnerTraceBidSupportWindow(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  bid: number,
  traceLinkCreditsToPay: number,
): boolean {
  const normalCreditsRequired = Math.max(
    0,
    Math.floor(bid) - Math.max(0, Math.floor(traceLinkCreditsToPay)),
  );
  return openRunnerCostPenaltySupportWindow(host.state, legalAction, {
    amount: normalCreditsRequired,
    availableWithoutSupport: host.state.runner.credits,
    context: "runner_trace_bid",
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
      if (host.cards.isTraceLinkForceJackOutSource(cardId) && !state.run)
        continue;
      const traceCost = costForTraceAbility(ability);
      const creditCost = traceCost.creditCost;
      if (state.runner.credits + runnerTraceLinkCredits(host) < creditCost)
        continue;
      if (traceCost.tapSource && instance.tapped === true) continue;
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
        tapSource: traceCost.tapSource,
        trashSource: traceCost.trashSource,
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
        metadata: {
          postBidTraceLinkDelta: candidate.linkDelta,
        },
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
    const sourceCostPayload = payTraceSourceCost(
      host,
      candidate.cardId,
      candidate,
      legalAction,
    );
    if (state.run)
      host.run.markTraceLinkForceJackOutAfterEncounter(
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
      ...sourceCostPayload,
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
  const crashSpaceSource = traceAutoSuccessSource(host);
  if (crashSpaceSource) {
    const forcedTrace = forceTraceSuccessful(trace);
    const extraPayload = traceAutoSuccessAdditionalTagPayload(crashSpaceSource);
    if (!host.state.run) {
      completeTraceWithoutRun(host, forcedTrace, "post_bid_link", legalAction, {
        runnerLinkFallback: calculateRunnerLink(host),
        extraPayload,
        additionalTagAmount: 1,
        deletePendingChoice: true,
      });
      return;
    }
    host.run.applyPrintedTraceSuccessFollowups({
      trace: forcedTrace,
      traceStep: "post_bid_link",
      legalAction,
      runnerLinkFallback: calculateRunnerLink(host),
      extraPayload,
      additionalTagAmount: 1,
      deletePendingChoice: true,
    });
    return;
  }
  if (startTraceSuccessCancelChoice(host, trace)) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "post_bid_link",
      sourceDefinitionId: trace.sourceDefinitionId,
      traceSuccessCancelChoiceOpened: true,
    };
    return;
  }
  if (!host.state.run) {
    completeTraceWithoutRun(host, trace, "post_bid_link", legalAction, {
      runnerLinkFallback: calculateRunnerLink(host),
      deletePendingChoice: true,
    });
    return;
  }
  host.run.applyPrintedTraceSuccessFollowups({
    trace,
    traceStep: "post_bid_link",
    legalAction,
    runnerLinkFallback: calculateRunnerLink(host),
  });
}

function traceAutoSuccessSource(
  host: TraceOrchestrationHost,
): { cardId: CardInstanceId; definitionId: CardDefinitionId } | undefined {
  for (const cardId of host.cards.runnerInstalledCardIds().slice().sort()) {
    const definition = host.cards.definitionFor(cardId);
    if (
      cardImplementationForDefinitionId(definition.id)?.runnerUtilityLongtail
        ?.kind === "trace_attempts_auto_success_add_tag"
    )
      return { cardId, definitionId: definition.id };
  }
  return undefined;
}

function forceTraceSuccessful(trace: CurrentTrace): CurrentTrace {
  const result = describeTraceResultFromTrace(trace);
  return {
    ...trace,
    successful: true,
    runnerStrength: result.runnerStrength,
  };
}

function traceAutoSuccessAdditionalTagPayload(source: {
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
}): Record<string, string | number | boolean> {
  return {
    traceAutoSuccessSourceCardId: source.cardId,
    traceAutoSuccessSourceDefinitionId: source.definitionId,
    traceAutoSuccessAdditionalTagAmount: 1,
  };
}

function completeTraceWithoutRun(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
  traceStep: "runner_bid" | "post_bid_link",
  legalAction: LegalAction,
  options: {
    runnerLinkFallback?: number;
    extraPayload?: Record<string, unknown>;
    additionalTagAmount?: number;
    deletePendingChoice?: boolean;
  } = {},
): void {
  const { state } = host;
  const result = describeTraceResultFromTrace(trace, {
    runnerLinkFallback: options.runnerLinkFallback ?? calculateRunnerLink(host),
  });
  const successful = result.successful;
  const tagAmount =
    traceSuccessTagAmountForOperation(trace.successEffect, successful, result) +
    (successful ? Math.max(0, options.additionalTagAmount ?? 0) : 0);
  const hackerTrackerCountersAdded =
    host.callbacks.addCorpTraceCounterPoolCounters();
  const traceAvoidReward = successful
    ? { amount: 0, sourceDefinitionIds: [] as string[] }
    : applyTraceAvoidRewardsForOperation(state, trace);
  const traceResourceTrashPayload =
    successful &&
    trace.successEffect.type === "trash_runner_resource_and_add_tag"
      ? host.callbacks.resolveTraceTrashRunnerResourceSuccess(
          trace.sourceDefinitionId,
          trace.sourceCardInstanceId,
          trace.traceId,
          trace.successEffect.targetCardInstanceId,
        )
      : {};
  const temporaryTraceCreditReturnPayload =
    returnUnusedCorpTraceWindowCredits(state);
  if (options.deletePendingChoice) delete state.pendingChoice;
  delete state.trace;
  if (trace.returnTimingPoint && trace.returnActiveSide && trace.returnPhase) {
    state.timingPoint = trace.returnTimingPoint;
    state.activeSide = trace.returnActiveSide;
    state.phase = trace.returnPhase;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep,
    traceLimit: trace.traceLimit,
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceValue: result.traceValue,
    runnerLink: result.runnerLink,
    runnerBid: result.runnerBid,
    ...(options.extraPayload ?? {}),
    runnerStrength: result.runnerStrength,
    ...(traceStep === "post_bid_link"
      ? { postBidTraceLinkBonus: trace.postBidLinkBonus ?? 0 }
      : {}),
    traceSuccessful: successful,
    tagsAdded: 0,
    ...temporaryTraceCreditReturnPayload,
    ...(hackerTrackerCountersAdded > 0
      ? {
          hackerTrackerCountersAdded,
          traceHostedCreditsAdded: hackerTrackerCountersAdded,
        }
      : {}),
    ...(traceAvoidReward.amount > 0
      ? {
          traceAvoidRewardCredits: traceAvoidReward.amount,
          gainedCredits: traceAvoidReward.amount,
          runnerCreditsAfter: state.runner.credits,
          traceAvoidRewardSourceDefinitionIds:
            traceAvoidReward.sourceDefinitionIds.sort().join(","),
        }
      : {}),
    ...traceResourceTrashPayload,
  };
  if (tagAmount > 0)
    host.callbacks.addRunnerTagsWithPrevention(
      legalAction,
      tagAmount,
      `trace:${trace.sourceDefinitionId}:${trace.traceId}`,
    );
}

function traceSuccessTagAmountForOperation(
  successEffect: TraceSuccessEffect,
  successful: boolean,
  result: ReturnType<typeof describeTraceResultFromTrace>,
): number {
  if (!successful) return 0;
  if (successEffect.type === "add_tag_and_counter")
    return successEffect.tagAmount;
  if (successEffect.type === "add_tag") return successEffect.amount;
  if (successEffect.type === "add_tags_by_trace_margin_over_runner_link")
    return Math.max(0, result.traceValue - result.runnerLink);
  if (successEffect.type === "trash_runner_resource_and_add_tag") return 1;
  return 0;
}

function applyTraceAvoidRewardsForOperation(
  state: GameState,
  trace: CurrentTrace,
): { amount: number; sourceDefinitionIds: string[] } {
  let amount = 0;
  const sourceDefinitionIds: string[] = [];
  for (const reward of trace.traceAvoidRewardUsages ?? []) {
    if (!Number.isInteger(reward.amount) || reward.amount <= 0) continue;
    amount += reward.amount;
    sourceDefinitionIds.push(reward.sourceDefinitionId);
  }
  if (amount > 0)
    credits(state, "runner", amount, {
      kind: "trace_effect",
      sourceDefinitionIds: sourceDefinitionIds as CardDefinitionId[],
      reason: "trace_avoid_rewards",
    });
  return { amount, sourceDefinitionIds };
}

function traceSuccessCancelCandidates(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): TracePostBidLinkCandidate[] {
  const result = describeTraceResultFromTrace(trace, {
    runnerLinkFallback: calculateRunnerLink(host),
  });
  if (!result.successful) return [];
  const candidates: TracePostBidLinkCandidate[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().sort()) {
    const instance = host.state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = host.cards.definitionFor(cardId);
    for (const { ability } of host.cards.activatedTraceAbilities(
      definition,
      "trace_success_cancel_window",
    )) {
      if (!successfulTraceCancelEffect(ability)) continue;
      const traceCost = costForTraceAbility(ability);
      if (!traceCost.tapSource && !traceCost.trashSource) continue;
      if (traceCost.tapSource && instance.tapped === true) continue;
      if (host.state.runner.credits < traceCost.creditCost) continue;
      candidates.push({
        cardId,
        definitionId: definition.id,
        label: definition.title,
        linkDelta: 0,
        creditCost: traceCost.creditCost,
        tapSource: traceCost.tapSource,
        trashSource: traceCost.trashSource,
        limitOncePerTrace: false,
        ...(badPublicityForCancelledTrace(ability) > 0
          ? {
              badPublicityIfCancelledTraceHasNonTagEffect:
                badPublicityForCancelledTrace(ability),
            }
          : {}),
      });
    }
  }
  return candidates;
}

function startTraceSuccessCancelChoice(
  host: TraceOrchestrationHost,
  trace: CurrentTrace,
): boolean {
  const candidates = traceSuccessCancelCandidates(host, trace);
  if (candidates.length === 0) return false;
  host.state.trace = { ...trace, status: "trace_success_cancel" };
  host.state.pendingChoice = {
    choiceId: `${trace.traceId}.success_cancel.${host.state.stateVersion + 1}`,
    side: "runner",
    source: `trace_success_cancel:${trace.traceId}`,
    prompt: "Trace-Erfolgseffekt canceln",
    kind: "select_option",
    options: [
      { id: "pass", label: "Trace-Effekt nicht canceln" },
      ...candidates.map((candidate) => ({
        id: `trace_success_cancel_${candidate.cardId}`,
        label: `${candidate.label}: Trace-Effekt canceln`,
        publicLabel: "Trace-Effekt canceln",
        value: candidate.cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "runner";
  return true;
}

function resolveTraceSuccessCancelChoice(
  host: TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = requireTracePhase(host.state, "trace_success_cancel");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected === "pass") {
    delete host.state.pendingChoice;
    if (!host.state.run) {
      completeTraceWithoutRun(
        host,
        { ...trace, status: "post_bid_link" },
        "post_bid_link",
        legalAction,
        { runnerLinkFallback: calculateRunnerLink(host) },
      );
      return;
    }
    host.run.applyPrintedTraceSuccessFollowups({
      trace: { ...trace, status: "post_bid_link" },
      traceStep: "post_bid_link",
      legalAction,
      runnerLinkFallback: calculateRunnerLink(host),
    });
    return;
  }
  const option = host.state.pendingChoice?.options.find(
    (candidate) => candidate.id === selected,
  );
  const cardId =
    typeof option?.value === "string"
      ? (option.value as CardInstanceId)
      : undefined;
  const candidate = traceSuccessCancelCandidates(host, trace).find(
    (item) => item.cardId === cardId,
  );
  if (!candidate) throw new Error("Diese Trace-Cancel-Quelle ist nicht legal.");
  if (host.state.runner.credits < candidate.creditCost)
    throw new Error("Der Runner kann die Trace-Cancel-Kosten nicht bezahlen.");
  host.payment.spendRunnerCredits(candidate.creditCost);
  const sourceCostPayload = payTraceSourceCost(
    host,
    candidate.cardId,
    candidate,
    legalAction,
  );
  const badPublicityAdded = traceEffectHasNonTagComponent(trace.successEffect)
    ? (candidate.badPublicityIfCancelledTraceHasNonTagEffect ?? 0)
    : 0;
  if (badPublicityAdded > 0) host.state.corp.badPublicity += badPublicityAdded;
  delete host.state.pendingChoice;
  delete host.state.trace;
  if (trace.returnTimingPoint && trace.returnActiveSide && trace.returnPhase) {
    host.state.timingPoint = trace.returnTimingPoint;
    host.state.activeSide = trace.returnActiveSide;
    host.state.phase = trace.returnPhase;
  } else if (host.state.run) {
    host.state.timingPoint = "run.encounter_ice";
    host.state.activeSide = "runner";
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "trace_success_cancel",
    sourceDefinitionId: candidate.definitionId,
    traceEffectCanceled: true,
    traceSuccessful: true,
    traceSuccessCancelCostPaid: candidate.creditCost,
    ...sourceCostPayload,
    ...(badPublicityAdded > 0
      ? {
          badPublicityAdded,
          corpBadPublicityAfter: host.state.corp.badPublicity,
        }
      : {}),
    runnerCreditsAfter: host.state.runner.credits,
  };
}

function traceEffectHasNonTagComponent(effect: TraceSuccessEffect): boolean {
  return !(
    effect.type === "add_tag" ||
    effect.type === "add_tags_by_trace_margin_over_runner_link"
  );
}

function successfulTraceCancelEffect(
  ability: ActivatedCardAbilityImplementation,
): CancelSuccessfulTraceEffectImplementation | undefined {
  const effects = ability.effects.filter(
    (effect): effect is CancelSuccessfulTraceEffectImplementation =>
      effect.kind === "cancel_successful_trace_effect",
  );
  if (effects.length > 1)
    throw new Error("Trace-Cancel-Fähigkeit enthält mehrere Cancel-Effekte.");
  return effects[0];
}

function badPublicityForCancelledTrace(
  ability: ActivatedCardAbilityImplementation,
): number {
  const effects = ability.effects.filter(
    (
      effect,
    ): effect is AddBadPublicityIfCancelledTraceHasNonTagEffectImplementation =>
      effect.kind === "add_bad_publicity_if_cancelled_trace_has_non_tag_effect",
  );
  if (effects.length > 1)
    throw new Error(
      "Trace-Cancel-Fähigkeit enthält mehrere Bad-Publicity-Folgen.",
    );
  const amount = effects[0]?.amount ?? 0;
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Trace-Cancel-Bad-Publicity ist ungültig.");
  return amount;
}

function runnerTraceLinkCredits(host: TraceOrchestrationHost): number {
  return host.payment
    .runnerTraceLinkCreditSourceIds()
    .reduce(
      (sum, cardId) => sum + host.payment.hostedPaymentCredits(cardId),
      0,
    );
}

function runnerTraceLinkPaymentSourceIds(
  host: TraceOrchestrationHost,
): CardInstanceId[] {
  return host.payment
    .runnerTraceLinkCreditSourceIds()
    .filter((cardId) => host.payment.hostedPaymentCredits(cardId) > 0);
}

function isRunnerBidPaymentChoice(choice: ChoiceRequest | undefined): boolean {
  return choice?.source.startsWith("trace_runner_bid_payment:") === true;
}

function openRunnerBidPaymentChoice(host: TraceOrchestrationHost): void {
  const { state } = host;
  const trace = requireTracePhase(state, "runner_bid");
  const selection = trace.runnerBidPaymentSelection;
  if (!selection)
    throw new Error("Es ist keine Runner-Trace-Zahlungswahl offen.");
  const sourceCardInstanceId =
    selection.sourceCardInstanceIds[selection.sourceIndex];
  if (!sourceCardInstanceId)
    throw new Error("Die Runner-Trace-Zahlungsquelle fehlt.");
  const sourceDefinition = host.cards.definitionFor(sourceCardInstanceId);
  const available = Math.max(
    0,
    Math.floor(host.payment.hostedPaymentCredits(sourceCardInstanceId)),
  );
  const selectedSoFar = selection.allocations.reduce(
    (sum, allocation) => sum + allocation.amount,
    0,
  );
  const remainingBid = Math.max(0, selection.bid - selectedSoFar);
  const futureSourceIds = selection.sourceCardInstanceIds.slice(
    selection.sourceIndex + 1,
  );
  const futureLinkCredits = futureSourceIds.reduce(
    (sum, cardId) =>
      sum + Math.max(0, Math.floor(host.payment.hostedPaymentCredits(cardId))),
    0,
  );
  const runnerCredits = Math.max(0, Math.floor(state.runner.credits));
  const maxAmount = Math.min(available, remainingBid);
  const options = Array.from({ length: maxAmount + 1 }, (_, amount) => amount)
    .filter(
      (amount) => remainingBid - amount <= runnerCredits + futureLinkCredits,
    )
    .map((amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Link-Bit${amount === 1 ? "" : "s"} (${selectedSoFar + amount}/${selection.bid} Gesamtbid)`,
      publicLabel: `${amount} Link-Bit${amount === 1 ? "" : "s"} (${selectedSoFar + amount}/${selection.bid} Gesamtbid)`,
      value: amount,
    }));
  if (options.length === 0)
    throw new Error("Der Runner kann den Link-Bid nicht bezahlen.");
  state.pendingChoice = {
    choiceId: `${trace.traceId}.runner.bid_payment.${sourceCardInstanceId}.${state.stateVersion + 1}`,
    side: "runner",
    source: `trace_runner_bid_payment:${trace.traceId}:${sourceCardInstanceId}`,
    prompt: `${sourceDefinition.title} fuer Runner Link-Bid nutzen (bisher ${selectedSoFar}/${selection.bid} Gesamtbid)`,
    kind: "bid_amount",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility:
      traceRulesDefinitionForTrace(trace).resolutionMode ===
      "hidden_commit_reveal"
        ? "hidden_info_barrier"
        : "public",
  };
  state.activeSide = "runner";
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

export function calculateRunnerLinkCore(host: TraceOrchestrationHost): number {
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

function costForTraceAbility(ability: ActivatedCardAbilityImplementation): {
  creditCost: number;
  tapSource: boolean;
  trashSource: boolean;
} {
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  const tapCosts = ability.costs.filter((cost) => cost.kind === "tap_source");
  const trashCosts = ability.costs.filter(
    (cost) => cost.kind === "trash_source",
  );
  if (
    ability.costs.length !==
      creditCosts.length + tapCosts.length + trashCosts.length ||
    creditCosts.length > 1 ||
    tapCosts.length + trashCosts.length > 1 ||
    (creditCosts.length === 0 &&
      tapCosts.length === 0 &&
      trashCosts.length === 0) ||
    !Number.isInteger(creditCosts[0]?.amount ?? 0) ||
    (creditCosts[0]?.amount ?? 0) < 0 ||
    (tapCosts[0] && tapCosts[0].amount !== 1) ||
    (trashCosts[0] && trashCosts[0].amount !== 1)
  ) {
    throw new Error(
      "Trace CardImplementation ability supports nonnegative credit and optional source costs.",
    );
  }
  return {
    creditCost: creditCosts[0]?.amount ?? 0,
    tapSource: tapCosts.length === 1,
    trashSource: trashCosts.length === 1,
  };
}

function payTraceSourceCost(
  host: TraceOrchestrationHost,
  cardId: CardInstanceId,
  candidate: Pick<TracePostBidLinkCandidate, "tapSource" | "trashSource">,
  legalAction: LegalAction,
): Record<string, string | number | boolean> {
  if (!candidate.tapSource && !candidate.trashSource) return {};
  const instance = host.state.cardInstances[cardId];
  if (!instance || instance.controller !== "runner")
    throw new Error("Die Trace-Quelle ist nicht installiert.");
  if (!host.cards.runnerInstalledCardIds().includes(cardId))
    throw new Error("Die Trace-Quelle ist nicht installiert.");
  if (candidate.tapSource && instance.tapped === true)
    throw new Error("Die Trace-Link-Quelle ist bereits getappt.");
  const payload = hiddenRunnerResourceRevealPayload(host.state, cardId);
  if (candidate.trashSource) {
    host.zones.trashRunnerInstalledCardToHeap(cardId, legalAction);
    return {
      ...payload,
      sourceTrashed: true,
      trashedCardDefinitionId: host.cards.definitionFor(cardId).id,
    };
  }
  host.state.cardInstances[cardId] = {
    ...instance,
    faceup: true,
    rezzed: true,
    tapped: true,
  };
  return {
    ...payload,
    sourceTapped: true,
    cardImplementationTapSourceCost: true,
  };
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
