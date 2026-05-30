import type { GameState, LegalAction, PlayerAction } from "@netgrid/shared";

type HostFn<T = unknown> = (...args: any[]) => T;

export type PendingChoiceResolutionHost = {
  state: GameState;
  setup: {
    resolveSetupMulliganChoice: HostFn<void>;
    resolveDiscardChoice: HostFn<void>;
  };
  replacement: {
    resolveReplacementChoice: HostFn<void>;
    resolveEventModificationChoice: HostFn<void>;
    resolvePdcaDamageReplacementChoice: HostFn<void>;
  };
  trace: {
    resolveTraceChoice: HostFn<void>;
  };
  hiddenZone: {
    handleHiddenZoneArrangeChoice: HostFn<{ handled: boolean }>;
    hiddenZoneArrangeChoiceHandlerHost: HostFn<unknown>;
    handleHiddenZoneNonSearchChoice: HostFn<{ handled: boolean }>;
    hiddenZoneNonSearchChoiceHandlerHost: HostFn<unknown>;
    handleCorpZoneChoice: HostFn<{ handled: boolean }>;
    corpZoneChoiceHandlerHost: HostFn<unknown>;
    isP358HiddenReplacementCompatibilityChoiceSource: HostFn<boolean>;
    resolveP358HiddenReplacementChoice: HostFn<void>;
    handleHiddenZoneSearchChoice: HostFn<{ handled: boolean; deletePendingChoice?: boolean }>;
    hiddenZoneSearchChoiceHandlerHost: HostFn<unknown>;
    resolveHuntClubBbsExposeChoice: HostFn<void>;
    resolveExposeInstalledCorpCardsChoice: HostFn<void>;
    resolveInvestmentFirmCreditChoice: HostFn<void>;
    resolveCrashEverettDrawChoice: HostFn<void>;
    resolvePowerGridOverloadChoice: HostFn<void>;
    resolveSystematicLayoffsAdvancementChoice: HostFn<void>;
    resolveAnonymousTipDerezBlackIceChoice: HostFn<void>;
    resolveCoreCommandJettisonIceChoice: HostFn<void>;
    resolveForgedActivationOrdersTargetChoice: HostFn<void>;
    resolveForgedActivationOrdersCorpChoice: HostFn<void>;
    resolveSecurityCodeWormChipTrashIceChoice: HostFn<void>;
    resolveV1921PlayfulAiChoice: HostFn<void>;
    resolveRunnerInstalledConnectionTrashBadPublicityChoice: HostFn<void>;
    resolveGripInstallTemporaryCreditChoice: HostFn<void>;
    resolveStackInstallRunCleanupChoice: HostFn<void>;
    resolveOpenEndedMileageProgramReturnChoice: HostFn<void>;
    resolveRunnerHostingChoice: HostFn<void>;
    resolveIncubatorTransformChoice: HostFn<void>;
    resolveCodeViralCachePurgeChoice: HostFn<void>;
    resolveChimeraDaemonTrashChoice: HostFn<void>;
    resolveRunnerProgramReturnChoice: HostFn<void>;
    resolveRunnerPrivateLookChoice: HostFn<void>;
    resolveExposePreventionChoice: HostFn<void>;
    resolveSenatorialFieldTripChoice: HostFn<void>;
    resolveFortHqReplacementChoice?: HostFn<void>;
  };
  corp: {
    handleCorpInstallRezSequenceChoice: HostFn<{ handled: boolean }>;
    corpInstallRezSequenceHandlerHost: HostFn<unknown>;
    handleScoredAgendaFlowChoice: HostFn<{ handled: boolean }>;
    scoredAgendaFlowHost: HostFn<unknown>;
  };
  runner: {
    resolveRunnerProgramTrashBeforeInstallChoice: HostFn<void>;
  };
  run: {
    resolveSingaporeCityGridSwapChoice: HostFn<void>;
    fortPassWindowHostForState: HostFn<unknown>;
    resolveTooManyDoorsSecretSpendChoiceInRunModule: HostFn<void>;
    encounterSpecialWindowHostForState: HostFn<unknown>;
    resolveHammerStealthLossChoice: HostFn<void>;
    fortRunSideFamiliesHostForState: HostFn<unknown>;
    resolveViral15ProgramTrashChoiceInRunModule: HostFn<void>;
    encounterResolutionHostForState: HostFn<unknown>;
    resolvePassRezzedIceProgramTrashChoiceInRunModule: HostFn<void>;
    resolveSpeedTrapRezInterruptChoice: HostFn<void>;
    runRezWindowHostForState: HostFn<unknown>;
    resolvePattelsVirusCounterChoice: HostFn<void>;
    runEndCleanupHost: HostFn<unknown>;
    resolveAardvarkInterceptionChoice: HostFn<void>;
    resolveSuccessfulRunInterventionChoiceInRunModule: HostFn<void>;
    successfulRunInterventionHost: HostFn<unknown>;
    resolvePostMeatDamageHiddenResourceChoice: HostFn<void>;
    resolveStartOfRunFortUtilityChoice: HostFn<void>;
  };
  access: {
    resolvePriorityWreckSpendChoice: HostFn<void>;
    runAccessTransitionHost: HostFn<unknown>;
    resolveMicrotechAiInterfacePreAccessChoice: HostFn<void>;
  };
  cardImplementation: {
    resolveCardImplementationAccessPaymentChoice: HostFn<void>;
    resolveCardImplementationAdvancementDistributionChoice: HostFn<void>;
    resolveCardImplementationMoveAdvancementChoice: HostFn<void>;
  };
  constants: {
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE: string;
  };
};

