import type { ChoiceRequest, LegalAction, PlayerAction } from "@netgrid/shared";
import type { PendingChoiceResolutionHost } from "./pending-choice-resolution-host";

export function dispatchPendingChoiceToDomains(
  host: PendingChoiceResolutionHost,
  choice: ChoiceRequest,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): boolean {
  const state = host.state;
  const hiddenZoneArrangeChoice = host.hiddenZone.handleHiddenZoneArrangeChoice(
    state,
    legalAction,
    playerAction,
  );
  if (hiddenZoneArrangeChoice.handled) return true;
  const resumesRunnerStartOrdering = choice.source.startsWith(
    "runner.installed_resource_trash_for_credits:",
  );
  const hiddenZoneNonSearchChoice =
    host.hiddenZone.handleHiddenZoneNonSearchChoice(
      state,
      legalAction,
      playerAction,
    );
  if (hiddenZoneNonSearchChoice.handled) {
    if (resumesRunnerStartOrdering && !state.pendingChoice)
      host.turn.resumeRunnerStartOfTurnOrdering(state, legalAction);
    return true;
  }
  const resumesCorpStartOrderingAfterCorpZone = choice.source.startsWith(
    "p3_36.show_hq_agendas_for_credits:",
  );
  const corpZoneChoice = host.hiddenZone.handleCorpZoneChoice(
    state,
    legalAction,
    playerAction,
  );
  if (corpZoneChoice.handled) {
    if (resumesCorpStartOrderingAfterCorpZone && !state.pendingChoice)
      host.turn.resumeCorpStartOfTurnOrdering(state, legalAction);
    return true;
  }
  const corpInstallRezSequenceChoice =
    host.corp.handleCorpInstallRezSequenceChoice(
      state,
      legalAction,
      playerAction,
    );
  if (corpInstallRezSequenceChoice.handled) return true;
  const resumesCorpStartOrdering = choice.source.startsWith(
    "scored_agenda.start_draw_choice",
  );
  const scoredAgendaFlowChoice = host.corp.handleScoredAgendaFlowChoice(
    state,
    legalAction,
    playerAction,
  );
  if (scoredAgendaFlowChoice.handled) {
    if (resumesCorpStartOrdering && !state.pendingChoice)
      host.turn.resumeCorpStartOfTurnOrdering(state, legalAction);
    return true;
  }
  if (host.hiddenZone.isHiddenZoneChoiceSource(choice.source)) {
    host.hiddenZone.resolveP358HiddenReplacementChoice(
      state,
      legalAction,
      playerAction,
    );
    return true;
  }
  const hiddenZoneSearchChoice = host.hiddenZone.handleHiddenZoneSearchChoice(
    state,
    legalAction,
    playerAction,
  );
  if (hiddenZoneSearchChoice.handled) {
    if (hiddenZoneSearchChoice.deletePendingChoice) delete state.pendingChoice;
    return true;
  }
  return false;
}
