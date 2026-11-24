import type {
  CardCreditGainContinuation,
  CorpDrawContinuation,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { resolveInvestmentFirmCreditGainChoice } from "../economy/credit-gain";

import type { PendingChoiceResolutionHost } from "./pending-choice-resolution-host";
import { MissingChoiceResolverError } from "./choice-validation";
import {
  resolveReplacementChoiceAndResume,
  tryResolveDamageChoice,
} from "./pending-choice-damage";
import { dispatchPendingChoiceToDomains } from "./pending-choice-domain-dispatch";
export type { PendingChoiceResolutionHost } from "./pending-choice-resolution-host";

export function resolvePendingChoice(
  host: PendingChoiceResolutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const state = host.state;

  const choiceId = String(legalAction.payload?.choiceId ?? "");
  if (!state.pendingChoice || state.pendingChoice.choiceId !== choiceId)
    throw new Error("Diese Choice ist nicht offen.");
  if (
    state.pendingChoice.source === "card_implementation.fort_capacity_cleanup"
  ) {
    host.lifecycle.resolveFortCapacityCleanupChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source === "setup.mulligan") {
    host.setup.resolveSetupMulliganChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source === "discard_phase") {
    host.setup.resolveDiscardChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v121.replacement")) {
    resolveReplacementChoiceAndResume(host, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("corp_start.order:")) {
    host.turn.resolveCorpStartOfTurnOrderChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("corp_start.rez:")) {
    host.turn.resolveCorpStartOfTurnRezChoice(state, legalAction, playerAction);
    return;
  }
  if (
    tryResolveDamageChoice(host, state.pendingChoice, legalAction, playerAction)
  )
    return;
  if (
    state.pendingChoice.source.startsWith("hidden_resource.post_meat_damage")
  ) {
    host.run.resolvePostMeatDamageHiddenResourceChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("corp.start_of_run_redirect")) {
    host.run.resolveStartOfRunFortUtilityChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("runner_run_start.order:")) {
    const suspended = host.run.resolveRunnerRunStartOrderChoice(
      state,
      legalAction,
      playerAction,
    );
    if (!suspended) {
      const damageSuspended = host.run.applyRunnerTraceCounterRunStartEffects(
        state,
        legalAction,
      );
      if (!damageSuspended && !state.winner && state.run)
        host.run.resumeRunStart(state, legalAction);
    }
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.classic_deflector",
    )
  ) {
    host.run.resolveClassicDeflectorChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("trace_success.hardware_wrecker:")
  ) {
    host.run.resolveTraceHardwareWreckerTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.trash_installed_program",
    )
  ) {
    host.run.resolveTrashProgramChoice(state, legalAction, playerAction);
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingTraceProgramTrashContinuation
    )
      host.run.resumeTraceProgramTrashContinuation(state, legalAction);
    return;
  }
  if (state.trace) {
    host.trace.resolveTraceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    dispatchPendingChoiceToDomains(
      host,
      state.pendingChoice,
      legalAction,
      playerAction,
    )
  )
    return;
  if (
    state.pendingChoice.source.startsWith("runner_program_trash_before_install")
  ) {
    host.runner.resolveRunnerProgramTrashBeforeInstallChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("runner_start.order:")) {
    host.turn.resolveRunnerStartOfTurnOrderChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("runner.checkpoint_memory_cleanup:")
  ) {
    host.runner.resolveRunnerMemoryCheckpointChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("runner_start.delayed_install:")) {
    host.runner.resolveDelayedInstallStartTurnChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1912.delayed_install_memory:") ||
    state.pendingChoice.source.startsWith("runner.delayed_install_destination:")
  ) {
    host.runner.resolveDelayedInstallPlacementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.multi_expose_installed_corp_cards",
    )
  ) {
    host.hiddenZone.resolveMultiExposeInstalledCorpCardsChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("corp.expose_prevention")) {
    host.hiddenZone.resolveExposePreventionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.derez_last_rezzed_black_ice_or_bad_publicity",
    )
  ) {
    host.hiddenZone.resolveSenatorialFieldTripChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "p3_36.expose_installed_cards_review:",
    ) ||
    state.pendingChoice.source.startsWith(
      "p3_36.expose_installed_card_review:",
    ) ||
    state.pendingChoice.source.startsWith("p3_36.expose_installed_card:") ||
    state.pendingChoice.source.startsWith("p3_36.expose_installed_cards")
  ) {
    host.hiddenZone.resolveExposeInstalledCorpCardsChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("proteus.pavit_bharat_replacement") ||
    state.pendingChoice.source.startsWith(
      "card_implementation.fort_hq_replacement",
    )
  ) {
    host.hiddenZone.resolveFortHqReplacementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "corp_installed_economy.credit_choice",
    )
  ) {
    host.hiddenZone.resolveCorpInstalledEconomyCreditChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("investment_firm.credit_gain:")) {
    const continuation: CardCreditGainContinuation | undefined =
      state.pendingCorpCreditGainReplacement?.continuation;
    resolveInvestmentFirmCreditGainChoice(state, legalAction, playerAction);
    if (continuation)
      host.replacement.resumeCardCreditGainContinuation(
        state,
        legalAction,
        continuation,
      );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.strategic_planning_group_draw:",
    )
  ) {
    const continuation: CorpDrawContinuation | undefined =
      state.pendingCorpDraw?.continuation;
    host.hiddenZone.resolveStrategicPlanningGroupDrawChoice(
      state,
      legalAction,
      playerAction,
    );
    if (continuation)
      host.replacement.resumeCorpDrawContinuation(
        state,
        legalAction,
        continuation,
      );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_61.crash_draw")) {
    host.hiddenZone.resolveCrashEverettDrawChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("classic.satellite_monitors")) {
    host.turn.resolveSatelliteMonitorsStartChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("runner_draw.draw_tax:") ||
    state.pendingChoice.source.startsWith("runner_draw.draw_tax_rez:")
  ) {
    host.hiddenZone.resolveRunnerDrawSequenceChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source ===
    "card_implementation.runner_installed_multi_trash"
  ) {
    host.hiddenZone.resolveRunnerInstalledMultiTrashChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source ===
    "card_implementation.counter_prevention_replacement"
  ) {
    host.hiddenZone.resolveVirusCounterPreventionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.advancement_placement",
    )
  ) {
    host.hiddenZone.resolveAdvancementPlacementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("card_implementation.hq_ice_swap")
  ) {
    host.run.resolveHqIceSwapChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.derez_rezzed_black_ice",
    )
  ) {
    host.hiddenZone.resolveDerezRezzedBlackIceChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.pay_rez_cost_trash_rezzed_ice",
    )
  ) {
    host.hiddenZone.resolvePayRezCostToTrashRezzedIceChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.corp_choice_rez_or_trash_ice_target",
    )
  ) {
    host.hiddenZone.resolveCorpChoiceRezOrTrashIceTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.corp_choice_rez_or_trash_ice_decision",
    )
  ) {
    host.hiddenZone.resolveCorpChoiceRezOrTrashIceDecisionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.trash_unrezzed_ice",
    )
  ) {
    host.hiddenZone.resolveTrashUnrezzedIceChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.random_dice_split",
    )
  ) {
    host.hiddenZone.resolveRandomDiceSplitChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      `${host.constants.RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE}:`,
    ) ||
    state.pendingChoice.source.startsWith(
      "card_implementation.runner_installed_connection_trash_bad_publicity:",
    )
  ) {
    host.hiddenZone.resolveRunnerInstalledConnectionTrashBadPublicityChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "runner.program_install_memory:access:",
    )
  ) {
    host.access.resolveAccessProgramInstallMemoryChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.current_access_free_trash:",
    )
  ) {
    host.access.resolveMercenaryCurrentAccessTrashChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "runner.program_install_memory:nonsearch:",
    )
  ) {
    host.hiddenZone.resolveNonSearchProgramInstallMemoryChoice(
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
    host.hiddenZone.resolveGripInstallTemporaryCreditChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    )
  ) {
    host.hiddenZone.resolveStackInstallRunCleanupChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.secret_spend_compare",
    ) ||
    state.pendingChoice.source === "card_implementation.vacuum_link_rewind"
  ) {
    host.run.resolveSecretSpendCompareChoiceInRunModule(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.paid_source_return_to_grip",
    )
  ) {
    host.hiddenZone.resolvePaidSourceReturnToGripChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.post_break_stealth_loss:")) {
    host.run.resolveHammerStealthLossChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "card_implementation.active_ice_program_trash",
    )
  ) {
    host.run.resolveActiveIceProgramTrashChoiceInRunModule(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_56.pass_ice_program_trash")) {
    host.run.resolvePassRezzedIceProgramTrashChoiceInRunModule(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("rez_interrupt.jack_out")) {
    host.run.resolveRezInterruptJackOutChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v191.incubator_transform")) {
    host.hiddenZone.resolveIncubatorTransformChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("broken_ice.virus_counter")) {
    host.run.resolveBrokenIceVirusCounterChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "runner_virus_counter_purge_replacement",
    )
  ) {
    host.hiddenZone.resolveVirusCounterPurgePreserveChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.aardvark")) {
    host.run.resolveAardvarkInterceptionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("p3_54.delayed_success") ||
    state.pendingChoice.source.startsWith(
      "classic.indiscriminate_response_team:",
    )
  ) {
    host.run.resolveSuccessfulRunInterventionChoiceInRunModule(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("proteus.return_runner_programs") ||
    state.pendingChoice.source.startsWith("classic.shock_treatment_programs")
  ) {
    host.hiddenZone.resolveRunnerProgramReturnChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("p3_35.access_payment") ||
    state.pendingChoice.source.startsWith("p3_35.access_activation")
  ) {
    host.cardImplementation.resolveCardImplementationAccessPaymentChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("successful_run.credit_loss_spend")
  ) {
    host.access.resolveSuccessfulRunCreditLossSpendChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("successful_run.gypsy_rd_reveal")) {
    host.access.resolveRevealRdUntilAgendaStoreInHqChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.private_look")) {
    host.hiddenZone.resolveRunnerPrivateLookChoice(state, legalAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("pre_access.top_rd_reorder")) {
    host.access.resolvePreAccessTopRdReorderChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.distribute_advancement")) {
    host.cardImplementation.resolveCardImplementationAdvancementDistributionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.move_advancement")) {
    host.cardImplementation.resolveCardImplementationMoveAdvancementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  throw new MissingChoiceResolverError(state.pendingChoice.source);
}
