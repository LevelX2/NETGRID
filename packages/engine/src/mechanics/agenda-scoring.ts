import {
  OVERADVANCE_DIRECTOR_AGENDA_SOURCE,
  COUNTER_CREDIT_OPERATION_SOURCE,
  OVERADVANCE_ACQUISITION_AGENDA_SOURCE,
  ADVANCEMENT_REASSIGN_OPERATION_SOURCE,
  TEAM_COUNTER_OPERATION_SOURCE,
} from "./agenda-operation-effects";
import {
  CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES,
  CORP_FORT_RUN_WINDOW_UPGRADE_SOURCES,
} from "./card-implementation-derived-sets";

export const OVERADVANCE_AGENDA_SOURCES = new Set([
  OVERADVANCE_DIRECTOR_AGENDA_SOURCE,
  OVERADVANCE_ACQUISITION_AGENDA_SOURCE,
]);

export const SCORED_REVEAL_AGENDA_SOURCES = new Set([
  OVERADVANCE_DIRECTOR_AGENDA_SOURCE,
  OVERADVANCE_ACQUISITION_AGENDA_SOURCE,
]);

export const SERVER_DIFFICULTY_UPGRADE_SOURCES =
  CORP_FORT_RUN_WINDOW_UPGRADE_SOURCES;

export const COUNTER_OPERATION_SOURCES =
  CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES;

// Keep these IDs imported until the remaining agenda-difficulty naming is
// migrated. The derived sets above are the preferred pattern for new mechanics.
void COUNTER_CREDIT_OPERATION_SOURCE;
void ADVANCEMENT_REASSIGN_OPERATION_SOURCE;
void TEAM_COUNTER_OPERATION_SOURCE;

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
