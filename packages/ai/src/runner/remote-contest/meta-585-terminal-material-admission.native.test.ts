import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  { credits: 41, admitted: false },
  { credits: 100, admitted: true },
])(
  "binds the terminal Remote only when its visible Trace is funded: $credits credits",
  ({ credits, admitted }) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../runtime/test-fixtures/meta585-g24-d495-terminal-contest.json",
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
    expect(input.playerView.opponent.agendaPoints).toBe(6);
    expect(input.playerView.own.credits).toBe(41);
    // Preserve the original unsafe checkpoint and test an explicitly funded
    // current companion against the same public route and Corp bid capacity.
    input.playerView.own.credits = credits;
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    const target = evaluateRunnerRunTargets({
      input,
      deckCapabilities: buildDeckCapabilityProfileFromInput(input),
    }).find((entry) => entry.actionId === "runner.start_run.remote_1")!;
    expect(target.pathPassability).toBe("reachable");
    expect(target.visibleTraceTagHazardUnavoidable).toBe(!admitted);
    if (!admitted) {
      expect(target.score).toBeLessThan(0);
      expect(target.visibleIceRunHazards).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "trace_tag_counter",
            visibleCorpMaxTraceFundingGap: 13,
            unavoidable: true,
          }),
        ]),
      );
    }
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = JSON.stringify(input);
    const decision = chooseAiAction(input);
    if (admitted) {
      expect(decision.actionId).toBe("runner.start_run.remote_1");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.contest_remote");
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("plan:runner.contest_remote:remote%3Aremote_1");
    } else {
      expect(decision.actionId).not.toBe("runner.start_run.remote_1");
    }
    expect(
      input.legalActions.some(
        (action) =>
          action.actionId === decision.actionId &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      ),
    ).toBe(true);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  },
);
