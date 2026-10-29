import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerTerminalRemoteUnreachableCentralLastChance } from "../../plans/runner-run-purpose";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta568-terminal-alternative-remote.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
function targets() {
  const { input } = fixture();
  const runs = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  });
  return {
    input,
    runs,
    hq: runs.find((r) => r.actionId === "runner.start_run.hq")!,
    remote: runs.find((r) => r.actionId === "runner.start_run.remote_4")!,
  };
}
afterEach(resetResidentPlanPortfolioMemory);

it("chooses the admitted free unknown remote instead of falsely treating HQ as the only last chance", () => {
  const { input, runtime, validation } = fixture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  expect(
    input.playerView.servers.find((s) => s.id === "remote_4")?.root[0],
  ).toMatchObject({ known: false });
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({
    actionId: "runner.start_run.remote_4",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "runner.contest_remote" },
    route: {
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
});

it("withdraws the last-chance claim when a second viable remote exists", () => {
  const p = targets();
  expect(p.remote.pathPassability).toBe("reachable");
  expect(p.remote.routeQuote?.reachability).toBe("guaranteed_access");
  expect(
    runnerTerminalRemoteUnreachableCentralLastChance(p.input, p.hq, p.runs),
  ).toBe(false);
});

it("retains the central last chance when the threatened fort is the only remaining remote route", () => {
  const p = targets();
  expect(
    runnerTerminalRemoteUnreachableCentralLastChance(
      p.input,
      p.hq,
      p.runs.filter((r) => r.targetServerId !== "remote_4"),
    ),
  ).toBe(true);
});

it.each([
  "no_payoff",
  "blocked",
  "reserve",
  "hazard",
  "unaffordable",
  "stale",
  "no_access",
  "uncontestable",
] as const)(
  "does not count a %s remote as an executable alternative",
  (kind) => {
    const p = targets();
    if (kind === "no_payoff")
      p.remote.knownAccessState = "known_no_current_payoff";
    if (kind === "blocked") p.remote.pathPassability = "blocked_unpayable";
    if (kind === "reserve")
      p.remote.prerunReserveQuote = {
        ...p.remote.prerunReserveQuote!,
        status: "blocked",
      };
    if (kind === "hazard") p.remote.unavoidableVisibleIceHazardCount = 1;
    if (kind === "unaffordable") p.remote.creditsAfterRun = -1;
    if (kind === "stale")
      p.input.legalActions.find((a) => a.actionId === p.remote.actionId)!
        .expiresAtStateVersion--;
    if (kind === "no_access")
      p.remote.routeQuote = {
        ...p.remote.routeQuote!,
        reachability: "no_access",
      };
    if (kind === "uncontestable") p.remote.accessPayoffContestable = false;
    expect(
      runnerTerminalRemoteUnreachableCentralLastChance(p.input, p.hq, p.runs),
    ).toBe(true);
  },
);
