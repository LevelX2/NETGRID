import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { reconstructBeliefState } from "../../belief-state";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  runnerTerminalRemoteLastChanceKnownPathFundingGap,
  runnerTerminalRemoteContestIsDirectlyMandatory,
} from "../../runner/remote-contest/remote-contest-admission";
import { evaluateKnownRemoteAccessPayoff } from "../../known-remote-access-payoff";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
afterEach(resetResidentPlanPortfolioMemory);
function fixture() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta573-r3-g34d371.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
it("quotes the self-steal price of the still valid reconcealed agenda memory", () => {
  const { input } = fixture();
  expect(
    input.playerView.servers.find((s) => s.id === "remote_3")!.root[0]!.known,
  ).toBe(false);
  expect(
    reconstructBeliefState(input).runnerOpponentModel!.knownPositionMemory,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        zone: "remote_3",
        positionKey: "root:0",
        definitionId: "onr_proteus_004_fetal-ai",
      }),
    ]),
  );
  const p = evaluateKnownRemoteAccessPayoff(input, "remote_3");
  expect(p).toMatchObject({
    payoff: "agenda",
    contestable: false,
    accessDecision: "defer_until_funded",
    declineReason: "insufficient_credits",
  });
  expect(p.evidence).toContain("known_remote_agenda_steal_cost:2");
});
it("funds the exact remembered remote before repeating its native unpaid terminal run", () => {
  const f = fixture(),
    input = f.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(d).toMatchObject({
    actionId: "runner.gain_credit",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    input.legalActions.find((a) => a.actionId === d.actionId)
      ?.expiresAtStateVersion,
  ).toBe(370);
  expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_3",
  );
});
it("does not invent a remembered self-cost after removing its actual observation", () => {
  const { input } = fixture();
  input.eventTail = [];
  input.playerView.publicEvents = [];
  expect(evaluateKnownRemoteAccessPayoff(input, "remote_3").payoff).toBe(
    "unknown",
  );
});

it.each(["unknown_ice", "lethal", "not_terminal"] as const)(
  "rejects the exceptional whole-route funding with %s evidence",
  (variant) => {
    const { input } = fixture();
    if (variant === "lethal")
      input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 1);
    if (variant === "not_terminal") {
      input.playerView.own.agendaPoints = 0;
      input.playerView.opponent.agendaPoints = 0;
    }
    const target = evaluateRunnerRunTargets({ input }).find(
      (t) => t.actionId === "runner.start_run.remote_3",
    )!;
    if (variant === "unknown_ice") target.routeQuote!.unknownIceCount = 1;
    expect(
      runnerTerminalRemoteLastChanceKnownPathFundingGap(input, target),
    ).toBeUndefined();
    expect(runnerTerminalRemoteContestIsDirectlyMandatory(input, target)).toBe(
      false,
    );
  },
);
it("retains the already funded nonlethal terminal contest instead of further credit or hand preparation", () => {
  const f = fixture(),
    input = f.input;
  input.playerView.own.credits = 2;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_3",
  )!;
  expect(target.routeQuote!.fundingGap).toBe(0);
  expect(runnerTerminalRemoteContestIsDirectlyMandatory(input, target)).toBe(
    true,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(d).toMatchObject({
    actionId: "runner.start_run.remote_3",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_3",
  );
});
