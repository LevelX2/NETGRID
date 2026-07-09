import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

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
  if (scoredAgenda?.kind === "overadvance_bonus_agenda_points") {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
    bonusAgendaPoints = Math.floor(
      overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
    );
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      applySequencePayloadPatch(legalAction, {
        overadvanceBonusAgendaPointOveradvance: overadvancedBy,
        overadvanceBonusAgendaPoints: bonusAgendaPoints,
      });
    }
  }
  if (host.cards.isOveradvanceAgendaDefinition(definition.id)) {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
    bonusAgendaPoints = Math.floor(overadvancedBy / 2);
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      applySequencePayloadPatch(legalAction, {
        v1919AgendaDifficulty: requiredDifficulty,
        v1919Overadvance: overadvancedBy,
        v1919BonusAgendaPoints: bonusAgendaPoints,
      });
    }
  }
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_credits") {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
    const recurringCredits =
      Math.floor(overadvancedBy / scoredAgenda.perExcessAdvancementCounters) *
      scoredAgenda.creditPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringCredits);
    if (legalAction) {
      applySequencePayloadPatch(legalAction, {
        overadvanceRecurringCredits: recurringCredits,
        projectZurichOveradvance: overadvancedBy,
      });
    }
  }
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_actions") {
    overadvancedBy = excessAdvancements(instanceBefore, requiredDifficulty);
    const actionGroups = Math.floor(
      overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
    );
    const recurringActions = actionGroups * scoredAgenda.actionPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringActions);
    const immediateActions = grantCorpScoreTurnActions(host, recurringActions);
    if (legalAction) {
      const payloadPatch = {
        overadvanceRecurringActions: recurringActions,
        overadvanceActionGroups: actionGroups,
        projectVeniceOveradvance: overadvancedBy,
      };
      applySequencePayloadPatch(
        legalAction,
        immediateActions > 0
          ? {
              ...payloadPatch,
              projectVeniceImmediateActions: immediateActions,
              corpClicksAfterProjectVeniceImmediateActions:
                host.state.corp.clicks,
            }
          : payloadPatch,
      );
    }
  }
  return { bonusAgendaPoints, overadvancedBy };
}

function grantCorpScoreTurnActions(
  host: ScoredAgendaFlowHost,
  amount: number,
): number {
  if (amount <= 0) return 0;
  if (
    host.state.activeSide !== "corp" ||
    host.state.phase !== "corp_action_phase"
  )
    return 0;
  host.state.corp.clicks += amount;
  return amount;
}

function excessAdvancements(
  instanceBefore: CardInstance,
  requiredDifficulty: number,
): number {
  return Math.max(0, instanceBefore.advancementCounters - requiredDifficulty);
}
