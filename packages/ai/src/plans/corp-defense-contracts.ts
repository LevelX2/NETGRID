import type { CorpRestrictedCreditRouteQuote } from "@netgrid/shared";
import { type CorpExactIceRezRouteProjection } from "../runtime/corp-exact-ice-rez-route";
import { type KnownCorpFundedIceInstallRouteProjection } from "../runtime/corp-funded-score-protection";
import { type ExactProbability } from "../runtime/corp-score-protection-assessment";
import { CorpScorePriorityClass } from "./corp-score-contracts";

export type CorpDefenseSignalBase = {
  defenseId: string;
  serverId: string;
  evidenceCode: string;
};

export type CorpGenericDefenseSignal = CorpDefenseSignalBase & {
  kind: "generic";
  phase:
    | "install_ice"
    | "install_defense_support"
    | "resolve_install_targets"
    | "resolve_run_redirect"
    | "resolve_post_pass_ice_lifecycle"
    | "draw_for_ice"
    | "fund_rez_reserve"
    | "rez_response"
    | "activate_run_defense"
    | "pass_encounter"
    | "decline_rez";
  sourceDefinitionIds: string[];
  parentKind?: "remote";
  parentProjectId?: string;
  parentNeedId?: string;
  sourceCardInstanceId?: string;
  actionIds?: string[];
  targetIceInstanceId?: string;
  followupIceInstanceId?: string;
  urgent: boolean;
  centralPressure?: "material" | "acute" | "terminal";
  immediateInstallSupport?: boolean;
  rezWindowVerdict?: "productive" | "nonproductive" | "open";
  installRoute?: Readonly<{
    disposition: "productive" | "funding_only";
    progressKind?:
      | "engine_certified_access"
      | "funded_structured_central_defense"
      | "scoreline_central_tax_allocation"
      | "staged_central_defense"
      | "score_material_capacity_release"
      | "agenda_capacity_defense_conversion"
      | "funding_required";
    rezFundingGap?: number;
    projection: KnownCorpFundedIceInstallRouteProjection;
  }>;
  rezReserveNeed?: Readonly<{
    observedAtStateVersion: number;
    currentCredits: number;
    requiredCredits: number;
    fundingGap: number;
    storedRestrictedCredits?: number;
  }>;
  rezRoute?: CorpExactIceRezRouteProjection;
  restrictedRezFunding?: {
    gap: number;
    quotes: CorpRestrictedCreditRouteQuote[];
  };
  value: number;
  choiceResolution?:
    | {
        kind: "agenda_purge_install_targets";
        choiceId: string;
        sourceAgendaId: string;
        sourceStateVersion: number;
        revealedCardIds: string[];
        targets: Array<{
          cardId: string;
          serverId: string;
          optionId: string;
        }>;
      }
    | {
        kind: "classic_deflector_redirect";
        choiceId: string;
        sourceStateVersion: number;
        runId: string;
        sourceIceInstanceId: string;
        sourceDefinitionId: string;
        subroutineIndex: number;
        subroutineId: string;
        targetProfile: "archives" | "any_data_fort" | "subsidiary_data_fort";
        creditCost: number;
        autoBreakIfNoTarget: boolean;
        selectedOptionId: string;
        disposition: "redirect" | "decline";
        selectedServerId?: string;
      };
  drawAttemptState?: {
    turnKey: string;
    remainingAttempts: 0 | 1;
    selectedAtStateVersion?: number;
  };
};

export type CorpScoreProtectionInstallSignal = CorpDefenseSignalBase & {
  kind: "score_protection_install";
  phase: "install_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  effect: "progress" | "satisfied";
  runnerAccessSuccessProbability: ExactProbability;
  totalInstallAndRezCredits: number;
  projection: KnownCorpFundedIceInstallRouteProjection & {
    effect: "progress" | "satisfied";
  };
};

export type CorpScoreProtectionDrawSignal = CorpDefenseSignalBase & {
  kind: "score_protection_draw";
  phase: "draw_for_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  cleanupReplacementDraw?: boolean;
  drawAttemptState: {
    turnKey: string;
    remainingAttempts: 1;
    selectedAtStateVersion?: number;
  };
};

export type CorpScoreProtectionStagingInstallSignal = CorpDefenseSignalBase & {
  kind: "score_protection_staging_install";
  phase: "install_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
};

export type CorpDefenseSignal =
  | CorpGenericDefenseSignal
  | CorpScoreProtectionInstallSignal
  | CorpScoreProtectionStagingInstallSignal
  | CorpScoreProtectionDrawSignal;
