import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(resetResidentPlanPortfolioMemory);

function native(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/meta-ten-repairs/506-g" + game + "-d" + decision + ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { input, cp };
}

it.each([
  [2, 63],
  [9, 153],
  [35, 132],
])(
  "does not open native G%s/D%s with an unpayable install or unbound memory loss",
  (game, decision) => {
    const { input, cp } = native(game, decision);
    const source = input.legalActions.find(
      (a) =>
        a.payload?.cardId &&
        (String(a.payload.cardId).includes("airport-locker") ||
          String(a.payload.cardId).includes("sneak-preview")),
    )!;
    expect(source).toBeDefined();
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe(source.actionId);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(result.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(portfolio.stateVersion).toBe(cp.stateVersion);
    expect(
      portfolio.instances.filter(
        (i) =>
          i.moduleId === "runner.develop_board_and_hand" &&
          (i.moduleState as { signal?: { programSearchCommitment?: unknown } })
            ?.signal?.programSearchCommitment &&
          i.viability === "ready",
      ),
    ).toHaveLength(0);
  },
);

it.each([
  [21, 105],
  [31, 104],
  [32, 59],
])(
  "prepares the quoted hand reserve at native G%s/D%s under the Defense owner",
  (game, decision) => {
    const { input, cp } = native(game, decision);
    expect(input.playerView.own.gripOrHq).toHaveLength(3);
    const result = chooseAiAction(input);
    expect(result.actionId).toBe(
      game === 21
        ? "runner.play_event.runner_onr_v1_079_bodyweight-synthetic-blood_2.runner_onr_v1_079_bodyweight-synthetic-blood_2.onr_v1_079_bodyweight-synthetic-blood:abilities_on_play_draw_cards"
        : "runner.draw_card",
    );
    expect(result.fallbackUsed).toBe(false);
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(portfolio.stateVersion).toBe(cp.stateVersion);
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: cp.stateVersion,
      planInstanceId:
        result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    });
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)
        ?.expiresAtStateVersion,
    ).toBe(cp.stateVersion);
  },
);

it.each([
  [2, 64],
  [9, 157],
])(
  "retains fail-closed handling for an already invalid old G%s/D%s choice",
  (game, decision) => {
    const { input } = native(game, decision);
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);
