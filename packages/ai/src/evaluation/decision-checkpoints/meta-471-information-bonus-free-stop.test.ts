import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerRepeatedFreeStopProbeEvidence } from "../../runner/central-pressure/central-probe-outcome";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-471-r5-g18-d63.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
it("declines the identical free stop when an installed information payoff upgrades the unknown access label", () => {
  const cp = fixture();
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const target = evaluateRunnerRunTargets({ input }).find(
    (e) => e.actionId === "runner.start_run.hq",
  )!;
  expect(target).toMatchObject({
    accessPayoff: "access_bonus",
    knownAccessState: "unknown",
    runCommitment: "probe_only",
    routeQuote: { reachability: "conditional_access" },
  });
  expect(runnerRepeatedFreeStopProbeEvidence(input, target)).toContain(
    "free_stop_already_observed:hq:evt_62",
  );
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe(target.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
});
it.each(["guaranteed_access", "known_agenda", "new_installation"])(
  "preserves a distinct information-bonus route: %s",
  (condition) => {
    const cp = fixture();
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    const target = evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.hq",
    )!;
    if (condition === "guaranteed_access")
      target.routeQuote!.reachability = "guaranteed_access";
    if (condition === "known_agenda") target.accessPayoff = "agenda";
    if (condition === "new_installation")
      input.eventTail.push({
        ...input.eventTail.at(-1)!,
        eventId: "new-tools",
        stateVersionAfter: 63,
        publicPayload: { actor: "runner", actionType: "install_card" },
      });
    expect(
      runnerRepeatedFreeStopProbeEvidence(structuredClone(input), target),
    ).toBeUndefined();
  },
);
