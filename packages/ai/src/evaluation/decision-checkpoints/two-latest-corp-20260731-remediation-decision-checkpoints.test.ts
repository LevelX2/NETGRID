import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { cardInstanceIdForCopy } from "../../../../engine/src/game/state/card-instance-id";
import { describe, expect, it } from "vitest";

import earlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-723d40-latest-01-early-defense-d3.json";
import sameTurnScoreD34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-723d40-latest-02-same-turn-score-d34.json";
import sirenEarlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-01-early-defense-d3.json";
import startScoreRemoteD19Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-02-start-score-remote-d19.json";
import bindNewRemoteD20Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-02-bind-new-remote-d20.json";
import hardenBoundRemoteD88Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-03-harden-bound-remote-d88.json";
import continueTychoD89Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-03-continue-tycho-d89.json";
import installBeforeOverflowD94Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-04-install-score-before-overflow-d94.json";
import rezHauntingD78Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-05-rez-haunting-d78.json";
import rezDataWallD84Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-06-rez-data-wall-d84.json";
import preserveScoreReserveD52Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-07-preserve-score-reserve-d52.json";
import retainTychoDiscardCfoD97Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-08-retain-tycho-discard-cfo-d97.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { applyAction, hashGameState, replayEvents } from "@netgrid/engine";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

describe("two latest Corp matches 2026-07-31 remediation checkpoints", () => {
  it.each([
    ["Rent to Own", earlyDefenseD3Json],
    ["Siren Fortress", sirenEarlyDefenseD3Json],
  ])(
    "chooses a productive early defense route over an unbound basic credit for %s",
    (_deck, json) => {
      const result = runAiDecisionCheckpoint(fixture(json));
      expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    },
  );

  it("funds the terminal central reserve before a same-turn score that consumes it", () => {
    // Liche needs 14 credits; 12 credits and three actions can fund it.
    // The rejected extra HQ installation would leave at most 13 credits.
    const checkpoint = fixture(sameTurnScoreD34Json);
    checkpoint.expectation = {
      acceptableActions: [
        {
          actionId:
            "cp.c37y.r1.c37y",
        },
      ],
      forbiddenActions: [{ type: "draw_card" }],
      planExecution: {
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    // The available closeout spends 12 on Consultants before gaining 5.
    // Even its remaining basic-credit click cannot fund the 14-credit Liche.
    const paths = corpSameTurnScoreConversionPaths(result.input);
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths)
      expect(path).toMatchObject({ creditsRequired: 12, clicksRequired: 2 });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_delegated_from:penw02zfrkklof54c2nuye5att",
        "plan_assessment_evidence:corp_terminal_central_rez_reserve_required:rd:c2vq:gap_2",
      ]),
    );
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.turnPlanning?.heads,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "corp.score_agenda",
          witnessValid: true,
        }),
      ]),
    );
  });

  it.each([
    [
      "starts a scoring remote or honors terminal central defense",
      startScoreRemoteD19Json,
    ],
    ["binds the created scoring remote", bindNewRemoteD20Json],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps score material in HQ when the overflow remote has no certified protection", () => {
    const checkpoint = fixture(installBeforeOverflowD94Json);
    checkpoint.expectation = {
      contractKind: "correctness",
      acceptableActions: [{ type: "gain_credit" }],
      forbiddenActions: [
        {
          type: "install_card",
          sourceDefinitionId: 432,
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("binds each defense action to the score project revalidated after its Engine transition", () => {
    const checkpoint = fixture(hardenBoundRemoteD88Json);
    const hardening = runAiDecisionCheckpoint(checkpoint);
    expect(hardening.ok, hardening.message).toBe(true);
    const initial = structuredClone(checkpoint.engine.testOnlyGameState);
    initial.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    const first = applyAction(initial, {
      matchId: initial.matchId,
      side: "corp",
      actionId: hardening.selectedAction!.actionId,
      clientKnownStateVersion: initial.stateVersion,
      idempotencyKey: "score-hardening",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);
    const input = buildAiDecisionInput(first.state, "corp", {
      difficulty: checkpoint.difficulty,
      profileId: checkpoint.profileId,
      decisionId: `continuation:${first.state.stateVersion}`,
      actionNumber: first.state.stateVersion,
      ownDeckSnapshot: checkpoint.deckSnapshot,
      eventTail: first.state.eventLog,
    });
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    )!;
    expect(selected).toMatchObject({
      type: "install_card",
      payload: { placement: "ice", serverId: "r1" },
    });
    // Revalidation may move an uninstalled agenda; it must rebind the support
    // parent and route together, never transplant the historical D89 state.
    for (const [current, action, version] of [
      [hardening.decision!, hardening.selectedAction!, initial.stateVersion],
      [decision, selected, first.state.stateVersion],
    ] as const) {
      const agenda = cardInstanceIdForCopy("corp", 400, 1);
      const parent = planInstanceIdForProposal({ moduleId: "corp.score_agenda", dedupeKey: `agenda:${agenda}:${action.payload!.serverId}` });
      expect(current.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: parent,
        selectedPlan: {
          moduleId: "corp.defend_servers",
          parentInstanceId: parent,
        },
        route: {
          actionId: action.actionId,
          stateVersion: version,
          target: { kind: "server", id: action.payload!.serverId },
        },
      });
    }
    const second = applyAction(first.state, {
      matchId: first.state.matchId,
      side: "corp",
      actionId: selected.actionId,
      clientKnownStateVersion: first.state.stateVersion,
      idempotencyKey: "score-continuation",
    });
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error(second.error.message);
    const replay = replayEvents(
      initial,
      second.state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(second.state));
  });

  it.each([0, 1])(
    "funds D89 protection before installation unless its one-credit gap is covered: %s",
    (extraCredit) => {
      const checkpoint = fixture(continueTychoD89Json);
      if (extraCredit) {
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.engine.testOnlyGameState.corp.credits += extraCredit;
        checkpoint.engine.stateHash = hashGameState(
          checkpoint.engine.testOnlyGameState,
        );
        checkpoint.expectation = {
          acceptableActions: [
            {
              type: "install_card",
              sourceDefinitionId: 459,
              targetServerId: "r1",
            },
          ],
          planExecution: {
            acceptablePlanKinds: ["corp.defend_servers"],
            acceptableCapabilities: ["develop_score_protection"],
          },
        };
      }
      const result = runAiDecisionCheckpoint(checkpoint);
      expect(result.ok, result.message).toBe(true);
      const parent =
        "pf1xgcwzno8b3egllyfizfvkj9";
      expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: parent,
        selectedPlan: { parentInstanceId: parent },
        route: {
          actionId: result.selectedAction!.actionId,
          stateVersion: checkpoint.engine.stateVersion,
        },
      });
    },
  );

  it.each([
    ["rezzes the materially taxing Haunting Inquisition", rezHauntingD78Json],
    ["rezzes the exact affordable Data Wall", rezDataWallD84Json],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not spend the score reserve on a pure Washington Grid overflow conversion", () => {
    const result = runAiDecisionCheckpoint(
      fixture(preserveScoreReserveD52Json),
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("retains Tycho while discarding redundant CFO material", () => {
    const result = runAiDecisionCheckpoint(
      fixture(retainTychoDiscardCfoD97Json),
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
