import { getLegalActions, getPlayerView } from "@netgrid/engine";
import {
  type AiDecisionInput,
  type AiDifficulty,
  type GameState,
  type LegalAction,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";
import {
  buildDeckCapabilityProfile,
  type DeckCapabilityProfile,
} from "../deck-capabilities";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import {
  type AiDeckStrategyProfile,
  type DeckDoctrineV2Diagnostic,
} from "../deck-doctrine-strategy";
import { buildDeckDoctrineRuntimeContext } from "../deck-doctrine-runtime-context";
import {
  assertValidAiDeckSnapshotForRuntime,
  type AiDeckSnapshotRuntimeExpectation,
} from "../deck-strategy-snapshot-validation";
import {
  buildCorpStrategicIntentProfile,
  type CorpStrategicIntentProfile,
} from "../corp-strategic-intent";
import {
  buildRunnerStrategicIntentProfile,
  type RunnerStrategicIntentProfile,
} from "../runner-strategic-intent";
import {
  buildStrategicIntentState,
  type StrategicIntentState,
} from "../strategic-intent-state";
import { getStrategicIntentMemorySnapshot } from "../strategic-intent-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import {
  strategicIntentRevalidationFromCurrentPublicEvents,
  strategicIntentRevalidationPublicEventFacts,
} from "./strategic-intent-live-revalidation";
import { buildStrategicRuntimeContext } from "./strategic-runtime-context";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
  type PlanningRulesContext,
  type PlanningStateIdentity,
} from "../plans/turn-planning-contracts";
import {
  buildRemoteDoctrineProfile,
  type RemoteDoctrineProfile,
} from "../remote-doctrine-profile";

export type AiDecisionSideSelection =
  | {
      side: Side;
      legalActions: LegalAction[];
      activeSideLegalActions: LegalAction[];
      inactiveSideLegalActions: LegalAction[];
      terminal: false;
    }
  | {
      side: undefined;
      legalActions: [];
      activeSideLegalActions: LegalAction[];
      inactiveSideLegalActions: LegalAction[];
      terminal: boolean;
      error?: string;
    };

export type AiDecisionInputWithDeckCapabilities = AiDecisionInput & {
  /**
   * Productive inputs built by buildAiDecisionInput always carry both
   * planning contracts. They remain optional on the extended compatibility
   * type until all isolated test/input builders have migrated; the Turn
   * Planner boundary must require them fail-closed.
   */
  planningRulesContext?: PlanningRulesContext;
  planningStateIdentity?: PlanningStateIdentity;
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
  ownDeckCapabilities?: DeckCapabilityProfile;
  ownDeckStrategyProfile?: AiDeckStrategyProfile;
  // Report-only diagnostic: keep it available for audits and debug reports, but
  // productive runtime consumers must use ownDeckStrategyProfile/StrategicIntentState.
  ownDeckDoctrineV2Diagnostic?: DeckDoctrineV2Diagnostic;
  ownStrategicIntentState?: StrategicIntentState;
  ownCorpStrategicIntent?: CorpStrategicIntentProfile;
  ownRemoteDoctrineProfile?: RemoteDoctrineProfile;
  ownRunnerStrategicIntent?: RunnerStrategicIntentProfile;
};

export const FORBIDDEN_AI_INPUT_FIELDS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState",
];

export const AI_DECISION_EVENT_TAIL_LIMIT = 80;

export function aiDecisionEventTail(
  publicEvents: PublicGameEvent[],
): PublicGameEvent[] {
  if (publicEvents.length <= AI_DECISION_EVENT_TAIL_LIMIT) return publicEvents;
  return publicEvents.slice(-AI_DECISION_EVENT_TAIL_LIMIT);
}

