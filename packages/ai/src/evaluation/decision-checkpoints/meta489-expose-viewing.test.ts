import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const read = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
const root = "plan:runner.pressure_central:central%3Ahq";
const leaf = "plan:runner.convert_run_window:run%3Arun_85";

function checkpoint() {
  const native = read("meta489-g4-d92");
  expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
  const counterline = read("meta489-g4-d92-viewing-counterline");
  expect(counterline.provenance.kind).toBe(
    "real-engine-input-from-exact-native-api-prefix",
  );
  const input = {
    ...counterline.input,
    ...buildAiDecisionInputDto(counterline.input),
  } as AiDecisionInput;
  const runtime = structuredClone(native.runtime);
  return {
    input,
    runtime,
    deckSnapshotId: native.input.ownDeckSnapshot.deckSnapshotId,
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
    const { input, runtime, deckSnapshotId } = checkpoint();
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(input.legalActions[0]!.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: root,
      leafExecutorInstanceId: leaf,
      executionOrigin: {
        rootPlanInstanceId: root,
        leafPlanInstanceId: leaf,
        stateVersion: 91,
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
    const { input, runtime, deckSnapshotId } = checkpoint();
    const p = runtime.residentPlanPortfolio;
    if (boundary === "memory") p.runnerExposeInformationMemory = [];
    if (boundary === "source")
      p.runnerExposeInformationMemory[0].sourceCardInstanceId =
        "different_source";
    if (boundary === "target")
      p.runnerExposeInformationMemory[0].targetIceInstanceId = "different_ice";
    if (boundary === "version")
      p.runnerExposeInformationMemory[0].selectedAtStateVersion--;
    if (boundary === "run") input.playerView.run!.runId = "different_run";
    if (boundary === "root") p.rootForegroundInstanceId = "different_root";
    if (boundary === "event") input.eventTail = input.eventTail!.slice(0, -1);
    if (boundary === "parent")
      p.instances.find(
        (i: { instanceId: string }) => i.instanceId === leaf,
      ).moduleState.signal.windowId = "run:different_parent";
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
