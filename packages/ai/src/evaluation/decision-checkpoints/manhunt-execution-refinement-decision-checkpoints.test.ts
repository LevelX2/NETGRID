import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-03.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-04.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-05.json";
import cp06Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-06.json";
import cp07Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-execution-07.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import {
  runAiDecisionCheckpoint,
  type AiDecisionCheckpointRunResult,
} from "./checkpoint-runner";

describe("Manhunt execution refinement exact decision checkpoints", () => {
  it("reacts to repeated R&D access before opening another remote", () => {
    const result = runAiDecisionCheckpoint(fixture(cp01Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("still protects HQ first when the opening agenda is exposed there", () => {
    const result = runAiDecisionCheckpoint(fixture(cp07Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("retains Scorched Earth while the deck still has reachable tag sources", () => {
    const result = runAiDecisionCheckpoint(fixture(cp02Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("does not buy a tag after every immediate damage payoff is exhausted", () => {
    const result = runAiDecisionCheckpoint(fixture(cp03Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("may buy the same tag when Scorched Earth is visible and payable", () => {
    const livePunishWindow = mutateFixture(cp03Json, (current) => {
      moveFirstCorpCardToHq(current, SCORCHED_EARTH);
      current.expectation = {
        acceptableActions: [
          {
            type: "play_operation",
            sourceDefinitionId: CHANCE_OBSERVATION,
          },
        ],
      };
    });

    const result = runAiDecisionCheckpoint(livePunishWindow);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("rezes the installed City Surveillance before taking a generic credit", () => {
    const result = runAiDecisionCheckpoint(fixture(cp04Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("takes a credit when City Surveillance cannot yet be afforded", () => {
    const unfundedEngine = mutateFixture(cp04Json, (current) => {
      current.engine.testOnlyGameState.corp.credits = 0;
      current.expectation = { acceptableActions: [{ type: "gain_credit" }] };
    });

    const result = runAiDecisionCheckpoint(unfundedEngine);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("pivots away from HQ matchpoint defense when no agenda remains stealable", () => {
    const result = runAiDecisionCheckpoint(fixture(cp05Json));

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(
      actionAlternativeHasComponent(
        result,
        WALL_OF_STATIC,
        "hq",
        "corp_matchpoint_hq_protection_alignment",
      ),
    ).toBe(false);
  });

  it("keeps HQ matchpoint defense when agenda points remain stealable", () => {
    const liveAgendaInventory = mutateFixture(cp05Json, (current) => {
      restoreCorpScoredAgendaToHq(current);
      current.expectation = {
        acceptableActions: [
          {
            type: "rez_ice",
            sourceDefinitionId: "onr_v1_313_city-surveillance",
          },
        ],
      };
    });

    const result = runAiDecisionCheckpoint(liveAgendaInventory);

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(
      actionAlternativeHasComponent(
        result,
        WALL_OF_STATIC,
        "hq",
        "corp_matchpoint_hq_protection_alignment",
      ),
    ).toBe(true);
  });

  it("bids zero when the trace has no visible punish conversion", () => {
    const result = runAiDecisionCheckpoint(fixture(cp06Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("bids exactly the minimum guarantee with a visible payable payoff", () => {
    const livePunishWindow = mutateFixture(cp06Json, (current) => {
      moveFirstCorpCardToHq(current, CLOSED_ACCOUNTS);
      current.expectation = { choice: { mustSelectValues: [1] } };
    });

    const result = runAiDecisionCheckpoint(livePunishWindow);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("still bids zero with a payoff when base trace already beats Runner credits", () => {
    const freeGuarantee = mutateFixture(cp06Json, (current) => {
      moveFirstCorpCardToHq(current, CLOSED_ACCOUNTS);
      current.engine.testOnlyGameState.runner.credits = 4;
      current.expectation = { choice: { mustSelectValues: [0] } };
    });

    const result = runAiDecisionCheckpoint(freeGuarantee);

    expect(result.ok, diagnostic(result)).toBe(true);
  });
});

const CHANCE_OBSERVATION = "onr_v1_284_chance-observation";
const CLOSED_ACCOUNTS = "onr_v1_285_closed-accounts";
const SCORCHED_EARTH = "onr_v1_302_scorched-earth";
const WALL_OF_STATIC = "onr_v1_279_wall-of-static";

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (current: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const current = fixture(value);
  mutation(current);
  current.engine.stateHash = hashGameState(current.engine.testOnlyGameState);
  return current;
}

function moveFirstCorpCardToHq(
  current: AiDecisionCheckpointV1,
  definitionId: string,
): void {
  const state = current.engine.testOnlyGameState;
  const instanceId = Object.values(state.cardInstances).find(
    (card) =>
      card.owner === "corp" &&
      card.definitionId === definitionId &&
      !state.corp.hq.includes(card.instanceId),
  )?.instanceId;
  if (!instanceId) throw new Error(`Missing Corp card ${definitionId}`);

  state.corp.rd = state.corp.rd.filter((id) => id !== instanceId);
  state.corp.archives = state.corp.archives.filter((id) => id !== instanceId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== instanceId);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (id) => id !== instanceId,
  );
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== instanceId);
    server.root = server.root.filter((id) => id !== instanceId);
  }
  state.corp.hq.push(instanceId);
  state.cardInstances[instanceId] = {
    ...state.cardInstances[instanceId]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
}

function restoreCorpScoredAgendaToHq(current: AiDecisionCheckpointV1): void {
  const state = current.engine.testOnlyGameState;
  const agendaId = state.corp.scoreArea.pop();
  if (!agendaId) throw new Error("Missing scored Corp agenda counterprobe");
  state.corp.hq.push(agendaId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
}

function diagnostic(result: AiDecisionCheckpointRunResult): string {
  return JSON.stringify({
    message: result.message,
    selectedActionId: result.selectedAction?.actionId,
    selectedActionType: result.selectedAction?.type,
    selectedChoices: result.decision?.selectedChoices,
    ownHq: result.input.playerView.own.gripOrHq.map(
      (card) => card.definitionId,
    ),
    ownBoard: result.input.playerView.servers.flatMap((server) =>
      [...server.ice, ...server.root].map((card) => card.definitionId),
    ),
    ownArchives: result.input.playerView.own.heapOrArchives.map(
      (card) => card.definitionId,
    ),
    lastEvent: result.input.eventTail.at(-1)?.publicPayload,
    scoreBreakdown: result.decision?.decisionDebug?.scoreBreakdown,
  });
}

function actionAlternativeHasComponent(
  result: AiDecisionCheckpointRunResult,
  sourceDefinitionId: string,
  serverId: string,
  componentKey: string,
): boolean {
  const sourceInstanceIds = new Set(
    result.input.playerView.own.gripOrHq
      .filter((card) => card.definitionId === sourceDefinitionId)
      .map((card) => card.instanceId),
  );
  return (
    result.decision?.decisionDebug?.actionAlternatives?.some(
      (entry) =>
        entry.actionId.includes(`.${serverId}.`) &&
        [...sourceInstanceIds].some((instanceId) =>
          entry.actionId.includes(instanceId),
        ) &&
        entry.scoreBreakdown?.some(
          (component) => component.key === componentKey,
        ),
    ) === true
  );
}
