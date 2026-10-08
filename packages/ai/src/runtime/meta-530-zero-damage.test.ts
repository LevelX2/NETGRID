import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);
function fixture() {
  const f = JSON.parse(
    readFileSync(
      new URL("./test-fixtures/meta-530-zero-damage.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.checkpoint.validation).every((v) => v === true)).toBe(
    true,
  );
  expect(
    f.provenance.eachPrefixHashMatches && f.provenance.checkpointHashMatches,
  ).toBe(true);
  expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
  return f;
}
function take(state: GameState, actionId: string) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}
it("emits the certificate for both native Rental zero-core breaks, keeping ETR and the exact legal set", () => {
  const f = fixture(),
    before = hashGameState(f.state),
    actions = getLegalActions(f.state, "runner");
  expect(actions.map((a) => a.actionId).sort()).toEqual(
    f.checkpoint.input.legalActions
      .map((a: { actionId: string }) => a.actionId)
      .sort(),
  );
  for (const original of f.checkpoint.input.legalActions) {
    const current = actions.find((a) => a.actionId === original.actionId)!;
    expect(current.costs).toEqual(original.costs);
  }
  const breaks = actions.filter((a) => a.type === "break_subroutine");
  expect(breaks.filter((a) => a.payload?.subroutineIndex === 0)).toHaveLength(
    2,
  );
  expect(
    breaks
      .filter((a) => a.payload?.subroutineIndex === 0)
      .every(
        (a) =>
          a.payload?.breakSubroutinePurpose ===
          "zero_damage_no_secondary_effect",
      ),
  ).toBe(true);
  expect(
    breaks
      .filter((a) => a.payload?.subroutineIndex === 1)
      .every((a) => a.payload?.breakSubroutinePurpose === undefined),
  ).toBe(true);
  expect(hashGameState(f.state)).toBe(before);
});
it("uses the actual Engine certificate at the restored native checkpoint and keeps the run owner", () => {
  const f = fixture(),
    actions = getLegalActions(f.state, "runner");
  // Transfer only the new metadata from the real Engine producer. Captured
  // costs, IDs, information projection and all nine bindings stay original.
  for (const original of f.checkpoint.input.legalActions) {
    const current = actions.find((a) => a.actionId === original.actionId)!;
    if (current.payload?.breakSubroutinePurpose !== undefined)
      original.payload.breakSubroutinePurpose =
        current.payload.breakSubroutinePurpose;
  }
  const input = {
    ...f.checkpoint.input,
    ...buildAiDecisionInputDto(f.checkpoint.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.checkpoint.runtime,
  );
  const before = JSON.stringify({
      view: input.playerView,
      legal: input.legalActions,
      deck: input.ownDeckSnapshot,
    }),
    decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.convert_run_window");
  const selected = actions.find((a) => a.actionId === decision.actionId)!;
  expect(selected.type).toBe("break_subroutine");
  expect(selected.payload?.subroutineIndex).toBe(1);
  expect(
    JSON.stringify({
      view: input.playerView,
      legal: input.legalActions,
      deck: input.ownDeckSnapshot,
    }),
  ).toBe(before);
  const broken = take(f.state, selected.actionId);
  expect(broken.run!.brokenSubroutineIndexes).toEqual([1]);
  const continuation = getLegalActions(broken, "runner").find(
    (a) => a.type === "continue_run",
  )!;
  const passed = take(broken, continuation.actionId);
  expect(passed.runner.coreDamage).toBe(f.state.runner.coreDamage);
  expect(passed.run).toBeDefined();
});
it("shows the original zero-core break is strictly costly before the still-unbroken ETR ends the run", () => {
  const f = fixture(),
    actions = getLegalActions(f.state, "runner");
  const zero = actions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  const broken = take(f.state, zero.actionId);
  const paid = take(
    broken,
    getLegalActions(broken, "runner").find((a) => a.type === "continue_run")!
      .actionId,
  );
  const direct = take(
    f.state,
    actions.find((a) => a.type === "continue_run")!.actionId,
  );
  expect(paid.run).toBeUndefined();
  expect(direct.run).toBeUndefined();
  expect(direct.runner.coreDamage).toBe(paid.runner.coreDamage);
  expect(direct.runner.credits - paid.runner.credits).toBe(1);
  expect(paid.runner.heap).toContain(zero.payload!.breakerId);
  expect(direct.runner.rig.programs).toContain(zero.payload!.breakerId);
});
