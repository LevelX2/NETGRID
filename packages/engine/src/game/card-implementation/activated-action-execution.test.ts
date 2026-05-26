import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleActivatedCardImplementationAction,
  type ActivatedCardImplementationExecutionHost,
} from "./activated-action-execution";

function state(): GameState {
  return {
    stateVersion: 5,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    runner: {
      credits: 5,
      clicks: 1,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {},
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function action(
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `${type}:source_1`,
    id: `${type}:source_1`,
    side: "runner",
    timingPoint: "runner_action.main",
    type,
    label: "Use ability",
    source: "source_1" as CardInstanceId,
    payload,
    costs: [],
    targetRequirements: [],
  } as unknown as LegalAction;
}

function host(
  gameState: GameState,
  legalAction: LegalAction,
  overrides: Partial<ActivatedCardImplementationExecutionHost["callbacks"]> = {},
): ActivatedCardImplementationExecutionHost {
  return {
    state: gameState,
    action: { legalAction },
    callbacks: {
      handleCorpTraceDamageActivatedAbility: () => false,
      handleScoredAgendaActivatedAbilityAction: () => false,
      resolveActivatedCardImplementationAbility: () => true,
      ...overrides,
    },
  };
}

describe("activated CardImplementation action execution dispatch", () => {
  it("returns unhandled for non-activated-card actions", () => {
    const legalAction = action("gain_credit");
    const result = handleActivatedCardImplementationAction(
      host(state(), legalAction, {
        handleCorpTraceDamageActivatedAbility: () => {
          throw new Error("corp callback should not run");
        },
        handleScoredAgendaActivatedAbilityAction: () => {
          throw new Error("agenda callback should not run");
        },
        resolveActivatedCardImplementationAbility: () => {
          throw new Error("runtime callback should not run");
        },
      }),
    );

    expect(result).toEqual({ handled: false });
  });

  it("delegates valid generic activated actions to the existing runtime callback", () => {
    const gameState = state();
    const payload = {
      sourceCardId: "source_1",
      sourceDefinitionId: "source_definition",
      abilityIndex: 0,
    };
    const legalAction = action("activated_card_ability", payload);
    let runtimeCalls = 0;
    const result = handleActivatedCardImplementationAction(
      host(gameState, legalAction, {
        resolveActivatedCardImplementationAbility: (receivedAction) => {
          runtimeCalls += 1;
          expect(receivedAction).toBe(legalAction);
          expect(receivedAction.payload).toBe(payload);
          return true;
        },
      }),
    );

    expect(runtimeCalls).toBe(1);
    expect(result).toMatchObject({
      handled: true,
      actionType: "activated_card_ability",
      resolvedPayload: payload,
      pendingChoiceStarted: false,
    });
  });

  it("preserves the existing special-handler order before generic runtime", () => {
    const calls: string[] = [];
    const legalAction = action("activated_card_ability");

    handleActivatedCardImplementationAction(
      host(state(), legalAction, {
        handleCorpTraceDamageActivatedAbility: () => {
          calls.push("corp_trace_damage");
          return false;
        },
        handleScoredAgendaActivatedAbilityAction: () => {
          calls.push("scored_agenda");
          return true;
        },
        resolveActivatedCardImplementationAbility: () => {
          calls.push("runtime");
          return true;
        },
      }),
    );

    expect(calls).toEqual(["corp_trace_damage", "scored_agenda"]);
  });

  it("throws the existing invalid activated ability error when runtime rejects", () => {
    const legalAction = action("activated_card_ability");

    expect(() =>
      handleActivatedCardImplementationAction(
        host(state(), legalAction, {
          resolveActivatedCardImplementationAbility: () => false,
        }),
      ),
    ).toThrow("Die aktivierte Kartenfaehigkeit ist nicht gueltig.");
  });

  it("reports pending choice starts without creating new choice values", () => {
    const gameState = state();
    const legalAction = action("activated_card_ability");
    const pendingChoice = {
      id: "choice_1",
      source: "v1911.search_stack:source_1",
      kind: "select_cards",
      side: "runner",
      options: [],
    };

    const result = handleActivatedCardImplementationAction(
      host(gameState, legalAction, {
        resolveActivatedCardImplementationAbility: () => {
          (gameState as unknown as { pendingChoice: unknown }).pendingChoice =
            pendingChoice;
          return true;
        },
      }),
    );

    expect(result.pendingChoiceStarted).toBe(true);
    expect(gameState.pendingChoice).toBe(pendingChoice);
  });
});
