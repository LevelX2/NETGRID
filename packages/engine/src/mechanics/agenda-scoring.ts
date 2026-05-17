import {
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  CHICAGO_BRANCH_COUNTER_ASSET_ID,
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  ROVING_SUBMARINE_AGENDA_DIFFICULTY_UPGRADE_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
  VAPOR_OPS_COUNTER_ASSET_ID,
  WASHINGTON_DC_AGENDA_DIFFICULTY_UPGRADE_ID,
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
  WASHINGTON_DC_AGENDA_DIFFICULTY_UPGRADE_ID,
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
  "onr_v1_335_remote-facility",
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

export const SCORED_AGENDA_COUNTER_CREDIT_PROFILES: ScoredAgendaActionProfile[] = [
  {
    profileId: "v1912.detroit_police_contract_counter_credit",
    sourceDefinitionId: "onr_v1_198_detroit-police-contract",
    agendaAbility: "v1912_detroit_police_contract",
    side: "corp",
    clickCost: 1,
    counterType: "power",
    removeCounterAmount: 1,
    creditGain: 1,
    label: "1 Credit aus Contract-Counter",
  },
  {
    profileId: "v1.corporate_coup_counter_credit",
    sourceDefinitionId: "onr_v1_193_corporate-coup",
    agendaAbility: "corporate_coup",
    side: "corp",
    clickCost: 1,
    counterType: "power",
    removeCounterAmount: 3,
    creditGain: 3,
    label: "3 Credits aus Coup-Counter",
  },
  {
    profileId: "v1.political_coup_counter_credit",
    sourceDefinitionId: "onr_v1_209_political-coup",
    agendaAbility: "political_coup",
    side: "corp",
    clickCost: 1,
    counterType: "power",
    removeCounterAmount: 3,
    creditGain: 3,
    label: "3 Credits aus Coup-Counter",
  },
];

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
