import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import traceBidEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-03575-01-trace-bid-economy.json";
import rdRepeatFreshMatchpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-03575-02-rd-repeat-fresh-matchpoint.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 03575 runner decision checkpoints", () => {
  it("pays the minimal modern Trace bid", () => {
    expectCheckpointToPass(fixture(traceBidEconomyJson));
  });

  it("contests the certified remote at matchpoint", () => {
    expectCheckpointToPass(fixture(rdRepeatFreshMatchpointJson));
  });

  it("may pay the winning trace bid when no cleanup click remains", () => {
    const noCleanupClick = mutateFixture(traceBidEconomyJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.clicks = 0;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "03575-C01-NO-TAG-CLEANUP-CLICK";
      const trace = checkpoint.engine.testOnlyGameState.trace as unknown as
        | Record<string, unknown>
        | undefined;
      if (!trace) throw new Error("Expected active trace state");
      trace.traceLimit = 5;
      trace.traceValue = 1;
      delete trace.baseTraceStrength;
      delete trace.corpBidMax;
      delete trace.traceStrength;
      const latestCorpBid = checkpoint.engine.eventPrefix
        .slice()
        .reverse()
        .find(
          (event) =>
            event.publicPayload.traceStep === "corp_bid" &&
            event.publicPayload.corpBid === 1,
        );
      if (!latestCorpBid) throw new Error("Expected latest Corp trace bid");
      latestCorpBid.publicPayload.traceLimit = 5;
      latestCorpBid.publicPayload.traceValue = 1;
      delete latestCorpBid.publicPayload.baseTraceStrength;
      delete latestCorpBid.publicPayload.corpBidMax;
      delete latestCorpBid.publicPayload.traceStrength;
      checkpoint.expectation = {
        choice: { mustSelectOptionIds: ["bid_1"] },
      };
    });

    expectCheckpointToPass(noCleanupClick);
  });

  it("keeps a truly unchanged repeated R&D run discounted", () => {
    const staleRndTop = mutateFixture(
      rdRepeatFreshMatchpointJson,
      (checkpoint) => {
        checkpoint.engine.eventPrefix = checkpoint.engine.eventPrefix.filter(
          (event) => event.type !== "mandatory_draw",
        );
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "03575-C02-STALE-RD-TOP";
        checkpoint.expectation = {
          acceptableActions: [{ actionId: "runner.start_run.remote_1" }],
          planExecution: {
            acceptablePlanKinds: ["runner.contest_remote"],
            acceptableCapabilities: ["contest_remote"],
            requiredAssessmentEvidence: ["runner_direct_run_converts_now:remote_1"],
          },
        };
      },
    );

    expectCheckpointToPass(staleRndTop);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-03575-02-rd-repeat-fresh-matchpoint"],
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

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(
    result.ok,
    `${result.code}: ${result.message}; choices=${JSON.stringify(result.decision?.selectedChoices)}`,
  ).toBe(true);
}
