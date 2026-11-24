import type {
  CardCreditGainContinuation,
  CardInstanceId,
  CorpDrawContinuation,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";

type ResolveChoice<TResult = void> = (
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
) => TResult;
type ResumeChoice<TResult = void> = (
  state: GameState,
  legalAction: LegalAction,
) => TResult;

export type PendingChoiceResolutionHost = {
  state: GameState;
  lifecycle: {
    trashCorpInstalledCardToArchives: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    resolveFortCapacityCleanupChoice: ResolveChoice;
  };
  setup: {
    resolveSetupMulliganChoice: ResolveChoice;
    resolveDiscardChoice: ResolveChoice;
  };
  replacement: {
    resolveReplacementChoice: ResolveChoice;
    resolveEventModificationChoice: ResolveChoice;
    resumeAddTagContinuation: ResumeChoice;
    resumeCorpDrawContinuation: (
      state: GameState,
      legalAction: LegalAction,
      continuation: CorpDrawContinuation,
    ) => void;
    resumeCardCreditGainContinuation: (
      state: GameState,
      legalAction: LegalAction,
      continuation: CardCreditGainContinuation,
    ) => void;
    resolvePdcaDamageReplacementChoice: ResolveChoice;
  };
  trace: {
    resolveTraceChoice: ResolveChoice;
  };
  hiddenZone: {
    handleHiddenZoneArrangeChoice: ResolveChoice<{ handled: boolean }>;
    handleHiddenZoneNonSearchChoice: ResolveChoice<{ handled: boolean }>;
    handleCorpZoneChoice: ResolveChoice<{ handled: boolean }>;
    isHiddenZoneChoiceSource: (source: string) => boolean;
    resolveP358HiddenReplacementChoice: ResolveChoice;
    handleHiddenZoneSearchChoice: ResolveChoice<{
      handled: boolean;
      deletePendingChoice?: boolean;
    }>;
    resolveMultiExposeInstalledCorpCardsChoice: ResolveChoice;
    resolveExposeInstalledCorpCardsChoice: ResolveChoice;
    resolveCorpInstalledEconomyCreditChoice: ResolveChoice;
    resolveStrategicPlanningGroupDrawChoice: ResolveChoice;
    resolveCrashEverettDrawChoice: ResolveChoice;
    resolveRunnerDrawSequenceChoice: ResolveChoice;
    resolveRunnerInstalledMultiTrashChoice: ResolveChoice;
    resolveVirusCounterPreventionChoice: ResolveChoice;
    resolveAdvancementPlacementChoice: ResolveChoice;
    resolveDerezRezzedBlackIceChoice: ResolveChoice;
    resolvePayRezCostToTrashRezzedIceChoice: ResolveChoice;
    resolveCorpChoiceRezOrTrashIceTargetChoice: ResolveChoice;
    resolveCorpChoiceRezOrTrashIceDecisionChoice: ResolveChoice;
    resolveTrashUnrezzedIceChoice: ResolveChoice;
    resolveRandomDiceSplitChoice: ResolveChoice;
    resolveRunnerInstalledConnectionTrashBadPublicityChoice: ResolveChoice;
    resolveGripInstallTemporaryCreditChoice: ResolveChoice;
    resolveNonSearchProgramInstallMemoryChoice: ResolveChoice;
    resolveStackInstallRunCleanupChoice: ResolveChoice;
    resolvePaidSourceReturnToGripChoice: ResolveChoice;
    resolveIncubatorTransformChoice: ResolveChoice;
    resolveVirusCounterPurgePreserveChoice: ResolveChoice;
    resolveRunnerProgramReturnChoice: ResolveChoice;
    resolveRunnerPrivateLookChoice: ResumeChoice;
    resolveExposePreventionChoice: ResolveChoice;
    resolveSenatorialFieldTripChoice: ResolveChoice;
    resolveFortHqReplacementChoice: ResolveChoice;
  };
  corp: {
    handleCorpInstallRezSequenceChoice: ResolveChoice<{ handled: boolean }>;
    handleScoredAgendaFlowChoice: ResolveChoice<{ handled: boolean }>;
  };
  runner: {
    resolveRunnerProgramTrashBeforeInstallChoice: ResolveChoice;
    resolveRunnerMemoryCheckpointChoice: ResolveChoice;
    resolveDelayedInstallStartTurnChoice: ResolveChoice;
    resolveDelayedInstallPlacementChoice: ResolveChoice;
  };
  run: {
    resolveHqIceSwapChoice: ResolveChoice;
    resolveSecretSpendCompareChoiceInRunModule: ResolveChoice;
    resolveHammerStealthLossChoice: ResolveChoice;
    resolveActiveIceProgramTrashChoiceInRunModule: ResolveChoice;
    resolvePassRezzedIceProgramTrashChoiceInRunModule: ResolveChoice;
    resolveRezInterruptJackOutChoice: ResolveChoice;
    resolveBrokenIceVirusCounterChoice: ResolveChoice;
    resolveAardvarkInterceptionChoice: ResolveChoice;
    resolveSuccessfulRunInterventionChoiceInRunModule: ResolveChoice;
    resolvePostMeatDamageHiddenResourceChoice: ResolveChoice;
    resolveStartOfRunFortUtilityChoice: ResolveChoice;
    resolveClassicDeflectorChoice: ResolveChoice;
    resolveTrashProgramChoice: ResolveChoice;
    resumeTraceProgramTrashContinuation: ResumeChoice;
    resumeRunEndTrashUsedBreakers: ResumeChoice;
    resolveTraceHardwareWreckerTargetChoice: ResolveChoice;
    resumeTraceHardwareWreckerAfterTrash: ResumeChoice;
    resumeRunnerTraceCounterRunStartEffects: ResumeChoice<boolean>;
    resumeRunStart: ResumeChoice;
    resolveRunnerRunStartOrderChoice: ResolveChoice<boolean>;
    applyRunnerTraceCounterRunStartEffects: ResumeChoice<boolean>;
  };
  access: {
    resumeAccessEffectAfterDamagePrevention: ResumeChoice;
    resolveAccessProgramInstallMemoryChoice: ResolveChoice;
    resolveMercenaryCurrentAccessTrashChoice: ResolveChoice;
    resolveSuccessfulRunCreditLossSpendChoice: ResolveChoice;
    resolvePreAccessTopRdReorderChoice: ResolveChoice;
    resolveRevealRdUntilAgendaStoreInHqChoice: ResolveChoice;
  };
  cardImplementation: {
    resumePreventableTrashCostContinuation: ResumeChoice;
    resolveCardImplementationAccessPaymentChoice: ResolveChoice;
    resolveCardImplementationAdvancementDistributionChoice: ResolveChoice;
    resolveCardImplementationMoveAdvancementChoice: ResolveChoice;
  };
  turn: {
    resolveCorpStartOfTurnOrderChoice: ResolveChoice;
    resolveCorpStartOfTurnRezChoice: ResolveChoice;
    resumeCorpStartOfTurnOrdering: ResumeChoice;
    resolveSatelliteMonitorsStartChoice: ResolveChoice;
    resolveRunnerStartOfTurnOrderChoice: ResolveChoice;
    resumeRunnerStartOfTurnOrdering: ResumeChoice;
  };
  constants: {
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE: string;
  };
};
