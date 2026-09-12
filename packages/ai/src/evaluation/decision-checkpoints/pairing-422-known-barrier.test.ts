import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-known-barrier-d280.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { quoteRunnerRunRoute } from "../../run-analysis/runner-run-route-quote";
import type { VisibleCard } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

it("does not waive a known break lock and ETR as a last-chance damage floor", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
  const target = evaluateRunnerRunTargets({ input }).find(
    (entry) => entry.actionId === "runner.start_run.remote_2",
  );
  expect(target).toMatchObject({
    pathPassability: "blocked_by_visible_damage_hand_buffer",
    routeQuote: { reachability: "no_access", noAccessReason: "harmful_unbroken_run_effect" },
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe("runner.start_run.remote_2");
  expect(decision.fallbackUsed).toBe(false);
  expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision?.dispositions).toContainEqual(
    expect.objectContaining({ actionId: "runner.start_run.remote_2", ownerModuleId: "runner.contest_remote", disposition: "explicitly_nonproductive" }),
  );
});

it("continues past direct damage to preserve a later known ETR barrier", () => {
  const input = checkpointJson.input as unknown as AiDecisionInputWithDeckCapabilities;
  const wall = input.playerView.servers.find((server) => server.id === "remote_2")!.ice.find(
    (card) => card.definitionId === "onr_v1_278_wall-of-ice",
  )!;
  const path = assessKnownRezzedIcePath([wall, damageOnlyIce()], [], 4);
  expect(path).toMatchObject({
    knownPathBlockedByEtr: true,
    noAccessReason: "missing_breaker_coverage",
    assessedKnownIceCount: 2,
  });
  expect(quoteRunnerRunRoute({ path, availableCredits: 4 }).blockedOnlyByDamage).toBeUndefined();
});

it("certifies the damage-only exception after every known encounter is checked", () => {
  const path = assessKnownRezzedIcePath([damageOnlyIce()], [], 4);
  expect(path).toMatchObject({
    blocked: true,
    knownPathBlockedOnlyByDamage: true,
    assessedKnownIceCount: 1,
    creditsAfterPath: 4,
  });
  expect(quoteRunnerRunRoute({ path, availableCredits: 4 })).toMatchObject({
    reachability: "no_access",
    blockedOnlyByDamage: true,
    fundingGap: 0,
  });
});

function damageOnlyIce(): VisibleCard {
  return {
    instanceId: "known-data-darts",
    definitionId: "onr_v1_234_data-darts",
    title: "Data Darts",
    known: true,
    rezzed: true,
    owner: "corp",
    controller: "corp",
    type: "ice",
    subtypes: ["ap", "hellbolt", "sentry"],
    strength: 3,
    advancementCounters: 0,
    effectiveRunQuote: {
      iceInstanceId: "known-data-darts",
      iceDefinitionId: "onr_v1_234_data-darts",
      effectiveStrength: 3,
      subroutines: [
        { id: "damage", type: "do_damage", damageType: "net", amount: 3, sourceDefinitionId: "onr_v1_234_data-darts", unbrokenRunEffect: { causesDamageOrProgramTrash: true } },
        { id: "next-break-lock", type: "set_next_encounter_no_break_subroutines", sourceDefinitionId: "onr_v1_234_data-darts", unbrokenRunEffect: { preventsFutureBreaking: true } },
      ],
    },
  };
}
