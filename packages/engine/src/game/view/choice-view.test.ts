import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  getLegalActions,
  getPlayerView,
  replayEvents,
} from "../../index";
import {
  choiceRequest,
  putCorpIceOnServer,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardInstanceId } from "@netgrid/shared";

describe("ChoiceView projection", () => {
  it("exposes pendingChoice only to the owning side and resolves it through LegalActions", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "v093-choice" }));
    state.pendingChoice = choiceRequest(state, "runner");

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const runnerActions = getLegalActions(state, "runner");

    expect(runnerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(runnerView.pendingChoice?.options[0]?.label).toBe(
      "Keep private option",
    );
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Keep private option");
    expect(runnerActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(
      runnerActions.some((action) => action.type === "trigger_ability"),
    ).toBe(false);

    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["illegal"],
      },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("ERR_INVALID_CHOICE");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["keep"],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.pendingChoice).toBeUndefined();
    expect(result.event.visibilityClass).toBe("private_to_side");
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "Keep private option",
    );
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "private prompt",
    );
    expect(replayEvents(state, [result.event]).ok).toBe(true);
  });

  it("projects private top-zone arrange choices with card details only to the acting side", () => {
    const runnerState = toRunnerTurn(
      createGameAfterSetup({ seed: "choice-view-runner-stack-top5" }),
    );
    const runnerTopCards = runnerState.runner.stack.slice(0, 5);
    expect(runnerTopCards).toHaveLength(5);
    runnerState.pendingChoice = {
      choiceId: "p3_37_runner_stack_top5_1",
      side: "runner",
      source: "p3_37.runner_stack_top5_choose_one_arrange_rest:source:1",
      prompt: "Stack-Spitze waehlen und anordnen",
      kind: "select_cards",
      options: runnerTopCards.map((cardId, index) => ({
        id: `card_${cardId}`,
        label: `Stack ${index + 1}`,
        value: cardId,
      })),
      minSelections: runnerTopCards.length,
      maxSelections: runnerTopCards.length,
      stateVersion: runnerState.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };

    const runnerView = getPlayerView(runnerState, "runner");
    const runnerOpponentView = getPlayerView(runnerState, "corp");
    const runnerChoiceCard = runnerView.pendingChoice?.options[0]?.card;
    const runnerChoiceTitle = runnerChoiceCard?.title ?? "";

    expect(runnerChoiceCard?.known).toBe(true);
    expect(runnerChoiceTitle).toBeTruthy();
    expect(runnerChoiceCard?.rulesText).toBeTruthy();
    expect(runnerOpponentView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerOpponentView)).not.toContain(runnerChoiceTitle);

    const corpState = toRunnerTurn(
      createGameAfterSetup({ seed: "choice-view-corp-rd-top5" }),
    );
    const corpTopCards = corpState.corp.rd.slice(0, 5);
    expect(corpTopCards).toHaveLength(5);
    corpState.pendingChoice = {
      choiceId: "v1922_corp_rd_arrange_top5_1",
      side: "corp",
      source: "v1922.corp_rd_arrange_top5:source:1",
      prompt: "R&D-Spitze anordnen",
      kind: "select_cards",
      options: corpTopCards.map((cardId, index) => ({
        id: `card_${cardId}`,
        label: `R&D ${index + 1}`,
        value: cardId,
      })),
      minSelections: corpTopCards.length,
      maxSelections: corpTopCards.length,
      stateVersion: corpState.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };

    const corpView = getPlayerView(corpState, "corp");
    const runnerOpponentCorpView = getPlayerView(corpState, "runner");
    const corpChoiceCard = corpView.pendingChoice?.options[0]?.card;
    const corpChoiceTitle = corpChoiceCard?.title ?? "";

    expect(corpChoiceCard?.known).toBe(true);
    expect(corpChoiceTitle).toBeTruthy();
    expect(corpChoiceCard?.rulesText).toBeTruthy();
    expect(runnerOpponentCorpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerOpponentCorpView)).not.toContain(
      corpChoiceTitle,
    );
  });

  it("keeps Data Fort Reclamation HQ options private to the Corp view", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "choice-view-data-fort-hq" }),
    );
    const optionCardIds = state.corp.hq.slice(0, 2) as CardInstanceId[];
    expect(optionCardIds).toHaveLength(2);
    const options = optionCardIds.map((cardId) => {
      const definitionId = state.cardInstances[cardId]?.definitionId;
      const definition = definitionId
        ? DEMO_CARDS_BY_ID[definitionId]
        : undefined;
      if (!definition) throw new Error(`Missing definition for ${cardId}`);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
      };
    });
    state.pendingChoice = {
      choiceId: "choice_card_implementation_hq_to_new_remote_install_rez_1",
      side: "corp",
      source:
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:1",
      prompt: "Data Fort Reclamation: HQ-Karten fuer neues Data Fort waehlen.",
      kind: "select_cards",
      options,
      minSelections: 0,
      maxSelections: 2,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };

    const corpView = getPlayerView(state, "corp");
    const runnerView = getPlayerView(state, "runner");
    const runnerViewJson = JSON.stringify(runnerView);

    expect(
      corpView.pendingChoice?.options.map((option) => option.value),
    ).toEqual(optionCardIds);
    expect(
      corpView.pendingChoice?.options.map((option) => option.label),
    ).toEqual(options.map((option) => option.label));
    expect(runnerView.pendingChoice).toBeUndefined();
    for (const fieldName of [
      "cardImplementationAbilityId",
      "cardImplementationAbilityKey",
      "cardImplementationPrimitiveKind",
      "cardImplementationEffectKind",
    ]) {
      expect(runnerViewJson).not.toContain(fieldName);
    }
    for (const option of options) {
      expect(runnerViewJson).not.toContain(String(option.value));
      expect(runnerViewJson).not.toContain(option.label);
      const definitionId = state.cardInstances[option.value]?.definitionId;
      if (definitionId) expect(runnerViewJson).not.toContain(definitionId);
    }
  });

  it("projects public rezzed ICE choices without hiding already-public targets", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "choice-view-public-rezzed-ice" }),
    );
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.pendingChoice = {
      choiceId: "choice_card_implementation_select_rezzed_ice_mark_modifier_1",
      side: "corp",
      source:
        "card_implementation_primitive.select_rezzed_ice_mark_modifier:ice_transmutation:1",
      prompt: "Scored Agenda: Rezzed ICE wählen.",
      kind: "select_cards",
      options: [
        {
          id: `card_${iceId}`,
          label: "Simple Barrier ICE",
          publicLabel: "Simple Barrier ICE",
          value: iceId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };

    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    const runnerView = getPlayerView(state, "runner");
    const runnerRdIce = runnerView.servers.find((server) => server.id === "rd")
      ?.ice[0];

    expect(corpChoice).toMatchObject({
      visibility: "public",
      options: [
        {
          id: `card_${iceId}`,
          label: "Simple Barrier ICE",
          publicLabel: "Simple Barrier ICE",
          value: iceId,
        },
      ],
    });
    expect(runnerView.pendingChoice).toBeUndefined();
    expect(runnerRdIce).toMatchObject({
      known: true,
      title: "Simple Barrier ICE",
      definitionId: "simple_barrier_ice",
      rezzed: true,
    });
    expect(JSON.stringify(runnerView)).toContain("Simple Barrier ICE");
  });
});
