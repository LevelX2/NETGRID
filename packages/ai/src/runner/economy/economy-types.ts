import type { RunnerFundingNeedSignal } from "../../plans/runner-funding-contracts";
export type RunnerInstalledCardLiquidationChoiceSignal = {
  conversionId: string;
  sourceResourceInstanceId: string;
  sourceResourceDefinitionId: string;
  actionId: string;
  choiceId: string;
  sourceStateVersion: number;
  selectedOptionId: string;
  selectedCardInstanceId?: string;
  disposition:
    | "liquidate_proven_expendable"
    | "decline_nonpositive_conversion"
    | "decline_unproven_expendability";
  quote: Readonly<{
    gainCredits: number;
    retainedCardValue: number;
    netLiquidationValue: number;
    expendability: "proven_redundant" | "unproven";
  }>;
  priorityClass: "P4";
  value: number;
  evidenceCodes: string[];
};

export type EconomyState =
  | { kind: "economy"; need: RunnerFundingNeedSignal }
  | {
      kind: "installed_card_liquidation_choice";
      signal: RunnerInstalledCardLiquidationChoiceSignal;
    };
