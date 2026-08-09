import { applyAction, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import deadFirstSeed002Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-01-dead-first-ice-seed002-d5.json";
import deadFirstSeed004Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-02-dead-first-ice-seed004-d17.json";
import scorelineSeed003D208Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-03-scoreline-seed003-d208.json";
import scorelineSeed003D219Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-04-scoreline-seed003-d219.json";
import scorelineSeed004D55Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-05-scoreline-seed004-d55.json";
import scorelineSeed004D65Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-06-scoreline-seed004-d65.json";
import scorelineSeed004D247Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-07-scoreline-seed004-d247.json";
import matchpointSeed004Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-08-matchpoint-central-seed004-d295.json";
import nestedChoiceSeed001Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-09-nested-choice-seed001-d246.json";
import nestedChoiceSeed005Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c1-10-nested-choice-seed005-d193.json";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const BEHAVIOR_FIXTURES = [
  [
    "defers dead first positional ICE via parent-bound protection draw in Seed 002",
    deadFirstSeed002Json,
  ],
  [
    "defers unfunded dead first positional ICE via parent-bound protection draw in Seed 004",
    deadFirstSeed004Json,
  ],
  [
    "continues the bound protected Seed 003 scoreline at d208",
    scorelineSeed003D208Json,
  ],
  [
    "continues the bound protected Seed 003 scoreline at d219",
    scorelineSeed003D219Json,
  ],
  [
    "converts burst economy before parent-bound protection at Seed 004 d55",
    scorelineSeed004D55Json,
  ],
  ["continues the bound Seed 004 scoreline at d65", scorelineSeed004D65Json],
  [
    "continues the late bound Seed 004 scoreline at d247",
    scorelineSeed004D247Json,
  ],
  [
    "allocates exact matchpoint central defense without exposing score material in Seed 004",
    matchpointSeed004Json,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT five-game remediation checkpoints", () => {
  it.each(BEHAVIOR_FIXTURES)("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    if (
      _label ===
      "allocates exact matchpoint central defense without exposing score material in Seed 004"
    ) {
      expectBoundTurnPlan(result, {
        actionId:
          "corp.install_card.corp_onr_v1_221_asp_1.rd.corp_onr_v1_221_asp_1.3",
        planKind: "corp.defend_servers",
        capability: "allocate_server_defense",
        executorInstanceId:
          "plan:corp.defend_servers:server-defense-portfolio",
      });
    }
  });

  it.each([
    ["Seed 001", nestedChoiceSeed001Json],
    ["Seed 005", nestedChoiceSeed005Json],
  ] as const)(
    "resolves the nested target choice in %s without an invariant",
    (_label, json) => {
      const checkpoint = fixture(json);
      const decisionResult = runAiDecisionCheckpoint(checkpoint);
      expect(
        decisionResult.ok,
        `${decisionResult.code}: ${decisionResult.message}`,
      ).toBe(true);
      expect(decisionResult.selectedAction).toBeDefined();
      const engineResult = applyAction(
        structuredClone(checkpoint.engine.testOnlyGameState),
        {
          matchId: checkpoint.source.matchId!,
          side: checkpoint.actor,
          actionId: decisionResult.selectedAction!.actionId,
          clientKnownStateVersion: checkpoint.engine.stateVersion,
          ...(decisionResult.decision?.selectedChoices
            ? { selectedChoices: decisionResult.decision.selectedChoices }
            : {}),
          idempotencyKey: `checkpoint-${checkpoint.checkpointId}`,
        },
      );
      expect(
        engineResult.ok,
        engineResult.ok
          ? "nested choice applied"
          : `${engineResult.error.code}: ${engineResult.error.message}`,
      ).toBe(true);
    },
  );

  it("does not infer an outer ICE route from positional layering and keeps the exact funded score install", () => {
    const checkpoint = mutateFixture(deadFirstSeed004Json, (candidate) => {
      const state = candidate.engine.testOnlyGameState;
      const innerIceId = state.corp.servers.find((server) => server.id === "hq")
        ?.ice[0];
      if (!innerIceId) throw new Error("Missing inner ICE for control");
      const hq = state.corp.servers.find((server) => server.id === "hq")!;
      hq.ice = hq.ice.filter((cardId) => cardId !== innerIceId);
      state.corp.servers.push({
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [innerIceId],
        root: [],
      });
      state.cardInstances[innerIceId] = {
        ...state.cardInstances[innerIceId]!,
        zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
      };
      state.corp.credits = 12;
      candidate.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_193_corporate-coup",
            targetServerId: "remote_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.score_agenda"],
          acceptableCapabilities: ["install_score_agenda"],
          requiredAssessmentEvidence: [
            "corp_funded_protected_score_install:remote_1",
          ],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("does not force advancement while a rich runner can contest it", () => {
    const checkpoint = mutateFixture(scorelineSeed004D55Json, (candidate) => {
      candidate.engine.testOnlyGameState.runner.credits = 30;
      candidate.expectation = {
        acceptableActions: [
          {
            type: "play_operation",
            sourceDefinitionId: "onr_v1_290_efficiency-experts",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.economy"],
          acceptableCapabilities: ["develop_or_convert_corp_economy"],
          requiredAssessmentEvidence: [
            "corp_score_protection_funding_gap:remote_1:1",
          ],
        },
        forbiddenActions: [{ type: "advance_card" }],
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("does not force central protection and takes exact basic liquidity below runner matchpoint", () => {
    const checkpoint = mutateFixture(matchpointSeed004Json, (candidate) => {
      const state = candidate.engine.testOnlyGameState;
      const scoredCards = [...state.runner.scoreArea];
      state.runner.scoreArea = [];
      state.runner.heap.push(...scoredCards);
      for (const cardId of scoredCards) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: false,
        };
      }
      candidate.expectation = {
        acceptableActions: [{ type: "gain_credit" }],
        forbiddenActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_251_jack-attack",
            targetServerId: "remote_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.economy"],
          acceptableCapabilities: ["develop_or_convert_corp_economy"],
          requiredAssessmentEvidence: [
            "corp_engine_certified_basic_liquidity_development",
          ],
        },
      };
    });

    const result = expectCheckpointToPass(checkpoint);
    expectBoundTurnPlan(result, {
      actionId: "corp.gain_credit",
      planKind: "corp.economy",
      capability: "develop_or_convert_corp_economy",
      assessmentEvidence:
        "corp_engine_certified_basic_liquidity_development",
      executorInstanceId:
        "plan:corp.economy:economy-visible-liquidity-development%3Acorp%3A38",
    });
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.source.kind = "synthetic_companion";
  result.source.findingId = `${result.source.findingId}-control`;
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1) {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  return result;
}

function expectBoundTurnPlan(
  result: ReturnType<typeof runAiDecisionCheckpoint>,
  expected: Readonly<{
    actionId: string;
    planKind: string;
    capability: string;
    assessmentEvidence?: string;
    executorInstanceId: string;
  }>,
): void {
  expect(result.decision?.actionId).toBe(expected.actionId);
  expect(result.decision?.decisionDebug?.planKind).toBe(expected.planKind);
  expect(result.decision?.evidence).toEqual(
    expect.arrayContaining([
      `plan_step_capability:${expected.capability}`,
      ...(expected.assessmentEvidence
        ? [`plan_assessment_evidence:${expected.assessmentEvidence}`]
        : []),
    ]),
  );
  expect(
    result.decision?.decisionDebug?.planFirstDecision?.selectionAuthority,
  ).toBe("turn_plan_commitment");
  const planning =
    result.decision?.decisionDebug?.planFirstDecision?.turnPlanning;
  expect(planning).toMatchObject({
    mode: "cutover",
    shadowComparison: {
      liveActionId: expected.actionId,
      shadowActionId: expected.actionId,
      agreement: true,
    },
    commitment: {
      status: "active",
      rematerialization: {
        status: "executable",
        actionId: expected.actionId,
      },
    },
  });

  const portfolio = residentPlanPortfolioSnapshot(result.input);
  expect(portfolio?.executorInstanceId).toBe(expected.executorInstanceId);
  expect(portfolio).toMatchObject({
    turnPlanCommitment: { status: "active" },
    turnPlanExecutionLease: {
      currentBinding: { actionId: expected.actionId },
    },
  });
  expect(portfolio?.turnPlanExecutionLease?.sourcePlanId).toBe(
    portfolio?.turnPlanCommitment?.sourcePlanId,
  );
  expect(portfolio?.turnPlanExecutionLease?.commitmentId).toBe(
    portfolio?.turnPlanCommitment?.commitmentId,
  );
  const cursor = portfolio?.turnPlanCommitment?.cursor;
  const committedNode = cursor
    ? portfolio?.turnPlanCommitment?.phases[cursor.phaseIndex]?.nodes[
        cursor.nodeIndex
      ]
    : undefined;
  expect(portfolio?.turnPlanExecutionLease?.routeKey).toBe(
    committedNode?.invocation.routeKey,
  );
}
