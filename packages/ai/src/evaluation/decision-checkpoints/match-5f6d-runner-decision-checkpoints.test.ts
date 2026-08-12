import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import traceRunBudgetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-01-trace-run-budget.json";
import unwinnableTraceControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-02-unwinnable-trace-control.json";
import newsgroupD62Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-03-newsgroup-dominance-d62.json";
import newsgroupD74Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-04-newsgroup-dominance-d74.json";
import newsgroupD75Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-05-newsgroup-dominance-d75.json";
import newsgroupD83Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-06-newsgroup-dominance-d83.json";
import newsgroupD84Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-07-newsgroup-dominance-d84.json";
import stackSearchFirstPickJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f6d-08-stack-search-first-pick.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const NEWSGROUP_INSTANCE_ID = "runner_onr_v1_045_newsgroup-filter_1";
const SHATTERED_REMAINS_INSTANCE_ID =
  "corp_onr_v1_315_corprunners-shattered-remains_1";
const VISIBLE_TAG_PUNISH_INSTANCE_ID =
  "corp_onr_classic_026_street-enforcer_fixture_1";
const VISIBLE_TAG_PUNISH_DEFINITION_ID =
  "onr_classic_026_street-enforcer";

describe("match 5F6D runner decision checkpoints", () => {
  it.each([
    [
      "preserves the known remaining run budget across a trace",
      traceRunBudgetJson,
    ],
    ["prefers Newsgroup's higher credit yield at D62", newsgroupD62Json],
    ["keeps Newsgroup above the basic credit action at D74", newsgroupD74Json],
    ["keeps Newsgroup above the basic credit action at D75", newsgroupD75Json],
    [
      "keeps the HQ-pressure plan above P5 Newsgroup economy at D83",
      newsgroupD83Json,
    ],
    [
      "keeps the HQ-pressure plan above P5 Newsgroup economy at D84",
      newsgroupD84Json,
    ],
    [
      "takes the immediately useful card before ordering the rest",
      stackSearchFirstPickJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps the minimal winning bid under the Trace-Limit model", () => {
    expectCheckpointToPass(fixture(unwinnableTraceControlJson));
  });

  it("does not take the tag when a visible active punish payoff remains", () => {
    const activeTagPunish = mutateFixture(traceRunBudgetJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      state.corp.archives = state.corp.archives.filter(
        (instanceId) => instanceId !== SHATTERED_REMAINS_INSTANCE_ID,
      );
      const remote = state.corp.servers.find(
        (server) => server.id === "remote_1",
      );
      if (!remote) throw new Error("Expected Remote 1");
      remote.root.push(VISIBLE_TAG_PUNISH_INSTANCE_ID);
      state.cardInstances[VISIBLE_TAG_PUNISH_INSTANCE_ID] = {
        ...state.cardInstances[SHATTERED_REMAINS_INSTANCE_ID]!,
        instanceId: VISIBLE_TAG_PUNISH_INSTANCE_ID,
        definitionId: VISIBLE_TAG_PUNISH_DEFINITION_ID,
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
        faceup: true,
        rezzed: true,
      };
      delete state.cardInstances[SHATTERED_REMAINS_INSTANCE_ID];
      const trace = state.trace;
      if (!trace) throw new Error("Expected an active trace");
      state.trace = {
        ...trace,
        traceLimit: 5,
        effectiveTraceLimit: 5,
        corpBidMax: 4,
        corpBid: 2,
        traceValue: 2,
        runnerLink: 0,
      };
      const legacyTrace = state.trace as typeof state.trace & {
        baseTraceStrength?: number;
        traceStrength?: number;
      };
      delete legacyTrace.baseTraceStrength;
      delete legacyTrace.traceStrength;
      const traceStarted = checkpoint.engine.eventPrefix.find(
        (event) => event.publicPayload.traceStarted === true,
      );
      if (!traceStarted) throw new Error("Expected trace-start event");
      traceStarted.publicPayload.traceLimit = 5;
      traceStarted.publicPayload.effectiveTraceLimit = 5;
      traceStarted.publicPayload.corpBidMax = 4;
      delete traceStarted.publicPayload.baseTraceStrength;
      delete traceStarted.publicPayload.traceStrength;
      const corpBidResolved = checkpoint.engine.eventPrefix
        .slice()
        .reverse()
        .find((event) => event.publicPayload.traceStep === "corp_bid");
      if (!corpBidResolved) throw new Error("Expected Corp trace-bid event");
      corpBidResolved.publicPayload.traceLimit = 5;
      corpBidResolved.publicPayload.effectiveTraceLimit = 5;
      corpBidResolved.publicPayload.corpBidMax = 4;
      corpBidResolved.publicPayload.corpBid = 2;
      corpBidResolved.publicPayload.traceValue = 2;
      corpBidResolved.publicPayload.runnerLink = 0;
      corpBidResolved.publicPayload.corpCreditBid = 2;
      delete corpBidResolved.publicPayload.baseTraceStrength;
      delete corpBidResolved.publicPayload.traceStrength;
      const choice = state.pendingChoice;
      if (!choice || choice.kind !== "bid_amount")
        throw new Error("Expected Runner trace-bid choice");
      choice.prompt = "Runner Link-Bid wählen (Trace 2, Link 0)";
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "5F6D-C04-VISIBLE-TAG-PUNISH";
      checkpoint.expectation = {
        choice: { mustSelectOptionIds: ["bid_3"] },
      };
    });

    expectCheckpointToPass(activeTagPunish);
  });

  it("does not invent a Newsgroup action when the card is no longer installed", () => {
    const withoutNewsgroup = mutateFixture(newsgroupD62Json, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      state.runner.rig.programs = state.runner.rig.programs.filter(
        (instanceId) => instanceId !== NEWSGROUP_INSTANCE_ID,
      );
      state.runner.heap.push(NEWSGROUP_INSTANCE_ID);
      state.cardInstances[NEWSGROUP_INSTANCE_ID] = {
        ...state.cardInstances[NEWSGROUP_INSTANCE_ID]!,
        zone: { side: "runner", zone: "heap" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "5F6D-C02-NEWSGROUP-NOT-INSTALLED";
      checkpoint.expectation = {
        forbiddenActions: [
          {
            actionId:
              "runner.activated_card_ability.runner_onr_v1_045_newsgroup-filter_1.runner_onr_v1_045_newsgroup-filter_1.activated.0",
          },
        ],
      };
    });

    expectCheckpointToPass(withoutNewsgroup);
  });

  it("may take Cloak first when credits and memory make it immediately usable", () => {
    const fundedCloak = mutateFixture(
      stackSearchFirstPickJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        state.runner.credits = 8;
        state.runner.memoryLimit = 5;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "5F6D-C03-FUNDED-CLOAK-FIRST";
        checkpoint.expectation = {
          choice: {
            selectedOptionIdsPrefix: ["card_runner_onr_v1_011_cloak_2"],
          },
        };
      },
    );

    expectCheckpointToPass(fundedCloak);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-5f6d-06-newsgroup-dominance-d83",
      "cp-5f6d-07-newsgroup-dominance-d84",
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

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
