/** Declarative typed port implemented by hidden-zone-nonsearch-runtime.ts. */
import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  HiddenZoneNonSearchChoiceHandlerHost,
  LegalAction,
  PlayerAction,
  Side,
} from "./runtime-shared";

export type HiddenZoneNonSearchRuntimePort = {
  RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION: string;
  RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE: string;
  canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity: (
    state: GameState,
    implementation: {
      kind: "trash_installed_runner_connections_then_add_bad_publicity";
      count: 2;
      badPublicity: 1;
      visibility: Extract<
        import("@netgrid/shared").EventVisibilityClass,
        "hidden_info_barrier"
      >;
    },
  ) => boolean;
  hiddenZoneNonSearchChoiceHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ) => HiddenZoneNonSearchChoiceHandlerHost;
  iceChoiceLabelForSide: (
    state: GameState,
    cardId: CardInstanceId,
    visibleTo: Side,
    fallback: string,
  ) => {
    label: string;
    publicLabel: string;
  };
  installedRunnerConnectionIds: (state: GameState) => CardInstanceId[];
  parseRunnerInstalledConnectionTrashBadPublicityChoiceSource: (
    source: string,
  ) => {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    count: number;
  };
  publicIcePositionLabelForCard: (
    state: GameState,
    cardId: string | undefined,
  ) => string | undefined;
  publicIceSelectionLabelForCard: (
    state: GameState,
    cardId: string | undefined,
  ) => string | undefined;
  resolveDerezRezzedBlackIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveCardImplementationAccessPaymentChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolvePayRezCostToTrashRezzedIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveCorpChoiceRezOrTrashIceDecisionChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveCorpChoiceRezOrTrashIceTargetChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveGripInstallTemporaryCreditChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveNonSearchProgramInstallMemoryChoice: (
    state: GameState,
    action: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveIncubatorTransformChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolvePaidSourceReturnToGripChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveRunnerProgramReturnChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveRunnerHostingChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveRunnerInstalledConnectionTrashBadPublicityChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveTrashUnrezzedIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveStackInstallRunCleanupChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    implementation: {
      kind: "trash_installed_runner_connections_then_add_bad_publicity";
      count: 2;
      badPublicity: 1;
      visibility: Extract<
        import("@netgrid/shared").EventVisibilityClass,
        "hidden_info_barrier"
      >;
    },
  ) => void;
  selectedChoiceCardIds: (
    choice: ChoiceRequest,
    playerAction: PlayerAction,
  ) => CardInstanceId[];
  selectedChoiceCardIdsForChoice: (
    choice: ChoiceRequest,
    playerAction: PlayerAction,
  ) => CardInstanceId[];
  startDerezRezzedBlackIceChoice: (
    state: GameState,
    sourceCardId: string,
  ) => void;
  startPayRezCostToTrashRezzedIceChoice: (
    state: GameState,
    sourceCardId: string,
  ) => void;
  startCorpChoiceRezOrTrashIceChoice: (
    state: GameState,
    sourceCardId: string,
  ) => void;
  startPaidSourceReturnToGripChoice: (
    state: GameState,
    sourceCardId: string,
  ) => void;
  startRunnerHostingChoice: (
    state: GameState,
    hostId: CardInstanceId,
    legalAction: LegalAction,
  ) => void;
  startTrashUnrezzedIceChoice: (state: GameState, sourceCardId: string) => void;
};
