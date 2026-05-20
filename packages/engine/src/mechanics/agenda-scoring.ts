import {
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  CHICAGO_BRANCH_COUNTER_ASSET_ID,
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  ROVING_SUBMARINE_AGENDA_DIFFICULTY_UPGRADE_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
  VAPOR_OPS_COUNTER_ASSET_ID,
} from "./agenda-operation-effects";

export const OVERADVANCE_AGENDA_CARD_IDS = new Set([
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
]);

export const SCORED_REVEAL_AGENDA_CARD_IDS = new Set([
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
]);

export const SERVER_DIFFICULTY_UPGRADE_CARD_IDS = new Set([
  ROVING_SUBMARINE_AGENDA_DIFFICULTY_UPGRADE_ID,
]);

export const COUNTER_ASSET_CARD_IDS = new Set([
  CHICAGO_BRANCH_COUNTER_ASSET_ID,
  VAPOR_OPS_COUNTER_ASSET_ID,
]);

export const COUNTER_OPERATION_CARD_IDS = new Set([
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
]);

export const ACTION_ASSET_CARD_IDS = new Set([
  "onr_v1_331_nevinyrral",
  "onr_v1_334_pacifica-regional-ai",
]);

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
