import type { GuaranteeLevel } from "../../plans/plan-assessment";

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
  sourceDefinitionIds: string[];
  actionIds?: string[];
  initiatingSemanticActionType?: string;
  feasible: boolean;
  guarantee: GuaranteeLevel;
  terminalCondition?: "runner_flatline" | "runner_deckout";
  visibleTerminalProjection: boolean;
  priorityClass?: "P4" | "P5";
  value: number;
  evidenceCode: string;
  evidenceCodes?: string[];
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
      sourceDefinitionId: string;
      quotedAtStateVersion: number;
      amount: number;
    };
  };
};

export type PunishState = {
  kind: "punish_campaign" | "punish_sequence";
  signal: CorpPunishCampaignSignal;
};
