import type {
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  RunState,
  ServerId,
} from "@netgrid/shared";
import {
  installedAccessBonusForServer,
  installedAccessBonusSourceDefinitionIdsForServer,
  type BreachStateHost,
} from "../access/breach-state";
import {
  enterAccessFromSuccessfulRun,
  type RunAccessTransitionHost,
} from "./run-access-transition";
import { approachOrEncounterIce, type RunMovementHost } from "./run-movement";

export type StartRunOptions = Pick<
  RunState,
  | "freeTrashAccessZones"
  | "grantAllNighterBonusRunOnFinish"
  | "accessServerOverride"
  | "successfulRunAccessReplacement"
  | "successfulRunCreditLoss"
  | "successfulRunRunnerTagGain"
  | "successfulRunCorpDraw"
  | "successfulRunRunnerCreditGain"
  | "successfulRunRequiresCorpCredits"
  | "successfulRunPrivateLookCount"
  | "successfulRunArchivesMoveCount"
  | "successfulRunSourceCardId"
  | "successfulRunSourceDefinitionId"
  | "successfulRunSourceTitle"
  | "bypassFirstIceRemaining"
  | "runTraceLinkBonus"
  | "runTraceLinkBonusSourceDefinitionId"
  | "runnerRunTemporaryCredits"
  | "testSpinTemporaryInstall"
  | "unpreventableCoreDamageAtRunEnd"
  | "socialEngineeringAutoPassIceId"
  | "prohibitNoisyIcebreakers"
  | "eventApproachIceExposeBeforeRez"
  | "runnerCreditGainOnCorpRez"
  | "damagePreventionPool"
  | "badPublicityRunAftermath"
  | "activeSequence"
>;

export type RunCoreExecutionHost = {
  state: GameState;
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
  };
  turn: {
    ensureRunnerTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  access: {
    breachStateHost: () => BreachStateHost;
    runAccessTransitionHost: () => RunAccessTransitionHost;
  };
  run: {
    movementHost: () => RunMovementHost;
  };
  rules: {
    isV099OrLater: () => boolean;
  };
  callbacks: {
    executeCardImplementationRunnerRunStartEffects: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
    applyRunnerTraceCounterRunStartEffects: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
    applyAiBoonRunStart: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
    openStartOfRunFortUtilityWindow: (
      state: GameState,
      legalAction?: LegalAction,
    ) => boolean;
  };
};

