import {
  applyAction,
  applyRandomizedIceInstallSelection,
  applyRandomizedTraceBidSelection,
  applyRandomizedTurnPlanSelection,
  quoteCorpPunishRoute,
  hashGameState,
  replayEvents,
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
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import {
  runAiDecisionCheckpoint,
  type AiDecisionCheckpointRunResult,
} from "./checkpoint-runner";

describe("match 5F7924 Corp agenda, defense and discard checkpoints", () => {
  it("keeps the coherent opening central-defense line", () => {
    expectCheckpointToPass(openingDefenseControlJson);
  });

  it("develops score protection before exposing Marked Accounts after Efficiency Experts", () => {
    expectCheckpointToPass(turn7AgendaDefenseJson);
  });

  it("continues the same bounded score project after both defensive support heads", () => {
    expectScoreProtectionDevelopmentContinuation(turn7AgendaDefenseJson, 1);
  });

  it("keeps the native newly bound Score goal while deferring its last-action installation", () => {
    const { input, decision } = decisionsAfterBoundAgendaDefense(
      turn7AgendaDefenseJson,
      1,
    );
    expect(input.playerView.own.clicks).toBe(1);
    expect(decision.actionId).toBe("corp.draw_card");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1",
      selectedPlan: { moduleId: "corp.defend_servers" },
    });
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId:
            "corp.install_card.corp_onr_proteus_005_marked-accounts_1.remote_1.corp_onr_proteus_005_marked-accounts_1",
          disposition: "explicitly_nonproductive",
          evidenceCode: "corp_last_click_score_install_deferred:remote_1",
        }),
      ]),
    );
  });

  it("starts the bound agenda-defense line instead of taking three neutral credits", () => {
    expectCheckpointToPass(turn9AgendaDefenseJson);
  });

  it("uses the third turn-9 action for the currently admitted bound agenda", () => {
    const { input, decision } = decisionsAfterBoundAgendaDefense(
      turn9AgendaDefenseJson,
      2,
    );
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected).toMatchObject({
      type: "install_card",
      source: "corp_onr_proteus_005_marked-accounts_1",
      payload: { serverId: "remote_1" },
    });
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.decisionDebug?.planFirstDecision?.route?.capabilityId).toBe(
      "install_score_agenda",
    );
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1",
    );
  });

  it("retains Marked Accounts and discards one of three Jack Attacks", () => {
    expectCheckpointToPass(markedAccountsDiscardJson);
  });

  it("still discards the inactive conditional damage upgrade", () => {
    expectCheckpointToPass(conditionalUpgradeDiscardControlJson);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
  );
}

function expectCheckpointToPass(value: unknown): void {
  const result = runAiDecisionCheckpoint(fixture(value));
  expect(result.ok, diagnostic(result)).toBe(true);
}

function expectScoreProtectionDevelopmentContinuation(
  value: unknown,
  additionalActions = 0,
): void {
  const checkpoint = fixture(value);
  if (additionalActions > 0) {
    checkpoint.engine.testOnlyGameState.corp.clicks += additionalActions;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
  }
  const first = runAiDecisionCheckpoint(checkpoint);
  expect(first.ok, diagnostic(first)).toBe(true);
  expect(first.decision).toBeDefined();

  let state = checkpointState(checkpoint);
  state = applyDecision(state, first.decision!);
  let { input, decision: second } = nextDecision(state, checkpoint);
  if (additionalActions > 0) {
    expect(second.actionId).toBe(
      "corp.install_card.corp_onr_v1_251_jack-attack_3.remote_1.corp_onr_v1_251_jack-attack_3.1",
    );
    expect(second.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1",
      selectedPlan: { moduleId: "corp.defend_servers" },
    });
    state = applyDecision(state, second);
    ({ input, decision: second } = nextDecision(state, checkpoint));
  }
  const selected = input.legalActions.find(
    (action) => action.actionId === second.actionId,
  );

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
    source: "corp_onr_proteus_005_marked-accounts_1",
    payload: { serverId: "remote_1" },
  });
  const firstPlan = first.decision!.decisionDebug!.planFirstDecision!;
  expect(firstPlan.selectedPlan?.parentInstanceId).toBe(
    "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Anew_remote",
  );
  expect(
    first.selectedAction?.payload?.postInstallRezQuoteProjectedServerId,
  ).toBe("remote_1");
  expect(second.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId:
      "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1",
    selectedPlan: { moduleId: "corp.score_agenda", phase: "install_agenda" },
    route: { actionId: selected!.actionId, stateVersion: state.stateVersion },
  });
  expect(
    input.playerView.servers
      .find((server) => server.id === "remote_1")
      ?.ice.map((card) => card.instanceId),
  ).toEqual(
    expect.arrayContaining([
      first.selectedAction!.source,
      "corp_onr_v1_251_jack-attack_3",
    ]),
  );
  const initial = checkpointState(checkpoint);
  state = applyDecision(state, second);
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
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
        : decision.selectionKind === "engine_randomized_trace_bid_selection"
          ? applyRandomizedTraceBidSelection(state, {
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
