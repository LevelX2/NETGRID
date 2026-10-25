import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { buildRunnerRigDemandProjectionForCoverage } from "../../runtime/runner-rig-demand-adapter";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import {
  cumulativeNeedLevel,
  persistentFunctionalProfileForCard,
  signalsForCard,
} from "../../runner/hand-development/runner-persistent-install-evaluation";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
type HandParams = Parameters<typeof evaluateRunnerHandDevelopment>[0];
type Decision = ReturnType<
  ReturnType<typeof createAiLiveRuntimeComposition>["chooseAiAction"]
>;
const supportId = "runner_onr_v1_071_vewy-vewy-quiet_2";
const exactInstall = "runner.install_card." + supportId + "." + supportId;
function fixture(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/" + name, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
function recordingRuntime() {
  const records: {
    params: HandParams;
    evaluations: ReturnType<typeof evaluateRunnerHandDevelopment>;
  }[] = [];
  const runtime = createAiLiveRuntimeComposition({
    ...aiLiveRuntimeDependencies,
    evaluateRunnerHandDevelopment: (params) => {
      const evaluations =
        aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment(params);
      records.push({ params, evaluations });
      return evaluations;
    },
  });
  return { runtime, records };
}
function expectBoundRoute(input: AiDecisionInput, result: Decision) {
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId)!
      .expiresAtStateVersion,
  ).toBe(input.playerView.stateVersion);
  return pf;
}
// Constructed credit-boundary cases retain the native costs, source and hints;
// they are not claimed to be historical checkpoint replays.
function supportAtCredits(credits: number) {
  const input = fixture("545-r2-g16-d325.json").input;
  input.playerView.own.credits = credits;
  const projection = buildRunnerRigDemandProjectionForCoverage({
    input,
    strategicIntent: input.ownRunnerStrategicIntent,
    deckCapabilities: input.ownDeckCapabilities,
    coverageGaps: [],
    rolesForDefinitionId: rolesForDeckDoctrineCard,
  });
  const params: HandParams = {
    input,
    strategicIntent: input.ownRunnerStrategicIntent,
    deckCapabilities: input.ownDeckCapabilities,
    rigDemandProjection: projection,
  };
  const evaluation = evaluateRunnerHandDevelopment(params).find(
    (e) => e.cardInstanceId === supportId,
  )!;
  return { input, params, projection, evaluation };
}

describe("admitted recurring support milestone", () => {
  it("keeps the native memory-to-Vewy purpose across two consecutive productive decisions", () => {
    const first = fixture("545-r2-g16-d324.json");
    const second = fixture("545-r2-g16-d325.json");
    const before = [JSON.stringify(first.input), JSON.stringify(second.input)];
    const { runtime, records } = recordingRuntime();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot.deckSnapshotId,
      first.runtime,
    );
    const setup = runtime.chooseAiAction(first.input);
    expect(setup.actionId).toBe(
      "runner.install_card.runner_onr_v1_146_zetatech-mem-chip_1.runner_onr_v1_146_zetatech-mem-chip_1",
    );
    expectBoundRoute(first.input, setup);
    const followup = runtime.chooseAiAction(second.input);
    const pf = expectBoundRoute(second.input, followup);
    const observed = records
      .filter(
        (r) =>
          r.params.input.playerView.stateVersion === 324 &&
          r.params.rigDemandProjection,
      )
      .at(-1)!
      .evaluations.find((e) => e.cardInstanceId === supportId)!;
    expect(observed).toMatchObject({
      currentNeed: "useful_now",
      deferReason: "none",
      rigDemandBinding: { boundDemandIds: ["strategic-support:" + supportId] },
      persistentInstallEvaluation: {
        capabilityDelta: "cumulative_capacity",
        duplicateRole: "useful_backup",
      },
    });
    expect(
      observed.persistentInstallEvaluation!.finalInstallFit,
    ).toBeGreaterThan(0);
    expect(followup.actionId).toBe(exactInstall);
    expect(pf.selectedPlan!.moduleId).toBe("runner.recurring_economy");
    expect(pf.rootPlanInstanceId).toBe(pf.selectedPlan!.instanceId);
    expect(pf.leafExecutorInstanceId).toBe(pf.selectedPlan!.instanceId);
    expect([JSON.stringify(first.input), JSON.stringify(second.input)]).toEqual(
      before,
    );
  });

  it("retains the actual native matchpoint hold instead of buying another recurring pool", () => {
    const f = fixture("545-r1-g23-d268.json");
    const before = JSON.stringify(f.input);
    const { runtime, records } = recordingRuntime();
    expect(f.input.playerView.own.agendaPoints).toBe(6);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot.deckSnapshotId,
      f.runtime,
    );
    const result = runtime.chooseAiAction(f.input);
    expectBoundRoute(f.input, result);
    expect(result.actionId).not.toContain(
      "install_card.runner_onr_v1_071_vewy",
    );
    const observed = records
      .filter((r) => r.params.rigDemandProjection)
      .at(-1)!
      .evaluations.find(
        (e) => e.definitionId === "onr_v1_071_vewy-vewy-quiet",
      )!;
    expect(observed.rigDemandBinding?.boundDemandIds).toEqual([]);
    expect(JSON.stringify(f.input)).toBe(before);
  });

  it.each([5, 6, 7, 8])(
    "checks preparation and current reserve at %i credits",
    (credits) => {
      const { input, evaluation, projection } = supportAtCredits(credits);
      const card = input.playerView.own.gripOrHq.find(
        (c: { instanceId: string }) => c.instanceId === supportId,
      )!;
      expect(card.installCost).toBe(4);
      expect(
        projection.roleDemands.some(
          (d) =>
            d.capabilityId === "strategic_support:recurring_breaker_credits",
        ),
      ).toBe(credits >= 6);
      if (credits >= 6) {
        expect(evaluation).toMatchObject({
          currentNeed: "useful_now",
          deferReason: credits >= 8 ? "none" : "stronger_override",
          persistentInstallEvaluation: { duplicateRole: "useful_backup" },
        });
      } else {
        expect(evaluation.deferReason).not.toBe("none");
        expect(evaluation.currentNeed).toBe("none");
      }
    },
  );

  it("does not borrow the admitted purpose from a different provider instance", () => {
    const { input, params, projection } = supportAtCredits(10);
    const card = input.playerView.own.gripOrHq.find(
      (c: { instanceId: string }) => c.instanceId === supportId,
    )!;
    const mismatched = {
      ...projection,
      roleDemands: projection.roleDemands.map((demand) => ({
        ...demand,
        providers: demand.providers.map((provider) => ({
          ...provider,
          cardInstanceId: input.playerView.own.rig[0].instanceId,
        })),
      })),
    };
    const profile = persistentFunctionalProfileForCard(
      card,
      signalsForCard(card, []).text,
    );
    expect(
      cumulativeNeedLevel(
        { ...params, rigDemandProjection: mismatched },
        profile,
      ),
    ).toBe("low");
  });
});
