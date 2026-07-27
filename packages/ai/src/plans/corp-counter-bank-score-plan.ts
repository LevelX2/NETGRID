import {
  CARD_DEFINITIONS_BY_ID,
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type VisibleCard,
  type VisibleCorpCounterBankPreparationQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { corpSameTurnScoreConversionPaths } from "./tactical-plan-corp-score-conversion";
import { corpRemoteContestabilityAssessment } from "./tactical-plan-corp-score-window";
import type { CorpScoreProjectSignal } from "./corp-core-plan-modules";

type InstalledCounterBank = {
  card: VisibleCard;
  quote: VisibleCorpCounterBankPreparationQuote;
  serverId: string;
};

/**
 * Builds narrow score-plan projects for Engine-certified counter banks. The
 * source quote proves only the card capability. Every resulting head remains
 * an exact current LegalAction and is revalidated by the normal planner.
 */
export function corpCounterBankScoreProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpScoreProjectSignal[] {
  if (!isCorpMainActionWindow(input)) return [];

  const installed = installedCounterBanks(input);
  return [
    ...counterBankHandoffProjects(input, candidates, installed),
    ...counterBankLiquidationProjects(input, candidates, installed),
    ...counterBankAdvanceProjects(input, candidates, installed),
    ...counterBankInstallProjects(input, candidates, installed),
  ];
}

/**
 * A counter-bank quote means this card must never be treated as an arbitrary
 * one-click HQ-overflow conversion. Its installation is owned exclusively by
 * the score plan above.
 */
export function isQuotedCorpCounterBankInHq(
  input: AiDecisionInput,
  card: VisibleCard | undefined,
): boolean {
  return (
    card !== undefined &&
    counterBankQuoteForCard(input, card, "corp_hq") !== undefined
  );
}

function counterBankInstallProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  installed: readonly InstalledCounterBank[],
): CorpScoreProjectSignal[] {
  if (installed.length > 0) return [];
  const counterTarget = counterBankTargetFromKnownDeck(input);
  if (counterTarget === undefined) return [];
  return input.playerView.own.gripOrHq.flatMap((card) => {
    const quote = counterBankQuoteForCard(input, card, "corp_hq");
    if (!quote || !card.definitionId) return [];
    return candidates.flatMap((candidate) => {
      const serverId = exactRootInstallTarget(
        input,
        candidate,
        card.instanceId,
      );
      if (!serverId || !counterBankRemoteIsSecure(input, serverId)) return [];
      return [
        counterBankProject({
          projectId: `counter-bank:install:${card.instanceId}:${serverId}`,
          sourceCard: card,
          sourceServerId: serverId,
          quote,
          counterTarget,
          actionIds: [candidate.actionId],
          phase: "install_counter_bank",
          evidenceCode: `engine_certified_counter_bank_install_in_secure_remote:${card.instanceId}:${serverId}:target_${counterTarget}`,
        }),
      ];
    });
  });
}

function counterBankAdvanceProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  installed: readonly InstalledCounterBank[],
): CorpScoreProjectSignal[] {
  const counterTarget = counterBankTargetFromKnownDeck(input);
  if (counterTarget === undefined) return [];
  return installed.flatMap(({ card, quote, serverId }) => {
    if (
      quote.advancementCounters >= counterTarget ||
      !counterBankRemoteIsSecure(input, serverId)
    ) {
      return [];
    }
    const advance = candidates.find(
      (candidate) =>
        candidate.semanticActionType === "score.advance_card" &&
        candidate.actionType === "advance_card" &&
        candidate.sourceCardInstanceId === card.instanceId &&
        candidate.sourceDefinitionId === card.definitionId,
    );
    if (!advance) return [];
    return [
      counterBankProject({
        projectId: `counter-bank:build:${card.instanceId}:${serverId}`,
        sourceCard: card,
        sourceServerId: serverId,
        quote,
        counterTarget,
        actionIds: [advance.actionId],
        phase: "advance_counter_bank",
        evidenceCode: `engine_certified_counter_bank_build_in_secure_remote:${card.instanceId}:${serverId}:${quote.advancementCounters}/${counterTarget}`,
      }),
    ];
  });
}

function counterBankHandoffProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  installed: readonly InstalledCounterBank[],
): CorpScoreProjectSignal[] {
  return [
    ...installed.flatMap((bank) =>
      counterBankAgendaInstallProjects(input, candidates, bank),
    ),
    ...installed.flatMap((bank) =>
      counterBankHandoffRezProjects(input, candidates, bank),
    ),
  ];
}

function counterBankAgendaInstallProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  bank: InstalledCounterBank,
): CorpScoreProjectSignal[] {
  if (!counterBankRemoteIsSecure(input, bank.serverId)) return [];
  return input.playerView.own.gripOrHq.flatMap((agenda) => {
    const requirement = agendaAdvancementRequirement(agenda);
    if (
      !isKnownAgenda(agenda) ||
      requirement === undefined ||
      bank.quote.advancementCounters < requirement
    ) {
      return [];
    }
    return candidates.flatMap((candidate) => {
      const serverId = exactRootInstallTarget(
        input,
        candidate,
        agenda.instanceId,
      );
      if (serverId !== bank.serverId) return [];
      const installAction = exactCurrentLegalAction(input, candidate.actionId);
      if (!installAction) return [];
      const rezAction = bank.card.rezzed
        ? undefined
        : exactCounterBankRezAction(input, bank.card.instanceId);
      if (!bank.card.rezzed && !rezAction) return [];
      const requiredCredits =
        legalActionCost(installAction, "credits") +
        (rezAction ? legalActionCost(rezAction, "credits") : 0);
      const requiredClicks =
        legalActionCost(installAction, "clicks") +
        bank.quote.transfer.actionCost;
      if (
        input.playerView.own.credits < requiredCredits ||
        input.playerView.own.clicks < requiredClicks
      ) {
        return [];
      }
      const agendaPoints = agenda.agendaPoints ?? 0;
      return [
        {
          ...counterBankProject({
            projectId: `counter-bank:handoff:${bank.card.instanceId}:${agenda.instanceId}:${bank.serverId}`,
            sourceCard: bank.card,
            sourceServerId: bank.serverId,
            quote: bank.quote,
            counterTarget: requirement,
            actionIds: [candidate.actionId],
            phase: "install_agenda_from_counter_bank",
            evidenceCode: `engine_certified_counter_bank_same_turn_handoff:${bank.card.instanceId}:${agenda.instanceId}:${bank.serverId}`,
          }),
          agendaDefinitionId: agenda.definitionId ?? agenda.instanceId,
          agendaPoints,
          agendaInstanceId: agenda.instanceId,
          sameTurnCloseout: true,
          terminalScore:
            input.playerView.own.agendaPoints + agendaPoints >=
            input.playerView.agendaPointsToWin,
        },
      ];
    });
  });
}

function counterBankHandoffRezProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  bank: InstalledCounterBank,
): CorpScoreProjectSignal[] {
  if (bank.card.rezzed || !counterBankRemoteIsSecure(input, bank.serverId))
    return [];
  const rez = candidates.find(
    (candidate) =>
      candidate.semanticActionType === "corp_window.rez" &&
      candidate.sourceCardInstanceId === bank.card.instanceId &&
      candidate.sourceDefinitionId === bank.card.definitionId,
  );
  if (!rez || input.playerView.own.clicks < bank.quote.transfer.actionCost)
    return [];
  const agenda = input.playerView.servers
    .find((server) => server.id === bank.serverId)
    ?.root.find((card) => {
      const requirement = agendaAdvancementRequirement(card);
      return (
        isKnownAgenda(card) &&
        requirement !== undefined &&
        bank.quote.advancementCounters >=
          Math.max(0, requirement - (card.advancementCounters ?? 0))
      );
    });
  if (!agenda) return [];
  const remaining = Math.max(
    0,
    (agendaAdvancementRequirement(agenda) ?? 0) -
      (agenda.advancementCounters ?? 0),
  );
  if (remaining <= 0) return [];
  return [
    {
      ...counterBankProject({
        projectId: `counter-bank:rez-handoff:${bank.card.instanceId}:${agenda.instanceId}:${bank.serverId}`,
        sourceCard: bank.card,
        sourceServerId: bank.serverId,
        quote: bank.quote,
        counterTarget: remaining,
        actionIds: [rez.actionId],
        phase: "rez_counter_bank_for_handoff",
        evidenceCode: `engine_certified_counter_bank_rez_for_same_turn_handoff:${bank.card.instanceId}:${agenda.instanceId}:${bank.serverId}`,
      }),
      agendaDefinitionId: agenda.definitionId ?? agenda.instanceId,
      agendaPoints: agenda.agendaPoints ?? 0,
      agendaInstanceId: agenda.instanceId,
      sameTurnCloseout: true,
      terminalScore:
        input.playerView.own.agendaPoints + (agenda.agendaPoints ?? 0) >=
        input.playerView.agendaPointsToWin,
    },
  ];
}

function counterBankLiquidationProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  installed: readonly InstalledCounterBank[],
): CorpScoreProjectSignal[] {
  return installed.flatMap((bank) => {
    if (
      bank.quote.advancementCounters <
        bank.quote.cashout.advancementCounterCost ||
      counterBankRemoteIsSecure(input, bank.serverId) ||
      counterBankHasCurrentScoreHandoff(input, bank.card.instanceId)
    ) {
      return [];
    }
    const cashout = candidates.find(
      (candidate) =>
        candidate.semanticActionType === "economy.gain_credit" &&
        candidate.sourceCardInstanceId === bank.card.instanceId &&
        candidate.sourceDefinitionId === bank.card.definitionId &&
        candidate.actionType === "activated_card_ability" &&
        exactCounterBankCashoutAction(
          input,
          candidate.actionId,
          bank.card.instanceId,
        ),
    );
    if (cashout) {
      return [
        counterBankProject({
          projectId: `counter-bank:liquidate:${bank.card.instanceId}:${bank.serverId}`,
          sourceCard: bank.card,
          sourceServerId: bank.serverId,
          quote: bank.quote,
          counterTarget: 0,
          actionIds: [cashout.actionId],
          phase: "liquidate_counter_bank",
          deadlinePressure: true,
          evidenceCode: `engine_certified_counter_bank_liquidation_after_remote_safety_lost:${bank.card.instanceId}:${bank.serverId}`,
        }),
      ];
    }
    if (bank.card.rezzed) return [];
    const rez = candidates.find(
      (candidate) =>
        candidate.semanticActionType === "corp_window.rez" &&
        candidate.sourceCardInstanceId === bank.card.instanceId &&
        candidate.sourceDefinitionId === bank.card.definitionId,
    );
    return rez
      ? [
          counterBankProject({
            projectId: `counter-bank:rez-liquidation:${bank.card.instanceId}:${bank.serverId}`,
            sourceCard: bank.card,
            sourceServerId: bank.serverId,
            quote: bank.quote,
            counterTarget: 0,
            actionIds: [rez.actionId],
            phase: "rez_counter_bank_for_liquidation",
            deadlinePressure: true,
            evidenceCode: `engine_certified_counter_bank_rez_for_liquidation_after_remote_safety_lost:${bank.card.instanceId}:${bank.serverId}`,
          }),
        ]
      : [];
  });
}

function counterBankProject(params: {
  projectId: string;
  sourceCard: VisibleCard;
  sourceServerId: string;
  quote: VisibleCorpCounterBankPreparationQuote;
  counterTarget: number;
  actionIds: string[];
  phase: CorpScoreProjectSignal["phase"];
  deadlinePressure?: boolean;
  evidenceCode: string;
}): CorpScoreProjectSignal {
  const definitionId = params.sourceCard.definitionId;
  if (!definitionId) throw new Error("Counter-bank source must be known.");
  return {
    projectId: params.projectId,
    agendaPoints: 0,
    actionIds: params.actionIds,
    phase: params.phase,
    sameTurnCloseout: false,
    ...(params.deadlinePressure ? { deadlinePressure: true } : {}),
    counterBank: {
      sourceCardInstanceId: params.sourceCard.instanceId,
      sourceDefinitionId: definitionId,
      serverId: params.sourceServerId,
      advancementCounters: params.quote.advancementCounters,
      counterTarget: params.counterTarget,
      quoteStateVersion: params.quote.expiresAtStateVersion,
    },
    terminalScore: false,
    feasible: true,
    evidenceCode: params.evidenceCode,
  };
}

function installedCounterBanks(input: AiDecisionInput): InstalledCounterBank[] {
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) => {
      const quote = counterBankQuoteForCard(
        input,
        card,
        "installed_root",
        server.id,
      );
      return quote ? [{ card, quote, serverId: server.id }] : [];
    }),
  );
}

function counterBankQuoteForCard(
  input: AiDecisionInput,
  card: VisibleCard,
  expectedLocation: "corp_hq" | "installed_root",
  expectedServerId?: string,
): VisibleCorpCounterBankPreparationQuote | undefined {
  const quote = card.counterBankPreparationQuote;
  if (
    !card.known ||
    !card.definitionId ||
    quote?.schemaVersion !==
      CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION ||
    quote.context !== "corp_counter_bank_preparation" ||
    quote.sourceCardId !== card.instanceId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(quote.advancementCounters) ||
    quote.advancementCounters < 0 ||
    quote.advancementCounters !== Math.max(0, card.advancementCounters ?? 0) ||
    quote.advanceableBeforeRez !== true ||
    quote.activatedAbilitiesRequireRez !== true ||
    quote.cashout.advancementCounterCost !== 1 ||
    quote.cashout.creditGain !== 1 ||
    quote.cashout.actionCost !== 0 ||
    quote.transfer.actionCost !== 1 ||
    quote.transfer.minimumSourceCounters !== 1 ||
    quote.transfer.source !== "source_card" ||
    quote.transfer.target !== "chosen_installed_advanceable_card" ||
    quote.transfer.maximum !== "all" ||
    (expectedLocation === "corp_hq"
      ? quote.location.kind !== "corp_hq"
      : quote.location.kind !== "installed_root" ||
        quote.location.serverId !== expectedServerId)
  ) {
    return undefined;
  }
  return quote;
}

