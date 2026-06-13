import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
  ResolvedGameEffect,
  ServerId,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import { markCorporateRetreatAvailableOnScore } from "./scored-agenda/corporate-retreat-sequence";
import { resolveCorporateWarOnScore } from "./scored-agenda/corporate-war-sequence";
import {
  isEmployeeEmpowermentStartDrawChoiceSource,
  resolveEmployeeEmpowermentStartDrawChoice,
  startEmployeeEmpowermentStartDrawChoice,
} from "./scored-agenda/employee-empowerment-sequence";
import {
  isScoredIceMarkModifierChoiceSource,
  resolveScoredRezzedIceMarkModifierChoice,
} from "./scored-agenda/ice-transmutation-sequence";
import { resolveScoredAgendaScoreTime } from "./scored-agenda/scored-agenda-score-time-registry";
import {
  isScoredSubtypeRevealChoiceSource,
  resolveScoredSubtypeRevealChoice,
} from "./scored-agenda/subtype-reveal-economy-sequence";

export { startEmployeeEmpowermentStartDrawChoice };

type ScoredAgendaPayload = Record<string, string | number | boolean>;

export type ScoredAgendaFlowHost = {
  state: Pick<
    GameState,
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "stateVersion"
    | "phase"
    | "activeSide"
    | "timingPoint"
    | "winner"
  >;
  legalAction?: LegalAction;
  playerAction?: PlayerAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    scoredAgendaForDefinition: (
      definition: CardDefinition,
    ) => CardScoredAgendaImplementation | undefined;
    effectiveAgendaDifficulty: (cardId: CardInstanceId) => number;
    hasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    isOveradvanceAgendaDefinition: (definitionId: string) => boolean;
  };
  constants: {
    employeeEmpowermentId: string;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    cleanupEmptyRemotes: () => void;
    corpInstalledCardIds: () => CardInstanceId[];
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => unknown;
  };
  counters: {
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: "agenda" | "mark",
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: "boon" | "mark",
      amount: number,
    ) => void;
    cardCounter: (
      cardId: CardInstanceId,
      counterType: "boon" | "mark",
    ) => number;
  };
  credits: {
    gainCredits: (side: "corp", amount: number) => void;
    setCorpCredits: (amount: number) => void;
  };
  flags: {
    markScoredBlackOpsAgendaThisTurn: () => void;
    employeeEmpowermentResolvedSourceIds: () => CardInstanceId[];
    markEmployeeEmpowermentResolved: (cardId: CardInstanceId) => void;
  };
  effects: {
    executeOnScore: (
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
    appendEmployeeEmpowermentDrawEffect: (
      cardId: CardInstanceId,
      drawnCount: number,
    ) => void;
  };
  draw: {
    drawCorpCard: () => void;
  };
  choices: {
    startDataFortReclamation: (cardId: CardInstanceId) => void;
    startPriorityRequisition: (cardId: CardInstanceId) => void;
    startCorporateDownsizing: (
      cardId: CardInstanceId,
      creditPerAgendaPoint: number,
    ) => void;
    resolveSecurityPurge: (cardId: CardInstanceId) => void;
  };
};

export type ScoredAgendaFlowResult = {
  handled: boolean;
  stateChanged?: boolean;
  agendaInstanceId?: CardInstanceId;
  agendaDefinitionId?: string;
  agendaPointsScored?: number;
  bonusAgendaPoints?: number;
  overadvancedBy?: number;
  gainedCredits?: number;
  lostCredits?: boolean;
  placedCounters?: number;
  pendingChoice?: ChoiceRequest;
  resolvedPayload?: ScoredAgendaPayload;
};

export function scoreAgenda(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
): ScoredAgendaFlowResult {
  const state = host.state;
  const legalAction = host.legalAction;
  const definition = host.cards.definitionFor(cardId);
  if (definition.type !== "agenda")
    throw new Error("Nur Agendas koennen gescored werden.");
  const instanceBefore = host.cards.mustInstance(cardId);
  const requiredDifficulty = host.cards.effectiveAgendaDifficulty(cardId);
  if (instanceBefore.advancementCounters < requiredDifficulty)
    throw new Error("Agenda hat nicht genug Advancements.");
  if (
    legalAction &&
    instanceBefore.zone.side === "corp" &&
    instanceBefore.zone.zone === "serverRoot"
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      scoredFromServerId: instanceBefore.zone.serverId,
    };
  }
  host.zones.removeFromAllZones(cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "scoreArea" },
  };
  if (host.cards.hasSubtype(definition, "black_ops")) {
    host.flags.markScoredBlackOpsAgendaThisTurn();
  }
  const scoredAgenda = host.cards.scoredAgendaForDefinition(definition);
  let bonusAgendaPoints = 0;
  let overadvancedBy = 0;
  if (scoredAgenda?.kind === "project_babylon_bonus_points") {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    bonusAgendaPoints = Math.floor(
      overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
    );
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        projectBabylonOveradvance: overadvancedBy,
        projectBabylonBonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (host.cards.isOveradvanceAgendaDefinition(definition.id)) {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    bonusAgendaPoints = Math.floor(overadvancedBy / 2);
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919AgendaDifficulty: requiredDifficulty,
        v1919Overadvance: overadvancedBy,
        v1919BonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (scoredAgenda?.kind === "fixed_bonus_agenda_points_on_score") {
    bonusAgendaPoints += scoredAgenda.amount;
    host.counters.setCardCounter(cardId, "agenda", scoredAgenda.amount);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        fixedBonusAgendaPoints: scoredAgenda.amount,
        bonusAgendaPoints,
      };
    }
  }
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_credits") {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    const recurringCredits =
      Math.floor(overadvancedBy / scoredAgenda.perExcessAdvancementCounters) *
      scoredAgenda.creditPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringCredits);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        overadvanceRecurringCredits: recurringCredits,
        projectZurichOveradvance: overadvancedBy,
      };
    }
  }
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_actions") {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    const recurringActions =
      Math.floor(overadvancedBy / scoredAgenda.perExcessAdvancementCounters) *
      scoredAgenda.actionPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringActions);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        overadvanceRecurringActions: recurringActions,
        overadvanceActionGroups: Math.floor(
          overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
        ),
        projectVeniceOveradvance: overadvancedBy,
      };
    }
  }
  applySimpleScoreEffects(host, cardId, definition, scoredAgenda);
  startScoreTimeChoices(host, cardId, definition, instanceBefore, scoredAgenda);
  host.zones.cleanupEmptyRemotes();
  const result: ScoredAgendaFlowResult = {
    handled: true,
    stateChanged: true,
    agendaInstanceId: cardId,
    agendaDefinitionId: definition.id,
    bonusAgendaPoints,
    overadvancedBy,
  };
  if (state.pendingChoice) result.pendingChoice = state.pendingChoice;
  if (legalAction?.payload)
    result.resolvedPayload = legalAction.payload as ScoredAgendaPayload;
  return result;
}

