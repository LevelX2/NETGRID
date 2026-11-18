import { referencesDefaultDeckCard } from "../evaluation/decision-checkpoints/compact-card-reference.test-support";
import { afterEach, expect, it } from "vitest";
import checkpoint from "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-485-sp332-g1-d70.json";
import positiveCheckpoint from "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-485-sp332-g1-d83.json";
import decks from "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-485-sp332-decks.json";
import { applyAction, createGameAfterSetup } from "@netgrid/engine";
import type { DeckDefinition, LegalAction } from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { buildDeckCapabilityProfileFromInput } from "../deck-capabilities";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "./ai-decision-input";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";

function isOwnStackSearch(action: LegalAction): boolean {
  return action.type === "activated_card_ability" &&
    action.payload?.cardImplementationAbilityKey === "abilities_activated_runner_main_look_top_stack_take_matching";
}

function fixture(source: unknown = checkpoint) {
  const cp = structuredClone(source) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.ownDeckCapabilities = buildDeckCapabilityProfileFromInput(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);

it("projects the canonical own-stack program search without injected roles", () => {
  const { input } = fixture();
  expect(
    AI_HINTS_BY_CARD.get(363)?.targetProfiles,
  ).toContainEqual(
    expect.objectContaining({
      zone: "stack_top",
      targetCardType: "program",
      lookCount: 5,
      costPerTaken: 1,
    }),
  );
  const caps = buildDeckCapabilityProfileFromInput(input);
  expect(caps.runner?.searchAccess.tools).toContainEqual(
    expect.objectContaining({
      cardId: 363,
      canSearchPrograms: true,
      canSearchBreakers: true,
      legalNow: true,
    }),
  );
});

it("selects the partial search through the real development executor and exact route", () => {
  const { cp, input } = fixture(positiveCheckpoint);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  const legal = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(legal.type).toBe("activated_card_ability");
  expect(legal.payload?.cardImplementationAbilityKey).toBe(
    "abilities_activated_runner_main_look_top_stack_take_matching",
  );
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "runner.develop_board_and_hand" },
    route: { actionId: legal.actionId },
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(
    portfolio.instances.find(
      (i) => i.instanceId === portfolio.executorInstanceId,
    )?.moduleState,
  ).toMatchObject({
    signal: {
      programSearchCommitment: {
        sourceDefinitionId: 363,
        targetDefinitionId: 223,
        selectedActionId: legal.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
      },
    },
  });
});

