import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

afterEach(resetResidentPlanPortfolioMemory);

describe("HQ success-window value belongs to its admitted route", () => {
  it("retains the original basic HQ preparation preceding the actual G27 removal", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r8-hq-window-g27.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input: AiDecisionInput = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    restoreAiRuntimeCheckpoint(
      input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.start_run.hq");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ahq",
    );
    const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
      (p) => p.moduleId === "runner.pressure_central" && p.target?.id === "hq",
    )!;
    expect(owner.moduleState).toMatchObject({
      signal: {
        marginalValue: 320,
        evidenceCode: expect.stringContaining("hq_success_window_setup"),
      },
    });
  });
  it.each([13, 5])(
    "does not transfer an excluded basic run's preparation bonus to the event in G%i",
    (game) => {
      const cp = JSON.parse(
        readFileSync(
          new URL(
            `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r8-hq-window-g${game}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const input: AiDecisionInput = {
        ...cp.input,
        ...buildAiDecisionInputDto(cp.input),
      };
      const targets = evaluateRunnerRunTargets({ input });
      const basic = targets.find((e) => e.actionId === "runner.start_run.hq")!;
      const event = targets.find(
        (e) => e.targetServerId === "hq" && e.actionId !== basic.actionId,
      )!;
      expect(basic.recommendation).toBe("gain_credits_first");
      expect(event.score).toBe(128);
      restoreAiRuntimeCheckpoint(
        input,
        cp.input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision.fallbackUsed).toBe(false);
      expect(
        input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
      if (game === 5) {
        expect(decision.actionId).toBe("runner.start_run.rd");
        expect(
          decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
        ).toBe("plan:runner.pressure_central:central%3Ard");
      } else {
        // Positive denial keeps its own independent value even when the
        // unavailable future-removal bonus is removed.
        expect(decision.actionId).toBe(event.actionId);
      }
      const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
        (p) =>
          p.moduleId === "runner.pressure_central" && p.target?.id === "hq",
      )!;
      expect(owner.moduleState).toMatchObject({
        signal: {
          marginalValue: event.score,
          runActionExclusions: { [basic.actionId]: expect.any(Array) },
        },
      });
      expect(
        (owner.moduleState as { signal: { evidenceCode: string } }).signal
          .evidenceCode,
      ).not.toContain("hq_success_window_setup");
    },
  );
});
