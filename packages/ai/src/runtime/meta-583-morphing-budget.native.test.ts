import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "../../../engine/src/index";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 583 Morphing Tool preparation uses one coherent general-credit ledger", () => {
  for (const [g, d] of [
    [1, 97],
    [2, 319],
  ])
    for (const dto of [false, true])
      it("resolves native G" + g + " D" + d + " DTO=" + dto, () => {
        const f = JSON.parse(
            readFileSync(
              new URL(
                "./test-fixtures/meta583-g" +
                  g +
                  "-d" +
                  d +
                  "-morphing-budget.json",
                import.meta.url,
              ),
              "utf8",
            ),
          ),
          cp = f.checkpoint;
        expect(Object.values(cp.validation).every(Boolean)).toBe(true);
        expect(hashGameState(f.state)).toBe(cp.stateHash);
        if (dto)
          cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
        cp.input.planningStateIdentity = buildPlanningStateIdentity(cp.input);
        restoreAiRuntimeCheckpoint(
          cp.input,
          cp.input.ownDeckSnapshot.deckSnapshotId,
          cp.runtime,
        );
        restoreResidentPlanPortfolioMemorySnapshot(
          cp.input,
          cp.runtime.residentPlanPortfolio,
        );
        const before = JSON.stringify(cp.input),
          selected = chooseAiAction(cp.input);
        expect(selected.fallbackUsed).toBe(false);
        expect(selected.timeoutUsed).toBe(false);
        expect(
          cp.input.legalActions.some(
            (a: any) => a.actionId === selected.actionId,
          ),
        ).toBe(true);
        const p = selected.decisionDebug!.planFirstDecision!;
        expect(p.lane).toBe("plan");
        expect(p.route).toMatchObject({
          actionId: selected.actionId,
          stateVersion: cp.stateVersion,
          planInstanceId: p.leafExecutorInstanceId,
        });
        expect(p.selectedStep!.planInstanceId).toBe(p.leafExecutorInstanceId);
        expect(JSON.stringify(cp.input)).toBe(before);
        if (!selected.actionId)
          throw new Error("Expected a direct native morphing action.");
        const command = {
          matchId: f.state.matchId,
          side: cp.actor,
          actionId: selected.actionId,
          clientKnownStateVersion: f.state.stateVersion,
          ...(selected.selectedChoices
            ? { selectedChoices: selected.selectedChoices }
            : {}),
        };
        const result = applyAction(f.state, command);
        expect(result.ok).toBe(true);
        if (!result.ok) throw Error("Native decision rejected");
        const replay = applyAction(f.state, command);
        expect(replay.ok && hashGameState(replay.state)).toBe(
          hashGameState(result.state),
        );
      });
});
