import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import unsafeTychoJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e676-01-unsafe-tycho.json";
import chesterBeforeHqIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e676-02-rez-chester-before-hq-ice.json";
import nightShiftReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e676-03-night-shift-reserve.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match e676 exact decision checkpoints", () => {
  it.each([
    [
      "uses known ICE to cover R&D without exposing Tycho",
      unsafeTychoJson,
      [
        "plan_priority_class:P5",
        "plan_module:corp.defend_servers",
        "plan_step_capability:allocate_server_defense",
      ],
    ],
    [
      "funds exact remote defense without rezzing Chester Mix",
      chesterBeforeHqIceJson,
      [
        "plan_module:corp.economy",
        "plan_step_capability:develop_or_convert_corp_economy",
        "plan_assessment_evidence:corp_defense_exact_route_funding_required:remote_1:corp.install_card.corp_onr_v1_278_wall-of-ice_1.remote_1.corp_onr_v1_278_wall-of-ice_1.3",
      ],
    ],
    [
      "converts Night Shift before exposing Hostile Takeover",
      nightShiftReserveJson,
      [
        "plan_priority_class:P4",
        "plan_module:corp.economy",
        "plan_step_capability:develop_or_convert_corp_economy",
        "plan_assessment_evidence:corp_engine_certified_immediate_operation_conversion:onr_v1_295_night-shift",
      ],
    ],
  ] as const)("%s", (_label, json, expectedEvidence) => {
    const result = expectCheckpointToPass(fixture(json));
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([...expectedEvidence]),
    );
  });

  it("still allows Tycho exposure when Project Consultants converts it this turn", () => {
    const immediateConversion = mutateFixture(unsafeTychoJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const projectConsultantsId = state.corp.rd.find(
        (cardId) =>
          state.cardInstances[cardId]?.definitionId === PROJECT_CONSULTANTS,
      );
      if (!projectConsultantsId) {
        throw new Error("Missing Project Consultants counterprobe card");
      }
      state.corp.rd = state.corp.rd.filter(
        (cardId) => cardId !== projectConsultantsId,
      );
      state.corp.hq.push(projectConsultantsId);
      state.cardInstances[projectConsultantsId] = {
        ...state.cardInstances[projectConsultantsId]!,
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      };
      state.corp.credits = 12;
      fixture.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: TYCHO_EXTENSION,
          },
        ],
      };
    });

    expectCheckpointToPass(immediateConversion);
  });

  it("does not force Chester Mix without a same-fort ICE opportunity", () => {
    const noHqIce = mutateFixture(chesterBeforeHqIceJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const movedIce = state.corp.hq.filter((cardId) =>
        HQ_ICE_DEFINITION_IDS.has(
          state.cardInstances[cardId]?.definitionId ?? "",
        ),
      );
      if (movedIce.length === 0) {
        throw new Error("Missing HQ ICE counterprobe cards");
      }
      state.corp.hq = state.corp.hq.filter(
        (cardId) => !movedIce.includes(cardId),
      );
      state.corp.archives.push(...movedIce);
      for (const cardId of movedIce) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
          faceup: true,
          rezzed: false,
        };
      }
      fixture.expectation = {
        forbiddenActions: [
          { type: "rez_card", sourceDefinitionId: CHESTER_MIX },
        ],
      };
    });

    expectCheckpointToPass(noHqIce);
  });

  it("does not play Night Shift when its draw would hit empty R&D", () => {
    const emptyRd = mutateFixture(nightShiftReserveJson, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const movedCards = [...state.corp.rd];
      state.corp.rd = [];
      state.corp.archives.push(...movedCards);
      for (const cardId of movedCards) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
          faceup: true,
          rezzed: false,
        };
      }
      fixture.expectation = {
        forbiddenActions: [
          { type: "play_operation", sourceDefinitionId: NIGHT_SHIFT },
        ],
      };
    });

    expectCheckpointToPass(emptyRd);
  });
});

const TYCHO_EXTENSION = "onr_v1_220_tycho-extension";
const CHESTER_MIX = "onr_v1_352_chester-mix";
const NIGHT_SHIFT = "onr_v1_295_night-shift";
const PROJECT_CONSULTANTS = "onr_v1_300_project-consultants";
const HQ_ICE_DEFINITION_IDS = new Set([
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_247_haunting-inquisition",
  "onr_v1_254_liche",
  "onr_v1_278_wall-of-ice",
]);

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  result.source.kind = "synthetic_companion";
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(
  fixture: AiDecisionCheckpointV1,
): ReturnType<typeof runAiDecisionCheckpoint> {
  const result = runAiDecisionCheckpoint(fixture);
  expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  return result;
}