export function startRun(
  host: RunCoreExecutionHost,
  serverId: Exclude<ServerId, "new_remote">,
  pendingSuccessBonusCredits?: number,
  accessCount = 1,
  options?: StartRunOptions,
  legalAction?: LegalAction,
): void {
  assertRequiredHostGroups(host);
  const { state } = host;
  const server = host.servers.mustServer(serverId);
  const flags = host.turn.ensureRunnerTurnFlags();
  flags.runAttemptsThisTurn = (flags.runAttemptsThisTurn ?? 0) + 1;
  flags.runAttemptsThisGame = (flags.runAttemptsThisGame ?? 0) + 1;
  host.callbacks.executeCardImplementationRunnerRunStartEffects(
    state,
    legalAction,
  );
  const breachHost = host.access.breachStateHost();
  const installedAccessBonus = installedAccessBonusForServer(
    breachHost,
    server.id,
  );
  const installedAccessBonusSourceDefinitionIds =
    installedAccessBonusSourceDefinitionIdsForServer(breachHost, server.id);
  const baseAccessCount = Math.max(1, Math.floor(accessCount));
  const effectiveAccessCount = baseAccessCount + installedAccessBonus;
  state.phase = "run";
  state.activeSide = "runner";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: server.id,
    phase: "approach_ice",
    position:
      server.ice.length > 0
        ? {
            kind: "ice",
            serverId: server.id,
            iceIndex: outermostIceIndex(server),
          }
        : { kind: "server", serverId: server.id },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    bartmossUsedBreakerIdsThisEncounter: [],
    aardvarkInterceptionIceIds: [],
    blinkUsedSubroutinesByBreakerThisEncounter: {},
    successful: false,
    accessCount: effectiveAccessCount,
    ...(options?.freeTrashAccessZones?.length
      ? { freeTrashAccessZones: options.freeTrashAccessZones.slice() }
      : {}),
    ...(options?.grantAllNighterBonusRunOnFinish
      ? { grantAllNighterBonusRunOnFinish: true }
      : {}),
    ...(options?.accessServerOverride
      ? { accessServerOverride: options.accessServerOverride }
      : {}),
    ...(options?.successfulRunAccessReplacement
      ? {
          successfulRunAccessReplacement:
            options.successfulRunAccessReplacement,
        }
      : {}),
    ...(options?.successfulRunCreditLoss && options.successfulRunCreditLoss > 0
      ? { successfulRunCreditLoss: options.successfulRunCreditLoss }
      : {}),
    ...(options?.successfulRunRunnerTagGain &&
    options.successfulRunRunnerTagGain > 0
      ? { successfulRunRunnerTagGain: options.successfulRunRunnerTagGain }
      : {}),
    ...(options?.successfulRunCorpDraw && options.successfulRunCorpDraw > 0
      ? { successfulRunCorpDraw: options.successfulRunCorpDraw }
      : {}),
    ...(options?.successfulRunRunnerCreditGain &&
    options.successfulRunRunnerCreditGain > 0
      ? { successfulRunRunnerCreditGain: options.successfulRunRunnerCreditGain }
      : {}),
    ...(options?.successfulRunRequiresCorpCredits
      ? { successfulRunRequiresCorpCredits: true }
      : {}),
    ...(options?.successfulRunPrivateLookCount &&
    options.successfulRunPrivateLookCount > 0
      ? { successfulRunPrivateLookCount: options.successfulRunPrivateLookCount }
      : {}),
    ...(options?.successfulRunArchivesMoveCount &&
    options.successfulRunArchivesMoveCount > 0
      ? { successfulRunArchivesMoveCount: options.successfulRunArchivesMoveCount }
      : {}),
    ...(options?.successfulRunSourceCardId
      ? { successfulRunSourceCardId: options.successfulRunSourceCardId }
      : {}),
    ...(options?.successfulRunSourceDefinitionId
      ? { successfulRunSourceDefinitionId: options.successfulRunSourceDefinitionId }
      : {}),
    ...(options?.successfulRunSourceTitle
      ? { successfulRunSourceTitle: options.successfulRunSourceTitle }
      : {}),
    ...(options?.bypassFirstIceRemaining
      ? { bypassFirstIceRemaining: true }
      : {}),
    ...(options?.runTraceLinkBonus && options.runTraceLinkBonus > 0
      ? { runTraceLinkBonus: options.runTraceLinkBonus }
      : {}),
    ...(options?.runTraceLinkBonusSourceDefinitionId
      ? {
          runTraceLinkBonusSourceDefinitionId:
            options.runTraceLinkBonusSourceDefinitionId,
        }
      : {}),
    ...(host.rules.isV099OrLater()
      ? { badPublicityCredits: state.corp.badPublicity }
      : {}),
    ...(options?.runnerRunTemporaryCredits
      ? {
          runnerRunTemporaryCredits: {
            ...options.runnerRunTemporaryCredits,
          },
        }
      : {}),
    ...(options?.testSpinTemporaryInstall
      ? {
          testSpinTemporaryInstall: {
            ...options.testSpinTemporaryInstall,
          },
        }
      : {}),
    ...(options?.unpreventableCoreDamageAtRunEnd
      ? {
          unpreventableCoreDamageAtRunEnd: {
            ...options.unpreventableCoreDamageAtRunEnd,
          },
        }
      : {}),
    ...(options?.socialEngineeringAutoPassIceId
      ? { socialEngineeringAutoPassIceId: options.socialEngineeringAutoPassIceId }
      : {}),
    ...(options?.prohibitNoisyIcebreakers
      ? { prohibitNoisyIcebreakers: true }
      : {}),
    ...(options?.eventApproachIceExposeBeforeRez
      ? { eventApproachIceExposeBeforeRez: true }
      : {}),
    ...(options?.runnerCreditGainOnCorpRez &&
    options.runnerCreditGainOnCorpRez > 0
      ? { runnerCreditGainOnCorpRez: options.runnerCreditGainOnCorpRez }
      : {}),
    ...(options?.damagePreventionPool
      ? { damagePreventionPool: { ...options.damagePreventionPool } }
      : {}),
    ...(options?.badPublicityRunAftermath
      ? { badPublicityRunAftermath: { ...options.badPublicityRunAftermath } }
      : {}),
    ...(options?.activeSequence
      ? { activeSequence: { ...options.activeSequence } }
      : {}),
    ...(pendingSuccessBonusCredits ? { pendingSuccessBonusCredits } : {}),
  };
  host.callbacks.applyRunnerTraceCounterRunStartEffects(state, legalAction);
  if (state.winner) return;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      serverId,
      baseAccessCount,
      installedAccessBonus,
      effectiveAccessCount,
      ...(installedAccessBonusSourceDefinitionIds.length > 0
        ? {
            installedAccessBonusSourceDefinitionIds:
              installedAccessBonusSourceDefinitionIds.join(","),
          }
        : {}),
    };
  }
  host.callbacks.applyAiBoonRunStart(state, legalAction);
  if (host.callbacks.openStartOfRunFortUtilityWindow(state, legalAction))
    return;
  if (server.ice.length > 0) {
    const iceIndex = outermostIceIndex(server);
    const approachedIceId = mustArrayValue(
      server.ice,
      iceIndex,
      "Server has no approached ice.",
    );
    state.run.approachedIceId = approachedIceId;
    approachOrEncounterIce(
      host.run.movementHost(),
      approachedIceId,
      legalAction,
    );
  } else if (openServerMovementWindowBeforeAccess(host, server.id)) {
    return;
  } else {
    enterAccessFromSuccessfulRun(
      host.access.runAccessTransitionHost(),
      legalAction,
    );
  }
}

function openServerMovementWindowBeforeAccess(
  host: RunCoreExecutionHost,
  serverId: Exclude<ServerId, "new_remote">,
): boolean {
  const movementHost = host.run.movementHost();
  if (!movementHost.rules.isV097OrLater()) return false;
  if (!movementHost.rules.corpRunRootRezActionsAvailable()) return false;
  const run = host.state.run;
  if (!run) return false;
  host.state.run = {
    ...run,
    phase: "movement",
    position: { kind: "server", serverId },
  };
  host.state.timingPoint = "run.jack_out_window";
  host.state.activeSide = "runner";
  return true;
}

function assertRequiredHostGroups(host: RunCoreExecutionHost): void {
  for (const group of [
    "state",
    "servers",
    "turn",
    "access",
    "run",
    "rules",
    "callbacks",
  ] as const) {
    if (!host[group])
      throw new Error(`RunCoreExecutionHost missing group: ${group}`);
  }
}

function outermostIceIndex(server: CorpServer): number {
  return server.ice.length - 1;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}
