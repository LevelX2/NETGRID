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

  it("prepares persistent tag pressure when a guaranteed trace would strand Scorched Earth", () => {
    const livePunishWindow = mutateFixture(cp03Json, (current) => {
      moveFirstCorpCardToHq(current, SCORCHED_EARTH);
      current.engine.testOnlyGameState.corp.credits = 5;
      current.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_313_city-surveillance",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.punish_campaign"],
          acceptableCapabilities: ["punish_prepare"],
          requiredAssessmentEvidence: [
            "tag_punish_ontology_prepare:onr_v1_313_city-surveillance",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(livePunishWindow);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("rezes the installed City Surveillance before taking a generic credit", () => {
    const result = runAiDecisionCheckpoint(fixture(cp04Json));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("draws for score material when unfunded City Surveillance has no legal punish route", () => {
    const unfundedEngine = mutateFixture(cp04Json, (current) => {
      current.engine.testOnlyGameState.corp.credits = 0;
      restoreCorpScoredAgendaToRd(current);
      // Keep this counterprobe about missing score material. The source
      // checkpoint starts over HQ capacity, which would otherwise make the
      // only legal hand-management route an overflow-credit conversion.
      moveFirstCorpCardToArchives(current, URBAN_RENEWAL);
      current.expectation = {
        acceptableActions: [{ actionId: "corp.draw_card" }],
        planExecution: {
          acceptablePlanKinds: ["corp.hand_and_agenda_management"],
          acceptableCapabilities: ["draw_for_plan"],
          requiredAssessmentEvidence: [
            "corp_score_campaign_missing_agenda_material",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(unfundedEngine);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("pivots away from HQ matchpoint defense when no agenda remains stealable", () => {
    const result = runAiDecisionCheckpoint(fixture(cp05Json));

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(result.decision?.decisionDebug?.planKind).not.toBe(
      "corp.defend_servers",
    );
  });

  it("keeps HQ matchpoint defense when agenda points remain stealable", () => {
    const liveAgendaInventory = mutateFixture(cp05Json, (current) => {
      restoreCorpScoredAgendaToHq(current);
      current.expectation = {
        acceptableActions: [
          {
            type: "rez_card",
            sourceDefinitionId: "onr_v1_313_city-surveillance",
          },
        ],
      };
    });

    const result = runAiDecisionCheckpoint(liveAgendaInventory);

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.punish_campaign",
    );
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
const URBAN_RENEWAL = "onr_v1_307_urban-renewal";

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

function moveFirstCorpCardToArchives(
  current: AiDecisionCheckpointV1,
  definitionId: string,
): void {
  const state = current.engine.testOnlyGameState;
  const instanceId = state.corp.hq.find(
    (id) => state.cardInstances[id]?.definitionId === definitionId,
  );
  if (!instanceId) throw new Error(`Missing Corp HQ card ${definitionId}`);

  state.corp.hq = state.corp.hq.filter((id) => id !== instanceId);
  state.corp.archives.push(instanceId);
  state.cardInstances[instanceId] = {
    ...state.cardInstances[instanceId]!,
    zone: { side: "corp", zone: "archives" },
    faceup: true,
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

function restoreCorpScoredAgendaToRd(current: AiDecisionCheckpointV1): void {
  const state = current.engine.testOnlyGameState;
  const agendaId = state.corp.scoreArea.pop();
  if (!agendaId) throw new Error("Missing scored Corp agenda counterprobe");
  state.corp.rd.push(agendaId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    zone: { side: "corp", zone: "rd" },
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
