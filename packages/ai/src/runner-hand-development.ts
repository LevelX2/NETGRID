import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";

export const RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION =
  "runner-hand-development-evaluation-v1" as const;

export type RunnerHandDevelopmentAvailability =
  | "legal_now"
  | "missing_credits"
  | "missing_mu"
  | "timing_blocked"
  | "not_relevant_now";

export type RunnerHandDevelopmentRole =
  | "access_payoff"
  | "breaker_or_rig_piece"
  | "memory_support"
  | "economy_engine"
  | "bank_tool"
  | "draw_or_search_engine"
  | "defense_support"
  | "run_event"
  | "duplicate_or_low_value"
  | "unknown";

export type RunnerHandDevelopmentStrategicFit =
  | "strong"
  | "medium"
  | "weak"
  | "blocked";

export type RunnerHandDevelopmentCurrentNeed =
  | "acute"
  | "useful_now"
  | "setup"
  | "later"
  | "none";

export type RunnerHandDevelopmentDeferReason =
  | "none"
  | "missing_credits"
  | "missing_mu"
  | "no_current_need"
  | "duplicate"
  | "timing"
  | "preserve_credit_floor"
  | "stronger_override";

export type RunnerHandDevelopmentFundingNeed = {
  installOrPlayCost: number;
  missingCredits: number;
  reason: "cannot_pay" | "would_break_floor" | "would_break_run_reserve";
};

export type RunnerHandDevelopmentEvaluation = {
  schemaVersion: typeof RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION;
  cardInstanceId: string;
  definitionId?: string;
  title?: string;
  cardType?: VisibleCard["type"];
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  priority: number;
  fundingNeed?: RunnerHandDevelopmentFundingNeed;
  deferReason: RunnerHandDevelopmentDeferReason;
  legalActionId?: string;
  evidence: string[];
};

export type EvaluateRunnerHandDevelopmentParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  actionCandidates?: readonly ActionSemanticCandidate[];
};

type CardSignals = {
  text: string;
  roles: string[];
  planRoles: string[];
  candidateSignals: string[];
};

type CardContext = {
  card: VisibleCard;
  legalAction?: LegalAction;
  matchingCandidates: ActionSemanticCandidate[];
  signals: CardSignals;
  currentCredits: number;
  installOrPlayCost?: number;
  memoryCost?: number;
  memoryAvailable?: number;
  duplicateInstalled: boolean;
};

const AI_HINTS = createAiHintsByCard();

export function evaluateRunnerHandDevelopment(
  params: EvaluateRunnerHandDevelopmentParams,
): RunnerHandDevelopmentEvaluation[] {
  if (params.input.side !== "runner") return [];
  return params.input.playerView.own.gripOrHq
    .filter((card) => card.known !== false)
    .map((card) => evaluateHandCard(params, card))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.developmentRole.localeCompare(right.developmentRole) ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    );
}

export function redactedRunnerHandDevelopmentFacts(
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): string[] {
  return evaluations.slice(0, 10).map((evaluation) =>
    [
      `runner_hand_development:${evaluation.developmentRole}`,
      `availability:${evaluation.availability}`,
      `need:${evaluation.currentNeed}`,
      `fit:${evaluation.strategicFit}`,
      `priority:${evaluation.priority}`,
      ...(evaluation.fundingNeed
        ? [`missing_credits:${evaluation.fundingNeed.missingCredits}`]
        : []),
      `defer:${evaluation.deferReason}`,
    ].join("|"),
  );
}

function evaluateHandCard(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
): RunnerHandDevelopmentEvaluation {
  const context = buildCardContext(params, card);
  const developmentRole = roleForCard(context);
  const availability = availabilityForCard(context, developmentRole);
  const currentNeed = currentNeedForCard(params, context, developmentRole);
  const strategicFit = strategicFitForCard(
    params.strategicIntent,
    availability,
    developmentRole,
    currentNeed,
  );
  const fundingNeed = fundingNeedForCard(params.input, context, availability);
  const deferReason = deferReasonForCard(
    availability,
    developmentRole,
    currentNeed,
  );
  const priority = priorityForCard({
    availability,
    developmentRole,
    strategicFit,
    currentNeed,
  });

  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: card.instanceId,
    ...(card.definitionId ? { definitionId: card.definitionId } : {}),
    ...(card.title ? { title: card.title } : {}),
    ...(card.type ? { cardType: card.type } : {}),
    availability,
    developmentRole,
    strategicFit,
    currentNeed,
    priority,
    ...(fundingNeed ? { fundingNeed } : {}),
    deferReason,
    ...(context.legalAction ? { legalActionId: context.legalAction.actionId } : {}),
    evidence: redactedEvidenceForCard({
      context,
      developmentRole,
      availability,
      strategicFit,
      currentNeed,
      ...(fundingNeed ? { fundingNeed } : {}),
    }),
  };
}