export function buildAiDecisionInput(
  state: GameState,
  side: Side,
  options: {
    difficulty?: AiDifficulty;
    decisionId?: string;
    actionNumber?: number;
    profileId?: string;
    eventTail?: PublicGameEvent[];
    ownDeckSnapshot: AiDeckStrategyDeckSnapshot;
    expectedDeckSnapshot?: Omit<AiDeckSnapshotRuntimeExpectation, "side">;
  },
): AiDecisionInputWithDeckCapabilities {
  const expectedDeckSnapshot = options?.expectedDeckSnapshot;
  const ownDeckSnapshot = assertValidAiDeckSnapshotForRuntime(
    options?.ownDeckSnapshot,
    {
      side,
      ...expectedDeckSnapshot,
    },
  );
  const playerView = getPlayerView(state, side);
  const legalActions = getLegalActions(state, side);
  const difficulty = options?.difficulty ?? "normal";
  const decisionId =
    options?.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`;
  const actionNumber = options?.actionNumber ?? state.stateVersion;
  const profileId = options?.profileId ?? `${side}-ai-v0.9-${difficulty}`;
  const deckDoctrineRuntimeContext = buildDeckDoctrineRuntimeContext({
    side,
    deckSnapshot: ownDeckSnapshot,
    ...(expectedDeckSnapshot ? { expectedDeckSnapshot } : {}),
  });
  const input = buildAiDecisionInputDto({
    matchId: state.matchId,
    side,
    playerView,
    eventTail:
      options?.eventTail ?? aiDecisionEventTail(playerView.publicEvents),
    legalActions,
    difficulty,
    seed: state.seed,
    decisionId,
    actionNumber,
    profileId,
  });
  const ownDeckCapabilities = buildDeckCapabilityProfile({
    side,
    playerView,
    legalActions,
    deckSnapshot: ownDeckSnapshot,
  });
  const ownDeckStrategyProfile = deckDoctrineRuntimeContext.strategyProfile;
  const ownDeckDoctrineV2Diagnostic = deckDoctrineRuntimeContext.v2Diagnostic;
  const previousStrategicIntentState = getStrategicIntentMemorySnapshot(
    input,
    ownDeckSnapshot.deckSnapshotId,
  )?.state;
  const strategicIntentRevalidation = previousStrategicIntentState
    ? strategicIntentRevalidationFromCurrentPublicEvents({
        side,
        stateVersion: playerView.stateVersion,
        eventTail: strategicIntentRevalidationPublicEventFacts(
          aiDecisionEventTail(state.eventLog),
        ),
      })
    : undefined;
  const strategicRuntimeContext = buildStrategicRuntimeContext({
    side,
    playerView,
    legalActions,
    strategyProfile: ownDeckStrategyProfile,
    deckCapabilities: ownDeckCapabilities,
    deckSnapshot: ownDeckSnapshot,
  });
  const ownStrategicIntentState = buildStrategicIntentState({
    side,
    stateVersion: playerView.stateVersion,
    strategyProfile: ownDeckStrategyProfile,
    deckCapabilities: ownDeckCapabilities,
    ...(previousStrategicIntentState
      ? { previousState: previousStrategicIntentState }
      : {}),
    ...(strategicIntentRevalidation
      ? { revalidation: strategicIntentRevalidation }
      : {}),
    availableCredits: playerView.own.credits,
    ...(strategicRuntimeContext.strategyPortfolio.activeStrategyId
      ? {
          preferredStrategyId:
            strategicRuntimeContext.strategyPortfolio.activeStrategyId,
        }
      : {}),
    strategyPortfolio: strategicRuntimeContext.strategyPortfolio,
    roleStatuses: strategicRuntimeContext.roleStatuses,
    targetVector: strategicRuntimeContext.targetVector,
    reserveRequirement: strategicRuntimeContext.reserveRequirement,
  });
  const ownRemoteDoctrineProfile =
    side === "corp"
      ? buildRemoteDoctrineProfile({
          strategyProfile: ownDeckStrategyProfile,
          deckCapabilities: ownDeckCapabilities,
          strategicIntentState: ownStrategicIntentState,
          plannerEffect: "plan_portfolio",
        })
      : undefined;
  const ownRunnerStrategicIntent =
    side === "runner"
      ? buildRunnerStrategicIntentProfile({
          strategyProfile: ownDeckStrategyProfile,
          deckCapabilities: ownDeckCapabilities,
        })
      : undefined;
  const ownCorpStrategicIntent =
    side === "corp"
      ? buildCorpStrategicIntentProfile({
          strategyProfile: ownDeckStrategyProfile,
          deckCapabilities: ownDeckCapabilities,
          strategicIntentState: ownStrategicIntentState,
        })
      : undefined;
  const enriched: AiDecisionInputWithDeckCapabilities = {
    ...input,
    planningRulesContext: buildPlanningRulesContext({
      rulesBaseline: state.baseline,
      formatProfileId:
        playerView.deckMetadata?.own.formatProfileId ??
        ownDeckSnapshot.formatProfileId ??
        "unknown-format",
      cardPoolSnapshotId:
        playerView.deckMetadata?.own.cardPoolSnapshotId ??
        ownDeckSnapshot.cardPoolSnapshotId ??
        "unknown-card-pool",
    }),
    planningStateIdentity: buildPlanningStateIdentity(input),
    ownDeckSnapshot,
    ownDeckCapabilities,
    ownDeckStrategyProfile,
    ownDeckDoctrineV2Diagnostic,
    ownStrategicIntentState,
    ...(ownRemoteDoctrineProfile ? { ownRemoteDoctrineProfile } : {}),
    ...(ownCorpStrategicIntent ? { ownCorpStrategicIntent } : {}),
    ...(ownRunnerStrategicIntent ? { ownRunnerStrategicIntent } : {}),
  };
  return enriched;
}

export function selectAiDecisionSideForState(
  state: GameState,
): AiDecisionSideSelection {
  const activeSide = state.activeSide;
  const inactiveSide = oppositeSide(activeSide);
  const activeSideLegalActions = getLegalActions(state, activeSide);
  const inactiveSideLegalActions = getLegalActions(state, inactiveSide);
  if (activeSideLegalActions.length > 0) {
    return {
      side: activeSide,
      legalActions: activeSideLegalActions,
      activeSideLegalActions,
      inactiveSideLegalActions,
      terminal: false,
    };
  }
  if (inactiveSideLegalActions.length > 0) {
    return {
      side: inactiveSide,
      legalActions: inactiveSideLegalActions,
      activeSideLegalActions,
      inactiveSideLegalActions,
      terminal: false,
    };
  }
  const terminal = Boolean(state.winner) || state.phase === "game_over";
  return {
    side: undefined,
    legalActions: [],
    activeSideLegalActions,
    inactiveSideLegalActions,
    terminal,
    ...(terminal
      ? {}
      : {
          error: `No legal actions for either side at ${state.stateVersion} (activeSide ${state.activeSide}, phase ${state.phase}, timingPoint ${state.timingPoint}, runPhase ${state.run?.phase ?? "none"}, pendingChoice ${state.pendingChoice ? "yes" : "no"}, costPenaltyWindow ${state.runnerCostPenaltySupportWindow ? "yes" : "no"}).`,
        }),
  };
}

function oppositeSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}
