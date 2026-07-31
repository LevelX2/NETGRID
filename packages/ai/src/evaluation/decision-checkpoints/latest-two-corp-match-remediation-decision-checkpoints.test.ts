import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import convertScorelineJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a759-01-convert-protected-scoreline-d45.json";
import keepScoreRemoteOpenJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a759-02-keep-score-remote-root-open-d55.json";
import minimizeAgendaRiskJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-8107-01-minimize-contested-agenda-risk-d27.json";
import startMatchpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-8107-02-start-protected-matchpoint-d110.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("latest two Corp matches remediation decision checkpoints", () => {
  it.each([
    ["converts the financed protected scoreline", convertScorelineJson],
    [
      "keeps the only protected score remote root open",
      keepScoreRemoteOpenJson,
    ],
    [
      "builds economy instead of exposing an agenda behind breakable staged ETR",
      minimizeAgendaRiskJson,
    ],
    [
      "prepares an executable protected matchpoint sibling before exposing it",
      startMatchpointJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not force delayed scoring while the rich runner can contest it", () => {
    const checkpoint = mutateFixture(convertScorelineJson, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 30;
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "LATEST-CORP-A1-RICH-RUNNER-CONTROL";
      fixture.expectation = {
        acceptableActions: [{ type: "draw_card" }],
        forbiddenActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_203_hostile-takeover",
          },
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_193_corporate-coup",
          },
        ],
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("does not force central support when no agenda can use the remote", () => {
    const checkpoint = mutateFixture(keepScoreRemoteOpenJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const agendas = state.corp.hq.filter((cardId) =>
        A759_AGENDAS.has(state.cardInstances[cardId]?.definitionId ?? ""),
      );
      state.corp.hq = state.corp.hq.filter(
        (cardId) => !agendas.includes(cardId),
      );
      state.corp.archives.push(...agendas);
      for (const cardId of agendas) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
          faceup: true,
          rezzed: false,
        };
      }
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "LATEST-CORP-A2-NO-AGENDA-CONTROL";
      fixture.expectation = {
        acceptableActions: [{ type: "draw_card" }],
        planExecution: {
          acceptablePlanKinds: ["corp.hand_and_agenda_management"],
          acceptableCapabilities: ["draw_for_plan"],
          requiredAssessmentEvidence: [
            "corp_score_campaign_missing_agenda_material",
          ],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("still develops the remote when it is no longer contestable", () => {
    const checkpoint = mutateFixture(minimizeAgendaRiskJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      state.runner.credits = 0;
      state.corp.credits = 20;
      const remote = state.corp.servers.find(
        (server) => server.id === "remote_1",
      );
      if (!remote) throw new Error("Missing agenda-risk control remote");
      for (const server of state.corp.servers) {
        if (server.id === remote.id) continue;
        const movedIce = [...server.ice];
        server.ice = [];
        remote.ice.push(...movedIce);
      }
      for (const iceId of remote.ice) {
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          rezzed: true,
        };
      }
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "LATEST-CORP-B1-SAFE-REMOTE-CONTROL";
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "corp.install_card.corp_onr_v1_195_corporate-retreat_1.remote_1.corp_onr_v1_195_corporate-retreat_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.score_agenda"],
          acceptableCapabilities: ["install_score_agenda"],
          requiredAssessmentEvidence: [
            "corp_funded_protected_score_install:remote_1",
          ],
        },
        selectedScoreBreakdown: {
          forbiddenComponentKeys: ["corp_contested_agenda_point_risk"],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("keeps the same safe remote preparation available below matchpoint", () => {
    const checkpoint = mutateFixture(startMatchpointJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const scoredCardId = state.corp.scoreArea.find(
        (cardId) =>
          state.cardInstances[cardId]?.definitionId ===
          "onr_v1_206_marine-arcology",
      );
      if (!scoredCardId) throw new Error("Missing matchpoint control agenda");
      state.corp.scoreArea = state.corp.scoreArea.filter(
        (cardId) => cardId !== scoredCardId,
      );
      state.corp.archives.push(scoredCardId);
      state.cardInstances[scoredCardId] = {
        ...state.cardInstances[scoredCardId]!,
        zone: { side: "corp", zone: "archives" },
        faceup: true,
        rezzed: false,
      };
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "LATEST-CORP-B2-NO-MATCHPOINT-CONTROL";
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "corp.install_card.corp_onr_v1_245_fire-wall_2.new_remote.corp_onr_v1_245_fire-wall_2",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.defend_servers"],
          acceptableCapabilities: ["develop_score_protection"],
          requiredAssessmentEvidence: [
            "score_protection_staging_install:agenda:corp_onr_proteus_008_project-zurich_1:new_remote:new_remote:bounded_deterrence",
          ],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });
});

const A759_AGENDAS = new Set([
  "onr_v1_193_corporate-coup",
  "onr_v1_203_hostile-takeover",
]);

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
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
