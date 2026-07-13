import type {
  AiDecisionInput,
  AiDifficulty,
  DeckDefinition,
  DeckPublicMetadata,
  GameState,
  Side,
} from "@netgrid/shared";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import type { AiDecisionRuntimeOptions } from "../runtime/choose-ai-action";
import type {
  SimulationControllerMode,
  SimulationWorld,
} from "./simulation-types";

export type AiSimulationDecisionCheckpointCapture = {
  seed: string;
  actionIndex: number;
  side: Side;
  state: GameState;
  input: AiDecisionInput;
  deckSnapshot: AiDeckStrategyDeckSnapshot;
};

export type AiSimulationConfig = {
  seed?: string;
  matchId?: string;
  maxActions?: number;
  agendaPointsToWin?: number;
  runnerDifficulty?: AiDifficulty;
  corpDifficulty?: AiDifficulty;
  runnerProfileId?: string;
  corpProfileId?: string;
  runnerDeckId?:
    | "demo_runner_001"
    | "demo_runner_004"
    | "demo_runner_008"
    | "demo_runner_096"
    | "demo_runner_097"
    | "demo_runner_098"
    | "demo_runner_099";
  corpDeckId?:
    | "demo_corp_001"
    | "demo_corp_004"
    | "demo_corp_008"
    | "demo_corp_096"
    | "demo_corp_097"
    | "demo_corp_098"
    | "demo_corp_099";
  runnerDeck?: DeckDefinition;
  corpDeck?: DeckDefinition;
  runnerDeckMetadata?: DeckPublicMetadata;
  corpDeckMetadata?: DeckPublicMetadata;
  runnerControllerMode?: SimulationControllerMode;
  corpControllerMode?: SimulationControllerMode;
  simulationRngSeed?: string;
  beliefWorld?: SimulationWorld;
  includeActionAlternativesForFindings?: boolean;
  maxAlternativesPerFinding?: number;
  aiDecisionRuntimeOptions?: AiDecisionRuntimeOptions;
  opportunitySnapshotRequests?: Array<{
    seed: string;
    actionIndices: number[];
  }>;
  /**
   * Test- und Diagnosehaken zum Einfrieren des exakten Zustands unmittelbar
   * vor einer Selfplay-Entscheidung. Die übergebenen Werte sind defensive
   * Kopien und fließen nie in das redigierte Simulationsergebnis ein.
   */
  testOnlyDecisionCheckpointCapture?: {
    actionIndices: number[];
    capture: (snapshot: AiSimulationDecisionCheckpointCapture) => void;
  };
};
