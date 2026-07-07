import {
  type DeckDefinition,
  type DeckPublicMetadata,
  type Side,
} from "@netgrid/shared";

import { type AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { type SimulationControllerMode } from "./simulation-types";

type SimulationControllerConfig = {
  readonly runnerControllerMode?: SimulationControllerMode;
  readonly corpControllerMode?: SimulationControllerMode;
};

type SimulationDeckConfigInput<
  RunnerDeckId extends string = string,
  CorpDeckId extends string = string,
> = {
  readonly runnerDeckId?: RunnerDeckId;
  readonly corpDeckId?: CorpDeckId;
  readonly runnerDeck?: DeckDefinition;
  readonly corpDeck?: DeckDefinition;
  readonly runnerDeckMetadata?: DeckPublicMetadata;
  readonly corpDeckMetadata?: DeckPublicMetadata;
};

type SimulationDefaultDeckIds<
  RunnerDeckId extends string,
  CorpDeckId extends string,
> = {
  readonly runnerDeckId: RunnerDeckId;
  readonly corpDeckId: CorpDeckId;
};

export type SimulationDeckConfigSelection<
  RunnerDeckId extends string = string,
  CorpDeckId extends string = string,
> = Pick<
  SimulationDeckConfigInput<RunnerDeckId, CorpDeckId>,
  | "runnerDeckId"
  | "corpDeckId"
  | "runnerDeck"
  | "corpDeck"
  | "runnerDeckMetadata"
  | "corpDeckMetadata"
>;

export function controllerModeForSide(
  side: Side,
  config: SimulationControllerConfig,
): SimulationControllerMode {
  return side === "runner"
    ? (config.runnerControllerMode ?? "current_candidate")
    : (config.corpControllerMode ?? "current_candidate");
}

export function deckSnapshotForSimulation(
  deck: DeckDefinition,
  publicMetadata?: DeckPublicMetadata,
): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deck.id}:simulation`,
    side: deck.side,
    ...(publicMetadata?.formatProfileId
      ? { formatProfileId: publicMetadata.formatProfileId }
      : {}),
    ...(publicMetadata ? { publicMetadata } : {}),
    cards: deck.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}

export function profileIdForMode(
  side: Side,
  mode: SimulationControllerMode,
): string {
  switch (mode) {
    case "plan_corp_v1_4_0":
      return side === "corp"
        ? "corp-ai-v1.4.0-normal"
        : "runner-ai-v0.9-normal";
    case "plan_runner_v1_4_1":
      return side === "runner"
        ? "runner-ai-v1.4.1-normal"
        : "corp-ai-v0.9-normal";
    case "belief_ai_v1_4_2":
      return side === "runner"
        ? "runner-ai-v1.4.2-normal"
        : "corp-ai-v1.4.2-normal";
    case "basic_runner_ai":
      return side === "runner"
        ? "runner-ai-v0.9-normal"
        : "corp-ai-v0.9-normal";
    case "basic_corp_ai":
      return side === "corp" ? "corp-ai-v0.9-normal" : "runner-ai-v0.9-normal";
    case "random_legal_bot":
      return side === "runner"
        ? "runner-ai-v0.9-normal"
        : "corp-ai-v0.9-normal";
    case "current_candidate":
      return side === "runner"
        ? "runner-ai-v1.4.2-normal"
        : "corp-ai-v1.4.2-normal";
  }
}

export function simulationDeckConfig<
  RunnerDeckId extends string,
  CorpDeckId extends string,
>(
  config: SimulationDeckConfigInput<RunnerDeckId, CorpDeckId>,
  defaultDeckIds: SimulationDefaultDeckIds<RunnerDeckId, CorpDeckId>,
): SimulationDeckConfigSelection<RunnerDeckId, CorpDeckId> {
  return {
    ...(config.runnerDeck
      ? { runnerDeck: config.runnerDeck }
      : {
          runnerDeckId: config.runnerDeckId ?? defaultDeckIds.runnerDeckId,
        }),
    ...(config.corpDeck
      ? { corpDeck: config.corpDeck }
      : { corpDeckId: config.corpDeckId ?? defaultDeckIds.corpDeckId }),
    ...(config.runnerDeckMetadata
      ? { runnerDeckMetadata: config.runnerDeckMetadata }
      : {}),
    ...(config.corpDeckMetadata
      ? { corpDeckMetadata: config.corpDeckMetadata }
      : {}),
  };
}
