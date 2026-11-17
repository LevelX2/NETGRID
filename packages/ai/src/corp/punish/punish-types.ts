import type { GuaranteeLevel } from "../../plans/plan-assessment";

export const PUNISH_PAYOFF_CAMPAIGN_ID = "corp-punish:engine-certified-payoff";

export type CorpPunishDrawNeed = Readonly<{
  needId: string;
  turnKey: string;
  stateVersion: number;
  actionId: string;
  remainingAttempts: 0 | 1;
  protectedHqCardIds: readonly string[];
  hits: number;
  population: number;
  missingRoles: readonly ("tag" | "damage")[];
  leastLineCredits: number;
  leastLineClicks: number;
  nextMandatoryDrawCount: number | undefined;
}>;

export type CorpPunishCampaignSignal = {
  campaignId: string;
  phase:
    | "prepare"
    | "watch_window"
    | "assemble_components"
    | "fund"
    | "trace"
    | "tag"
    | "damage"
    | "kill";
  sourceDefinitionIds: number[];
  actionIds?: string[];
  initiatingSemanticActionType?: string;
  feasible: boolean;
  guarantee: GuaranteeLevel;
  terminalCondition?: "runner_flatline" | "runner_deckout";
  visibleTerminalProjection: boolean;
  priorityClass?: "P3" | "P4" | "P5";
  value: number;
  evidenceCode: string;
  evidenceCodes?: string[];
  developmentDrawNeed?: CorpPunishDrawNeed;
  routeContract?: {
    contractVersion: "corp_punish_route_signal_v1";
    quoteStatus: "complete" | "unknown";
    quoteStateVersion: number;
    routeId: string;
    totalClicks: number;
    totalActionCredits: number;
    corpResponseCredits: number;
    totalCorpCredits: number;
    fundingGap: number;
    fundingActionIds: string[];
    horizon: "execute" | "fund" | "wait";
    executionNeedId: string;
    fundingNeedId: string;
    currentHeadStepId?: string;
    currentHeadActionId?: string;
    traceBidBinding?: {
      sourceCardInstanceId: string;
      sourceDefinitionId: number;
      quotedAtStateVersion: number;
      amount: number;
    };
  };
};

export type PunishState = {
  kind: "punish_campaign" | "punish_sequence";
  signal: CorpPunishCampaignSignal;
};
