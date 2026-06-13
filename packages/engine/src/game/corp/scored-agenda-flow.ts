import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import { markCorporateRetreatAvailableOnScore } from "./scored-agenda/corporate-retreat-sequence";
import { resolveCorporateWarOnScore } from "./scored-agenda/corporate-war-sequence";
import { applyDirectScoreEconomyEffects } from "./scored-agenda/direct-score-economy-effects";
import { startEmployeeEmpowermentStartDrawChoice } from "./scored-agenda/employee-empowerment-sequence";
import { applyOveradvanceScoreEffects } from "./scored-agenda/overadvance-score-effects";
import type {
  ScoredAgendaFlowHost,
  ScoredAgendaFlowResult,
  ScoredAgendaPayload,
} from "./scored-agenda/scored-agenda-flow-host";
import { resolveScoredAgendaFlowChoice } from "./scored-agenda/scored-agenda-flow-choice-registry";
import { resolveScoredAgendaScoreTime } from "./scored-agenda/scored-agenda-score-time-registry";

export { startEmployeeEmpowermentStartDrawChoice };
export type {
  ScoredAgendaFlowHost,
  ScoredAgendaFlowResult,
  ScoredAgendaPayload,
} from "./scored-agenda/scored-agenda-flow-host";

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
  const overadvanceResult = applyOveradvanceScoreEffects(
    host,
    cardId,
    definition,
    instanceBefore,
    requiredDifficulty,
    scoredAgenda,
    legalAction,
  );
  let bonusAgendaPoints = overadvanceResult.bonusAgendaPoints;
  const overadvancedBy = overadvanceResult.overadvancedBy;
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
  applyDirectScoreEconomyEffects(
    host,
    cardId,
    definition,
    scoredAgenda,
    legalAction,
  );
  host.effects.executeOnScore(definition, cardId);
  if (scoredAgenda?.kind === "corporate_retreat_disable_on_rez_or_install") {
    markCorporateRetreatAvailableOnScore(host, cardId, legalAction);
  }
  if (scoredAgenda?.kind === "corporate_war_credit_swing") {
    resolveCorporateWarOnScore(host, definition, legalAction, scoredAgenda);
  }
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
}

export function handleScoredAgendaFlowChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  if (resolveScoredAgendaFlowChoice(host)) {
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
