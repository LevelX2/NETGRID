import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { completeEncounterBreakerPayment } from "./run-window-encounter-payment";

function native() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-618-d238-bound-post-pass-risk.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const cheap = input.legalActions.find(
    (a: { type: string; costs: { credits?: number }[] }) =>
      a.type === "break_subroutine" && a.costs[0]?.credits === 1,
  )!;
  const costly = input.legalActions.find(
    (a: { type: string; costs: { credits?: number }[] }) =>
      a.type === "break_subroutine" && a.costs[0]?.credits === 2,
  )!;
  // D237's actual public break bound the check before this D238 checkpoint.
  // Both exact Engine branches then consume the same single random draw.
  input.playerView.run.postPassTrashCheckUsedBreakerIdsThisEncounter = [
    cheap.source,
  ];
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input, cheap, costly };
}

afterEach(resetResidentPlanPortfolioMemory);

it("compares the cheaper last-ICE break after its post-pass risk is already bound", () => {
  const { input, cheap, costly } = native();
  const payment = completeEncounterBreakerPayment(input, cheap);
  expect(payment).toMatchObject({
    cost: 1,
    cashCost: 1,
    liquidCreditsAfterPayment: 1,
  });
  expect(completeEncounterBreakerPayment(input, costly)).toMatchObject({
    cost: 2,
    liquidCreditsAfterPayment: 0,
  });
});

it("keeps the native run root, executor, route and input while retaining the last credit", () => {
  const { cp, input, cheap } = native();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.parse(JSON.stringify(input));
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(cheap.actionId);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ard",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.convert_run_window:run%3Arun_212",
  );
  expect(plan.route).toMatchObject({
    actionId: cheap.actionId,
    stateVersion: 237,
  });
  expect(
    Object.keys({ ...before, ...input }).filter(
      (key) => JSON.stringify(input[key]) !== JSON.stringify(before[key]),
    ),
  ).toEqual([]);
});

it("preserves the Engine fact through the DTO and rejects malformed usage", () => {
  const { input, cheap } = native();
  expect(buildAiDecisionInputDto(input).playerView.run).toHaveProperty(
    "postPassTrashCheckUsedBreakerIdsThisEncounter",
    [cheap.source],
  );
  input.playerView.run.postPassTrashCheckUsedBreakerIdsThisEncounter.push(
    cheap.source,
  );
  expect(() => buildAiDecisionInputDto(input)).toThrow(/post-pass/);
});

it.each(["unbound", "another_source", "inner_ice"])(
  "does not certify an equivalent payment at %s",
  (boundary) => {
    const { input, cheap, costly } = native();
    if (boundary === "unbound")
      delete input.playerView.run.postPassTrashCheckUsedBreakerIdsThisEncounter;
    if (boundary === "another_source")
      input.playerView.run.postPassTrashCheckUsedBreakerIdsThisEncounter = [
        costly.source,
      ];
    if (boundary === "inner_ice") {
      const server = input.playerView.servers.find(
        (s: { id: string }) => s.id === "rd",
      )!;
      [server.ice[0], server.ice[1]] = [server.ice[1], server.ice[0]];
      input.playerView.run.position.iceIndex = 1;
    }
    expect(completeEncounterBreakerPayment(input, cheap)).toBeUndefined();
  },
);
