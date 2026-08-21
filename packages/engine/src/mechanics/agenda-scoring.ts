import {
  CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES,
  CORP_FORT_RUN_WINDOW_UPGRADE_SOURCES,
} from "./card-implementation-derived-sets";

export const OVERADVANCE_AGENDA_SOURCES = new Set<string>();

export const SCORED_REVEAL_AGENDA_SOURCES = new Set<string>();

export const SERVER_DIFFICULTY_UPGRADE_SOURCES =
  CORP_FORT_RUN_WINDOW_UPGRADE_SOURCES;

export const COUNTER_OPERATION_SOURCES =
  CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES;

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
