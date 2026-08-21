import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  runnerMuPressureAssessment,
  type RunnerMuPressureAssessmentDependencies,
} from "./runner-mu-pressure-assessment";

describe("runnerMuPressureAssessment", () => {
  it("rejects a non-runner input before reading runner dependencies", () => {
    expect(() =>
      runnerMuPressureAssessment(
        { side: "corp" } as AiDecisionInput,
        {} as RunnerMuPressureAssessmentDependencies,
      ),
    ).toThrow("runner_mu_pressure_requires_runner_input:corp");
  });
});
