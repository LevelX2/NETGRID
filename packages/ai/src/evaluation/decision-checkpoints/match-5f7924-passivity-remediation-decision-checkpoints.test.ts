import {
  applyAction,
  applyRandomizedIceInstallSelection,
  applyRandomizedTurnPlanSelection,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import type { AiDecision, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import netwatchAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-05-netwatch-agenda-defense-d35.json";
import hostileAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-06-hostile-agenda-defense-d59.json";
import dreffRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-07-dreff-future-encounter-rez-d64.json";
import capacityReleaseD67Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-08-capacity-release-draw-d67.json";
import capacityReleaseD88Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-09-capacity-release-draw-d88.json";
import coupAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-10-coup-agenda-defense-d91.json";
import richCapacityReleaseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-11-rich-capacity-release-draw-d102.json";
import layeredIceRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-12-layered-ice-rez-evidence-d107.json";
import dreffWrongServerControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5f7924-13-dreff-wrong-server-control-d20.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import {
  runAiDecisionCheckpoint,
  type AiDecisionCheckpointRunResult,
} from "./checkpoint-runner";

describe("match 5F7924 passivity remediation checkpoints", () => {
  it("finds a bound Netwatch agenda-defense line in the later match state", () => {
    expectCheckpointToPass(netwatchAgendaJson);
  });

  it("finds a bound Hostile Takeover agenda-defense line", () => {
    expectCheckpointToPass(hostileAgendaJson);
  });

  it("finds a bound Corporate Coup agenda-defense line", () => {
    expectCheckpointToPass(coupAgendaJson);
  });

  it("rezzes the free fort-bound future-encounter support in the HQ run", () => {
    expectCheckpointToPass(dreffRezJson);
  });

  it("does not rez the HQ-bound future-encounter support during an R&D run", () => {
    expectCheckpointToPass(dreffWrongServerControlJson);
  });

  it.each([
    ["D67", capacityReleaseD67Json],
    ["D102", richCapacityReleaseJson],
  ])(
    "uses a useful hand-capacity release before the score-material draw at %s",
    (_label, value) => {
      expectCapacityReleaseThenDraw(value);
    },
  );

  it("uses the final click at D88 for a score-material replacement draw", () => {
    expectCheckpointToPass(capacityReleaseD88Json);
  });

  it("exposes an exact current approached-ICE exchange quote on the layered Archives server", () => {
    const result = runAiDecisionCheckpoint(fixture(layeredIceRezJson));
    expect(result.ok, diagnostic(result)).toBe(true);
    const archives = result.input?.playerView.servers.find(
      (server) => server.id === "archives",
    );
    const approachedKeeper = archives?.ice.find(
      (card) => card.definitionId === "onr_v1_252_keeper",
    );

    expect(
      approachedKeeper?.effectiveRezResourceExchangeQuote,
      JSON.stringify({
        selectedActionId: result.selectedAction?.actionId,
        quote: approachedKeeper?.effectiveRezResourceExchangeQuote,
      }),
    ).toMatchObject({
      complete: true,
    });
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(value: unknown): void {
  const result = runAiDecisionCheckpoint(fixture(value));
  expect(result.ok, diagnostic(result)).toBe(true);
}

function expectCapacityReleaseThenDraw(value: unknown): void {
  const checkpoint = fixture(value);
  const first = runAiDecisionCheckpoint(checkpoint);
  expect(first.ok, diagnostic(first)).toBe(true);
  expect(first.decision).toBeDefined();
  expect(first.selectedAction).toMatchObject({
    type: "install_card",
    payload: {
      placement: "ice",
    },
  });

  const state = applyDecision(checkpointState(checkpoint), first.decision!);
  const second = nextDecision(state, checkpoint);
  expect(
    second.selected,
    JSON.stringify({
      firstActionId: first.decision?.actionId,
      selected: second.selected,
      planFirst: second.decision.decisionDebug?.planFirstDecision,
    }),
  ).toMatchObject({
    type: "draw_card",
  });
  expect(
    second.decision.decisionDebug?.planFirstDecision?.turnPlanning?.commitment
      ?.replanReason,
  ).toBe("scheduled_information_boundary");
}

function checkpointState(checkpoint: AiDecisionCheckpointV1): GameState {
  const state = structuredClone(checkpoint.engine.testOnlyGameState);
  state.eventLog = checkpoint.engine.eventPrefix.map((event) => ({ ...event }));
  return state;
}

function nextDecision(
  state: GameState,
  checkpoint: AiDecisionCheckpointV1,
): {
  input: ReturnType<typeof buildAiDecisionInput>;
  decision: AiDecision;
  selected: ReturnType<typeof buildAiDecisionInput>["legalActions"][number];
} {
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: checkpoint.difficulty,
    profileId: checkpoint.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    actionNumber: state.stateVersion,
    ownDeckSnapshot: checkpoint.deckSnapshot,
    eventTail: state.eventLog,
  });
  const decision = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
  const selected = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  );
  if (!selected)
    throw new Error(`Selected action is not legal: ${decision.actionId}`);
  return { input, decision, selected };
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  const idempotencyKey = `match-5f7924-passivity:${state.stateVersion}`;
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
    planFirst: result.decision?.decisionDebug?.planFirstDecision,
  });
}