function buildCardContext(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
): CardContext {
  const matchingCandidates = (params.actionCandidates ?? []).filter((candidate) =>
    candidateMatchesCard(candidate, card),
  );
  const legalAction =
    params.input.legalActions.find((action) => actionMatchesCard(action, card)) ??
    matchingCandidates
      .map((candidate) =>
        params.input.legalActions.find(
          (action) => action.actionId === candidate.actionId,
        ),
      )
      .find((action): action is LegalAction => action !== undefined);
  const signals = signalsForCard(card, matchingCandidates);
  const actionCost =
    legalAction !== undefined ? actionCreditCost(legalAction) : undefined;
  const installOrPlayCost =
    actionCost ?? visibleOrRuntimeNumber(card, "installCost") ??
    visibleOrRuntimeNumber(card, "cost");
  const memoryCost = visibleOrRuntimeNumber(card, "memoryCost");
  const memoryAvailable = memoryAvailableFor(params);
  const duplicateInstalled = card.definitionId !== undefined &&
    (params.input.playerView.own.rig ?? []).some(
      (installed) => installed.definitionId === card.definitionId,
    );

  return {
    card,
    ...(legalAction ? { legalAction } : {}),
    matchingCandidates,
    signals,
    currentCredits: params.input.playerView.own.credits,
    ...(installOrPlayCost !== undefined ? { installOrPlayCost } : {}),
    ...(memoryCost !== undefined ? { memoryCost } : {}),
    ...(memoryAvailable !== undefined ? { memoryAvailable } : {}),
    duplicateInstalled,
  };
}

function signalsForCard(
  card: VisibleCard,
  candidates: readonly ActionSemanticCandidate[],
): CardSignals {
  const definition = card.definitionId ? runtimeDefinition(card.definitionId) : undefined;
  const hint = card.definitionId ? AI_HINTS.get(card.definitionId) : undefined;
  const roleRecord = card.definitionId
    ? CARD_ROLES_BY_CARD.get(card.definitionId)
    : undefined;
  const roles = sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
  ]);
  const planRoles = sortedUnique([...(hint?.planRoles ?? [])]);
  const candidateSignals = sortedUnique(
    candidates.flatMap((candidate) => [
      candidate.semanticActionType,
      ...candidate.cardContextSignals,
      ...candidate.actionTacticSignals,
      ...candidate.strategySupport.map((support) => support.role),
      ...candidate.strategySupport.map((support) => support.strategyId),
    ]),
  );
  const text = [
    card.title,
    card.definitionId,
    card.type,
    ...(card.subtypes ?? []),
    card.rulesText,
    definition?.title,
    definition?.type,
    ...(definition?.subtypes ?? []),
    definition?.text,
    ...roles,
    ...planRoles,
    ...candidateSignals,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
  return { text, roles, planRoles, candidateSignals };
}

function roleForCard(context: CardContext): RunnerHandDevelopmentRole {
  const text = context.signals.text;
  if (context.duplicateInstalled && !looksRepeatUseful(text)) {
    return "duplicate_or_low_value";
  }
  if (looksLikeMemorySupport(context.card, text)) return "memory_support";
  if (looksLikeBreaker(context.card, text)) return "breaker_or_rig_piece";
  if (looksLikeBankTool(text)) return "bank_tool";
  if (looksLikeEconomyTool(text)) return "economy_engine";
  if (looksLikeDrawOrSearch(text)) return "draw_or_search_engine";
  if (looksLikeDefense(text)) return "defense_support";
  if (looksLikeAccessPayoff(text)) return "access_payoff";
  if (looksLikeRunEvent(context.card, text)) return "run_event";
  if (context.duplicateInstalled) return "duplicate_or_low_value";
  return "unknown";
}

