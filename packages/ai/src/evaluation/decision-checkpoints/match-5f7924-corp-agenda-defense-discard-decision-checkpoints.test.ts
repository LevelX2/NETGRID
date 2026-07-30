import {
  applyAction,
  applyRandomizedIceInstallSelection,
  applyRandomizedTurnPlanSelection,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import type { AiDecision, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import openingDefenseControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-00-opening-central-defense-control-d3.json";
import turn7AgendaDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-01-turn7-agenda-defense-d23.json";
import turn9AgendaDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-02-turn9-agenda-defense-d28.json";
import markedAccountsDiscardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-03-marked-accounts-discard-d32.json";
import conditionalUpgradeDiscardControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-04-conditional-upgrade-discard-control-d26.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import {
  runAiDecisionCheckpoint,
  type AiDecisionCheckpointRunResult,
} from "./checkpoint-runner";

describe("match 5F7924 Corp agenda, defense and discard checkpoints", () => {
  it("keeps the coherent opening central-defense line", () => {
    expectCheckpointToPass(openingDefenseControlJson);
  });

  it("starts the bound agenda-defense line with two actions after Efficiency Experts", () => {
    expectCheckpointToPass(turn7AgendaDefenseJson);
  });

  it("continues the turn-7 defense staging head by installing the agenda with the remaining click", () => {
    expectBoundAgendaDefenseContinuation(turn7AgendaDefenseJson);
  });

  it("starts the bound agenda-defense line instead of taking three neutral credits", () => {
    expectCheckpointToPass(turn9AgendaDefenseJson);
  });

  it("uses the third turn-9 action for another concrete ICE placement before cleanup", () => {
    const { input, decision } = decisionsAfterBoundAgendaDefense(
      turn9AgendaDefenseJson,
      2,
    );
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(
      selected,
      JSON.stringify({
        selected,
        assessmentEvidenceCodes:
          decision.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes,
        defenseComparison:
          decision.decisionDebug?.planFirstDecision?.turnPlanning
            ?.defenseComparison,
      }),
    ).toMatchObject({
      type: "install_card",
      payload: {
        placement: "ice",
      },
    });
    expect(["hq", "rd"]).toContain(selected?.payload?.serverId);
    expect(
      input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === selected?.source,
      )?.definitionId,
    ).toBe("onr_v1_251_jack-attack");
    expect(
      decision.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.some(
        (code) => code.includes("corp_scoreline_central_tax_allocation:"),
      ),
    ).toBe(true);
  });

  it("retains Marked Accounts and discards one of three Jack Attacks", () => {
    expectCheckpointToPass(markedAccountsDiscardJson);
  });

  it("still discards the inactive conditional damage upgrade", () => {
    expectCheckpointToPass(conditionalUpgradeDiscardControlJson);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(value: unknown): void {
  const result = runAiDecisionCheckpoint(fixture(value));
  expect(result.ok, diagnostic(result)).toBe(true);
}

function expectBoundAgendaDefenseContinuation(value: unknown): void {
  const checkpoint = fixture(value);
  const first = runAiDecisionCheckpoint(checkpoint);
  expect(first.ok, diagnostic(first)).toBe(true);
  expect(first.decision).toBeDefined();

  let state = checkpointState(checkpoint);
  state = applyDecision(state, first.decision!);
  const { input, decision: second } = nextDecision(state, checkpoint);
  const selected = input.legalActions.find(
    (action) => action.actionId === second.actionId,
  );
  const firstRootPlan =
    first.decision?.decisionDebug?.planFirstDecision?.rootPlanInstanceId ?? "";
  const expectedAgendaSource = firstRootPlan.includes(
    "corp_onr_proteus_005_marked-accounts_1",
  )
    ? "corp_onr_proteus_005_marked-accounts_1"
    : firstRootPlan.includes("corp_onr_v1_207_netwatch-operations-office_1")
      ? "corp_onr_v1_207_netwatch-operations-office_1"
      : undefined;

  expect(
    selected,
    JSON.stringify({
      selected,
      remote: input.playerView.servers.find(
        (server) => server.id === "remote_1",
      ),
      dispositions:
        second.decisionDebug?.planFirstDecision?.dispositions.filter(
          (entry) =>
            entry.actionId.includes("marked-accounts") ||
            entry.actionId.includes("jack-attack"),
        ),
    }),
  ).toMatchObject({
    type: "install_card",
    payload: {
      placement: "root",
    },
  });
  expect(expectedAgendaSource).toBeDefined();
  expect(selected?.source).toBe(expectedAgendaSource);
}

function decisionsAfterBoundAgendaDefense(
  value: unknown,
  appliedDecisionCount: number,
): { input: ReturnType<typeof buildAiDecisionInput>; decision: AiDecision } {
  const checkpoint = fixture(value);
  const first = runAiDecisionCheckpoint(checkpoint);
  expect(first.ok, diagnostic(first)).toBe(true);
  expect(first.decision).toBeDefined();
  let state = checkpointState(checkpoint);
  let decision = first.decision!;
  for (let index = 0; index < appliedDecisionCount; index += 1) {
    state = applyDecision(state, decision);
    const next = nextDecision(state, checkpoint);
    if (index === appliedDecisionCount - 1) return next;
    decision = next.decision;
  }
  throw new Error("Expected at least one applied decision.");
}

function checkpointState(checkpoint: AiDecisionCheckpointV1): GameState {
  const state = structuredClone(checkpoint.engine.testOnlyGameState);
  state.eventLog = checkpoint.engine.eventPrefix.map((event) => ({ ...event }));
  return state;
}

function nextDecision(
  state: GameState,
  checkpoint: AiDecisionCheckpointV1,
): { input: ReturnType<typeof buildAiDecisionInput>; decision: AiDecision } {
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: checkpoint.difficulty,
    profileId: checkpoint.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    actionNumber: state.stateVersion,
    ownDeckSnapshot: checkpoint.deckSnapshot,
    eventTail: state.eventLog,
  });
  return {
    input,
    decision: chooseAiAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
    }),
  };
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  const idempotencyKey = `match-5f7924-test:${state.stateVersion}`;
  const result =
    decision.selectionKind === "engine_randomized_ice_install_selection"
      ? applyRandomizedIceInstallSelection(state, {
          ...decision.engineCommand,
          idempotencyKey,
        })
      : decision.selectionKind === "engine_randomized_turn_plan_selection"
        ? applyRandomizedTurnPlanSelection(state, {
            ...decision.engineCommand,
            idempotencyKey,
          })
        : applyAction(state, {
            matchId: state.matchId,
            side: "corp",
            actionId: decision.actionId,
            clientKnownStateVersion: state.stateVersion,
            ...(decision.selectedChoices
              ? { selectedChoices: decision.selectedChoices }
              : {}),
            idempotencyKey,
          });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function diagnostic(result: AiDecisionCheckpointRunResult): string {
  return JSON.stringify({
    code: result.code,
    message: result.message,
    selectedActionId: result.selectedAction?.actionId,
    selectedActionType: result.selectedAction?.type,
    selectedChoices: result.decision?.selectedChoices,
    planKind: result.decision?.decisionDebug?.planKind,
    planFirst: result.decision?.decisionDebug?.planFirstDecision,
  });
}
