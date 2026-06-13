import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import type { ScoredAgendaFlowHost } from "../scored-agenda-flow";

export type OveradvanceScoreEffectResult = {
  bonusAgendaPoints: number;
  overadvancedBy: number;
};

export function applyOveradvanceScoreEffects(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  instanceBefore: CardInstance,
  requiredDifficulty: number,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
  legalAction: LegalAction | undefined,
): OveradvanceScoreEffectResult {
  let bonusAgendaPoints = 0;
  let overadvancedBy = 0;
  if (scoredAgenda?.kind === "project_babylon_bonus_points") {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
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
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
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
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_credits") {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
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
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
    const actionGroups = Math.floor(
      overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
    );
    const recurringActions = actionGroups * scoredAgenda.actionPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringActions);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        overadvanceRecurringActions: recurringActions,
        overadvanceActionGroups: actionGroups,
        projectVeniceOveradvance: overadvancedBy,
      };
    }
  }
  return { bonusAgendaPoints, overadvancedBy };
}

function excessAdvancements(
  instanceBefore: CardInstance,
  requiredDifficulty: number,
): number {
  return Math.max(0, instanceBefore.advancementCounters - requiredDifficulty);
}
