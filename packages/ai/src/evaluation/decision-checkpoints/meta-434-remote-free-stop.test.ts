import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerRemoteRepeatedFreeStopEvidence } from "../../runner/remote-contest/remote-contest-admission";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r20-remote-free-stop.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  return { cp, input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) } };
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([
  "guaranteed_access",
  "score_threat",
  "event_run",
  "unknown_payoff",
  "missing_outcome",
])("does not replace current route or payoff evidence: %s", (condition) => {
  const { input } = fixture();
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.actionId === "runner.start_run.remote_2",
  )!;
  if (condition === "guaranteed_access")
    target.routeQuote!.reachability = "guaranteed_access";
  if (condition === "score_threat") target.scoreThreat = true;
  if (condition === "event_run")
    input.legalActions.find(
      (a: { actionId: string }) => a.actionId === target.actionId,
    )!.source = "own-run-event";
  if (condition === "unknown_payoff") target.accessPayoff = "unknown";
  if (condition === "missing_outcome")
    for (const events of [input.eventTail, input.playerView.publicEvents])
      delete events.find((e: { eventId: string }) => e.eventId === "evt_95")!
        .publicPayload.result;
  expect(
    runnerRemoteRepeatedFreeStopEvidence(structuredClone(input), target),
  ).toBeUndefined();
});

it("declines the repeated free remote stop through the exact Remote owner while preserving the known trash payoff", () => {
  const { cp, input } = fixture();
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.actionId === "runner.start_run.remote_2",
  )!;
  expect(target.accessPayoff).toBe("trash_affordable");
  expect(target.runCommitment).toBe("probe_only");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe(target.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
    (i) =>
      i.moduleId === "runner.contest_remote" && i.target?.id === "remote_2",
  )!;
  expect(owner.moduleState).toMatchObject({
    signal: {
      runActionAssessments: {
        [target.actionId]: {
          verdict: "explicitly_nonproductive",
          evidenceCodes: expect.arrayContaining([
            expect.stringContaining("free_stop_already_observed"),
          ]),
        },
      },
    },
  });
});

it.each(["paid_defense", "next_turn", "new_installation"])(
  "keeps a different Remote experiment available: %s",
  (condition) => {
    const { cp, input } = fixture();
    if (condition === "paid_defense")
      for (const events of [input.eventTail, input.playerView.publicEvents])
        events.find(
          (e: { eventId: string }) => e.eventId === "evt_94",
        )!.publicPayload.rezCostPaid = 1;
    if (condition === "next_turn") input.playerView.turnSerial++;
    if (condition === "new_installation")
      input.eventTail.push({
        ...input.eventTail.at(-1),
        eventId: "new-rig-install",
        stateVersionBefore: 95,
        stateVersionAfter: 96,
        publicPayload: { actor: "runner", actionType: "install_card" },
      });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.start_run.remote_2");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      residentPlanPortfolioSnapshot(input)!.instances.find(
        (i) =>
          i.moduleId === "runner.contest_remote" && i.target?.id === "remote_2",
      )!.moduleState,
    ).toMatchObject({
      signal: {
        runActionAssessments: {
          "runner.start_run.remote_2": { verdict: "executable" },
        },
      },
    });
  },
);