function counterBankTargetFromKnownDeck(
  input: AiDecisionInput,
): number | undefined {
  const visibleHqRequirements = input.playerView.own.gripOrHq
    .map(agendaAdvancementRequirement)
    .filter((value): value is number => value !== undefined);
  const deckRequirements = (
    (input as AiDecisionInputWithDeckCapabilities).ownDeckSnapshot?.cards ?? []
  ).flatMap((entry) => {
    const definition = CARD_DEFINITIONS_BY_ID[entry.cardId];
    const requirement = definition?.advancementRequirement;
    return definition?.side === "corp" &&
      definition.type === "agenda" &&
      typeof requirement === "number" &&
      requirement > 0
      ? [requirement]
      : [];
  });
  const requirements =
    visibleHqRequirements.length > 0 ? visibleHqRequirements : deckRequirements;
  return requirements.length > 0 ? Math.min(...requirements) : undefined;
}

function counterBankRemoteIsSecure(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  if (!serverId.startsWith("remote_")) return false;
  const assessment = corpRemoteContestabilityAssessment(input, serverId);
  return (
    assessment !== undefined &&
    assessment.assessedKnownIceCount > 0 &&
    assessment.contestable === false &&
    assessment.canReachAccess === false
  );
}

function counterBankHasCurrentScoreHandoff(
  input: AiDecisionInput,
  sourceCardId: string,
): boolean {
  return corpSameTurnScoreConversionPaths(input).some(
    (path) => (path.reservedAdvancementCounters[sourceCardId] ?? 0) > 0,
  );
}

function exactRootInstallTarget(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCardId: string,
): string | undefined {
  const action = exactCurrentLegalAction(input, candidate.actionId);
  const serverId = action?.payload?.serverId;
  return candidate.semanticActionType === "install.card" &&
    candidate.sourceCardInstanceId === sourceCardId &&
    action?.type === "install_card" &&
    action.source === sourceCardId &&
    action.payload?.cardId === sourceCardId &&
    action.payload?.placement === "root" &&
    typeof serverId === "string" &&
    input.playerView.servers.some((server) => server.id === serverId)
    ? serverId
    : undefined;
}

function exactCounterBankRezAction(
  input: AiDecisionInput,
  sourceCardId: string,
) {
  return input.legalActions.find(
    (action) =>
      action.side === "corp" &&
      action.type === "rez_card" &&
      action.source === sourceCardId &&
      action.payload?.cardId === sourceCardId &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.timingPoint === input.playerView.timingPoint,
  );
}

function exactCounterBankCashoutAction(
  input: AiDecisionInput,
  actionId: string,
  sourceCardId: string,
): boolean {
  const action = exactCurrentLegalAction(input, actionId);
  return (
    action?.side === "corp" &&
    action.type === "activated_card_ability" &&
    action.source === sourceCardId &&
    action.payload?.cardId === sourceCardId &&
    action.payload?.cardImplementationAdvancementCounterCost === 1 &&
    action.payload?.gainCreditsAmount === 1
  );
}

function exactCurrentLegalAction(input: AiDecisionInput, actionId: string) {
  return input.legalActions.find(
    (action) =>
      action.actionId === actionId &&
      action.side === "corp" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.timingPoint === input.playerView.timingPoint,
  );
}

function legalActionCost(
  action: NonNullable<ReturnType<typeof exactCurrentLegalAction>>,
  resource: "credits" | "clicks",
): number {
  return action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost[resource] ?? 0),
    0,
  );
}

function isKnownAgenda(card: VisibleCard): boolean {
  return card.known === true && card.type === "agenda";
}

function agendaAdvancementRequirement(card: VisibleCard): number | undefined {
  if (!isKnownAgenda(card)) return undefined;
  const requirement =
    card.advancementRequirement ??
    (card.definitionId
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.advancementRequirement
      : undefined);
  return typeof requirement === "number" &&
    Number.isSafeInteger(requirement) &&
    requirement > 0
    ? requirement
    : undefined;
}

function isCorpMainActionWindow(input: AiDecisionInput): boolean {
  return (
    input.side === "corp" &&
    input.playerView.activeSide === "corp" &&
    input.playerView.timingPoint === "corp_action.main"
  );
}
