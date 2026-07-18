/** Declarative typed port for advancement-focused Corp turn operations. */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";

export type AdvancementDistributionMode =
  | "single_target"
  | "any_combination"
  | "up_to_distinct_targets_one_each";

export type MoveAdvancementSourceMode = "chosen_card" | "source_card";

export type TurnCorpRuntimePort = {
  advanceableInstalledCardTargets: (state: GameState) => CardInstanceId[];
  isInstalledCorpCardAdvanceable: (
    state: GameState,
    cardId: CardInstanceId,
    definition?: CardDefinition,
  ) => boolean;
  advancementDistributionOptions: (
    state: GameState,
    amount: number,
    distribution: AdvancementDistributionMode,
  ) => Array<{ id: string; label: string; publicLabel: string; value: string }>;
  startCardImplementationAdvancementDistributionChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    amount: number,
    distribution: AdvancementDistributionMode,
  ) => { publicPayload?: Record<string, string | number | boolean> };
  parseAdvancementDistributionValue: (
    value: string,
  ) => Array<[CardInstanceId, number]>;
  sourcePartsForP334Choice: (source: string) => {
    sourceDefinitionId: CardDefinitionId;
    sourceCardId: CardInstanceId;
    amount: number;
    mode: AdvancementDistributionMode;
  };
  validateAdvancementDistribution: (
    state: GameState,
    placements: Array<[CardInstanceId, number]>,
    amount: number,
    mode: AdvancementDistributionMode,
  ) => void;
  resolveCardImplementationAdvancementDistributionChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  movableAdvancementSourceIds: (state: GameState) => CardInstanceId[];
  moveAdvancementOptions: (
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceMode: MoveAdvancementSourceMode,
    maxAmount: number | "all",
  ) => Array<{ id: string; label: string; publicLabel: string; value: string }>;
  startCardImplementationMoveAdvancementChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    sourceMode: MoveAdvancementSourceMode,
    maxAmount: number | "all",
  ) => { publicPayload?: Record<string, string | number | boolean> };
  resolveCardImplementationMoveAdvancementChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveCorpOperationAddAdvancementCounters: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  awardRunnerEventAgendaPoint: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
  ) => void;
};
