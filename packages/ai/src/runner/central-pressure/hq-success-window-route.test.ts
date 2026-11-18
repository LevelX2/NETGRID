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
import { projectRunnerRunActions } from "../../actions/run-action-projection";
import { runnerCentralPressureRunTracePurpose } from "./central-pressure-plan-module";

afterEach(resetResidentPlanPortfolioMemory);

describe("HQ success-window value belongs to its admitted route", () => {
  it.each([
    [13, "corp_lose_credits", 0, true],
    [5, "runner_spend_corp_lose_credits", 3, true],
    [27, "corp_lose_credits", 3, true],
    [27, "corp_lose_credits", 0, false],
  ] as const)(
    "describes the selected HQ replacement from G%i with replacement %s and %i Corp credits",
    (game, replacement, credits, isCreditDenial) => {
      const fixture = JSON.parse(
        readFileSync(
          new URL(
            `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r8-hq-window-g${game}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const input: AiDecisionInput = {
        ...fixture.input,
        ...buildAiDecisionInputDto(fixture.input),
      };
      input.playerView.opponent.credits = credits;
      const projections = projectRunnerRunActions({ input });
      const event = projections.find(
        (projection) => projection.accessReplacement === replacement,
      )!;
      const basic = projections.find(
        (projection) => projection.actionId === "rs.hq",
      )!;
      expect(runnerCentralPressureRunTracePurpose(input, event)).toBe(
        isCreditDenial ? "Execute credit-denial pressure on hq." : undefined,
      );
      expect(runnerCentralPressureRunTracePurpose(input, basic)).toBeUndefined();
    },
  );
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
    expect(decision.actionId).toBe("rs.hq");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "pa7nez1ioecg7mf06q1uwqq57o",
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
      const basic = targets.find((e) => e.actionId === "rs.hq")!;
      const event = targets.find(
        (e) => e.targetServerId === "hq" && e.actionId !== basic.actionId,
      )!;
      expect(basic.recommendation).toBe("gain_credits_first");
      expect(
        event.evidence.some((e) => e.includes("hq_success_window_setup")),
      ).toBe(false);
      expect(event.score).toBeLessThan(0);
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
        expect(decision.actionId).toBe("rs.rd");
        expect(
          decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
        ).toBe("pa90fufw9vc5bkshp96ztlryxl");
      } else {
        // The one-credit denial does not pay for the six-credit ICE path.
        expect(decision.actionId).toBe("rb");
      }
      const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
        (p) =>
          p.moduleId === "runner.pressure_central" && p.target?.id === "hq",
      )!;
      expect(owner.moduleState).toMatchObject({
        signal: {
          reachable: false,
          runActionIds: [],
          runActionExclusions: {
            [basic.actionId]: expect.any(Array),
            [event.actionId]: expect.any(Array),
          },
          runActionRouteDiagnostics: {
            [event.actionId]: { rawRouteScore: event.score },
          },
        },
      });
      expect(
        (owner.moduleState as { signal: { evidenceCode: string } }).signal
          .evidenceCode,
      ).not.toContain("hq_success_window_setup");
    },
  );
});
