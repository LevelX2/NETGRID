import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerRunLockReleaseProjection } from "../../runtime/runner-run-lock-release-score";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each(["native_four_point_remote", "ordinary_companion"] as const)(
  "releases the funded Run-parent route after recurring income: %s",
  (variant) => {
    const checkpoint = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r5-g4-d191.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const input = checkpoint.input;
    if (variant === "ordinary_companion") {
      input.playerView.opponent.agendaPoints = 2;
      expect(runnerTerminalContestThreat(input)).toBeUndefined();
    } else {
      expect(input.playerView.opponent.agendaPoints).toBe(3);
      expect(runnerTerminalContestThreat(input)?.kind).toBe(
        "visible_four_point_remote",
      );
    }
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      checkpoint.runtime,
    );
    const release = input.legalActions.find(
      (a) =>
        a.type === "trigger_ability" &&
        a.payload?.abilityId === "pay_to_remove_run_lock",
    )!;
    expect(input.playerView.own.credits).toBe(42);
    expect(input.playerView.own.clicks).toBe(4);
    expect(runnerRunLockReleaseProjection(input, release)).toMatchObject({
      status: "ready",
      fundingGap: 0,
    });
    const before = JSON.stringify(input),
      beforeFingerprint =
        input.planningStateIdentity!.sideSafePlanningFingerprint,
      decision = chooseAiAction(input);
    expect(decision.actionId).toBe(release.actionId);
    expect(decision.reasonCode).toBe(
      variant === "ordinary_companion"
        ? "plan_first.runner.pressure_central"
        : "plan_first.runner.contest_remote",
    );
    expect(decision.fallbackUsed).toBe(false);
    if (variant === "ordinary_companion")
      expect(decision.evidence).toContain(
        "plan_step_capability:pressure_hq_access",
      );
    else
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toMatch(/^plan:runner\.contest_remote:/);
    const after = structuredClone(input);
    if (variant === "ordinary_companion") {
      // Changing the public score invalidates only this derived identity.
      // Engine facts and every other input field remain immutable.
      expect(after.planningStateIdentity!.sideSafePlanningFingerprint).not.toBe(
        beforeFingerprint,
      );
      after.planningStateIdentity!.sideSafePlanningFingerprint =
        beforeFingerprint;
    }
    expect(JSON.stringify(after)).toBe(before);
  },
);
