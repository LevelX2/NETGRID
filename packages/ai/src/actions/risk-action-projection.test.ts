import { createGameAfterSetup } from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type DeckDefinition,
} from "@netgrid/shared";
import {
  apply,
  toRunnerTurn,
} from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { currentRunRemainingIce } from "../runtime/current-encounter";
import { releaseAiMatchRuntime } from "../runtime/match-runtime-memory";
import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";

import type { AiCardHint } from "../ai-hints";
import {
  assessRandomBreakOrDamageRiskForVisibleRunPath,
  randomBreakOrDamageRiskProfileForHint,
} from "./risk-action-projection";

describe("random break-or-damage risk profile", () => {
  it("projects an unseen card from functional hint semantics without an id registry", () => {
    const hint = {
      cardId: syntheticCardDefinitionId("future-random-breaker"),
      side: "runner",
      aiSupportStatus: "ai_supported",
      breakerProfile: {
        coverage: ["universal"],
        randomOutcome: {
          kind: "random_break_or_damage",
          successProbabilityPerAttempt: 0.75,
          failureDamageType: "net",
          maxSingleFailureDamage: 2,
        },
      },
    } as AiCardHint;

    expect(randomBreakOrDamageRiskProfileForHint(hint)).toEqual({
      kind: "random_break_or_damage",
      profileId: "random_break_or_damage:net:0.75:2",
      successProbabilityPerAttempt: 0.75,
      failureDamageType: "net",
      maxSingleFailureDamage: 2,
    });
  });

  it("fails closed when the functional random outcome is missing", () => {
    expect(
      randomBreakOrDamageRiskProfileForHint({
        cardId: syntheticCardDefinitionId("ordinary-breaker"),
        side: "runner",
        aiSupportStatus: "ai_supported",
        breakerProfile: { coverage: ["wall"] },
      } as AiCardHint),
    ).toBeUndefined();
  });
});

const BLINK = 219;
const INSIDE_JOB = 306;
const SHOCK = 480;
const WALL_OF_ICE = 490;
const HAUNTING_INQUISITION = 459;

function deckWith(
  deck: DeckDefinition,
  cardIds: readonly number[],
): DeckDefinition {
  return {
    ...deck,
    cards: [
      ...deck.cards.filter((card) => !cardIds.includes(card.id)),
      ...cardIds.map((id) => ({ id, quantity: 1 })),
    ],
  };
}

function runAtKnownLock(handAfterRunStart: number, corpCredits: number) {
  const runnerDeck = deckWith(ORIGINALSET_DEFAULT_DECKS.runner, [
    BLINK,
    INSIDE_JOB,
  ]);
  const corpDeck = deckWith(ORIGINALSET_DEFAULT_DECKS.corp, [
    SHOCK,
    WALL_OF_ICE,
    HAUNTING_INQUISITION,
  ]);
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "conditional-break-into-unrezzed-ice",
      traceRulesProfile: "modern_open",
      runnerDeck,
      corpDeck,
    }),
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(25)
    .withCorpCredits(corpCredits)
    .withRunnerProgramInstalled(BLINK)
    .withRunnerCardInGrip(INSIDE_JOB)
    .withCorpIceOnServer("rd", WALL_OF_ICE)
    .withRezzedCorpIceOnServer("rd", SHOCK)
    .withRezzedCorpIceOnServer("rd", HAUNTING_INQUISITION);
  while (state.runner.grip.length < handAfterRunStart + 1) {
    state = apply(state, "runner", (action) => action.type === "draw_card");
  }
  RealEngineFixtureBuilder.forState(state).withRunnerGripSize(
    handAfterRunStart + 1,
  );
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "play_event" &&
      action.payload?.serverId === "rd" &&
      state.cardInstances[action.source ?? ""]?.definitionId === INSIDE_JOB,
  );
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  expect(input.playerView.timingPoint).toBe("run.jack_out_window");
  expect(input.playerView.own.gripOrHq).toHaveLength(handAfterRunStart);
  const remainingIce = currentRunRemainingIce(input);
  expect(remainingIce).toMatchObject([
    { known: false, rezzed: false },
    {
      known: true,
      rezzed: true,
      effectiveRunQuote: {
        subroutines: [
          {
            unbrokenRunEffect: {
              preventsFutureBreaking: true,
              preventsJackOut: true,
            },
          },
        ],
      },
    },
  ]);
  return { input, remainingIce };
}

describe("random break before a forced unrezzed encounter", () => {
  it.each([
    { hand: 4, corpCredits: 14, blocked: true, actionType: "jack_out" },
    { hand: 6, corpCredits: 14, blocked: false, actionType: "continue_run" },
    { hand: 4, corpCredits: 0, blocked: false, actionType: "continue_run" },
  ])(
    "projects the failed branch with grip $hand and Corp credits $corpCredits",
    ({ hand, corpCredits, blocked, actionType }) => {
      const { input, remainingIce } = runAtKnownLock(hand, corpCredits);
      try {
        const quote = assessRandomBreakOrDamageRiskForVisibleRunPath(input, {
          targetServerId: "rd",
          visibleIce: remainingIce,
        });
        expect(quote).toMatchObject({
          pathDependsOnRandomBreakOrDamage: true,
          maxSingleFailureDamage: 3,
          blockedByHandBuffer: blocked,
        });
        const decision = chooseAiAction(input);
        const action = input.legalActions.find(
          (candidate) => candidate.actionId === decision.actionId,
        );
        expect(action?.type).toBe(actionType);
        expect(action?.expiresAtStateVersion).toBe(
          input.playerView.stateVersion,
        );
        expect(decision.reasonCode).toBe("plan_first.runner.convert_run_window");
        expect(decision.fallbackUsed).toBe(false);
      } finally {
        releaseAiMatchRuntime(input.matchId!);
      }
    },
  );
});
