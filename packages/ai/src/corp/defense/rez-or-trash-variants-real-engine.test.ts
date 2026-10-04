import { beforeEach, describe, expect, it } from "vitest";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type {
  DeckDefinition,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { corpRezOrTrashDefenseChoiceSignal } from "./rez-or-trash-choice";
import { selectedCorpRezOrTrashIceOptionId } from "./defense-choice-binding";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";

const FAO = "onr_v1_086_forged-activation-orders";
const CARYATID = "onr_proteus_013_caryatid";
const HOMING = "onr_proteus_025_homing-missile";
const GATEKEEPER = "onr_proteus_024_gatekeeper";
function deck(side: "runner" | "corp"): DeckDefinition {
  const d = catalog.decks.find(
    (d) =>
      d.side === side &&
      (side === "corp"
        ? [CARYATID, HOMING, GATEKEEPER].every((id) =>
            d.cards.some((c) => c.cardId === id),
          )
        : d.cards.some((c) => c.cardId === FAO)),
  )!;
  return {
    id: d.standardDeckId,
    name: d.name,
    side,
    identity: d.identityCardId,
    cards: [
      ...d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      ...(side === "runner" ? [{ id: "onr_v1_074_worm", quantity: 1 }] : []),
    ],
  };
}
const corpDeck = deck("corp"),
  runnerDeck = deck("runner");
function selectedOptionId(decision: ReturnType<typeof chooseAiAction>): string {
  const choice = decision.selectedChoices as { selectedOptionIds?: string[] };
  const id = choice?.selectedOptionIds?.[0];
  if (!id) throw Error("native_selected_option_required");
  return id;
}
function apply(
  state: GameState,
  action: LegalAction,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  if (!action) throw Error("native_action_required");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "variants:" + state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(JSON.stringify(result.error));
  return result.state;
}
function fixture(definitionId: string, credits = 20, worm = false) {
  let state = createGameAfterSetup({
    matchId: "forced:" + definitionId,
    seed: "forced:" + definitionId,
    agendaPointsToWin: 7,
    corpDeck,
    runnerDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withCorpIceOnServer("rd", definitionId)
    .withRunnerCredits(20)
    .withRunnerCardInGrip(FAO);
  if (worm) {
    builder.withRunnerProgramInstalled("onr_v1_074_worm");
    state.runner.memoryUsed = 1;
  }
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  const initial = structuredClone(state),
    start = state.eventLog.length;
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "play_event" && a.source.includes(FAO),
    )!,
  );
  const target = state.corp.servers
    .find((s) => s.id === "rd")!
    .ice.find((id) => state.cardInstances[id]?.definitionId === definitionId)!;
  const choice = state.pendingChoice!,
    option = choice.options.find((o) => o.value === target)!;
  state = apply(state, getLegalActions(state, "runner")[0]!, {
    choiceId: choice.choiceId,
    selectedOptionIds: [option.id],
  });
  return { state, initial, start, target };
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: "forced:" + state.stateVersion,
    profileId: "forced-native",
    ownDeckSnapshot: {
      deckSnapshotId: "forced-native",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
beforeEach(() => resetResidentPlanPortfolioMemory());
describe("native mandatory variable ICE rez", () => {
  it.each([CARYATID, HOMING, GATEKEEPER])(
    "quotes and applies %s under the sole Defense executor",
    (definitionId) => {
      const { state, initial, start, target } = fixture(definitionId);
      const stateHash = hashState(state),
        input = inputFor(state),
        choice = input.playerView.pendingChoice!;
      expect(hashState(state)).toBe(stateHash);
      const quotes = choice.options.flatMap((o) =>
        o.forcedIceRezQuote ? [o.forcedIceRezQuote] : [],
      );
      expect(quotes).toHaveLength(choice.options.length - 1);
      for (const q of quotes)
        expect(q).toMatchObject({
          schemaVersion: 1,
          choiceId: choice.choiceId,
          choiceSource: choice.source,
          stateVersion: state.stateVersion,
          iceInstanceId: target,
          iceDefinitionId: definitionId,
          serverId: "rd",
          creditsBeforeRez: 20,
        });
      expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
      expect(
        JSON.stringify(state.eventLog.slice(start).map((e) => e.publicPayload)),
      ).not.toContain(definitionId);
      expect(
        JSON.stringify(state.eventLog.slice(start).map((e) => e.publicPayload)),
      ).not.toContain("forcedIceRezQuote");
      const decision = chooseAiAction(input),
        portfolio = residentPlanPortfolioSnapshot(input)!;
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.actionId).toBe("corp.resolve_choice");
      expect(
        decision.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
      ).toBe("corp.defend_servers");
      expect(decision.decisionDebug!.planFirstDecision!.route).toMatchObject({
        actionId: decision.actionId,
        stateVersion: state.stateVersion,
        planInstanceId: portfolio.executorInstanceId,
      });
      const selected = choice.options.find(
        (o) => o.id === selectedOptionId(decision),
      )!;
      const q = selected.forcedIceRezQuote!;
      expect(
        selectedCorpRezOrTrashIceOptionId(
          input,
          input.legalActions[0]!,
          choice,
          choice.options,
          portfolio,
        ),
      ).toBe(selected.id);
      const after = apply(
          state,
          input.legalActions[0]!,
          decision.selectedChoices,
        ),
        view = getPlayerView(after, "corp");
      const card = view.servers
        .flatMap((s) => s.ice)
        .find((c) => c.instanceId === target)!;
      expect(view.own.credits).toBe(q.creditsAfterRez);
      expect(card.subtypes).toEqual(q.effectiveSubtypes);
      expect(card.effectiveRunQuote).toEqual(q.effectiveRunQuote);
      const replay = replayEvents(initial, after.eventLog.slice(start));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(after));
    },
  );
  it("pays for exactly one ETR when further ETRs add no access protection", () => {
    const input = inputFor(fixture(GATEKEEPER).state),
      decision = chooseAiAction(input);
    const q = input.playerView.pendingChoice!.options.find(
      (o) => o.id === selectedOptionId(decision),
    )!.forcedIceRezQuote!;
    expect(q.rezCredits).toBe(5);
    expect(
      q.effectiveRunQuote.subroutines.filter((s) => s.type === "end_the_run"),
    ).toHaveLength(1);
  });
  it("changes subtype only when the actual visible rig can break the cheaper subtype", () => {
    const input = inputFor(fixture(CARYATID, 20, true).state),
      decision = chooseAiAction(input);
    const q = input.playerView.pendingChoice!.options.find(
      (o) => o.id === selectedOptionId(decision),
    )!.forcedIceRezQuote!;
    expect(q.rezCredits).toBe(8);
    expect(q.effectiveSubtypes).toEqual(["code_gate"]);
  });
  it("does not pay optional trace strength without a known marginal access proof", () => {
    const input = inputFor(fixture(HOMING).state),
      decision = chooseAiAction(input);
    const q = input.playerView.pendingChoice!.options.find(
      (o) => o.id === selectedOptionId(decision),
    )!.forcedIceRezQuote!;
    expect(q.rezCredits).toBe(4);
    expect(q.effectiveRunQuote.effectiveStrength).toBe(0);
  });
  it("keeps a published score floor when considering optional variant upgrades", () => {
    const input = inputFor(fixture(GATEKEEPER, 6).state);
    const projects = [
      {
        projectId: "score-floor",
        serverId: "remote_1",
        agendaPoints: 1,
        terminalScore: false,
        continuationReserve: {
          serverId: "remote_1",
          requiredCreditsBeforeNextCorpTurn: 2,
          remainingAdvancementCounters: 1,
        },
      },
    ] as CorpScoreProjectSignal[];
    const candidates = [
      {
        actionId: input.legalActions[0]!.actionId,
        semanticActionType: "choice.resolve",
      },
    ] as ActionSemanticCandidate[];
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "rez_ice_1" });
  });
  it("handles a single affordable variable variant and a native trash-only choice", () => {
    const one = inputFor(fixture(CARYATID, 7).state);
    expect(one.playerView.pendingChoice!.options.map((o) => o.id)).toEqual([
      "rez_ice",
      "trash_ice",
    ]);
    expect(chooseAiAction(one).selectedChoices).toMatchObject({
      selectedOptionIds: ["rez_ice"],
    });
    resetResidentPlanPortfolioMemory();
    const none = inputFor(fixture(CARYATID, 6).state);
    expect(chooseAiAction(none).selectedChoices).toMatchObject({
      selectedOptionIds: ["trash_ice"],
    });
  });
  it.each([
    "missing",
    "stale",
    "ice",
    "option",
    "cost",
    "points",
    "bank",
    "run_identity",
    "missing_run",
    "action_choice",
  ])("fails closed for %s", (defect) => {
    const input = inputFor(fixture(GATEKEEPER).state),
      o = input.playerView.pendingChoice!.options[0]!,
      q = o.forcedIceRezQuote!;
    if (defect === "missing") delete o.forcedIceRezQuote;
    if (defect === "stale") q.stateVersion--;
    if (defect === "ice") q.iceInstanceId = "other";
    if (defect === "option") q.optionId = "other";
    if (defect === "cost") q.rezCredits++;
    if (defect === "points") q.mandatoryAgendaPointCost++;
    if (defect === "bank") q.creditsBeforeRez++;
    if (defect === "run_identity") q.effectiveRunQuote.iceInstanceId = "other";
    if (defect === "missing_run")
      delete (q as Partial<typeof q>).effectiveRunQuote;
    if (defect === "action_choice")
      input.legalActions[0]!.choiceRequirements![0]!.choiceId = "other";
    expect(() =>
      chooseAiAction({ ...input, ...buildAiDecisionInputDto(input) }),
    ).toThrowError(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });
  it("strips unapproved quote fields and never admits them to a Runner DTO", () => {
    const input = inputFor(fixture(GATEKEEPER).state),
      q = input.playerView.pendingChoice!.options[0]!.forcedIceRezQuote!;
    Object.assign(q, {
      hiddenRunnerHand: ["secret"],
      rawGameState: { secret: true },
    });
    const dto = buildAiDecisionInputDto(input);
    expect(JSON.stringify(dto)).not.toContain("hiddenRunnerHand");
    expect(JSON.stringify(dto)).not.toContain("rawGameState");
    input.playerView.side = "runner";
    input.side = "runner";
    input.legalActions = [];
    input.playerView.legalActions = [];
    expect(
      buildAiDecisionInputDto(input).playerView.pendingChoice!.options.every(
        (o) => !o.forcedIceRezQuote,
      ),
    ).toBe(true);
  });
});