function availabilityForCard(
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentAvailability {
  if (context.legalAction) return "legal_now";
  if (role === "duplicate_or_low_value" || role === "unknown") {
    return "not_relevant_now";
  }
  if (memoryBlocked(context)) return "missing_mu";
  if (
    context.installOrPlayCost !== undefined &&
    context.installOrPlayCost > 0 &&
    context.installOrPlayCost > context.currentCredits
  ) {
    return "missing_credits";
  }
  if (looksPotentiallyPlayable(context.card, context.signals.text)) {
    return "timing_blocked";
  }
  return "not_relevant_now";
}

function currentNeedForCard(
  params: EvaluateRunnerHandDevelopmentParams,
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentCurrentNeed {
  const intent = params.strategicIntent;
  const credits = params.input.playerView.own.credits;
  switch (role) {
    case "memory_support":
      return params.deckCapabilities?.runner?.memoryProfile.missingMemoryPressure ||
        context.memoryAvailable === 0
        ? "acute"
        : intent?.setupEngine.includes("runner.rig_first") === true
          ? "useful_now"
          : "setup";
    case "breaker_or_rig_piece":
      return runnerNeedsCoverageFromHand(params.deckCapabilities)
        ? "acute"
        : intent?.setupEngine.includes("runner.rig_first") === true ||
            intent?.setupEngine.includes("runner.search_breaker_setup") === true
          ? "useful_now"
          : "setup";
    case "economy_engine":
    case "bank_tool":
      return credits <= 2
        ? "acute"
        : intent?.setupEngine.includes("runner.economy_setup_before_pressure") === true
          ? "useful_now"
          : "setup";
    case "draw_or_search_engine":
      return intent?.setupEngine.includes("runner.draw_or_search_setup") === true ||
        intent?.setupEngine.includes("runner.search_breaker_setup") === true
        ? "useful_now"
        : "setup";
    case "access_payoff":
      return intentHasPressure(intent) ? "useful_now" : "setup";
    case "run_event":
      return intent?.executionStyle === "runner.run_event_tempo"
        ? "useful_now"
        : intentHasPressure(intent)
          ? "setup"
          : "later";
    case "defense_support":
      return visibleRunnerThreat(params.input) ? "acute" : "none";
    case "duplicate_or_low_value":
    case "unknown":
      return context.legalAction ? "later" : "none";
  }
}

function strategicFitForCard(
  intent: RunnerStrategicIntentProfile | undefined,
  availability: RunnerHandDevelopmentAvailability,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
): RunnerHandDevelopmentStrategicFit {
  if (availability === "missing_credits" || availability === "missing_mu") {
    return currentNeed === "acute" || currentNeed === "useful_now"
      ? "blocked"
      : "medium";
  }
  if (role === "duplicate_or_low_value" || role === "unknown") return "weak";
  if (currentNeed === "none") return "weak";
  if (roleMatchesStrategicIntent(role, intent)) return "strong";
  if (currentNeed === "acute" || currentNeed === "useful_now") return "strong";
  if (currentNeed === "setup") return "medium";
  return "weak";
}

function fundingNeedForCard(
  input: AiDecisionInput,
  context: CardContext,
  availability: RunnerHandDevelopmentAvailability,
): RunnerHandDevelopmentFundingNeed | undefined {
  if (availability !== "missing_credits") return undefined;
  const installOrPlayCost = context.installOrPlayCost;
  if (installOrPlayCost === undefined) return undefined;
  return {
    installOrPlayCost,
    missingCredits: Math.max(0, installOrPlayCost - input.playerView.own.credits),
    reason: "cannot_pay",
  };
}

function deferReasonForCard(
  availability: RunnerHandDevelopmentAvailability,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
): RunnerHandDevelopmentDeferReason {
  if (role === "duplicate_or_low_value") return "duplicate";
  if (availability === "missing_credits") return "missing_credits";
  if (availability === "missing_mu") return "missing_mu";
  if (availability === "timing_blocked") return "timing";
  if (currentNeed === "none") return "no_current_need";
  return "none";
}

function priorityForCard(params: {
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
}): number {
  return clampPriority(
    rolePriority(params.developmentRole) +
      availabilityPriority(params.availability) +
      fitPriority(params.strategicFit) +
      needPriority(params.currentNeed),
  );
}

function redactedEvidenceForCard(params: {
  context: CardContext;
  developmentRole: RunnerHandDevelopmentRole;
  availability: RunnerHandDevelopmentAvailability;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  fundingNeed?: RunnerHandDevelopmentFundingNeed;
}): string[] {
  return [
    "source:own_runner_hand",
    `card_type:${params.context.card.type ?? "unknown"}`,
    `hand_role:${params.developmentRole}`,
    `availability:${params.availability}`,
    `strategic_fit:${params.strategicFit}`,
    `current_need:${params.currentNeed}`,
    `legal_action_present:${params.context.legalAction !== undefined}`,
    `matching_action_candidates:${params.context.matchingCandidates.length}`,
    `duplicate_installed:${params.context.duplicateInstalled}`,
    ...(params.context.memoryAvailable !== undefined
      ? [`memory_available:${params.context.memoryAvailable}`]
      : []),
    ...(params.context.memoryCost !== undefined
      ? [`memory_cost:${params.context.memoryCost}`]
      : []),
    ...(params.fundingNeed
      ? [
          `funding_missing_credits:${params.fundingNeed.missingCredits}`,
          `funding_reason:${params.fundingNeed.reason}`,
        ]
      : []),
  ];
}

function actionMatchesCard(action: LegalAction, card: VisibleCard): boolean {
  if (action.side !== "runner") return false;
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  const payload = action.payload ?? {};
  return (
    action.source === card.instanceId ||
    payload.cardId === card.instanceId ||
    payload.sourceCardId === card.instanceId ||
    payload.sourceDefinitionId === card.definitionId ||
    payload.cardDefinitionId === card.definitionId ||
    payload.targetCardDefinitionId === card.definitionId ||
    (card.title !== undefined &&
      action.label.toLowerCase().includes(card.title.toLowerCase()))
  );
}

function candidateMatchesCard(
  candidate: ActionSemanticCandidate,
  card: VisibleCard,
): boolean {
  return (
    candidate.actorSide === "runner" &&
    (candidate.sourceCardId === card.instanceId ||
      candidate.sourceCardId === card.definitionId ||
      candidate.legalActionRef.actionId === card.instanceId)
  );
}

function actionCreditCost(action: LegalAction): number | undefined {
  const values = action.costs
    .map((cost) => cost.credits)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function visibleOrRuntimeNumber(
  card: VisibleCard,
  key: "installCost" | "cost" | "memoryCost",
): number | undefined {
  const visibleValue = card[key];
  if (typeof visibleValue === "number") return visibleValue;
  if (!card.definitionId) return undefined;
  const runtimeValue = runtimeDefinition(card.definitionId)?.numeric?.[key];
  return typeof runtimeValue === "number" ? runtimeValue : undefined;
}

type RuntimeCardInfo = {
  title?: string;
  type?: string;
  subtypes?: readonly string[];
  text?: string;
  numeric?: Partial<Record<"installCost" | "cost" | "memoryCost", number | null>>;
};

function runtimeDefinition(cardId: string): RuntimeCardInfo | undefined {
  return RUNTIME_CARDS[cardId] as RuntimeCardInfo | undefined;
}

function memoryAvailableFor(
  params: EvaluateRunnerHandDevelopmentParams,
): number | undefined {
  const deckCapabilityMemory =
    params.deckCapabilities?.runner?.memoryProfile.memoryAvailable;
  if (deckCapabilityMemory !== undefined) return deckCapabilityMemory;
  const used = params.input.playerView.own.memoryUsed;
  const limit = params.input.playerView.own.memoryLimit;
  if (used === undefined || limit === undefined) return undefined;
  return Math.max(0, limit - used);
}

function memoryBlocked(context: CardContext): boolean {
  return (
    context.memoryCost !== undefined &&
    context.memoryCost > 0 &&
    context.memoryAvailable !== undefined &&
    context.memoryCost > context.memoryAvailable
  );
}

function looksLikeBreaker(card: VisibleCard, text: string): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      /breaker|icebreaker|fracter|decoder|killer/i.test(subtype),
    ) ||
      /breaker|icebreaker|fracter|decoder|killer|break .*subroutine/.test(text))
  );
}

