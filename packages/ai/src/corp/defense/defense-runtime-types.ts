import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";

export type CorpRunDefenseAbilityAssessment = {
  productive: boolean;
  serverId: string;
  value: number;
  evidenceCode: string;
};

export type CorpExactCardRezSupportAssessment = {
  productive: boolean;
  serverId: string;
  value: number;
  evidenceCode: string;
};

export type CorpDefensiveUpgradePlacement = {
  signal?: CorpDefenseSignal;
  evidenceCode: string;
};
