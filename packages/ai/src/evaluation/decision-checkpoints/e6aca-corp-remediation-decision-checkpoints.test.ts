import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import rezFreeEtrDecoyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-01-rez-free-etr-decoy-d70.json";
import continueZurichScoreJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-02-continue-zurich-score-d84.json";
import rezFreeEtrAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-03-rez-free-etr-agenda-d89.json";
import activateBbsEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-04-activate-bbs-economy-d102.json";
import preserveAccountsThresholdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-05-preserve-accounts-threshold-d120.json";
import bindVaporDecoyRouteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-06-bind-vapor-decoy-route-d66.json";
import preserveVeniceTargetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-07-preserve-venice-target-d103.json";
import avoidUnfundedRdOverstackJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("e6aca Corp remediation decision checkpoints", () => {
  it.each([
    [
      "rejects declining a free effective ETR in the decoy remote",
      rezFreeEtrDecoyJson,
    ],
    [
      "rejects declining a free effective ETR over the agenda",
      rezFreeEtrAgendaJson,
    ],
    [
      "prices an unfunded fifth R&D layer against its opportunity cost",
      avoidUnfundedRdOverstackJson,
    ],
    [
      "uses Accounts Receivable for the exact terminal R&D rez reserve",
      preserveAccountsThresholdJson,
    ],
    [
      "continues the already started Zurich score line",
      continueZurichScoreJson,
    ],
    [
      "owns the Vapor Ops install as a typed decoy route",
      bindVaporDecoyRouteJson,
    ],
    [
      "does not drift away from the bound Venice score remote",
      preserveVeniceTargetJson,
    ],
    [
      "uses the protected current BBS economy route when no exact R&D defense is admitted",
      activateBbsEconomyJson,
    ],
  ])("passes the corrected Corp behavior: %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(json) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("still permits a funded fifth R&D layer", () => {
    const checkpoint = mutateFixture(
      avoidUnfundedRdOverstackJson,
      (fixture) => {
        fixture.engine.testOnlyGameState.corp.credits = 20;
        fixture.expectation = {
          acceptableActions: [
            {
              actionId:
                "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
            },
          ],
        };
      },
    );

    expectCheckpointToPass(checkpoint);
  });

  it("draws for missing concrete R&D defense before an unfunded third layer", () => {
    const checkpoint = mutateFixture(
      avoidUnfundedRdOverstackJson,
      (fixture) => {
        const state = fixture.engine.testOnlyGameState;
        const rd = state.corp.servers.find((server) => server.id === "rd");
        if (!rd) throw new Error("Missing R&D server");
        const movedIce = rd.ice.splice(2);
        for (const cardId of movedIce) {
          state.corp.archives.push(cardId);
          state.cardInstances[cardId] = {
            ...state.cardInstances[cardId]!,
            zone: { side: "corp", zone: "archives" },
            faceup: true,
            rezzed: false,
          };
        }
        fixture.expectation = {
          acceptableActions: [{ type: "draw_card" }],
          planExecution: {
            acceptablePlanKinds: ["corp.defend_servers"],
            acceptableCapabilities: ["allocate_server_defense"],
            requiredAssessmentEvidence: [
              "corp_missing_concrete_defense_draw:rd",
            ],
          },
        };
      },
    );

    expectCheckpointToPass(checkpoint);
  });
});

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const fixture = structuredClone(value) as AiDecisionCheckpointV1;
  mutation(fixture);
  fixture.source.kind = "synthetic_companion";
  fixture.engine.stateHash = hashGameState(fixture.engine.testOnlyGameState);
  return fixture;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