function applySimpleScoreEffects(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): void {
  const legalAction = host.legalAction;
  if (scoredAgenda?.kind === "gain_credits_on_score") {
    host.credits.gainCredits(scoredAgenda.recipient, scoredAgenda.amount);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        onScoreGainCredits: scoredAgenda.amount,
        gainedCredits: scoredAgenda.amount,
        corpCreditsAfter: host.state.corp.credits,
      };
      appendScoreCreditEffect(legalAction, {
        effectId: `${definition.id}.score.gain_credits`,
        kind: "gain_credits",
        amount: scoredAgenda.amount,
        definition,
      });
    }
  }
  if (scoredAgenda?.kind === "add_counters_on_score") {
    host.counters.addCardCounter(
      cardId,
      scoredAgenda.counterType,
      scoredAgenda.amount,
    );
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        counterType: scoredAgenda.counterType,
        addedCounterAmount: scoredAgenda.amount,
        remainingCounters: host.counters.cardCounter(
          cardId,
          scoredAgenda.counterType,
        ),
      };
  }
  host.effects.executeOnScore(definition, cardId);
  if (scoredAgenda?.kind === "corporate_retreat_disable_on_rez_or_install") {
    markCorporateRetreatAvailableOnScore(host, cardId, legalAction);
  }
  if (scoredAgenda?.kind === "corporate_war_credit_swing") {
    resolveCorporateWarOnScore(host, definition, legalAction, scoredAgenda);
  }
}

function appendScoreCreditEffect(
  legalAction: LegalAction,
  effect: {
    effectId: string;
    kind: Extract<ResolvedGameEffect["kind"], "gain_credits" | "lose_credits">;
    amount: number;
    definition: CardDefinition;
  },
): void {
  const resolvedEffect: ResolvedGameEffect = {
    effectId: effect.effectId,
    kind: effect.kind,
    visibility: "public",
    side: "corp",
    amount: effect.amount,
    reason: "card_resolver",
    sourceDefinitionId: effect.definition.id,
    sourceTitle: effect.definition.title,
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    resolvedEffect,
  ];
}

function startScoreTimeChoices(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  instanceBefore: CardInstance,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): void {
  const legalAction = host.legalAction;
  if (!legalAction) return;
  if (
    scoredAgenda &&
    resolveScoredAgendaScoreTime({
      host,
      cardId,
      definition,
      instanceBefore,
      legalAction,
      scoredAgenda,
    })
  )
    return;
  if (scoredAgenda?.kind === "choose_fort_ice_strength_bonus") {
    const selectedServerId =
      typeof legalAction.payload?.selectedServerId === "string"
        ? String(legalAction.payload.selectedServerId)
        : instanceBefore.zone.side === "corp" &&
            instanceBefore.zone.zone === "serverRoot"
          ? instanceBefore.zone.serverId
          : undefined;
    if (!selectedServerId || selectedServerId === "new_remote")
      throw new Error(
        "Security Net Optimization braucht ein gueltiges Remote.",
      );
    host.zones.mustServer(selectedServerId as Exclude<ServerId, "new_remote">);
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      selectedServerId: selectedServerId as Exclude<ServerId, "new_remote">,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      securityNetOptimizationActive: true,
      selectedServerId,
      securityNetOptimizationServerId: selectedServerId,
    };
  }
  if (
    scoredAgenda?.kind === "shuffle_selected_hq_agendas_into_rd_gain_credits"
  ) {
    host.choices.startCorporateDownsizing(
      cardId,
      scoredAgenda.creditPerAgendaPoint,
    );
  }
}

export function handleScoredAgendaFlowChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (isScoredSubtypeRevealChoiceSource(source)) {
    resolveScoredSubtypeRevealChoice(host);
    const result: ScoredAgendaFlowResult = {
      handled: true,
      stateChanged: true,
    };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  if (isScoredIceMarkModifierChoiceSource(source)) {
    resolveScoredRezzedIceMarkModifierChoice(host);
    const result: ScoredAgendaFlowResult = {
      handled: true,
      stateChanged: true,
    };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  if (isEmployeeEmpowermentStartDrawChoiceSource(source)) {
    resolveEmployeeEmpowermentStartDrawChoice(host);
    const result: ScoredAgendaFlowResult = {
      handled: true,
      stateChanged: true,
    };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  return { handled: false };
}
