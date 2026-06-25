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
import {
  buildDeckDoctrineProfile,
  type AiDeckDoctrineDeckSnapshot,
} from "../deck-doctrine";
import { buildDeckStrategyProfile } from "../deck-doctrine-strategy";
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
import { type RunnerTacticalGoal } from "../runner-tactical-goals";
import { buildAiDecisionInputDto } from "../input-dto";

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
  ownDeckCapabilities?: DeckCapabilityProfile;
  ownStrategicIntentState?: StrategicIntentState;
  ownCorpStrategicIntent?: CorpStrategicIntentProfile;
  ownRunnerStrategicIntent?: RunnerStrategicIntentProfile;
  ownRunnerTacticalGoals?: RunnerTacticalGoal[];
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

export function buildAiDecisionInput(
  state: GameState,
  side: Side,
  options: {
    difficulty?: AiDifficulty;
    decisionId?: string;
    actionNumber?: number;
    profileId?: string;
    eventTail?: PublicGameEvent[];
    ownDeckSnapshot?: AiDeckDoctrineDeckSnapshot;
    ownDeckDoctrine?: AiDecisionInput["ownDeckDoctrine"];
  } = {},
): AiDecisionInput {
  const playerView = getPlayerView(state, side);
  const legalActions = getLegalActions(state, side);
  const ownDeckDoctrine =
    options.ownDeckDoctrine ??
    (options.ownDeckSnapshot
      ? buildDeckDoctrineProfile(options.ownDeckSnapshot)
      : undefined);
  const input = buildAiDecisionInputDto({
    side,
    playerView,
    eventTail: options.eventTail ?? playerView.publicEvents,
    legalActions,
    difficulty: options.difficulty ?? "normal",
    seed: state.seed,
    decisionId:
      options.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`,
    actionNumber: options.actionNumber ?? state.stateVersion,
    profileId:
      options.profileId ?? `${side}-ai-v0.9-${options.difficulty ?? "normal"}`,
    ...(ownDeckDoctrine ? { ownDeckDoctrine } : {}),
  });
  if (!options.ownDeckSnapshot) return input;
  const ownDeckCapabilities = buildDeckCapabilityProfile({
    side,
    playerView,
    legalActions,
    deckSnapshot: options.ownDeckSnapshot,
  });
  const ownDeckStrategyProfile = buildDeckStrategyProfile(options.ownDeckSnapshot);
  const ownStrategicIntentState = buildStrategicIntentState({
    side,
    stateVersion: playerView.stateVersion,
    strategyProfile: ownDeckStrategyProfile,
    deckCapabilities: ownDeckCapabilities,
    availableCredits: playerView.own.credits,
  });
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
    ownDeckCapabilities,
    ownStrategicIntentState,
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
          error: `No legal actions for either side at ${state.stateVersion} (activeSide ${state.activeSide}, phase ${state.phase}, timingPoint ${state.timingPoint}).`,
        }),
  };
}

function oppositeSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}