export function resolvePendingChoice(
  host: PendingChoiceResolutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const state = host.state;
  const resolveSetupMulliganChoice = host.setup.resolveSetupMulliganChoice;
  const resolveDiscardChoice = host.setup.resolveDiscardChoice;
  const resolveReplacementChoice = host.replacement.resolveReplacementChoice;
  const resolveEventModificationChoice =
    host.replacement.resolveEventModificationChoice;
  const resolvePdcaDamageReplacementChoice =
    host.replacement.resolvePdcaDamageReplacementChoice;
  const resolveTraceChoice = host.trace.resolveTraceChoice;
  const handleHiddenZoneArrangeChoice =
    host.hiddenZone.handleHiddenZoneArrangeChoice;
  const hiddenZoneArrangeChoiceHandlerHost =
    host.hiddenZone.hiddenZoneArrangeChoiceHandlerHost;
  const handleHiddenZoneNonSearchChoice =
    host.hiddenZone.handleHiddenZoneNonSearchChoice;
  const hiddenZoneNonSearchChoiceHandlerHost =
    host.hiddenZone.hiddenZoneNonSearchChoiceHandlerHost;
  const handleCorpZoneChoice = host.hiddenZone.handleCorpZoneChoice;
  const corpZoneChoiceHandlerHost = host.hiddenZone.corpZoneChoiceHandlerHost;
  const isP358HiddenReplacementCompatibilityChoiceSource =
    host.hiddenZone.isP358HiddenReplacementCompatibilityChoiceSource;
  const resolveP358HiddenReplacementChoice =
    host.hiddenZone.resolveP358HiddenReplacementChoice;
  const handleHiddenZoneSearchChoice =
    host.hiddenZone.handleHiddenZoneSearchChoice;
  const hiddenZoneSearchChoiceHandlerHost =
    host.hiddenZone.hiddenZoneSearchChoiceHandlerHost;
  const resolveHuntClubBbsExposeChoice =
    host.hiddenZone.resolveHuntClubBbsExposeChoice;
  const resolveExposeInstalledCorpCardsChoice =
    host.hiddenZone.resolveExposeInstalledCorpCardsChoice;
  const resolveInvestmentFirmCreditChoice =
    host.hiddenZone.resolveInvestmentFirmCreditChoice;
  const resolveCrashEverettDrawChoice =
    host.hiddenZone.resolveCrashEverettDrawChoice;
  const resolvePowerGridOverloadChoice =
    host.hiddenZone.resolvePowerGridOverloadChoice;
  const resolveSystematicLayoffsAdvancementChoice =
    host.hiddenZone.resolveSystematicLayoffsAdvancementChoice;
  const resolveAnonymousTipDerezBlackIceChoice =
    host.hiddenZone.resolveAnonymousTipDerezBlackIceChoice;
  const resolveCoreCommandJettisonIceChoice =
    host.hiddenZone.resolveCoreCommandJettisonIceChoice;
  const resolveForgedActivationOrdersTargetChoice =
    host.hiddenZone.resolveForgedActivationOrdersTargetChoice;
  const resolveForgedActivationOrdersCorpChoice =
    host.hiddenZone.resolveForgedActivationOrdersCorpChoice;
  const resolveSecurityCodeWormChipTrashIceChoice =
    host.hiddenZone.resolveSecurityCodeWormChipTrashIceChoice;
  const resolveV1921PlayfulAiChoice =
    host.hiddenZone.resolveV1921PlayfulAiChoice;
  const resolveRunnerInstalledConnectionTrashBadPublicityChoice =
    host.hiddenZone.resolveRunnerInstalledConnectionTrashBadPublicityChoice;
  const resolveGripInstallTemporaryCreditChoice =
    host.hiddenZone.resolveGripInstallTemporaryCreditChoice;
  const resolveStackInstallRunCleanupChoice =
    host.hiddenZone.resolveStackInstallRunCleanupChoice;
  const resolveOpenEndedMileageProgramReturnChoice =
    host.hiddenZone.resolveOpenEndedMileageProgramReturnChoice;
  const resolveRunnerHostingChoice = host.hiddenZone.resolveRunnerHostingChoice;
  const resolveIncubatorTransformChoice =
    host.hiddenZone.resolveIncubatorTransformChoice;
  const resolveCodeViralCachePurgeChoice =
    host.hiddenZone.resolveCodeViralCachePurgeChoice;
  const resolveChimeraDaemonTrashChoice =
    host.hiddenZone.resolveChimeraDaemonTrashChoice;
  const resolveRunnerProgramReturnChoice =
    host.hiddenZone.resolveRunnerProgramReturnChoice;
  const resolveRunnerPrivateLookChoice =
    host.hiddenZone.resolveRunnerPrivateLookChoice;
  const resolveExposePreventionChoice =
    host.hiddenZone.resolveExposePreventionChoice;
  const resolveSenatorialFieldTripChoice =
    host.hiddenZone.resolveSenatorialFieldTripChoice;
  const resolveFortHqReplacementChoice =
    host.hiddenZone.resolveFortHqReplacementChoice;
  const handleCorpInstallRezSequenceChoice =
    host.corp.handleCorpInstallRezSequenceChoice;
  const corpInstallRezSequenceHandlerHost =
    host.corp.corpInstallRezSequenceHandlerHost;
  const handleScoredAgendaFlowChoice = host.corp.handleScoredAgendaFlowChoice;
  const scoredAgendaFlowHost = host.corp.scoredAgendaFlowHost;
  const resolveRunnerProgramTrashBeforeInstallChoice =
    host.runner.resolveRunnerProgramTrashBeforeInstallChoice;
  const resolveSingaporeCityGridSwapChoice =
    host.run.resolveSingaporeCityGridSwapChoice;
  const fortPassWindowHostForState = host.run.fortPassWindowHostForState;
  const resolveTooManyDoorsSecretSpendChoiceInRunModule =
    host.run.resolveTooManyDoorsSecretSpendChoiceInRunModule;
  const encounterSpecialWindowHostForState =
    host.run.encounterSpecialWindowHostForState;
  const resolveHammerStealthLossChoice =
    host.run.resolveHammerStealthLossChoice;
  const fortRunSideFamiliesHostForState =
    host.run.fortRunSideFamiliesHostForState;
  const resolveViral15ProgramTrashChoiceInRunModule =
    host.run.resolveViral15ProgramTrashChoiceInRunModule;
  const encounterResolutionHostForState =
    host.run.encounterResolutionHostForState;
  const resolvePassRezzedIceProgramTrashChoiceInRunModule =
    host.run.resolvePassRezzedIceProgramTrashChoiceInRunModule;
  const resolveSpeedTrapRezInterruptChoice =
    host.run.resolveSpeedTrapRezInterruptChoice;
  const runRezWindowHostForState = host.run.runRezWindowHostForState;
  const resolvePattelsVirusCounterChoice =
    host.run.resolvePattelsVirusCounterChoice;
  const runEndCleanupHost = host.run.runEndCleanupHost;
  const resolveAardvarkInterceptionChoice =
    host.run.resolveAardvarkInterceptionChoice;
  const resolveSuccessfulRunInterventionChoiceInRunModule =
    host.run.resolveSuccessfulRunInterventionChoiceInRunModule;
  const successfulRunInterventionHost = host.run.successfulRunInterventionHost;
  const resolvePostMeatDamageHiddenResourceChoice =
    host.run.resolvePostMeatDamageHiddenResourceChoice;
  const resolveStartOfRunFortUtilityChoice =
    host.run.resolveStartOfRunFortUtilityChoice;
  const resolvePriorityWreckSpendChoice =
    host.access.resolvePriorityWreckSpendChoice;
  const runAccessTransitionHost = host.access.runAccessTransitionHost;
  const resolveMicrotechAiInterfacePreAccessChoice =
    host.access.resolveMicrotechAiInterfacePreAccessChoice;
  const resolveCardImplementationAccessPaymentChoice =
    host.cardImplementation.resolveCardImplementationAccessPaymentChoice;
  const resolveCardImplementationAdvancementDistributionChoice =
    host.cardImplementation.resolveCardImplementationAdvancementDistributionChoice;
  const resolveCardImplementationMoveAdvancementChoice =
    host.cardImplementation.resolveCardImplementationMoveAdvancementChoice;
  const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE =
    host.constants.RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE;

  const choiceId = String(legalAction.payload?.choiceId ?? "");
  if (!state.pendingChoice || state.pendingChoice.choiceId !== choiceId)
    throw new Error("Diese Choice ist nicht offen.");
  if (state.pendingChoice.source === "setup.mulligan") {
    resolveSetupMulliganChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source === "discard_phase") {
    resolveDiscardChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v121.replacement")) {
    resolveReplacementChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v120.event_modification")) {
    resolveEventModificationChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("proteus.pdca_damage_replacement")) {
    resolvePdcaDamageReplacementChoice(state, legalAction, playerAction);
    return;
  }
  if (state.trace) {
    resolveTraceChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("hidden_resource.post_meat_damage")) {
    resolvePostMeatDamageHiddenResourceChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("corp.start_of_run_redirect")) {
    resolveStartOfRunFortUtilityChoice(state, legalAction, playerAction);
    return;
  }
  const hiddenZoneArrangeChoice = handleHiddenZoneArrangeChoice(
    hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneArrangeChoice.handled) return;
  const hiddenZoneNonSearchChoice = handleHiddenZoneNonSearchChoice(
    hiddenZoneNonSearchChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneNonSearchChoice.handled) return;
  const corpZoneChoice = handleCorpZoneChoice(
    corpZoneChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (corpZoneChoice.handled) return;
  const corpInstallRezSequenceChoice = handleCorpInstallRezSequenceChoice(
    corpInstallRezSequenceHandlerHost(state, legalAction, playerAction),
  );
  if (corpInstallRezSequenceChoice.handled) return;
  const scoredAgendaFlowChoice = handleScoredAgendaFlowChoice(
    scoredAgendaFlowHost(state, legalAction, playerAction),
  );
  if (scoredAgendaFlowChoice.handled) return;
  if (
    isP358HiddenReplacementCompatibilityChoiceSource(
      state.pendingChoice.source,
    )
  ) {
    resolveP358HiddenReplacementChoice(state, legalAction, playerAction);
    return;
  }
  const hiddenZoneSearchChoice = handleHiddenZoneSearchChoice(
    hiddenZoneSearchChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneSearchChoice.handled) {
    if (hiddenZoneSearchChoice.deletePendingChoice) delete state.pendingChoice;
    return;
  }
  if (
    state.pendingChoice.source.startsWith("runner_program_trash_before_install")
  ) {
    resolveRunnerProgramTrashBeforeInstallChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1912.hunt_club_bbs_expose")) {
    resolveHuntClubBbsExposeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("corp.expose_prevention")) {
    resolveExposePreventionChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.derez_last_rezzed_black_ice_or_bad_publicity",
    )
  ) {
    resolveSenatorialFieldTripChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_36.expose_installed_cards")) {
    resolveExposeInstalledCorpCardsChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("proteus.pavit_bharat_replacement") ||
    state.pendingChoice.source.startsWith("card_implementation.fort_hq_replacement")
  ) {
    if (!resolveFortHqReplacementChoice)
      throw new Error("Pavit-Bharat-Choice-Resolver fehlt.");
    resolveFortHqReplacementChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1917.investment_firm_credit")) {
    resolveInvestmentFirmCreditChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_61.crash_draw")) {
    resolveCrashEverettDrawChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1914.power_grid_overload")) {
    resolvePowerGridOverloadChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1919.systematic_layoffs_advancement",
    )
  ) {
    resolveSystematicLayoffsAdvancementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1918.singapore_city_grid")) {
    resolveSingaporeCityGridSwapChoice(
      fortPassWindowHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.anonymous_tip_derez_black_ice")
  ) {
    resolveAnonymousTipDerezBlackIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.core_command_jettison_ice")
  ) {
    resolveCoreCommandJettisonIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.forged_activation_orders_target",
    )
  ) {
    resolveForgedActivationOrdersTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.forged_activation_orders_corp")
  ) {
    resolveForgedActivationOrdersCorpChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.security_code_worm_chip")) {
    resolveSecurityCodeWormChipTrashIceChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1921.playful_ai")) {
    resolveV1921PlayfulAiChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      `${RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE}:`,
    ) ||
    state.pendingChoice.source.startsWith(
      "card_implementation.runner_installed_connection_trash_bad_publicity:",
    )
  ) {
    resolveRunnerInstalledConnectionTrashBadPublicityChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.pro018_grip_install_temporary_credits:",
    )
  ) {
    resolveGripInstallTemporaryCreditChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    )
  ) {
    resolveStackInstallRunCleanupChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("p3_56.too_many_doors_secret_spend")
  ) {
    resolveTooManyDoorsSecretSpendChoiceInRunModule(
      encounterSpecialWindowHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.open_ended_mileage_return")
  ) {
    resolveOpenEndedMileageProgramReturnChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.hammer_stealth_loss")
  ) {
    resolveHammerStealthLossChoice(
      fortRunSideFamiliesHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.viral_15_program_trash")
  ) {
    resolveViral15ProgramTrashChoiceInRunModule(
      encounterResolutionHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("p3_56.pass_ice_program_trash")
  ) {
    resolvePassRezzedIceProgramTrashChoiceInRunModule(
      encounterResolutionHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.speed_trap")) {
    resolveSpeedTrapRezInterruptChoice(
      runRezWindowHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v099.host_program")) {
    resolveRunnerHostingChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v191.incubator_transform")) {
    resolveIncubatorTransformChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v181.pattels_virus")) {
    resolvePattelsVirusCounterChoice(
      runEndCleanupHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1913.code_viral_cache_purge")) {
    resolveCodeViralCachePurgeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.aardvark")) {
    resolveAardvarkInterceptionChoice(
      fortRunSideFamiliesHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_54.delayed_success")) {
    resolveSuccessfulRunInterventionChoiceInRunModule(
      successfulRunInterventionHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.chimera_daemon_trash")) {
    resolveChimeraDaemonTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("proteus.return_runner_programs")) {
    resolveRunnerProgramReturnChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_35.access_payment")) {
    resolveCardImplementationAccessPaymentChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.priority_wreck")) {
    resolvePriorityWreckSpendChoice(
      runAccessTransitionHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.private_look")) {
    resolveRunnerPrivateLookChoice(state, legalAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.microtech_ai_interface")) {
    resolveMicrotechAiInterfacePreAccessChoice(
      runAccessTransitionHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.distribute_advancement")) {
    resolveCardImplementationAdvancementDistributionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.move_advancement")) {
    resolveCardImplementationMoveAdvancementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  delete state.pendingChoice;
}
