import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const read = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
const root = "plan:runner.pressure_central:central%3Ahq";
const SMARTEYE = "onr_v1_065_smarteye";
const BLOCKS = "onr_proteus_017_credit-blocks";
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "current-smarteye-viewing-runner",
  cards: [
    ...DEMO_DECKS.demo_runner_001.cards,
    ...[
      "onr_v1_030_grubb",
      "onr_v1_054_raptor",
      "onr_v1_014_codecracker",
      SMARTEYE,
      "onr_v1_129_hq-interface",
    ].map((id) => ({ id, quantity: 1 })),
  ],
};
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "current-smarteye-viewing-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    ...[BLOCKS, "onr_v1_278_wall-of-ice", "onr_v1_290_efficiency-experts"].map(
      (id) => ({ id, quantity: 1 }),
    ),
  ],
};

function apply(state: GameState, side: "runner" | "corp", actionId: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function checkpoint() {
  // A fresh Engine prefix replaces the obsolete positive counterline whose
  // unrelated Hunt event predates the complete public expose contract.
  let state = createGameAfterSetup({
    seed: "current-smarteye-viewing",
    runnerDeck,
    corpDeck,
  });
  state = apply(state, "corp", "corp.mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  state = apply(state, "corp", "corp.end_turn");
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(20)
    .withRunnerGripSize(5)
    .withRunnerProgramInstalled("onr_v1_030_grubb")
    .withRunnerProgramInstalled("onr_v1_054_raptor")
    .withRunnerProgramInstalled("onr_v1_014_codecracker")
    .withRunnerProgramInstalled(SMARTEYE)
    .withRunnerCardInGrip("onr_v1_129_hq-interface")
    .withCorpCardInHq("simple_agenda")
    .withCorpCardInHq("onr_v1_290_efficiency-experts")
    .withCorpIceOnServer("hq", BLOCKS)
    .withRezzedCorpIceOnServer("rd", "onr_v1_278_wall-of-ice")
    .withCorpCredits(6);
  state.runner.memoryUsed = 4;
  const interfaceAction = getLegalActions(state, "runner").find(
    (a) =>
      a.type === "install_card" &&
      typeof a.payload?.cardId === "string" &&
      state.cardInstances[a.payload.cardId]?.definitionId ===
        "onr_v1_129_hq-interface",
  )!;
  state = apply(state, "runner", interfaceAction.actionId);
  const build = (s: GameState) =>
    buildAiDecisionInput(s, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: runnerDeck.id,
        side: "runner",
        cards: runnerDeck.cards.map((c) => ({
          cardId: c.id,
          quantity: c.quantity,
        })),
      },
    });
  const start = chooseAiAction(build(state));
  expect(start.actionId).toBe("runner.start_run.hq");
  expect(start.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(root);
  state = apply(state, "runner", start.actionId!);
  const expose = chooseAiAction(build(state));
  expect(expose.actionId).toContain(".expose");
  state = apply(state, "runner", expose.actionId!);
  const input = build(state);
  expect(input.playerView.run?.approachedIce).toMatchObject({
    definitionId: BLOCKS,
    effectiveRezCostQuote: { complete: true, finalCredits: 6 },
  });
  const runtime = exportAiRuntimeCheckpoint(input, runnerDeck.id);
  expect(
    runtime.residentPlanPortfolio?.runnerExposeInformationMemory,
  ).toHaveLength(1);
  const leaf = `plan:runner.convert_run_window:run%3A${input.playerView.run!.runId}`;
  resetResidentPlanPortfolioMemory();
  return {
    input,
    runtime,
    deckSnapshotId: runnerDeck.id,
    leaf,
  };
}

describe("native expose-viewing continuation (SP-472)", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("preserves both actual Engine window facts and drops unrelated payload data", () => {
    const native = read("meta489-g4-d92");
    expect(
      native.input.legalActions[0].payload.approachIceExposeViewDecision,
    ).toBeUndefined();
    const { input } = checkpoint();
    input.legalActions[0]!.payload!.untrustedHiddenHand = "secret";
    const projected = buildAiDecisionInputDto(input);
    expect(projected.legalActions[0]!.payload).toMatchObject({
      approachIceExposeViewDecision: "finish",
    });
    expect(projected.legalActions[1]!.payload).toMatchObject({
      approachIceExposeJackOut: true,
    });
    expect(
      projected.legalActions[0]!.payload!.untrustedHiddenHand,
    ).toBeUndefined();
  });

  it("finishes the revealed window with the native Root and Run executor", () => {
    const { input, runtime, deckSnapshotId, leaf } = checkpoint();
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(input.legalActions[0]!.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: root,
      leafExecutorInstanceId: leaf,
      executionOrigin: {
        rootPlanInstanceId: root,
        leafPlanInstanceId: leaf,
        stateVersion: input.playerView.stateVersion,
      },
    });
    expect(
      selected.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.join(
        "|",
      ),
    ).toContain(
      "runner_expose_viewing_continuation_bound_to_selected_information",
    );
  });

  it.each([
    "memory",
    "source",
    "target",
    "version",
    "run",
    "root",
    "event",
    "parent",
  ] as const)("fails closed for a changed %s binding", (boundary) => {
    const { input, runtime, deckSnapshotId, leaf } = checkpoint();
    const p = runtime.residentPlanPortfolio!;
    const remembered = p.runnerExposeInformationMemory?.[0];
    if (!remembered) throw new Error("Fresh native expose memory is missing");
    if (boundary === "memory") p.runnerExposeInformationMemory = [];
    if (boundary === "source")
      p.runnerExposeInformationMemory = [
        { ...remembered, sourceCardInstanceId: "different_source" },
      ];
    if (boundary === "target")
      p.runnerExposeInformationMemory = [
        { ...remembered, targetIceInstanceId: "different_ice" },
      ];
    if (boundary === "version")
      p.runnerExposeInformationMemory = [
        {
          ...remembered,
          selectedAtStateVersion: remembered.selectedAtStateVersion - 1,
        },
      ];
    if (boundary === "run") input.playerView.run!.runId = "different_run";
    if (boundary === "root") p.rootForegroundInstanceId = "different_root";
    if (boundary === "event") input.eventTail = input.eventTail!.slice(0, -1);
    if (boundary === "parent") {
      const parent = p.instances.find(
        (i: { instanceId: string }) => i.instanceId === leaf,
      )!;
      const state = parent.moduleState as { signal: Record<string, unknown> };
      parent.moduleState = {
        ...state,
        signal: { ...state.signal, windowId: "run:different_parent" },
      };
    }
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  });

  it("does not create an unrelated run root for an unbound viewing window", () => {
    const { input } = checkpoint();
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  });

  it("retains the existing safety exit after material reserve degradation", () => {
    const { input, runtime, deckSnapshotId } = checkpoint();
    const server = input.playerView.servers.find((s) => s.id === "hq")!;
    server.ice.unshift({
      instanceId: "new_inner_ice",
      known: false,
      rezzed: false,
    });
    const position = input.playerView.run!.position!;
    if (position.kind !== "ice")
      throw new Error("native approach position missing");
    position.iceIndex = 1;
    input.playerView.own.credits = 0;
    input.playerView.own.gripOrHq = [];
    input.playerView.opponent.credits = 10;
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(input.legalActions[1]!.actionId);
    expect(
      selected.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.join(
        "|",
      ),
    ).toContain("runner_run_risk_contract_degraded:hq");
    expect(selected.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      root,
    );
  });
});