function looksLikeMemorySupport(card: VisibleCard, text: string): boolean {
  return (
    card.memoryLimitBonus !== undefined ||
    /memory_support|memory|mem chip|\bmu\b/.test(text)
  );
}

function looksLikeBankTool(text: string): boolean {
  return /bank_tool|broker|bank|stored credits|counter_bank|temporary_resource_bank/.test(
    text,
  );
}

function looksLikeEconomyTool(text: string): boolean {
  return /economy|gain .*credit|gain credits|credit|bits|loan|savings/.test(text);
}

function looksLikeDrawOrSearch(text: string): boolean {
  return /draw_or_search|setup\.draw|setup\.search|search|draw|tutor/.test(text);
}

function looksLikeDefense(text: string): boolean {
  return /defense|prevent .*damage|damage prevention|net damage|meat damage|tag|remove .*tag|link|hand size/.test(
    text,
  );
}

function looksLikeAccessPayoff(text: string): boolean {
  return /access_payoff|multiaccess|interface|access|r&d|rd pressure|hq pressure|trash support|remote_contest/.test(
    text,
  );
}

function looksLikeRunEvent(card: VisibleCard, text: string): boolean {
  return card.type === "event" && /run|bypass|access|jack out|approach/.test(text);
}

function looksRepeatUseful(text: string): boolean {
  return /counter|temporary|virus|recurring|multiaccess|memory/.test(text);
}

