import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { releaseAiMatchRuntime } from "../runtime/match-runtime-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep690-run-event-random-break.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
};

function input() {
  const raw = structuredClone(fixture.input);
  return { ...raw, ...buildAiDecisionInputDto(raw) };
}
function hqEvaluations(value = input()) {
  return evaluateRunnerRunTargets({ input: value }).filter(
    (e) => e.targetServerId === "hq",
  );
}
afterEach(() => releaseAiMatchRuntime(fixture.input.matchId!));

describe("native P690 D115 run-event random-break hand buffer", () => {
  it("rejects the event's H2 route while preserving the basic H3 route", () => {
    const evaluations = hqEvaluations();
    const event = evaluations.find((e) => e.actionId.includes("all-nighter"));
    const basic = evaluations.find((e) => e.actionId === "runner.start_run.hq");
    expect(event).toMatchObject({
      pathPassability: "blocked_by_random_break_damage_hand_buffer",
      recommendation: "draw_for_damage_buffer",
      randomBreakOrDamageRiskAssessment: {
        currentHandCount: 3,
        handAfterActionCost: 2,
        blockedByHandBuffer: true,
        breakWouldBeExcludedInEncounter: true,
      },
    });
    expect(basic).toMatchObject({
      pathPassability: "reachable",
      randomBreakOrDamageRiskAssessment: {
        handAfterActionCost: 3,
        blockedByHandBuffer: false,
      },
    });
  });

  it("returns preparation to the existing Defense owner instead of starting the unusable event", () => {
    const value = input();
    if (!value.ownDeckSnapshot) throw new Error("native_deck_snapshot_missing");
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      value,
      value.ownDeckSnapshot.deckSnapshotId,
      structuredClone(fixture.runtime),
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      value,
      structuredClone(fixture.runtime.residentPlanPortfolio),
    );
    const selected = chooseAiAction(value);
    expect(selected.selectionKind).toBe("direct");
    expect(selected.actionId).not.toContain("all-nighter");
    expect(
      value.legalActions.some((a) => a.actionId === selected.actionId),
    ).toBe(true);
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.actionId).toBe("runner.draw_card");
    expect(selected.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:runner.defense_and_recovery:runner",
    );
    expect(selected.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: selected.actionId,
      stateVersion: value.playerView.stateVersion,
    });
  });

  it("preserves the event after an additional known own hand card restores H3 after payment", () => {
    const value = input();
    // Unit contrast to the native checkpoint: one extra own draw, no opponent information.
    value.playerView.own.gripOrHq.push({
      ...value.playerView.own.gripOrHq[0]!,
      instanceId: "own-hand-buffer-control",
    });
    const event = hqEvaluations(value).find((e) =>
      e.actionId.includes("all-nighter"),
    );
    expect(event).toMatchObject({
      pathPassability: "reachable",
      randomBreakOrDamageRiskAssessment: {
        currentHandCount: 4,
        handAfterActionCost: 3,
        blockedByHandBuffer: false,
      },
    });
  });
});
