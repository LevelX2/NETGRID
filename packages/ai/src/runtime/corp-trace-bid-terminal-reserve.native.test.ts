import { createGame, getLegalActions, getPlayerView } from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecisionInput,
  type CardDefinitionId,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../input-dto";
import { selectedBidChoiceOptionId } from "./bid-choice-option";
import { latestTraceContext } from "./trace-context";

function takeCorpCard(state: GameState, definitionId: CardDefinitionId) {
  const id = [...state.corp.hq, ...state.corp.rd].find(
    (id) => state.cardInstances[id]?.definitionId === definitionId,
  );
  if (!id) throw Error("missing fixture card " + definitionId);
  state.corp.hq = state.corp.hq.filter((candidate) => candidate !== id);
  state.corp.rd = state.corp.rd.filter((candidate) => candidate !== id);
  return state.cardInstances[id]!;
}

function setup() {
  const fangDefinitionId = "onr_v1_240_fang";
  const { corp, runner } = ORIGINALSET_DEFAULT_DECKS;
  const state = createGame({
    seed: "terminal-fang-bid",
    setupMode: "completed",
    runnerDeck: {
      ...runner,
      cards: [
        ...runner.cards,
        { id: "onr_proteus_129_back-door-to-netwatch", quantity: 1 },
      ],
    },
    corpDeck: {
      ...corp,
      cards: [
        ...corp.cards,
        { id: fangDefinitionId, quantity: 1 },
        { id: "onr_v1_190_bioweapons-engineering", quantity: 1 },
      ],
    },
  });
  const hq = state.corp.servers.find((server) => server.id === "hq")!;
  const fang = takeCorpCard(state, fangDefinitionId);
  hq.ice.push(fang.instanceId);
  fang.zone = { side: "corp", zone: "serverIce", serverId: "hq" };
  fang.rezzed = true;
  fang.faceup = true;
  const tycho = takeCorpCard(state, "onr_v1_220_tycho-extension");
  tycho.zone = { side: "corp", zone: "hq" };
  state.corp.hq.push(tycho.instanceId);
  const stolen = takeCorpCard(state, "onr_v1_190_bioweapons-engineering");
  stolen.zone = { side: "runner", zone: "scoreArea" };
  stolen.controller = "runner";
  stolen.faceup = true;
  state.runner.scoreArea.push(stolen.instanceId);
  state.phase = "run";
  state.timingPoint = "run.encounter_ice";
  state.activeSide = "corp";
  state.corp.clicks = 0;
  state.corp.credits = 2;
  state.runner.clicks = 1;
  state.runner.credits = 5;
  const runId = "terminal-fang-run";
  const traceId = "terminal-fang-trace";
  state.run = {
    runId,
    attackedServerId: "hq",
    phase: "encounter_ice",
    position: { kind: "ice", serverId: "hq", iceIndex: 0 },
    encounteredIceId: fang.instanceId,
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [0],
    successful: false,
  };
  state.trace = {
    traceId,
    sourceCardInstanceId: fang.instanceId,
    sourceDefinitionId: fangDefinitionId,
    traceRulesProfile: "modern_open",
    traceLimit: 4,
    effectiveTraceLimit: 4,
    subroutineIndex: 0,
    status: "corp_bid",
    corpBidMax: 2,
    successEffect: { type: "end_run_and_run_lock", amount: 2 },
  };
  state.pendingChoice = {
    choiceId: "terminal-fang-choice",
    side: "corp",
    source: "trace:" + traceId,
    prompt: "Corp bid",
    kind: "bid_amount",
    options: [0, 1, 2].map((value) => ({
      id: "bid_" + value,
      label: String(value),
      value,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "public",
  };
  return { state, hq, tycho, stolen };
}

function inputFor(state: GameState) {
  const source = {
    matchId: state.matchId,
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    legalActions: getLegalActions(state, "corp"),
    eventTail: [],
    difficulty: "hard",
    seed: state.seed,
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    actionNumber: state.stateVersion,
    profileId: "corp-ai-v0.9-hard",
  } satisfies AiDecisionInput;
  return buildAiDecisionInputDto(source);
}

function selected(input: AiDecisionInput) {
  return selectedBidChoiceOptionId(
    input,
    input.playerView.pendingChoice!,
    latestTraceContext(input),
  );
}

describe("current terminal Corp trace reserve", () => {
  it("spends the last two credits only for the exact offered trace stop", () => {
    const { state } = setup();
    const input = inputFor(state);
    const quote = input.playerView.trace?.currentRunLockBidQuote;
    expect(input.playerView.opponent.agendaPoints).toBe(3);
    expect(quote).toMatchObject({
      stateVersion: state.stateVersion,
      actionId: "corp.resolve_choice",
      choiceId: state.pendingChoice!.choiceId,
      optionId: "bid_2",
      amount: 2,
    });
    expect(
      getPlayerView(state, "runner").trace?.currentRunLockBidQuote,
    ).toBeUndefined();
    expect(selected(input)).toBe("bid_2");
  });

  it.each([
    "nonterminal",
    "higher maximum",
    "unoffered",
    "cancel response",
    "another ICE",
    "another run",
  ])("keeps the ordinary reserve for %s", (scenario) => {
    const { state, hq, tycho } = setup();
    if (scenario === "nonterminal") {
      state.corp.hq = state.corp.hq.filter((id) => id !== tycho.instanceId);
      tycho.zone = { side: "corp", zone: "rd" };
      state.corp.rd.push(tycho.instanceId);
    }
    if (scenario === "higher maximum") {
      state.run!.runTraceLinkBonus = 1;
    }
    if (scenario === "unoffered") {
      state.pendingChoice!.options.pop();
    }
    if (scenario === "cancel response") {
      const id = [...state.runner.grip, ...state.runner.stack].find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_proteus_129_back-door-to-netwatch",
      )!;
      state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
      state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
      state.runner.rig.resources.push(id);
      const card = state.cardInstances[id]!;
      card.zone = { side: "runner", zone: "rig" };
      card.faceup = true;
      card.rezzed = true;
    }
    if (scenario === "another ICE") {
      const inner = takeCorpCard(state, "onr_v1_279_wall-of-static");
      inner.zone = { side: "corp", zone: "serverIce", serverId: "hq" };
      inner.faceup = true;
      inner.rezzed = true;
      hq.ice.unshift(inner.instanceId);
      state.run!.position = { kind: "ice", serverId: "hq", iceIndex: 1 };
    }
    if (scenario === "another run") state.runner.clicks = 2;
    const input = inputFor(state);
    if (
      scenario === "higher maximum" ||
      scenario === "unoffered" ||
      scenario === "cancel response"
    ) {
      expect(input.playerView.trace?.currentRunLockBidQuote).toBeUndefined();
    }
    expect(selected(input)).toBe("bid_0");
  });
});
