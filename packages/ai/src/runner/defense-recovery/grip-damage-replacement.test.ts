import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
} from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../../evaluation/meta-ten-standard-decks.test-support";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-537-r1-g16-d23-grip-replacement.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
beforeEach(resetResidentPlanPortfolioMemory);
function native() {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...structuredClone(checkpoint.input),
    ...buildAiDecisionInputDto(checkpoint.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  return input;
}

it("preserves the certified reactive meat replacement kind in the side-safe DTO", () => {
  const input = native();
  expect(input.playerView.pendingChoice.options[1].metadata?.optionKind).toBe(
    "play_identity_donor",
  );
});

it.each(["runner_missing_source", "corp_private_source"])(
  "rejects a replacement source outside the own known zones: %s",
  (sourceId) => {
    const input = native();
    input.playerView.pendingChoice.options[1].metadata.sourceCardInstanceId =
      sourceId;
    expect(() => buildAiDecisionInputDto(input)).toThrow(
      /invalid_runner_damage_replacement_source_binding/,
    );
  },
);

it("binds the native reactive grip replacement to the existing defense owner", () => {
  const input = native(),
    decision = chooseAiAction(input);
  expect(decision.actionId).toBe(input.legalActions[0].actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.executionOrigin,
  ).toMatchObject({
    side: "runner",
    stateVersion: input.playerView.stateVersion,
  });
  expect(decision.selectedChoices).toEqual({
    choiceId: input.playerView.pendingChoice.choiceId,
    selectedOptionIds: [
      "grip_meat_damage_replacement_runner_onr_proteus_112_identity-donor_1",
    ],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "runner.defense_and_recovery" },
    rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
    leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
    route: {
      stepId:
        "plan:runner.defense_and_recovery:runner:replace_damage_from_grip",
    },
  });
});

it.each(["side", "state", "source", "effect", "option", "turn"])(
  "fails closed for changed %s",
  (boundary) => {
    const input = native(),
      choice = input.playerView.pendingChoice;
    if (boundary === "side") choice.side = "corp";
    if (boundary === "state") choice.stateVersion++;
    if (boundary === "source") input.playerView.own.gripOrHq = [];
    if (boundary === "effect")
      choice.options[1].metadata = {
        ...choice.options[1].metadata,
        optionKind: "unrelated_replacement",
      };
    if (boundary === "option") choice.options[1].id += "_unbound";
    if (boundary === "turn") input.playerView.activeSide = "runner";
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);

it.each([1, 7])(
  "applies the actual Engine replacement with %i grip cards",
  (handSize) => {
    const original = native();
    const deck = (name: string): DeckDefinition => {
      const d = catalog.decks.find((d) => d.name === name)!;
      return {
        id: d.standardDeckId,
        name: d.name,
        side: d.side as "runner" | "corp",
        identity: d.identityCardId,
        cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      };
    };
    const state = createGameAfterSetup({
      seed: `meta537-meat-${handSize}`,
      runnerDeck: deck("Proteus Runner - Hidden Backdoor Sabotage"),
      corpDeck: deck("Shadoe Tag & Bag"),
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    const builder = RealEngineFixtureBuilder.forState(state)
      .withCorpCredits(10)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip("onr_proteus_112_identity-donor")
      .withRunnerTags(1)
      .withCorpCardInHq("onr_v1_302_scorched-earth");
    for (const id of [
      "onr_proteus_097_taxman",
      "onr_proteus_084_crumble",
      "onr_proteus_089_garbage-in",
      "onr_proteus_090_highlighter",
      "onr_proteus_094_scaldan",
      "onr_proteus_098_vienna-22",
    ].slice(0, handSize - 1))
      builder.withRunnerCardInGrip(id);
    expect(state.runner.grip).toHaveLength(handSize);
    const operation = getLegalActions(state, "corp").find(
      (a) =>
        a.type === "play_operation" && a.source?.includes("scorched-earth"),
    )!;
    const damage = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: operation.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!damage.ok) throw Error(damage.error.message);
    expect(damage.state.pendingChoice?.source).toBe("v121.replacement.damage");
    const input = buildAiDecisionInput(damage.state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: original.ownDeckSnapshot,
      eventTail: damage.state.eventLog,
    });
    const replacementSource = input.playerView.pendingChoice?.options.find(
      (option) => option.metadata?.optionKind === "play_identity_donor",
    )?.metadata?.sourceCardInstanceId;
    expect(replacementSource).toBe(
      damage.state.runner.grip.find((id) => id.includes("identity-donor")),
    );
    const decision = chooseAiAction(input);
    const action = {
      matchId: state.matchId,
      side: "runner" as const,
      actionId: decision.actionId!,
      clientKnownStateVersion: damage.state.stateVersion,
      selectedChoices: decision.selectedChoices!,
    };
    const resolved = applyAction(damage.state, action);
    if (!resolved.ok) throw Error(resolved.error.message);
    expect(resolved.state.eventLog.at(-1)?.publicPayload).toMatchObject({
      originalEventId: damage.state.imminentEvent!.eventId,
      originalEventType: "damage",
      damageType: "meat",
      originalAmount: 4,
      preventedAmount: 4,
      replacementOutcome: "replaced",
    });
    expect(resolved.state.winner).toBeNull();
    expect(resolved.state.runner.grip).toHaveLength(handSize - 1);
    expect(resolved.state.corp.badPublicity).toBe(2);
    expect(
      resolved.state.runner.heap.some((id) => id.includes("identity-donor")),
    ).toBe(true);
    const replay = applyAction(damage.state, action);
    if (!replay.ok) throw Error(replay.error.message);
    expect(hashGameState(replay.state)).toBe(hashGameState(resolved.state));
  },
);
