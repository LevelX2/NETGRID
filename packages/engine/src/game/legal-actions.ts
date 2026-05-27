import type { ChoiceRequest, GameState, LegalAction, Side } from "@netgrid/shared";
import {
  isApproachIceExposeViewingWindowOpen,
  isApproachIceExposeWindowOpen,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  type EncounterEntryHost,
} from "./run/encounter-entry";
import {
  buildRunnerEncounterActions,
  buildRunnerMovementActions,
  type RunnerEncounterActionHost,
} from "./run/encounter-actions";
import {
  buildCorpPostPassIceReturnToHqActions,
  buildRunnerPostPassFutureStrengthActions,
  type RunMovementHost,
} from "./run/run-movement";
import {
  buildCorpApproachActions,
  buildCorpRunRootRezWindowActions,
  isCorpRunRootRezWindowOpen,
  type RunRezWindowHost,
} from "./run/run-rez-window";
import { buildRunnerAccessActions, type RunnerAccessActionHost } from "./access/access-actions";
import {
  buildCorpEncounterCardImplementationActions,
  type RunCardImplementationActionHost,
} from "./run/card-implementation-run-actions";
import {
  buildCorpMainActions,
  type CorpMainActionGenerationHost,
} from "./turn/corp-main-actions";
import {
  buildRunnerMainActions,
  type RunnerMainActionGenerationHost,
} from "./turn/runner-main-actions";

type HostFn<T = unknown> = () => T;

export type LegalActionGenerationHost = {
  state: GameState;
  actions: {
    buildMandatoryDrawAction: HostFn<LegalAction>;
    buildChoiceAction: (choice: ChoiceRequest) => LegalAction;
    buildPurgeableRunnerVirusPurgeAction: HostFn<LegalAction>;
    corpRunnerActionPaidWindowActions: HostFn<LegalAction[]>;
  };
  counters: {
    purgeableRunnerVirusCounterTotal: HostFn<number>;
  };
  hosts: {
    corpMainActionGenerationHost: HostFn<CorpMainActionGenerationHost>;
    runnerMainActionGenerationHost: HostFn<RunnerMainActionGenerationHost>;
    runnerEncounterActionHost: HostFn<RunnerEncounterActionHost>;
    encounterEntryHost: HostFn<EncounterEntryHost>;
    runRezWindowHost: HostFn<RunRezWindowHost>;
    runMovementHost: HostFn<RunMovementHost>;
    runCardImplementationActionHost: HostFn<RunCardImplementationActionHost>;
    runnerAccessActionHost: HostFn<RunnerAccessActionHost>;
  };
};

let defaultHostFactory:
  | ((state: GameState) => LegalActionGenerationHost)
  | undefined;

export function configureLegalActionGenerationHost(
  hostFactory: (state: GameState) => LegalActionGenerationHost,
): void {
  defaultHostFactory = hostFactory;
}

export function getLegalActions(state: GameState, side: Side): LegalAction[] {
  if (!defaultHostFactory)
    throw new Error("LegalAction-Host ist nicht initialisiert.");
  return buildLegalActions(defaultHostFactory(state), side);
}

export function legalActionsFor(state: GameState, side: Side): LegalAction[] {
  return getLegalActions(state, side);
}

export function buildLegalActions(
  host: LegalActionGenerationHost,
  side: Side,
): LegalAction[] {
  const { state } = host;
  if (state.winner || state.phase === "game_over") return [];
  if (state.pendingChoice)
    return side === state.pendingChoice.side
      ? [host.actions.buildChoiceAction(state.pendingChoice)]
      : [];
  if (state.run?.corpPostPassIceReturnToHq)
    return side === "corp"
      ? buildCorpPostPassIceReturnToHqActions(host.hosts.runMovementHost())
      : [];
  if (state.run?.postPassCancellableFutureIceStrength)
    return side === "runner"
      ? buildRunnerPostPassFutureStrengthActions(host.hosts.runMovementHost())
      : [];
  if (state.run?.postPassPayOrEndRun)
    return side === "runner"
      ? buildRunnerMovementActions(
          host.hosts.runnerEncounterActionHost(),
        ).legalActions
      : [];
  if (state.runnerVirusPurgeWindow)
    return side === "corp" && host.counters.purgeableRunnerVirusCounterTotal() > 0
      ? [host.actions.buildPurgeableRunnerVirusPurgeAction()]
      : [];
  const sharedRunWindow =
    state.timingPoint === "run.approach_ice" ||
    state.timingPoint === "run.jack_out_window";
  const inactiveCorpRunnerActionPaidWindow =
    state.timingPoint === "runner_action.main" && side === "corp";
  const inactiveCorpEncounterPaidWindow =
    state.timingPoint === "run.encounter_ice" && side === "corp";
  if (
    side !== state.activeSide &&
    !sharedRunWindow &&
    !inactiveCorpRunnerActionPaidWindow &&
    !inactiveCorpEncounterPaidWindow
  )
    return [];

  if (state.timingPoint === "corp_draw.mandatory_draw") {
    return side === "corp" ? [host.actions.buildMandatoryDrawAction()] : [];
  }

  if (state.timingPoint === "corp_action.main")
    return side === "corp"
      ? buildCorpMainActions(host.hosts.corpMainActionGenerationHost())
      : [];
  if (state.timingPoint === "runner_action.main") {
    if (side === "runner")
      return buildRunnerMainActions(host.hosts.runnerMainActionGenerationHost());
    return side === "corp"
      ? host.actions.corpRunnerActionPaidWindowActions()
      : [];
  }
  if (state.timingPoint === "run.approach_ice") {
    const encounterEntryHost = host.hosts.encounterEntryHost();
    if (isApproachIceExposeViewingWindowOpen(encounterEntryHost))
      return side === "runner"
        ? runnerApproachIceExposeViewingActions(encounterEntryHost)
        : [];
    if (isApproachIceExposeWindowOpen(encounterEntryHost))
      return side === "runner"
        ? runnerApproachIceExposeActions(encounterEntryHost)
        : [];
    return side === "corp"
      ? buildCorpApproachActions(host.hosts.runRezWindowHost())
      : [];
  }
  if (state.timingPoint === "run.encounter_ice") {
    if (side === "runner")
      return buildRunnerEncounterActions(
        host.hosts.runnerEncounterActionHost(),
      ).legalActions;
    return side === "corp"
      ? buildCorpEncounterCardImplementationActions(
          host.hosts.runCardImplementationActionHost(),
        ).legalActions
      : [];
  }
  if (state.timingPoint === "run.jack_out_window") {
    if (side === "corp")
      return buildCorpRunRootRezWindowActions(host.hosts.runRezWindowHost());
    if (isCorpRunRootRezWindowOpen(host.hosts.runRezWindowHost())) return [];
    return side === "runner"
      ? buildRunnerMovementActions(
          host.hosts.runnerEncounterActionHost(),
        ).legalActions
      : [];
  }
  if (state.timingPoint === "access.resolve_card")
    return side === "runner"
      ? buildRunnerAccessActions(host.hosts.runnerAccessActionHost()).legalActions
      : [];
  return [];
}
