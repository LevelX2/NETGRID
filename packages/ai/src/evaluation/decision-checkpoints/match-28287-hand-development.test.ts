import { afterEach, expect, it } from "vitest";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { load, decide, candidates } from "./match-28287.test-support";
import { runnerGenericDrawDevelopmentSignals } from "../../runner/hand-development/development-signals";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import type { RunnerHandRotationAssessment } from "../../runtime/runner-hand-rotation-assessment";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
afterEach(resetResidentPlanPortfolioMemory);

it("develops a fully dead hand before extending an already large credit reserve", () => {
  const { action, plan } = decide(load(171));
  expect(action.type).toBe("draw_card");
  expect(plan.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
});

it("keeps optional draw at P6 for a useful/protected/mixed hand or an unfunded development floor", () => {
  const input = load(171).input;
  const rotation: RunnerHandRotationAssessment = {
    schemaVersion: "runner-hand-rotation-assessment-v1",
    handSize: 1,
    maxHandSize: 1,
    handCapacityGap: 0,
    stackHasCards: true,
    knownRotationTargetCardInstanceIds: [
      input.playerView.own.gripOrHq[0]!.instanceId,
    ],
    retentionProtectedCardInstanceIds: [],
    genericDrawAdmissible: true,
    exactKnownNeedDrawAdmissible: true,
    status: "known_rotation_target_available",
    evidenceCodes: [],
  };
  const economy = buildRunnerEconomyPosture({ input });
  const signal = (
    fact: RunnerHandRotationAssessment,
    credits = input.playerView.own.credits,
  ) =>
    runnerGenericDrawDevelopmentSignals(
      {
        ...input,
        playerView: {
          ...input.playerView,
          own: { ...input.playerView.own, credits },
        },
      },
      candidates(input),
      {} as RunnerStrategicIntentProfile,
      [],
      fact,
      { admissible: false, evidenceCodes: [] },
      economy,
    );
  expect(signal(rotation)[0]?.priorityClass).toBe("P5");
  expect(signal(rotation, 0)[0]?.priorityClass).toBe("P6");
  expect(
    signal({ ...rotation, retentionProtectedCardInstanceIds: ["protected"] })[0]
      ?.priorityClass,
  ).toBe("P6");
  expect(signal({ ...rotation, handSize: 2 })[0]?.priorityClass).toBe("P6");
  expect(
    signal({ ...rotation, genericDrawAdmissible: false, stackHasCards: false }),
  ).toEqual([]);
});
