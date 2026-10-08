import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
const captures = () => JSON.parse(readFileSync(new URL("./test-fixtures/meta-527-causes.json", import.meta.url), "utf8"));
afterEach(resetResidentPlanPortfolioMemory);
describe("meta 527 original Engine checkpoints", () => {
  it.each(["region", "boon27", "boon31", "boon39"])("chooses and applies a native action at %s without fallback", key => {
    const { checkpoint: cp, state, provenance } = captures().find((f: { key: string }) => f.key === key);
    expect(provenance.eachPrefixHashMatches).toBe(true);
    expect(provenance.checkpointHashMatches).toBe(true);
    expect(Object.values(cp.validation).every(v => v === true)).toBe(true);
    expect(hashGameState(state)).toBe(cp.stateHash);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot.deckSnapshotId, cp.runtime);
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    if (!result.actionId) throw new Error("Expected a direct native action");
    const native = input.legalActions.find((a: { actionId: string }) => a.actionId === result.actionId);
    expect(native).toBeDefined();
    if (key === "region") {
      expect(native.source).not.toBe("corp_onr_proteus_077_weapons-depot_1");
    } else {
      expect(["pump_breaker", "break_subroutine", "continue_run", "jack_out"]).toContain(native.type);
      expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toContain("runner.convert_run_window");
    }
    const applied = applyAction(state, { matchId: state.matchId, side: input.side,
      actionId: result.actionId, clientKnownStateVersion: state.stateVersion,
      ...(result.selectedChoices ? { selectedChoices: result.selectedChoices } : {}) });
    expect(applied.ok).toBe(true);
    expect(hashGameState(state)).toBe(cp.stateHash);
  });
});
