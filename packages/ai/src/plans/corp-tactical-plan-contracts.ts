import { CorpPunishCampaignSignal } from "../corp/punish/punish-types";
import type { CorpVirusPressureSignal } from "../corp/virus-pressure/virus-pressure-types";
import type { CorpDrawAdmissionAssessment } from "../runtime/corp-draw-admission";
import type { CorpHandInventoryFacts } from "../runtime/corp-hand-inventory-facts";
import type { KnownCorpCardAccessEffectProjection } from "../runtime/known-corp-card-access-effect-projection";
import type { CorpBluffDefenseNeed } from "./corp-bluff-defense-types";
import type { CorpCorePlanDomain } from "./corp-core-plan-modules";

export type CorpAmbushSignal = {
  commitmentVersion: "corp_ambush_commitment_v1";
  ambushId: string;
  sourceDefinitionId: string;
  sourceInstanceId: string;
  actionIds: string[];
  serverId: string;
  phase:
    | "install"
    | "install_support"
    | "advance"
    | "rez_support"
    | "trigger_support"
    | "trigger"
    | "recycle"
    | "recycle_rd";
  patternKind?: "access_ambush" | "score_decoy" | "rd_recycle";
  recycleBluffUntilTurnSerial?: number;
  emptyRdRecovery?: { observedAtStateVersion: number };
  defenseNeed?: CorpBluffDefenseNeed;
  followupAgendaInstanceId?: string;
  runnerCreditsAtPlanStart?: number;
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  plannedAtStateVersion: number;
  plannedAdvancementTarget: number;
  value: number;
  evidenceCode: string;
  decisionEvidenceCodes?: string[];
  runnerKnowledgeState?: "unknown" | "known_exact";
  bluffCompromised?: boolean;
  compromisedDisposition?:
    | "hold_known_threat"
    | "recycle_to_hq"
    | "trigger_on_access";
  accessThreatProjection?: KnownCorpCardAccessEffectProjection;
  accessPaymentChoiceBinding?: {
    actionId: string;
    choiceId: string;
    choiceSource: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    creditCost: number;
    noOpCertified: boolean;
  };
  accessProgramBounceChoiceBinding?: {
    actionId: string;
    choiceId: string;
    choiceSource: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    targetProgramInstanceIds: string[];
    evidenceCodes: string[];
  };
  recycleRoute?: {
    actionId: string;
    recyclerSourceInstanceId: string;
    recyclerSourceDefinitionId: string;
    targetCardInstanceId: string;
  };
  advancementSupportRoute?: {
    phase: "install" | "rez" | "trigger";
    actionId: string;
    supportSourceInstanceId: string;
    supportSourceDefinitionId: string;
    targetCardInstanceId: string;
    serverId: string;
    creditCost: number;
  };
  installRoute?: {
    actionId: string;
    creditCost: number;
    fundingGap: number;
    costSource: "legal_action";
  };
};

export type CorpHandManagementSignal = {
  handPlanId: string;
  parentPlanInstanceId?: string;
  parentNeedId?: string;
  phase:
    | "draw_for_plan"
    | "develop_card"
    | "resolve_hq_overflow"
    | "agenda_flood_relief"
    | "discard_window"
    | "draw_filter_window"
    | "hq_shuffle_window";
  sourceDefinitionIds?: string[];
  sourceInstanceId?: string;
  actionIds?: string[];
  exactActionRoute?: boolean;
  agendaCount: number;
  handSize: number;
  maximumHandSize: number;
  concretePurposeCode: string;
  priorityClass?: "P3" | "P5" | "P6";
  routeAllowed?: boolean;
  uncertainty?: {
    kind: "draw_then_observe";
    unknownOutcome: "drawn_card_identity";
    revalidateAfterCurrentHead: true;
  };
  drawAttemptState?: {
    turnKey: string;
    remainingAttempts: 0 | 1;
    selectedAtStateVersion?: number;
  };
  overflowResolutionState?: {
    turnKey: string;
    initialOverflowCount: number;
    maximumConversions: number;
    remainingConversions: number;
    selectedAtStateVersion?: number;
    expectedOverflowAfterSelectedConversion?: number;
  };
  discardChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    discardedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  drawFilterChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    bottomedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  hqShuffleChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    shuffledCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  actionPriorityOrder?: string[];
  value: number;
  evidenceCode: string;
};

export type CorpTacticalPlanDomain = {
  virusPressure: CorpVirusPressureSignal[];
  punishCampaigns: CorpPunishCampaignSignal[];
  ambushes: CorpAmbushSignal[];
  handManagement: CorpHandManagementSignal[];
  handInventoryFacts?: CorpHandInventoryFacts;
  drawArbitrations?: CorpDrawAdmissionAssessment[];
};

export type CorpPlanDomain = CorpCorePlanDomain & CorpTacticalPlanDomain;
