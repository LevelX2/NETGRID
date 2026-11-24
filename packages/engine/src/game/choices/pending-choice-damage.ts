import type {
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type { PendingChoiceResolutionHost } from "./pending-choice-resolution-host";

export function resolveReplacementChoiceAndResume(
  host: PendingChoiceResolutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const state = host.state;
  host.replacement.resolveReplacementChoice(state, legalAction, playerAction);
  resumeAccessDamageIfReady(host, state, legalAction);
  resumeRunStartDamageIfReady(host, state, legalAction);
}

export function tryResolveDamageChoice(
  host: PendingChoiceResolutionHost,
  choice: ChoiceRequest,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): boolean {
  const state = host.state;
  const source = choice.source;
  if (source.startsWith("v120.event_modification")) {
    host.replacement.resolveEventModificationChoice(
      state,
      legalAction,
      playerAction,
    );
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingAddTagContinuation
    )
      host.replacement.resumeAddTagContinuation(state, legalAction);
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingTraceProgramTrashContinuation
    )
      host.run.resumeTraceProgramTrashContinuation(state, legalAction);
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingPreventableTrashCostContinuation
    )
      host.cardImplementation.resumePreventableTrashCostContinuation(
        state,
        legalAction,
      );
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingTraceHardwareWreckerContinuation?.stage ===
        "trash_prevention"
    )
      host.run.resumeTraceHardwareWreckerAfterTrash(state, legalAction);
    if (
      !state.pendingChoice &&
      !state.eventModificationWindow &&
      state.pendingRunEndTrashContinuation
    )
      host.run.resumeRunEndTrashUsedBreakers(state, legalAction);
    resumeRunStartDamageIfReady(host, state, legalAction);
    resumeDamageFollowupIfReady(host, state, legalAction);
    resumeAccessDamageIfReady(host, state, legalAction);
    return true;
  }
  if (source.startsWith("damage_replacement:")) {
    host.replacement.resolvePdcaDamageReplacementChoice(
      state,
      legalAction,
      playerAction,
    );
    resumeRunStartDamageIfReady(host, state, legalAction);
    resumeDamageFollowupIfReady(host, state, legalAction);
    resumeAccessDamageIfReady(host, state, legalAction);
    return true;
  }
  return false;
}

function resumeDamageFollowupIfReady(
  host: PendingChoiceResolutionHost,
  state: GameState,
  legalAction: LegalAction,
): void {
  const followup = state.pendingDamageFollowup;
  if (!followup || state.pendingChoice || state.eventModificationWindow) return;
  delete state.pendingDamageFollowup;
  if (state.winner) return;
  const source = state.cardInstances[followup.sourceCardInstanceId];
  const stillInstalled = state.corp.servers.some((server) =>
    server.root.includes(followup.sourceCardInstanceId),
  );
  if (!source || !stillInstalled) return;
  host.lifecycle.trashCorpInstalledCardToArchives(
    state,
    followup.sourceCardInstanceId,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: followup.sourceDefinitionId,
    selfTrashed: true,
  };
}

function resumeAccessDamageIfReady(
  host: PendingChoiceResolutionHost,
  state: GameState,
  legalAction: LegalAction,
): void {
  if (
    state.pendingChoice ||
    state.eventModificationWindow ||
    state.replacementWindow ||
    !state.pendingAccessEffectDamageContinuation
  )
    return;
  host.access.resumeAccessEffectAfterDamagePrevention(state, legalAction);
}

function resumeRunStartDamageIfReady(
  host: PendingChoiceResolutionHost,
  state: GameState,
  legalAction: LegalAction,
): void {
  if (
    state.pendingChoice ||
    state.eventModificationWindow ||
    state.replacementWindow ||
    !state.pendingRunStartDamageContinuation
  )
    return;
  const suspended = host.run.resumeRunnerTraceCounterRunStartEffects(
    state,
    legalAction,
  );
  if (!suspended && !state.winner && state.run)
    host.run.resumeRunStart(state, legalAction);
}
