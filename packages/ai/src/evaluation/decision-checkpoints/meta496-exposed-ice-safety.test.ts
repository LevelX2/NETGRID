import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerExposedIceSafetyAssessment } from "../../runner/run-window/run-window-expose-viewing";

const read = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
function checkpoint() {
  const native = read("meta496-g8-d106");
  expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
  const facts = read("meta496-g8-d106-post-rez-facts").ice;
  const input = structuredClone(
    native.input,
  ) as AiDecisionInputWithDeckCapabilities;
  input.playerView.run!.approachedIce = {
    ...facts,
    effectiveRezCostQuote: {
      ...facts.effectiveRezCostQuote,
      expiresAtStateVersion: input.playerView.stateVersion,
    },
    effectivePostRezRunQuote: {
      ...facts.effectivePostRezRunQuote,
      expiresAtStateVersion: input.playerView.stateVersion,
    },
  };
  return { input, runtime: structuredClone(native.runtime) };
}
describe("exposed ICE safety in the selected Run window (SP-520)", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("preserves only the exposed current ICE quotes through the input boundary", () => {
    const { input } = checkpoint();
    const dto = buildAiDecisionInputDto(input);
    expect(dto.playerView.run?.approachedIce).toMatchObject({
      known: true,
      rezzed: false,
      effectiveRezCostQuote: { complete: true, finalCredits: 7 },
      effectivePostRezRunQuote: { complete: true },
    });
    expect(
      dto.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!
        .effectivePostRezRunQuote,
    ).toBeUndefined();
  });
  it("keeps the native Root and executor but selects the free exit before lethal rez", () => {
    const { input, runtime } = checkpoint();
    const projected = { ...input, ...buildAiDecisionInputDto(input) };
    restoreAiRuntimeCheckpoint(
      projected,
      projected.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const selected = chooseAiAction(projected);
    expect(selected.actionId).toBe(input.legalActions[1]!.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_104",
    });
    expect(
      selected.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.join(
        "|",
      ),
    ).toContain("runner_exposed_ice_lethal_after_funded_rez");
  });
  it.each(["unfunded", "nonlethal", "prevention"] as const)(
    "does not reject the continuation when the exposed damage is %s",
    (condition) => {
      const { input, runtime } = checkpoint();
      if (condition === "unfunded") input.playerView.opponent.credits = 6;
      if (condition === "nonlethal")
        input.playerView.own.gripOrHq.push({
          ...structuredClone(input.playerView.own.gripOrHq[0]!),
          instanceId: "counterline_extra_grip_card",
        });
      if (condition === "prevention")
        input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 1;
      expect(runnerExposedIceSafetyAssessment(input)).toBeUndefined();
      const projected = { ...input, ...buildAiDecisionInputDto(input) };
      restoreAiRuntimeCheckpoint(
        projected,
        projected.ownDeckSnapshot!.deckSnapshotId,
        runtime,
      );
      expect(chooseAiAction(projected).actionId).toBe(
        input.legalActions[0]!.actionId,
      );
    },
  );
  it.each(["missing", "stale", "target", "definition", "incomplete"] as const)(
    "fails closed for a %s exposed projection",
    (boundary) => {
      const { input } = checkpoint();
      const ice = input.playerView.run!.approachedIce!;
      const quote = ice.effectivePostRezRunQuote!;
      if (boundary === "missing") delete ice.effectivePostRezRunQuote;
      if (boundary === "stale") quote.expiresAtStateVersion--;
      if (boundary === "target") quote.targetServerId = "hq";
      if (boundary === "definition") quote.iceDefinitionId = "different_ice";
      if (boundary === "incomplete")
        ice.effectivePostRezRunQuote = {
          ...quote,
          complete: false,
          reason: "effective_run_projection_unavailable",
        };
      expect(() => runnerExposedIceSafetyAssessment(input)).toThrow(
        /missing_plan_module_coverage/,
      );
    },
  );
  it("does not certify unfunded ICE safe while public during-run rez support is present", () => {
    const { input } = checkpoint();
    input.playerView.opponent.credits = 0;
    input.playerView.servers.find((s) => s.id === "remote_1")!.statuses = [
      {
        id: "counterline_visible_rez_support",
        kind: "during_run_ice_rez_support",
        scope: "target_server",
        costModel: "half_rez_cost_rounded_down",
        target: "unrezzed_ice_on_this_fort",
        limit: "once_per_run_per_source",
        targetServerId: "remote_1",
        sourceCardInstanceId: "counterline_dreff",
        sourceTitle: "Dr. Dreff",
        sourceSide: "corp",
      },
    ];
    expect(runnerExposedIceSafetyAssessment(input)?.evidenceCode).toContain(
      "possible_supported_rez",
    );
  });
  it("finishes with an already installed funded sentry breaker", () => {
    const { input, runtime } = checkpoint();
    const native = read("meta496-installed-sentry-countercase");
    expect(native.provenance).toBe("native-read-only-maintenance-actor-state");
    input.playerView.own.rig!.push(native.card);
    input.playerView.own.memoryUsed!++;
    expect(runnerExposedIceSafetyAssessment(input)).toBeUndefined();
    const projected = { ...input, ...buildAiDecisionInputDto(input) };
    restoreAiRuntimeCheckpoint(
      projected,
      projected.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    expect(chooseAiAction(projected).actionId).toBe(
      input.legalActions[0]!.actionId,
    );
  });
});
