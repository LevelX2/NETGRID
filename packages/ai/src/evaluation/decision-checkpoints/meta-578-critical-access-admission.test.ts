import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { currentRunAbortAssessment } from "../../runner/run-window/run-window-assessment";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerCriticalUnknownAccessRequiredHandFloor } from "../../runner-damage-threat-assessment";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-g3-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  if (!cp.input.ownDeckCapabilities) throw Error("Native deck capabilities missing");
  return cp;
}

it.each(["before-earlier-run", "before-run"])(
  "prepares the hand instead of starting the native run already condemned to immediate jack-out (%s)",
  (name) => {
    const { input, runtime } = checkpoint(name);
    const target = evaluateRunnerRunTargets({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
    }).find((t) => t.actionId === "runner.start_run.rd")!;
    expect(target.prerunReserveQuote).toMatchObject({
      status: "blocked",
      requiredHandBuffer: 2,
      handBufferGap: 1,
      unknownIceCount: 0,
      creditGap: 0,
    });
    expect(target.recommendation).toBe("draw_for_damage_buffer");
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const unchanged = JSON.stringify(input),
      result = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(unchanged);
    expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(result.actionId).not.toBe("runner.start_run.rd");
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)
        ?.expiresAtStateVersion,
    ).toBe(input.playerView.stateVersion);
    expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
      /^plan:runner\.(defense_and_recovery|economy):/,
    );
  },
);

it("retains the native in-run exit when the same critical access has already been started", () => {
  const { input } = checkpoint("abort");
  expect(currentRunAbortAssessment(input, undefined)?.evidenceCode).toContain(
    "runner_critical_low_grip_unknown_central_access_requires_jack_out",
  );
});

it("reopens the empty R&D route when the current hand is buffered", () => {
  const { input } = checkpoint("before-run");
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "owned-buffer-countercase",
  });
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.rd")!;
  expect(target.prerunReserveQuote?.status).not.toBe("blocked");
  expect(target.recommendation).toBe("run_now");
});

it("retains known agenda commitments and Archives without borrowing their exception for unknown centrals", () => {
  const { input } = checkpoint("before-run");
  expect(runnerCriticalUnknownAccessRequiredHandFloor(input, "rd", false)).toBe(
    2,
  );
  expect(runnerCriticalUnknownAccessRequiredHandFloor(input, "hq", false)).toBe(
    2,
  );
  expect(runnerCriticalUnknownAccessRequiredHandFloor(input, "rd", true)).toBe(
    0,
  );
  expect(
    runnerCriticalUnknownAccessRequiredHandFloor(input, "archives", false),
  ).toBe(0);
});

it("does not invent a critical threat from unseen opposing cards", () => {
  const { input } = checkpoint("before-run");
  input.playerView.publicEvents = [];
  input.eventTail = [];
  input.playerView.opponent.discardCards = [];
  input.playerView.servers.forEach((server) => {
    server.ice = [];
    server.root = [];
  });
  expect(runnerCriticalUnknownAccessRequiredHandFloor(input, "rd", false)).toBe(
    0,
  );
});
