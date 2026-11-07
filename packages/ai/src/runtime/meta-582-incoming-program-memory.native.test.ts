import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashGameState,
} from "../../../engine/src/index";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";

const positions = [
  [7, 280, "runner_onr_classic_031_rent-i-con_3"],
  [19, 186, "runner_onr_classic_031_rent-i-con_3"],
] as const;

function fixture(game: number, decision: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        `./test-fixtures/meta582-g${game}-d${decision}-memory.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 582 incoming identical program preserves recurring economy", () => {
  it.each(positions)(
    "G%i D%i replaces the installed duplicate %s",
    (g, d, oldId) => {
      const f = fixture(g, d),
        cp = f.checkpoint;
      expect(Object.values(cp.validation).every(Boolean)).toBe(true);
      expect(hashGameState(f.state)).toBe(cp.stateHash);
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
      expect(selected.actionId).toBe("runner.resolve_choice");
      expect(selected.selectedChoices).toEqual({
        choiceId: cp.input.playerView.pendingChoice.choiceId,
        selectedOptionIds: [`card_${oldId}`],
      });
      expect(
        selected.decisionDebug!.planFirstDecision!.executionOrigin,
      ).toMatchObject({
        rootPlanInstanceId: "rules",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        stateVersion: cp.stateVersion,
        windowKind: "mandatory_choice",
        windowId: `runner_action.main:${cp.stateVersion}`,
      });
      expect(JSON.stringify(cp.input)).toBe(before);
      if (!selected.actionId || !selected.selectedChoices)
        throw new Error("Expected the direct native memory choice.");
      const command = {
        matchId: f.state.matchId,
        side: "runner" as const,
        actionId: selected.actionId,
        clientKnownStateVersion: f.state.stateVersion,
        selectedChoices: selected.selectedChoices,
      };
      const applied = applyAction(f.state, command);
      expect(applied.ok).toBe(true);
      if (!applied.ok) throw new Error("Native memory action rejected");
      const view = getPlayerView(applied.state, "runner");
      const rig = view.own.rig;
      if (!rig) throw new Error("Native Runner rig projection missing.");
      expect(rig.some((c) => c.instanceId === oldId)).toBe(false);
      const supports = cp.input.playerView.own.rig.filter((c: any) =>
        [
          "onr_v1_011_cloak",
          "onr_v1_035_invisibility",
          "onr_v1_071_vewy-vewy-quiet",
        ].includes(c.definitionId),
      );
      for (const card of supports)
        expect(rig.some((c) => c.instanceId === card.instanceId)).toBe(true);
      expect(
        rig.some((c) => c.definitionId === "onr_classic_031_rent-i-con"),
      ).toBe(true);
      expect(view.own.memoryUsed).toBeLessThanOrEqual(view.own.memoryLimit!);
      const replay = applyAction(f.state, command);
      expect(replay.ok && hashGameState(replay.state)).toBe(
        hashGameState(applied.state),
      );
    },
  );

  it.each(positions)(
    "retains G%i D%i choices through the shared DTO (%s)",
    (g, d, oldId) => {
      const cp = fixture(g, d).checkpoint;
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
      expect(chooseAiAction(cp.input).selectedChoices).toEqual({
        choiceId: cp.input.playerView.pendingChoice.choiceId,
        selectedOptionIds: [`card_${oldId}`],
      });
    },
  );

  it.each([false, true])(
    "keeps a useful second breaker when duplicate economy is cheaper to lose DTO=%s",
    (dto) => {
      const f = fixture(23, 296),
        cp = f.checkpoint;
      if (dto) cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
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
      const selected = chooseAiAction(cp.input);
      // This state already has two Vewy copies, Cloak and Invisibility. Keeping
      // two consumable breakers still preserves six recurring credits.
      expect(selected.selectedChoices).toEqual({
        choiceId: cp.input.playerView.pendingChoice.choiceId,
        selectedOptionIds: ["card_runner_onr_v1_071_vewy-vewy-quiet_1"],
      });
      if (!selected.actionId || !selected.selectedChoices)
        throw new Error("Expected the direct native memory choice.");
      const result = applyAction(f.state, {
        matchId: f.state.matchId,
        side: "runner",
        actionId: selected.actionId,
        clientKnownStateVersion: f.state.stateVersion,
        selectedChoices: selected.selectedChoices,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Native counterexample rejected");
      const view = getPlayerView(result.state, "runner");
      const rig = view.own.rig;
      if (!rig) throw new Error("Native Runner rig projection missing.");
      expect(
        rig.filter((c) => c.definitionId === "onr_classic_031_rent-i-con"),
      ).toHaveLength(2);
      expect(
        rig.some((c) => c.instanceId === "runner_onr_v1_071_vewy-vewy-quiet_2"),
      ).toBe(true);
      expect(rig.some((c) => c.definitionId === "onr_v1_011_cloak")).toBe(true);
      expect(
        rig.some((c) => c.definitionId === "onr_v1_035_invisibility"),
      ).toBe(true);
    },
  );
});
