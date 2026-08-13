/** Declarative typed port for the corpRuntimeResolvers composition group. */
import type { EconomyActionProfile } from "../../mechanics/payment-costs";
import type { CorpAgendaPointCostResult } from "./runtime-shared";
import type { TurnCorpRuntimePort } from "./turn-corp-runtime-port";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";

export type CorpRuntimePort = TurnCorpRuntimePort & {
  forfeitRunnerAgendaForPointCost: (
    state: GameState,
    cardId: CardInstanceId,
  ) => void;
  forfeitCorpAgendaForPointCost: (
    state: GameState,
    cardId: CardInstanceId,
  ) => void;
  activeObligationCount: (state: GameState) => number;
  addActiveObligation: (state: GameState, amount: number) => void;
  removeActiveObligation: (state: GameState) => void;
  spendCorpAgendaPointCost: (
    state: GameState,
    requiredPoints: number,
  ) => CorpAgendaPointCostResult;
  installedAgendaOperationTarget: (
    state: GameState,
  ) => CardInstanceId | undefined;
  corpAgendaCounterOperationTarget: (
    state: GameState,
  ) => CardInstanceId | undefined;
  corpScoredAgendaForfeitTargets: (state: GameState) => CardInstanceId[];
  hardwareTrashByCounterEligibleHardwareIds: (
    state: GameState,
  ) => CardInstanceId[];
  hardwareTrashByCounterLegalActions: (
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ) => LegalAction[];
  hardwareTrashByCounterTrashCountFromPayload: (
    legalAction: LegalAction,
  ) => number;
  resolveHardwareTrashByCounterOperation: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveTaggedRunnerResourceMultiTrashOperation: (
    state: GameState,
    legalAction: LegalAction,
    minimumTargets: number,
    maximumTargets: number,
    selectionOrdering: "ordered" | "unordered",
  ) => void;
  startRunnerInstalledMultiTrashChoice: (
    state: GameState,
    legalAction: LegalAction,
    input: {
      effectKind: NonNullable<
        GameState["pendingRunnerInstalledMultiTrash"]
      >["effectKind"];
      targetCardType: "resource" | "hardware";
      minimumTargets: number;
      maximumTargets: number;
      selectionOrdering: "ordered" | "unordered";
      excludesSubtype?: string;
    },
    eligibleCardIds: CardInstanceId[],
  ) => void;
  resolveRunnerInstalledMultiTrashChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  advancementPlacementLegalActions: (
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ) => LegalAction[];
  resolveAgendaCounterOperation: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
  ) => void;
  resolveAdvancementPlacementOperation: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  advancementPlacementOptions: (state: GameState) => Array<{
    firstTargetId: CardInstanceId;
    secondTargetId?: CardInstanceId;
    id: string;
    label: string;
    publicLabel: string;
    value: string;
  }>;
  startAdvancementPlacementChoice: (
    state: GameState,
    options: ReturnType<
      (state: GameState) => Array<{
        firstTargetId: CardInstanceId;
        secondTargetId?: CardInstanceId;
        id: string;
        label: string;
        publicLabel: string;
        value: string;
      }>
    >,
    legalAction: LegalAction,
  ) => void;
  resolveAdvancementPlacementChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  applyAdvancementCounterPlacement: (
    state: GameState,
    firstTargetId: CardInstanceId,
    secondTargetId: CardInstanceId | undefined,
    legalAction: LegalAction,
  ) => void;
  choiceAction: (state: GameState, choice: ChoiceRequest) => LegalAction;
  abilityMetadata: (
    sourceCardInstanceId: CardInstanceId,
    abilityId: string,
    encounteredIceId?: CardInstanceId,
  ) => Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements">;
  resolveCorpInstalledEconomyAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => boolean;
  validateCorpInstalledEconomyAction: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: string,
    profile: EconomyActionProfile,
  ) => void;
  rezzedCorpInstalledEconomyCreditSourceIds: (
    state: GameState,
  ) => CardInstanceId[];
  shouldOpenCorpInstalledEconomyCreditChoice: (
    state: GameState,
    legalAction: LegalAction,
  ) => boolean;
  startCorpInstalledEconomyCreditChoice: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveCorpInstalledEconomyCreditChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
};
