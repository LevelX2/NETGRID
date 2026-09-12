import { describe, expect, it } from "vitest";

import matchpointWallRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-978d-01-matchpoint-wall-rez-d80.json";
import noLastClickDefenseDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-978d-02-no-last-click-defense-draw-d54.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match 978d Corp remediation checkpoints", () => {
  it("rezzes exact persistent ICE before a visible matchpoint agenda despite an unfavorable first-run exchange", () => {
    const result = runAiDecisionCheckpoint(
      matchpointWallRezJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        "plan_step_capability:allocate_server_defense",
      ]),
    );
  });

  it("defers qualitative score protection on the last click and develops liquidity", () => {
    const checkpoint = structuredClone(
      noLastClickDefenseDrawJson,
    ) as AiDecisionCheckpointV1;
    checkpoint.expectation.planExecution = {
      acceptablePlanKinds: ["corp.economy"],
      acceptableCapabilities: ["develop_or_convert_corp_economy"],
    };
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.economy",
        "plan_step_capability:develop_or_convert_corp_economy",
        "plan_assessment_evidence:corp_terminal_central_rez_reserve_required:rd:corp_onr_v1_236_data-raven_1:gap_2",
        "plan_priority_delegated_from:plan:corp.defend_servers:server-defense-portfolio",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(result.input)
        ?.instances.filter(
          (instance) => instance.moduleId === "corp.score_agenda",
        )
        .map((instance) => instance.moduleState),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signal: expect.objectContaining({
            feasible: false,
            evidenceCode: "corp_last_click_score_install_deferred:remote_1",
          }),
        }),
      ]),
    );
  });
});
