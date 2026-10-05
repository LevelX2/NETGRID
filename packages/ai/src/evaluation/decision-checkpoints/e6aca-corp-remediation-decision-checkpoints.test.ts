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
import { corpSpendConsumesKnownCentralRezReserve } from "../../corp/defense/corp-defense-domain-signals";

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
      "does not drift away from the bound Venice score remote",
      preserveVeniceTargetJson,
    ],
    [
      "keeps urgent R&D drawing independent of lower-priority score support and source-bound BBS economy",
      activateBbsEconomyJson,
    ],
  ])("passes the corrected Corp behavior: %s", (_label, json) => {
    const checkpoint = structuredClone(json) as AiDecisionCheckpointV1;
    if (json === activateBbsEconomyJson) {
      // The old selected BBS sequence borrowed a remote_1 score-draw quote
      // for the independent urgent R&D draw. That replaced its P2 priority
      // with the unrelated score-support priority and postponed protection
      // against the visible six-point Runner. BBS remains an admitted head
      // under its own source-bound owner; it must not suppress this P2 need.
      checkpoint.expectation = {
        acceptableActions: [{ type: "draw_card" }],
        planExecution: {
          acceptablePlanKinds: ["corp.defend_servers"],
          acceptableCapabilities: ["allocate_server_defense"],
        },
      };
    }
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    if (json === activateBbsEconomyJson) {
      const plan = result.decision?.decisionDebug?.planFirstDecision;
      const defenseRoot = "plan:corp.defend_servers:server-defense-portfolio";
      expect(plan?.selectedPlan).toMatchObject({
        moduleId: "corp.defend_servers",
        instanceId: defenseRoot,
      });
      expect(plan?.rootPlanInstanceId).toBe(defenseRoot);
      expect(plan?.priority?.effectiveClass).toBe("P2");
      expect(plan?.assessmentEvidenceCodes).toContain(
        "corp_missing_concrete_defense_draw:rd",
      );
      expect(plan?.route).toMatchObject({
        actionId: result.selectedAction!.actionId,
        stateVersion: result.input.playerView.stateVersion,
        planInstanceId: plan?.selectedPlan?.instanceId,
      });
      const bbsRoot =
        "plan:corp.economy:economy-campaign%3Acorp_onr_v1_309_bbs-whispering-campaign_1%3Arez%3Aremote_1";
      expect(plan?.turnPlanning?.heads).toContainEqual(
        expect.objectContaining({
          moduleId: "corp.economy",
          rootPlanInstanceId: bbsRoot,
          executorPlanInstanceId: bbsRoot,
          actionId:
            "corp.rez_card.corp_onr_v1_309_bbs-whispering-campaign_1.remote_1.corp_onr_v1_309_bbs-whispering-campaign_1",
          witnessValid: true,
        }),
      );
    }
  });

  it("preserves the reachable seven-credit R&D rez before installing HQ support", () => {
    const checkpoint = mutateFixture(bindVaporDecoyRouteJson, (fixture) => {
      fixture.expectation = {
        forbiddenActions: [
          {
            sourceDefinitionId: "onr_v1_366_red-herrings",
            targetServerId: "hq",
          },
        ],
        acceptableActions: [
          {
            sourceDefinitionId: "onr_v1_347_vapor-ops",
            targetServerId: "remote_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.ambush_and_bluff"],
          acceptableCapabilities: ["decoy_setup"],
        },
      };
    });
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, result.message).toBe(true);
    const rd = result.input.playerView.servers.find(
      (server) => server.id === "rd",
    )!;
    expect(
      rd.ice.find((ice) => ice.definitionId === "onr_v1_231_cortical-scrub")
        ?.effectiveRezCostQuote,
    ).toMatchObject({ complete: true, finalCredits: 7 });
    expect(result.input.playerView.own).toMatchObject({
      credits: 4,
      clicks: 3,
    });
    // Installation costs no credits, but consumes a funding click: 4+3 can
    // reach seven, whereas 4+(3-1) cannot. Rez costs remain Engine-quoted.
    expect(
      corpSpendConsumesKnownCentralRezReserve(result.input, undefined, 4, 2),
    ).toBe(true);
  });

  it("still puts Red Herrings on pressured HQ when the seven-credit rez stays reachable", () => {
    const checkpoint = mutateFixture(bindVaporDecoyRouteJson, (fixture) => {
      fixture.engine.testOnlyGameState.corp.credits = 7;
    });
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, result.message).toBe(true);
    expect(
      corpSpendConsumesKnownCentralRezReserve(result.input, undefined, 7, 2),
    ).toBe(false);
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
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