function looksPotentiallyPlayable(card: VisibleCard, text: string): boolean {
  return (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource" ||
    card.type === "event" ||
    /install|play|trigger|action/.test(text)
  );
}

function runnerNeedsCoverageFromHand(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const matrix = deckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return false;
  return Object.values(matrix).some((state) => state.inHand && !state.installed);
}

function roleMatchesStrategicIntent(
  role: RunnerHandDevelopmentRole,
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  if (!intent) return false;
  if (
    (role === "breaker_or_rig_piece" || role === "memory_support") &&
    (intent.setupEngine.includes("runner.rig_first") ||
      intent.setupEngine.includes("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "economy_engine" || role === "bank_tool") &&
    intent.setupEngine.includes("runner.economy_setup_before_pressure")
  ) {
    return true;
  }
  if (
    role === "draw_or_search_engine" &&
    (intent.setupEngine.includes("runner.draw_or_search_setup") ||
      intent.setupEngine.includes("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "access_payoff" || role === "run_event") &&
    (intentHasPressure(intent) || intent.executionStyle === "runner.run_event_tempo")
  ) {
    return true;
  }
  return false;
}

function intentHasPressure(
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  return (intent?.pressureVectors.length ?? 0) > 0;
}

function visibleRunnerThreat(input: AiDecisionInput): boolean {
  return (
    (input.playerView.own.tags ?? 0) > 0 ||
    input.playerView.servers.some((server) =>
      server.root.some(
        (card) =>
          card.known &&
          /damage|tag|flatline|trace/i.test(
            [card.title, card.rulesText, card.definitionId]
              .filter(Boolean)
              .join(" "),
          ),
      ),
    )
  );
}

function rolePriority(role: RunnerHandDevelopmentRole): number {
  switch (role) {
    case "breaker_or_rig_piece":
      return 700;
    case "memory_support":
      return 680;
    case "bank_tool":
      return 650;
    case "economy_engine":
      return 640;
    case "access_payoff":
      return 620;
    case "run_event":
      return 580;
    case "draw_or_search_engine":
      return 560;
    case "defense_support":
      return 420;
    case "duplicate_or_low_value":
      return 120;
    case "unknown":
      return 80;
  }
}

function availabilityPriority(
  availability: RunnerHandDevelopmentAvailability,
): number {
  switch (availability) {
    case "legal_now":
      return 90;
    case "missing_credits":
      return -80;
    case "missing_mu":
      return -120;
    case "timing_blocked":
      return -70;
    case "not_relevant_now":
      return -190;
  }
}

function fitPriority(fit: RunnerHandDevelopmentStrategicFit): number {
  switch (fit) {
    case "strong":
      return 120;
    case "medium":
      return 40;
    case "blocked":
      return -20;
    case "weak":
      return -90;
  }
}

function needPriority(need: RunnerHandDevelopmentCurrentNeed): number {
  switch (need) {
    case "acute":
      return 180;
    case "useful_now":
      return 110;
    case "setup":
      return 50;
    case "later":
      return -50;
    case "none":
      return -170;
  }
}

function clampPriority(value: number): number {
  return Math.max(0, Math.min(1000, value));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