it.each([
  { hasTarget: true, tamper: false },
  { hasTarget: false, tamper: false },
  { hasTarget: true, tamper: true },
])(
  "keeps the real installation/search/choice binding: %j",
  ({ hasTarget, tamper }) => {
    resetResidentPlanPortfolioMemory();
    const snapshot = fixture().input.ownDeckSnapshot!;
    let state = createGameAfterSetup({
      seed: "sp332-canonical-install-search-choice",
      runnerDeck: decks.runner as DeckDefinition,
      corpDeck: decks.corp as DeckDefinition,
    });
    // The genuine matchup deck, with a known Gate gap. The search resource begins in hand.
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.credits = 8;
    state.runner.clicks = 4;
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(363)
      .withRunnerCardInGrip(373)
      .withRunnerCardInGrip(268)
      .withRunnerCardInGrip(333)
      .withRunnerProgramInstalled(286)
      .withRezzedCorpIceOnServer("hq", 442)
      .withRezzedCorpIceOnServer("rd", 451);
    state.runner.memoryUsed = 1;
    const actions: string[] = [];
    let searchActionId: string | undefined;
    let targetDefinitionId: number | undefined;
    let ownerInstanceId: string | undefined;
    let creditsBeforeChoice: number | undefined;
    for (let n = 0; n < 5; n++) {
      if (state.activeSide !== "runner") break;
      const input = buildAiDecisionInput(state, "runner", {
        difficulty: "hard",
        ownDeckSnapshot: snapshot,
        eventTail: state.eventLog,
        decisionId: `${state.matchId}:${state.stateVersion}:runner`,
        actionNumber: state.stateVersion,
      });
      if (state.pendingChoice && tamper) {
        input.playerView.pendingChoice!.sourceCardDefinitionId =
          373;
        expect(() => chooseAiAction(input)).toThrow("invalid_support_graph");
        return;
      }
      const decision = chooseAiAction(input);
      if (!decision.actionId)
        throw Error("The real Engine path requires a selected legal action.");
      const legal = input.legalActions.find((action) => action.actionId === decision.actionId)!;
      if (isOwnStackSearch(legal)) {
        searchActionId = legal.actionId;
        const portfolio = residentPlanPortfolioSnapshot(input)!;
        ownerInstanceId = portfolio.executorInstanceId;
        const moduleState = portfolio.instances.find(
          (i) => i.instanceId === ownerInstanceId,
        )!.moduleState as {
          gap: {
            directSearchChoiceBindings: Array<{
              actionId: string;
              targetDefinitionId: number;
            }>;
          };
        };
        targetDefinitionId = moduleState.gap.directSearchChoiceBindings.find(
          (b) => b.actionId === decision.actionId,
        )!.targetDefinitionId;
        const target = state.runner.stack.find(
          (id) => state.cardInstances[id]!.definitionId === targetDefinitionId,
        )!;
        expect(target).toBeDefined();
        const other = state.runner.stack.filter(
          (id) => state.cardInstances[id]!.definitionId !== targetDefinitionId,
        );
        const top = hasTarget
          ? [target, ...other.slice(0, 4)]
          : other.slice(0, 5);
        state.runner.stack = [
          ...top,
          ...state.runner.stack.filter((id) => !top.includes(id)),
        ];
        creditsBeforeChoice = state.runner.credits;
      }
      if (state.pendingChoice) {
        expect(input.playerView.pendingChoice).toMatchObject({
          sourceCardDefinitionId: 363,
          minSelections: 0,
        });
        expect(residentPlanPortfolioSnapshot(input)!.executorInstanceId).toBe(
          ownerInstanceId,
        );
        expect(decision.selectedChoices!.selectedOptionIds).toHaveLength(
          hasTarget ? 1 : 0,
        );
        if (hasTarget) {
          const selectedOptionIds = decision.selectedChoices!.selectedOptionIds;
          if (!Array.isArray(selectedOptionIds))
            throw Error("Missing structured choice option IDs.");
          const chosen = input.playerView.pendingChoice!.options.find(
            (o) => o.id === selectedOptionIds[0],
          )!;
          expect(chosen.card!.definitionId).toBe(targetDefinitionId);
        }
      }
      actions.push(decision.actionId);
      const result = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: decision.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
      });
      if (!result.ok) throw Error(result.error.message);
      state = result.state;
      if (searchActionId && !state.pendingChoice) break;
    }
    expect(actions[0]).toMatch(/^rc\./);
    expect(searchActionId).toBeDefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.credits).toBe(
      creditsBeforeChoice! - (hasTarget ? 1 : 0),
    );
    expect(
      state.eventLog.some(
        (e) =>
          e.publicPayload?.hiddenZoneAction ===
          "p3_37_look_top_stack_take_matching",
      ),
    ).toBe(true);
  },
);

it.each(["no_credit", "full_hand"])(
  "does not activate an unfunded or full-hand search: %s",
  (boundary) => {
    const snapshot = fixture().input.ownDeckSnapshot!;
    const state = createGameAfterSetup({
      seed: `sp332-${boundary}`,
      runnerDeck: decks.runner as DeckDefinition,
      corpDeck: decks.corp as DeckDefinition,
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.credits = boundary === "no_credit" ? 0 : 8;
    state.runner.clicks = 4;
    RealEngineFixtureBuilder.forState(state)
      .withRunnerResourceInstalled(363)
      .withRunnerProgramInstalled(286)
      .withRezzedCorpIceOnServer("hq", 442)
      .withRezzedCorpIceOnServer("rd", 451);
    state.runner.memoryUsed = 1;
    if (boundary === "full_hand")
      while (state.runner.grip.length < state.runner.maxHandSize) {
        const id = state.runner.stack.shift()!;
        state.runner.grip.push(id);
        state.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
      }
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
      eventTail: state.eventLog,
    });
    const search = input.legalActions.find(isOwnStackSearch);
    expect(search).toBeDefined();
    expect(chooseAiAction(input).actionId).not.toBe(search?.actionId);
  },
);

it("does not route the own-stack ability through an R&D-information parent", () => {
  const { cp, input } = fixture();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  const ownSearch = decision.decisionDebug?.actionAlternatives?.find((a) =>
    referencesDefaultDeckCard(a.actionId, 363),
  )!;
  expect(ownSearch).toBeDefined();
  expect(
    ownSearch.whyNot?.some((s) => s.includes("rd_information_ability")),
  ).toBe(false);
  expect(decision.fallbackUsed).toBe(false);
});
