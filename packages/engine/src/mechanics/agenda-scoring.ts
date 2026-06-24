import {
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
} from "./agenda-operation-effects";
import {
  CORP_ADVANCEMENT_COUNTER_ASSET_CARD_IDS,
  CORP_ADVANCEMENT_COUNTER_OPERATION_CARD_IDS,
  CORP_FORT_RUN_WINDOW_UPGRADE_CARD_IDS,
} from "./card-implementation-derived-sets";

export const OVERADVANCE_AGENDA_CARD_IDS = new Set([
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
]);

export const SCORED_REVEAL_AGENDA_CARD_IDS = new Set([
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
]);

export const SERVER_DIFFICULTY_UPGRADE_CARD_IDS =
  CORP_FORT_RUN_WINDOW_UPGRADE_CARD_IDS;

export const COUNTER_ASSET_CARD_IDS = CORP_ADVANCEMENT_COUNTER_ASSET_CARD_IDS;

export const COUNTER_OPERATION_CARD_IDS =
  CORP_ADVANCEMENT_COUNTER_OPERATION_CARD_IDS;

// Keep these IDs imported until the remaining agenda-difficulty naming is
// migrated. The derived sets above are the preferred pattern for new mechanics.
void FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID;
void MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID;
void TEAM_RESTRUCTURING_COUNTER_OPERATION_ID;

export type ScoredAgendaActionProfile = {
  profileId: string;
  sourceDefinitionId: string;
  agendaAbility: string;
  side: "corp";
  clickCost: number;
  counterType: "power";
  removeCounterAmount: number;
  creditGain: number;
  label: string;
};

export const SCORED_AGENDA_COUNTER_CREDIT_PROFILES: ScoredAgendaActionProfile[] = [];

export function scoredAgendaCounterCreditProfileForDefinition(
  sourceDefinitionId: string,
): ScoredAgendaActionProfile | undefined {
  return SCORED_AGENDA_COUNTER_CREDIT_PROFILES.find(
    (profile) => profile.sourceDefinitionId === sourceDefinitionId,
  );
}

export function scoredAgendaCounterCreditProfileForPayload(
  sourceDefinitionId: string,
  payload: Record<string, unknown> | undefined,
): ScoredAgendaActionProfile | undefined {
  return SCORED_AGENDA_COUNTER_CREDIT_PROFILES.find(
    (profile) =>
      profile.sourceDefinitionId === sourceDefinitionId &&
      payload?.agendaAbility === profile.agendaAbility,
  );
}

export function scoredAgendaCounterCreditPayload(
  profile: ScoredAgendaActionProfile,
  cardId: string,
): Record<string, string | number> {
  return {
    cardId,
    agendaAbility: profile.agendaAbility,
    counterType: profile.counterType,
    removePowerCounterAmount: profile.removeCounterAmount,
    gainCreditsAmount: profile.creditGain,
  };
}
