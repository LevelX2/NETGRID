import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  applyAction,
  hashGameState,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
const load = () =>
  JSON.parse(
    readFileSync(
      new URL("./test-fixtures/progress-before-capacity.json", import.meta.url),
      "utf8",
    ),
  );
const gate =
  "corp.install_card.corp_onr_v1_261_quandary_3.hq.corp_onr_v1_261_quandary_3.1";
function choose(
  f: ReturnType<typeof load>,
  order: "original" | "reverse" | "gate_first" = "original",
) {
  const input: AiDecisionInputWithDeckCapabilities = {
    ...f.checkpoint.input,
    ...buildAiDecisionInputDto(f.checkpoint.input),
  };
  if (order === "reverse") input.legalActions.reverse();
  if (order === "gate_first")
    input.legalActions.sort(
      (a, b) => Number(b.actionId === gate) - Number(a.actionId === gate),
    );
  const before = JSON.stringify(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.checkpoint.runtime,
  );
  const d = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(d.fallbackUsed).not.toBe(true);
  expect(d.timeoutUsed).not.toBe(true);
  return { input, d };
}
afterEach(resetResidentPlanPortfolioMemory);
describe("Native defensive progress before zero-tax capacity release", () => {
  it.each(["original", "reverse", "gate_first"] as const)(
    "prefers the funded Code Gate under %s offer order",
    (order) => {
      const f = load();
      expect(
        Object.values(f.checkpoint.validation).every((v) => v === true),
      ).toBe(true);
      expect(f.provenance.checkedOriginalStates).toBe(84);
      expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
      const { input, d } = choose(f, order);
      expect(d.actionId).toBe(gate);
      expect(d.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject({
        moduleId: "corp.defend_servers",
        phase: "defense",
        executionState: "executor",
      });
      expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
        "plan:corp.defend_servers:server-defense-portfolio",
      );
      expect(input.playerView.stateVersion).toBe(83);
      expect(input.legalActions.some((a) => a.actionId === d.actionId)).toBe(
        true,
      );
    },
  );
  it("executes the same native bound install and preserves deterministic replay", () => {
    const f = load(),
      { d } = choose(f);
    expect(d.actionId).toBe(gate);
    const r = applyAction(f.state, {
      matchId: f.state.matchId,
      side: "corp",
      actionId: d.actionId!,
      clientKnownStateVersion: 83,
      ...(d.selectedChoices ? { selectedChoices: d.selectedChoices } : {}),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw Error(r.error.message);
    expect(r.state.corp.credits).toBe(5);
    const replay = replayEvents(
      f.state,
      r.state.eventLog.slice(f.state.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw Error("Replay failed");
    expect(hashState(replay.state)).toBe(hashState(r.state));
  });
});
