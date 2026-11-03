import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerRunRiskContractReassessment } from "./run-window-assessment";
import { pureEndRunEncounterPayment } from "./run-window-pure-etr-economics";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
function native(fixture = "cp-meta588-terminal-etr-reserve.json") {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/${fixture}`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const signal = cp.runtime.residentPlanPortfolio.instances.find(
    (p: { moduleId: string }) => p.moduleId === "runner.contest_remote",
  ).moduleState.signal;
  const origin = {
    runRiskContract: signal.runRiskContract,
    accessCommitment: signal.accessCommitment,
  } as RunnerRunOrigin;
  const action = input.legalActions.find(
    (a: { type: string; actionId: string }) =>
      a.type === "break_subroutine" &&
      a.actionId.includes("printed_subroutines_end_the_run"),
  );
  return { cp, input, origin, action };
}
afterEach(resetResidentPlanPortfolioMemory);
it("retains the same terminal risk decision after passing the paid encounter", () => {
  const { input, origin } = native();
  input.playerView.timingPoint = "run.jack_out_window";
  input.playerView.run.phase = "movement";
  input.playerView.run.position.iceIndex = 1;
  input.playerView.own.credits = 2;
  expect(runnerRunRiskContractReassessment(input, origin)).toMatchObject({
    decision: "preserve_continuation",
    currentReserveQuote: { creditGap: 2, handBufferGap: 0 },
    evidenceCodes: expect.arrayContaining([
      "runner_terminal_last_action_spends_unknown_ice_cash_reserve",
    ]),
  });
  origin.runRiskContract!.reserveQuote.riskTolerance = "standard";
  expect(runnerRunRiskContractReassessment(input, origin)?.decision).toBe(
    "prefer_jack_out",
  );
});
it("spends an affordable mandatory ETR payment on the last action of the bound terminal contest", () => {
  const { cp, input, action } = native();
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input),
    p = d.decisionDebug!.planFirstDecision!;
  expect(d.actionId).toBe(action.actionId);
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).toBe(false);
  expect(p.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(p.selectedPlan!.moduleId).toBe("runner.convert_run_window");
  expect(p.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 260,
  });
  expect(JSON.stringify(input)).toBe(before);
});
it.each([
  "ordinary_run",
  "another_action",
  "hand_gap",
  "no_current_deadline",
  "no_payment",
  "unaffordable_payment",
  "stale_action",
  "known_mixed_encounter",
] as const)("preserves the reserve boundary %s", (boundary) => {
  const { input, origin, action } = native();
  if (boundary === "ordinary_run")
    origin.runRiskContract!.reserveQuote.riskTolerance = "standard";
  if (boundary === "another_action") input.playerView.own.clicks = 1;
  if (boundary === "hand_gap") input.playerView.own.gripOrHq.pop();
  if (boundary === "no_current_deadline")
    input.playerView.opponent.agendaPoints = 0;
  if (boundary === "unaffordable_payment") input.playerView.own.credits = 0;
  if (boundary === "stale_action") action.expiresAtStateVersion -= 1;
  if (boundary === "known_mixed_encounter") {
    const remote = input.playerView.servers.find(
      (server: { id: string }) => server.id === "remote_1",
    );
    const encountered = input.playerView.run.encounteredIce;
    remote.ice[0] = { ...encountered, instanceId: remote.ice[0].instanceId };
    remote.ice[0].effectiveRunQuote = {
      ...encountered.effectiveRunQuote,
      iceInstanceId: remote.ice[0].instanceId,
    };
  }
  const payment =
    boundary === "no_payment"
      ? undefined
      : pureEndRunEncounterPayment(input, action);
  expect(
    runnerRunRiskContractReassessment(input, origin, payment, action)?.decision,
  ).toBe("prefer_jack_out");
});

it("keeps the free ETR break after paying Skeleton's strength in the same terminal contest", () => {
  const { cp, input, origin, action } = native(
    "cp-meta590-free-terminal-etr.json",
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const payment = pureEndRunEncounterPayment(input, action);
  expect(payment).toMatchObject({ cost: 0, liquidCreditsAfterPayment: 3 });
  expect(
    runnerRunRiskContractReassessment(input, origin, payment, action),
  ).toMatchObject({ decision: "preserve_continuation" });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify({
      playerView: input.playerView,
      legalActions: input.legalActions,
    }),
    decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(decision.decisionDebug!.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    selectedPlan: { moduleId: "runner.convert_run_window" },
    route: { actionId: action.actionId, stateVersion: 342 },
  });
  expect(
    JSON.stringify({
      playerView: input.playerView,
      legalActions: input.legalActions,
    }) === before,
  ).toBe(true);
});
it.each(["ordinary_run", "another_action", "stale_action"] as const)(
  "keeps the free-break reserve boundary %s",
  (boundary) => {
    const { input, origin, action } = native(
      "cp-meta590-free-terminal-etr.json",
    );
    if (boundary === "ordinary_run")
      origin.runRiskContract!.reserveQuote.riskTolerance = "standard";
    if (boundary === "another_action") input.playerView.own.clicks = 1;
    if (boundary === "stale_action") action.expiresAtStateVersion -= 1;
    expect(
      runnerRunRiskContractReassessment(
        input,
        origin,
        pureEndRunEncounterPayment(input, action),
        action,
      )?.decision,
    ).toBe("prefer_jack_out");
  },
);
