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
    resolveMultiExposeInstalledCorpCardsChoice: HostFn<void>;
    resolveExposeInstalledCorpCardsChoice: HostFn<void>;
    resolveCorpInstalledEconomyCreditChoice: HostFn<void>;
    resolveCrashEverettDrawChoice: HostFn<void>;
    resolvePowerGridOverloadChoice: HostFn<void>;
    resolveSystematicLayoffsAdvancementChoice: HostFn<void>;
    resolveDerezRezzedBlackIceChoice: HostFn<void>;
    resolvePayRezCostToTrashRezzedIceChoice: HostFn<void>;
    resolveCorpChoiceRezOrTrashIceTargetChoice: HostFn<void>;
    resolveCorpChoiceRezOrTrashIceDecisionChoice: HostFn<void>;
    resolveTrashUnrezzedIceChoice: HostFn<void>;
    resolveV1921PlayfulAiChoice: HostFn<void>;
    resolveRunnerInstalledConnectionTrashBadPublicityChoice: HostFn<void>;
    resolveGripInstallTemporaryCreditChoice: HostFn<void>;
    resolveStackInstallRunCleanupChoice: HostFn<void>;
    resolvePaidSourceReturnToGripChoice: HostFn<void>;
    resolveRunnerHostingChoice: HostFn<void>;
    resolveIncubatorTransformChoice: HostFn<void>;
    resolveVirusCounterPurgePreserveChoice: HostFn<void>;
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
    resolveHqIceSwapChoice: HostFn<void>;
    fortPassWindowHostForState: HostFn<unknown>;
    resolveTooManyDoorsSecretSpendChoiceInRunModule: HostFn<void>;
    encounterSpecialWindowHostForState: HostFn<unknown>;
    resolveHammerStealthLossChoice: HostFn<void>;
    fortRunSideFamiliesHostForState: HostFn<unknown>;
    resolveViral15ProgramTrashChoiceInRunModule: HostFn<void>;
    encounterResolutionHostForState: HostFn<unknown>;
    resolvePassRezzedIceProgramTrashChoiceInRunModule: HostFn<void>;
    resolveRezInterruptJackOutChoice: HostFn<void>;
    runRezWindowHostForState: HostFn<unknown>;
    resolveBrokenIceVirusCounterChoice: HostFn<void>;
    runEndCleanupHost: HostFn<unknown>;
    resolveAardvarkInterceptionChoice: HostFn<void>;
    resolveSuccessfulRunInterventionChoiceInRunModule: HostFn<void>;
    successfulRunInterventionHost: HostFn<unknown>;
    resolvePostMeatDamageHiddenResourceChoice: HostFn<void>;
    resolveStartOfRunFortUtilityChoice: HostFn<void>;
  };
  access: {
    resolveSuccessfulRunCreditLossSpendChoice: HostFn<void>;
    runAccessTransitionHost: HostFn<unknown>;
    resolvePreAccessTopRdReorderChoice: HostFn<void>;
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
  const resolveMultiExposeInstalledCorpCardsChoice =
    host.hiddenZone.resolveMultiExposeInstalledCorpCardsChoice;
  const resolveExposeInstalledCorpCardsChoice =
    host.hiddenZone.resolveExposeInstalledCorpCardsChoice;
  const resolveCorpInstalledEconomyCreditChoice =
    host.hiddenZone.resolveCorpInstalledEconomyCreditChoice;
  const resolveCrashEverettDrawChoice =
    host.hiddenZone.resolveCrashEverettDrawChoice;
  const resolvePowerGridOverloadChoice =
    host.hiddenZone.resolvePowerGridOverloadChoice;
  const resolveSystematicLayoffsAdvancementChoice =
    host.hiddenZone.resolveSystematicLayoffsAdvancementChoice;
  const resolveDerezRezzedBlackIceChoice =
    host.hiddenZone.resolveDerezRezzedBlackIceChoice;
  const resolvePayRezCostToTrashRezzedIceChoice =
    host.hiddenZone.resolvePayRezCostToTrashRezzedIceChoice;
  const resolveCorpChoiceRezOrTrashIceTargetChoice =
    host.hiddenZone.resolveCorpChoiceRezOrTrashIceTargetChoice;
  const resolveCorpChoiceRezOrTrashIceDecisionChoice =
    host.hiddenZone.resolveCorpChoiceRezOrTrashIceDecisionChoice;
  const resolveTrashUnrezzedIceChoice =
    host.hiddenZone.resolveTrashUnrezzedIceChoice;
  const resolveV1921PlayfulAiChoice =
    host.hiddenZone.resolveV1921PlayfulAiChoice;
  const resolveRunnerInstalledConnectionTrashBadPublicityChoice =
    host.hiddenZone.resolveRunnerInstalledConnectionTrashBadPublicityChoice;
  const resolveGripInstallTemporaryCreditChoice =
    host.hiddenZone.resolveGripInstallTemporaryCreditChoice;
  const resolveStackInstallRunCleanupChoice =
    host.hiddenZone.resolveStackInstallRunCleanupChoice;
  const resolvePaidSourceReturnToGripChoice =
    host.hiddenZone.resolvePaidSourceReturnToGripChoice;
  const resolveRunnerHostingChoice = host.hiddenZone.resolveRunnerHostingChoice;
  const resolveIncubatorTransformChoice =
    host.hiddenZone.resolveIncubatorTransformChoice;
  const resolveVirusCounterPurgePreserveChoice =
    host.hiddenZone.resolveVirusCounterPurgePreserveChoice;
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
  const resolveHqIceSwapChoice =
    host.run.resolveHqIceSwapChoice;
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
  const resolveRezInterruptJackOutChoice =
    host.run.resolveRezInterruptJackOutChoice;
  const runRezWindowHostForState = host.run.runRezWindowHostForState;
  const resolveBrokenIceVirusCounterChoice =
    host.run.resolveBrokenIceVirusCounterChoice;
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
  const resolveSuccessfulRunCreditLossSpendChoice =
    host.access.resolveSuccessfulRunCreditLossSpendChoice;
  const runAccessTransitionHost = host.access.runAccessTransitionHost;
  const resolvePreAccessTopRdReorderChoice =
    host.access.resolvePreAccessTopRdReorderChoice;
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
  if (state.pendingChoice.source.startsWith("card_implementation.multi_expose_installed_corp_cards")) {
    resolveMultiExposeInstalledCorpCardsChoice(state, legalAction, playerAction);
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
  if (
    state.pendingChoice.source.startsWith("p3_36.expose_installed_card_review:") ||
    state.pendingChoice.source.startsWith("p3_36.expose_installed_card:") ||
    state.pendingChoice.source.startsWith("p3_36.expose_installed_cards")
  ) {
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
  if (state.pendingChoice.source.startsWith("corp_installed_economy.credit_choice")) {
    resolveCorpInstalledEconomyCreditChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_61.crash_draw")) {
    resolveCrashEverettDrawChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1914.installed_hardware_trash_by_power_counters")) {
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
    resolveHqIceSwapChoice(
      fortPassWindowHostForState(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("card_implementation.derez_rezzed_black_ice")
  ) {
    resolveDerezRezzedBlackIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("card_implementation.pay_rez_cost_trash_rezzed_ice")
  ) {
    resolvePayRezCostToTrashRezzedIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.corp_choice_rez_or_trash_ice_target",
    )
  ) {
    resolveCorpChoiceRezOrTrashIceTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("card_implementation.corp_choice_rez_or_trash_ice_decision")
  ) {
    resolveCorpChoiceRezOrTrashIceDecisionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("card_implementation.trash_unrezzed_ice")) {
    resolveTrashUnrezzedIceChoice(state, legalAction, playerAction);
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
    state.pendingChoice.source.startsWith("card_implementation.paid_source_return_to_grip")
  ) {
    resolvePaidSourceReturnToGripChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("rez_interrupt.jack_out")) {
    resolveRezInterruptJackOutChoice(
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
  if (state.pendingChoice.source.startsWith("broken_ice.virus_counter")) {
    resolveBrokenIceVirusCounterChoice(
      runEndCleanupHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("runner_virus_counter_purge_replacement")
  ) {
    resolveVirusCounterPurgePreserveChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("successful_run.credit_loss_spend")) {
    resolveSuccessfulRunCreditLossSpendChoice(
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
  if (state.pendingChoice.source.startsWith("pre_access.top_rd_reorder")) {
    resolvePreAccessTopRdReorderChoice(
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
