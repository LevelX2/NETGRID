import type { CorpCorePlanDomain } from "./corp-core-plan-contracts";
import { CorpHandManagementSignal } from "../corp/hand-management/hand-management-types";
import { CorpPunishCampaignSignal } from "../corp/punish/punish-types";
import type { CorpVirusPressureSignal } from "../corp/virus-pressure/virus-pressure-types";
import type { CorpDrawAdmissionAssessment } from "../runtime/corp-draw-admission";
import type { CorpHandInventoryFacts } from "../corp/hand-management/hand-inventory-facts";
import type { KnownCorpCardAccessEffectProjection } from "../runtime/known-corp-card-access-effect-projection";
import type { CorpBluffDefenseNeed } from "./corp-bluff-defense-types";

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

export type CorpTacticalPlanDomain = {
  virusPressure: CorpVirusPressureSignal[];
  punishCampaigns: CorpPunishCampaignSignal[];
  ambushes: CorpAmbushSignal[];
  handManagement: CorpHandManagementSignal[];
  handInventoryFacts?: CorpHandInventoryFacts;
  drawArbitrations?: CorpDrawAdmissionAssessment[];
};

export type CorpPlanDomain = CorpCorePlanDomain & CorpTacticalPlanDomain;
