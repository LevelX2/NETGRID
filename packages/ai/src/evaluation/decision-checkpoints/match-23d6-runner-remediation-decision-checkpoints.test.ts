import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import preserveKrashJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-01-preserve-krash-break-target-d37.json";
import brokerFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-02-broker-before-unconvertible-funding-d130.json";
import coverageSearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-03-aujourdoui-coverage-search-d164.json";
import coverageThresholdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-04-aujourdoui-over-credit-base-d176.json";
import riskyViacoxJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-05-avoid-risky-viacox-install-d148.json";
import safeViacoxJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-06-allow-safe-viacox-install-d58.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 23D6 runner remediation decision checkpoints", () => {
  it.each([
    [
      "preserves Krash by breaking Viral 15's program-trash subroutine",
      preserveKrashJson,
    ],
    [
      "keeps the P5 Broker plan below productive P4 HQ information",
      brokerFundingJson,
    ],
    [
      "installs Aujourd'Oui to close urgent breaker coverage",
      coverageSearchJson,
    ],
    [
      "lets urgent coverage search outrank a base credit",
      coverageThresholdJson,
    ],
    [
      "avoids installing Viacox into a materially unsafe forced-run board",
      riskyViacoxJson,
    ],
    [
      "prefers the current HQ information plan on the earlier safe Viacox board",
      safeViacoxJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps immediately convertible Lucidrine funding liquid", () => {
    const checkpoint = mutateFixture(brokerFundingJson, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 7;
      fixture.engine.testOnlyGameState.runner.clicks = 2;
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "23D6-F2-LIQUID-FUNDING-CONTROL";
      fixture.expectation = {
        acceptableActions: [{ actionId: "runner.start_run.hq" }],
        forbiddenActions: [
          {
            actionId:
              "runner.activated_card_ability.runner_onr_v1_154_broker_1.runner_onr_v1_154_broker_1.activated.0",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.pressure_central"],
          acceptableCapabilities: ["pressure_hq_information"],
          requiredAssessmentEvidence: ["target:hq"],
        },
      };
    });

    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps the deferred Broker build represented as a resident P5 plan", () => {
    const result = runAiDecisionCheckpoint(fixture(brokerFundingJson));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_scheduler:assess:validated:plan:runner.credit_bank:onr_v1_154_broker",
      ]),
    );
    expect(
      result.decision?.decisionDebug?.actionAlternatives?.find((entry) =>
        entry.actionId.includes("broker"),
      )?.whyNot,
    ).toEqual(
      expect.arrayContaining([
        "candidate_plan:plan:runner.credit_bank:onr_v1_154_broker:ready",
        "candidate_plan_evidence:runner_credit_bank_first_load",
      ]),
    );
  });

  it("keeps Viacox legal even when the current HQ information plan wins", () => {
    const result = runAiDecisionCheckpoint(fixture(safeViacoxJson));

    expect(
      result.input.legalActions.some(
        (action) =>
          action.actionId ===
          "runner.install_card.runner_onr_proteus_131_bargain-with-viacox_1.runner_onr_proteus_131_bargain-with-viacox_1",
      ),
    ).toBe(true);
  });

  it("keeps deck-strategy coverage setup at development priority without a visible interrupt", () => {
    const checkpoint = mutateFixture(coverageThresholdJson, (fixture) => {
      for (const server of fixture.engine.testOnlyGameState.corp.servers) {
        for (const iceId of server.ice) {
          const ice = fixture.engine.testOnlyGameState.cardInstances[iceId];
          if (ice) ice.rezzed = false;
        }
      }
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "23D6-F3-NO-COVERAGE-NEED-CONTROL";
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "runner.install_card.runner_onr_v1_151_aujourdoui_1.runner_onr_v1_151_aujourdoui_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.rig_and_coverage"],
          acceptableCapabilities: ["setup_search_engine_breaker_sentry"],
          requiredAssessmentEvidence: [
            "deck_strategy_open_sentry_coverage",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-23d6-02-broker-before-unconvertible-funding-d130",
      "cp-23d6-06-allow-safe-viacox-install-d58",
    ],
  );
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}
