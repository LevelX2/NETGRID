import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type {
  AiDecisionInput,
  CorpOptionalRezChoiceQuote,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
} from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";

describe("selectedChoicesForDecision", () => {
  beforeEach(() => {
    resetResidentPlanPortfolioMemory();
  });

  it("routes checkpoint memory cleanup to the dedicated minimal selector", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source: "runner.checkpoint_memory_cleanup:1:318",
          minSelections: 1,
          maxSelections: 4,
          options: [
            { id: "program_a", label: "Program A", value: "program_a" },
            { id: "program_b", label: "Program B", value: "program_b" },
          ],
        },
        { side: "runner" },
      ),
      resolveChoiceAction("runner"),
      {
        ...unusedDependencies(),
        selectedRunnerMemoryCheckpointTrashOptionIds: () => ["program_b"],
      },
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["program_b"],
    });
  });

  it("spends a useful Priority Wreck amount while keeping a small reserve", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "successful_run.credit_loss_spend:run_85:85",
          minSelections: 1,
          maxSelections: 1,
          options: Array.from({ length: 8 }, (_, amount) => ({
            id: `pay_${amount}`,
            label: `${amount} Credits zahlen`,
            value: amount,
          })),
        },
        { side: "runner", credits: 7, opponentCredits: 7 },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["pay_4"],
    });
  });

  it("does not spend more on Priority Wreck than the Corp can lose", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "successful_run.credit_loss_spend:run_129:129",
          minSelections: 1,
          maxSelections: 1,
          options: Array.from({ length: 18 }, (_, amount) => ({
            id: `pay_${amount}`,
            label: `${amount} Credits zahlen`,
            value: amount,
          })),
        },
        { side: "runner", credits: 17, opponentCredits: 12 },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision?.selectedOptionIds).toEqual(["pay_12"]);
  });

  it("pays the current City Surveillance draw tax when the option is legal", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "runner_draw.draw_tax:12:city_1:0",
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "pay_credit", label: "1 Credit zahlen" },
            { id: "take_tag", label: "1 Tag nehmen" },
          ],
        },
        { side: "runner" },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["pay_credit"],
    });
  });

  it("takes the City Surveillance tag when no payment option is legal", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "runner_draw.draw_tax:12:city_1:0",
          minSelections: 1,
          maxSelections: 1,
          options: [{ id: "take_tag", label: "1 Tag nehmen" }],
        },
        { side: "runner", credits: 0 },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["take_tag"],
    });
  });

  it("resolves the real Engine access-payment choice for the exact accessed Corp card", () => {
    let state = createGameAfterSetup({
      seed: "ai-real-access-payment-choice",
    });
    state = applyRealAction(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const excessHqCardId = state.corp.hq.pop();
    if (!excessHqCardId) throw new Error("Missing Corp HQ fixture card.");
    state.corp.rd.push(excessHqCardId);
    state.cardInstances[excessHqCardId] = {
      ...state.cardInstances[excessHqCardId]!,
      zone: { side: "corp", zone: "rd" },
    };
    state = applyRealAction(
      state,
      "corp",
      (action) => action.type === "end_turn",
    );
    const accessedCardId = state.corp.rd[0];
    if (!accessedCardId) throw new Error("Missing R&D access fixture card.");
    state.cardInstances[accessedCardId] = {
      ...state.cardInstances[accessedCardId]!,
      definitionId: "onr_v1_345_trap",
    };
    state.corp.credits = 10;
    state = applyRealAction(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = applyRealAction(
      state,
      "runner",
      (action) => action.type === "access_card",
    );

    const playerView = getPlayerView(state, "corp");
    const legalActions = getLegalActions(state, "corp");
    const resolve = legalActions.find(
      (action) => action.type === "resolve_choice",
    );
    if (!resolve) throw new Error("Missing real Corp access choice action.");
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView,
      legalActions,
      eventTail: playerView.publicEvents,
      difficulty: "normal",
      seed: state.seed,
      decisionId: "real-access-payment-choice",
      actionNumber: state.stateVersion,
      profileId: "real-access-payment-choice",
    });

    expect(playerView.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_option",
      stateVersion: state.stateVersion,
      options: [
        {
          id: "pay",
          value: "pay",
          metadata: { creditCost: 4 },
        },
        { id: "decline", value: "decline" },
      ],
    });
    expect(playerView.pendingChoice?.source).toBe(
      `p3_35.access_payment:${accessedCardId}:0:rd:${state.stateVersion}`,
    );
    expect(playerView.publicEvents.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      ambushPaymentChoiceOpened: true,
      ambushPaymentAmount: 4,
    });
    expect(input.playerView.pendingChoice?.options[0]?.metadata).toEqual({
      creditCost: 4,
    });
    expect(input.eventTail.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      ambushPaymentChoiceOpened: true,
      ambushPaymentAmount: 4,
    });

    const selectedChoices = selectedChoicesForDecision(
      input,
      resolve,
      unusedDependencies(),
    );
    expect(selectedChoices).toEqual({
      choiceId: playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["pay"],
    });
    if (!selectedChoices) {
      throw new Error("Missing selected Corp access-payment choice.");
    }

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices,
      idempotencyKey: `corp:${state.stateVersion}:${resolve.actionId}`,
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.corp.credits).toBe(6);
    expect(result.state.runner.tags).toBe(1);
  });

  it("keeps an access-payment choice without an Engine cost quote fail-closed", () => {
    const input = inputWithChoice(
      {
        kind: "select_option",
        source: "p3_35.access_payment:trap-1:0:rd:12",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "pay", label: "Pay", value: "pay" },
          { id: "decline", label: "Decline", value: "decline" },
        ],
      },
      { side: "corp" },
    );
    input.playerView.stateVersion = 12;
    input.playerView.timingPoint = "access.resolve_card";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "access",
      accessedCard: {
        instanceId: "trap-1",
        known: true,
      },
      successful: true,
    };
    input.eventTail = [
      {
        eventId: "access-payment-without-quote",
        type: "action_applied",
        stateVersionBefore: 11,
        stateVersionAfter: 12,
        stateHashAfter: "sha256:test",
        publicPayload: {
          actionType: "access_card",
          ambushPaymentChoiceOpened: true,
          ambushPaymentAmount: 4,
        },
      },
    ];

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceAction("corp"),
        unusedDependencies(),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "window_origin_missing",
      }),
    );
  });

  it("rezes an affordable City Surveillance before passing the draw window", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        source: "runner_draw.draw_tax_rez:12",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "rez_city_1", label: "City Surveillance rezzen" },
          { id: "pass", label: "Passen" },
        ],
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["rez_city_1"],
    });
  });

  it("uses a legal Runner tag-avoidance source instead of passing", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "v120.event_modification.avoid",
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "pass", label: "Tag nicht vermeiden" },
            {
              id: "card_implementation_avoid_tag_runner_resource_1_0",
              label: "Installierte Ressource: 1 Tag vermeiden",
            },
          ],
        },
        { side: "runner" },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_implementation_avoid_tag_runner_resource_1_0"],
    });
  });

  it("keeps pass when no legal Runner tag-avoidance source is selectable", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "v120.event_modification.avoid",
          minSelections: 1,
          maxSelections: 1,
          options: [{ id: "pass", label: "Tag nicht vermeiden" }],
        },
        { side: "runner" },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["pass"],
    });
  });

  it("keeps pass in a damage window without a legal prevention source", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "v120.event_modification.prevent",
          minSelections: 1,
          maxSelections: 1,
          options: [{ id: "pass", label: "Nicht verhindern" }],
        },
        { side: "runner" },
      ),
      resolveChoiceAction("runner"),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["pass"],
    });
  });

  it("fails closed when an intentional damage-window pass has no Engine pass option", () => {
    expect(() =>
      selectedChoicesForDecision(
        inputWithChoice(
          {
            kind: "select_option",
            source: "v120.event_modification.prevent",
            minSelections: 1,
            maxSelections: 1,
            options: [
              {
                id: "unknown_prevention_source",
                label: "Unklassifizierte Schadensverhinderung",
              },
            ],
          },
          {
            side: "runner",
            gripOrHq: Array.from({ length: 4 }, (_, index) => ({
              instanceId: `grip-buffer-${index}`,
              known: true,
              type: "event",
            })),
          },
        ),
        resolveChoiceAction("runner"),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("uses the first legal Runner damage-prevention source instead of passing", () => {
    const forceShield = {
      instanceId: "runner_force_shield_1",
      definitionId: "runner_force_shield",
      known: true,
      type: "program",
    } as AiDecisionInput["playerView"]["own"]["gripOrHq"][number];
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "v120.event_modification.prevent",
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "pass", label: "Nicht verhindern" },
            {
              id: "card_implementation_damage_prevent_runner_force_shield_1_0_1",
              label: "Force Shield: 1 Schaden verhindern",
            },
          ],
        },
        {
          side: "runner",
          gripOrHq: [
            { ...forceShield, instanceId: "grip-buffer-1" },
            { ...forceShield, instanceId: "grip-buffer-2" },
            { ...forceShield, instanceId: "grip-buffer-3" },
          ],
          rig: [forceShield],
        },
      ),
      resolveChoiceAction("runner"),
      {
        ...unusedDependencies(),
        rolesForCardId: () => ["damage_prevention", "rig_defense"],
      },
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: [
        "card_implementation_damage_prevent_runner_force_shield_1_0_1",
      ],
    });
  });

  it("preserves a non-routine prevention source outside acute damage pressure", () => {
    const oneShot = {
      instanceId: "runner_one_shot_1",
      definitionId: "runner_one_shot",
      known: true,
      type: "program",
    } as AiDecisionInput["playerView"]["own"]["gripOrHq"][number];
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_option",
          source: "v120.event_modification.prevent",
          minSelections: 1,
          maxSelections: 1,
          options: [
            { id: "pass", label: "Nicht verhindern" },
            {
              id: "card_implementation_damage_prevent_runner_one_shot_1_0_1",
              label: "Einmalige Quelle: 1 Schaden verhindern",
            },
          ],
        },
        {
          side: "runner",
          gripOrHq: [
            { ...oneShot, instanceId: "grip-buffer-1" },
            { ...oneShot, instanceId: "grip-buffer-2" },
            { ...oneShot, instanceId: "grip-buffer-3" },
            { ...oneShot, instanceId: "grip-buffer-4" },
          ],
          rig: [oneShot],
        },
      ),
      resolveChoiceAction("runner"),
      {
        ...unusedDependencies(),
        rolesForCardId: () => ["program"],
      },
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["pass"],
    });
  });

  it("fails closed for an ambiguous mandatory choice without a resolver", () => {
    expect(() =>
      selectedChoicesForDecision(
        inputWithChoice({
          kind: "select_option",
          minSelections: 2,
          maxSelections: 2,
        }),
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("fails closed for an optional unknown choice instead of picking first", () => {
    expect(() =>
      selectedChoicesForDecision(
        inputWithChoice({
          kind: "select_option",
          minSelections: 0,
          maxSelections: 1,
          options: [{ id: "only_option", label: "Only option" }],
        }),
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("resolves an unknown mandatory choice when exactly one option is selectable", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "forced", label: "Forced" },
          { id: "unavailable", label: "Unavailable", selectable: false },
        ],
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["forced"],
    });
  });

  it("resolves a mandatory choice only when every selectable option is forced", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 2,
        maxSelections: 3,
        options: [
          { id: "ice_a_hq", label: "ICE A HQ", value: "ice_a|hq" },
          { id: "ice_b_hq", label: "ICE B HQ", value: "ice_b|hq" },
        ],
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["ice_a_hq", "ice_b_hq"],
    });
  });

  it("rejects an invalid selection returned by a registered resolver", () => {
    expect(() =>
      selectedChoicesForDecision(
        inputWithChoice(
          {
            kind: "select_cards",
            source: "runner.checkpoint_memory_cleanup:1:318",
            minSelections: 1,
            maxSelections: 1,
            options: [
              { id: "program_a", label: "Program A", value: "program_a" },
            ],
          },
          { side: "runner" },
        ),
        resolveChoiceAction("runner"),
        {
          ...unusedDependencies(),
          selectedRunnerMemoryCheckpointTrashOptionIds: () => [
            "not_selectable",
          ],
        },
      ),
    ).toThrowError("window_origin_missing");
  });

  it("selects Corporate Negotiating Center HQ agenda options when revealing agendas", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_cards",
        source: "v1917.corp_hq_agenda_reveal:cnc_source:8",
        minSelections: 0,
        maxSelections: 2,
        options: [
          { id: "card_hq_agenda_1", label: "HQ-Agenda", value: "hq_agenda_1" },
          { id: "card_hq_agenda_2", label: "HQ-Agenda", value: "hq_agenda_2" },
        ],
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_hq_agenda_1", "card_hq_agenda_2"],
    });
  });

  it("continues an exact scored-agenda HQ cleanup through its resident score parent", () => {
    const input = inputWithChoice(
      {
        kind: "select_cards",
        source: "scored_agenda.hq_agenda_shuffle_credits:downsizing_source:2:7",
        continuation: {
          family: "corp_scored_agenda_hq_shuffle",
          originActionId: "corp.score-conversion",
          agendaInstanceId: "downsizing_source",
          creditPerAgendaPoint: 2,
          createdAtStateVersion: 7,
        },
        minSelections: 0,
        maxSelections: 2,
        options: [
          {
            id: "card_hq_agenda_1",
            label: "HQ-Agenda",
            value: "hq_agenda_1",
          },
          {
            id: "card_hq_agenda_2",
            label: "HQ-Agenda",
            value: "hq_agenda_2",
          },
        ],
      },
      {
        gripOrHq: [
          visibleCard("hq_agenda_1", "agenda"),
          visibleCard("hq_agenda_2", "agenda"),
        ],
        scoreArea: [visibleCard("downsizing_source", "agenda")],
      },
    );
    rememberResidentScoreChoiceContinuation(
      input,
      "downsizing_source",
      "corp_scored_agenda_on_score",
    );

    expect(
      selectedChoicesForDecision(
        input,
        resolveChoiceActionForInput(input),
        unusedDependencies(),
      ),
    ).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_hq_agenda_1", "card_hq_agenda_2"],
    });
  });

  it("keeps a scored-agenda HQ cleanup without its exact score parent fail-closed", () => {
    const input = inputWithChoice(
      {
        kind: "select_cards",
        source: "scored_agenda.hq_agenda_shuffle_credits:downsizing_source:2:7",
        minSelections: 0,
        maxSelections: 1,
        options: [
          {
            id: "card_hq_agenda_1",
            label: "HQ-Agenda",
            value: "hq_agenda_1",
          },
        ],
      },
      {
        gripOrHq: [visibleCard("hq_agenda_1", "agenda")],
        scoreArea: [visibleCard("downsizing_source", "agenda")],
      },
    );

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceActionForInput(input),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it.each([
    ["draws when R&D can still pay the following mandatory draw", 8, "draw"],
    ["skips when the extra draw would consume the mandatory-draw card", 1, "skip"],
    ["skips when R&D is already empty", 0, "skip"],
  ] as const)("%s", (_label, rdCount, expectedOptionId) => {
    const input = inputWithChoice(
      {
        kind: "select_option",
        source: "scored_agenda.start_draw_choice:employee:7",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "draw", label: "Zusätzliche Karte ziehen", value: "draw" },
          { id: "skip", label: "Überspringen", value: "skip" },
        ],
      },
      {
        scoreArea: [
          {
            ...visibleCard("employee", "agenda"),
            definitionId: "onr_v1_199_employee-empowerment",
          },
        ],
      },
    );
    input.playerView.timingPoint = "corp_draw.mandatory_draw";
    input.playerView.pendingChoice!.visibility = "public";
    input.playerView.own.stackOrRdCount = rdCount;
    const action = resolveChoiceActionForInput(input);

    expect(
      selectedChoicesForDecision(input, action, unusedDependencies()),
    ).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: [expectedOptionId],
    });
  });

  it("keeps an unbound scored-agenda start draw fail-closed", () => {
    const input = inputWithChoice({
      kind: "select_option",
      source: "scored_agenda.start_draw_choice:missing-employee:7",
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: "draw", label: "Zusätzliche Karte ziehen", value: "draw" },
        { id: "skip", label: "Überspringen", value: "skip" },
      ],
    });
    input.playerView.timingPoint = "corp_draw.mandatory_draw";
    input.playerView.pendingChoice!.visibility = "public";
    input.playerView.own.stackOrRdCount = 8;

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceActionForInput(input),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("keeps a stale scored-agenda start draw fail-closed", () => {
    const input = inputWithChoice(
      {
        kind: "select_option",
        source: "scored_agenda.start_draw_choice:employee:7",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "draw", label: "Zusätzliche Karte ziehen", value: "draw" },
          { id: "skip", label: "Überspringen", value: "skip" },
        ],
      },
      { scoreArea: [visibleCard("employee", "agenda")] },
    );
    input.playerView.timingPoint = "corp_draw.mandatory_draw";
    input.playerView.pendingChoice!.visibility = "public";
    input.playerView.pendingChoice!.stateVersion = 6;
    input.playerView.own.stackOrRdCount = 8;

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceActionForInput(input),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it.each([
    [
      "different scored agenda",
      (input: AiDecisionInput) => {
        input.playerView.pendingChoice!.continuation = {
          family: "corp_scored_agenda_hq_shuffle",
          originActionId: "corp.score-conversion",
          agendaInstanceId: "different_source",
          creditPerAgendaPoint: 2,
          createdAtStateVersion: 7,
        };
      },
    ],
    [
      "stale source state",
      (input: AiDecisionInput) => {
        input.playerView.pendingChoice!.continuation = {
          family: "corp_scored_agenda_hq_shuffle",
          originActionId: "corp.score-conversion",
          agendaInstanceId: "downsizing_source",
          creditPerAgendaPoint: 2,
          createdAtStateVersion: 6,
        };
      },
    ],
    [
      "different origin action",
      (input: AiDecisionInput) => {
        input.playerView.pendingChoice!.continuation = {
          family: "corp_scored_agenda_hq_shuffle",
          originActionId: "other-score-action",
          agendaInstanceId: "downsizing_source",
          creditPerAgendaPoint: 2,
          createdAtStateVersion: 7,
        };
      },
    ],
    [
      "public visibility",
      (input: AiDecisionInput) => {
        input.playerView.pendingChoice!.visibility = "public";
      },
    ],
    [
      "incomplete HQ-agenda option set",
      (input: AiDecisionInput) => {
        input.playerView.own.gripOrHq.push(
          visibleCard("hq_agenda_2", "agenda"),
        );
      },
    ],
  ])("rejects a scored-agenda HQ cleanup with %s", (_label, mutate) => {
    const input = scoredAgendaCleanupInput();
    mutate(input);
    rememberResidentScoreChoiceContinuation(
      input,
      "downsizing_source",
      "corp_scored_agenda_on_score",
    );

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceActionForInput(input),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("rejects a scored-agenda HQ cleanup with a mismatched LegalAction choice contract", () => {
    const input = scoredAgendaCleanupInput();
    rememberResidentScoreChoiceContinuation(
      input,
      "downsizing_source",
      "corp_scored_agenda_on_score",
    );
    const action = resolveChoiceActionForInput(input);
    action.choiceRequirements![0]!.optionIds = ["different_option"];

    expect(() =>
      selectedChoicesForDecision(input, action, unusedDependencies()),
    ).toThrowError("window_origin_missing");
  });

  it("builds a valid Data Fort Reclamation selection instead of taking every HQ option", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source:
            "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:12",
          minSelections: 0,
          maxSelections: 4,
          options: [
            { id: "card_agenda_1", label: "Agenda", value: "agenda_1" },
            { id: "card_asset_1", label: "Asset", value: "asset_1" },
            { id: "card_ice_1", label: "ICE", value: "ice_1" },
            { id: "card_asset_2", label: "Second Asset", value: "asset_2" },
            { id: "card_upgrade_1", label: "Upgrade", value: "upgrade_1" },
          ],
        },
        {
          gripOrHq: [
            visibleCard("agenda_1", "agenda"),
            visibleCard("asset_1", "asset"),
            visibleCard("ice_1", "ice"),
            visibleCard("asset_2", "asset"),
            visibleCard("upgrade_1", "upgrade"),
          ],
        },
      ),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_ice_1", "card_asset_1", "card_upgrade_1"],
    });
  });

  it("does not install agendas through a Data Fort Reclamation fallback choice", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source:
            "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:12",
          minSelections: 0,
          maxSelections: 2,
          options: [
            { id: "card_agenda_1", label: "Agenda", value: "agenda_1" },
            { id: "card_agenda_2", label: "Agenda", value: "agenda_2" },
          ],
        },
        {
          gripOrHq: [
            visibleCard("agenda_1", "agenda"),
            visibleCard("agenda_2", "agenda"),
          ],
        },
      ),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: [],
    });
  });

  it("selects an affordable Data Fort Reclamation rez only from its exact Engine quote", () => {
    const decision = selectedChoicesForDecision(
      optionalRezInput(optionalRezQuote()),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["rez_option"],
    });
  });

  it.each([
    ["incomplete", incompleteOptionalRezQuote()],
    [
      "unaffordable",
      {
        ...optionalRezQuote(),
        baseCredits: 11,
        finalCredits: 11,
        regularCreditsRequired: 6,
        creditPayable: false,
        affordable: false,
      } as CorpOptionalRezChoiceQuote,
    ],
  ])("declines an %s Engine-quoted optional rez", (_label, quote) => {
    const decision = selectedChoicesForDecision(
      optionalRezInput(quote),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: [],
    });
  });

  it.each([
    ["missing quote", undefined],
    [
      "different choice",
      { ...optionalRezQuote(), choiceId: "different-choice" },
    ],
    [
      "different option",
      { ...optionalRezQuote(), optionId: "different-option" },
    ],
    ["stale state", { ...optionalRezQuote(), stateVersion: 6 }],
    [
      "malformed payment",
      { ...optionalRezQuote(), regularCreditsRequired: 99 },
    ],
    [
      "unknown score parent",
      { ...optionalRezQuote(), sourceAgendaId: "different-agenda" },
    ],
    [
      "new_remote target",
      { ...optionalRezQuote(), targetServerId: "new_remote" },
    ],
    ["central target", { ...optionalRezQuote(), targetServerId: "hq" }],
    [
      "duplicate modifier ids",
      {
        ...optionalRezQuote(),
        reductionSourceDefinitionIds: ["modifier-a", "modifier-a"],
      },
    ],
    [
      "non-canonical modifier ids",
      {
        ...optionalRezQuote(),
        reductionSourceDefinitionIds: ["modifier-b", "modifier-a"],
      },
    ],
  ])("fails closed for an optional rez with %s", (_label, quote) => {
    expect(() =>
      selectedChoicesForDecision(
        optionalRezInput(quote as CorpOptionalRezChoiceQuote | undefined),
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "window_origin_missing",
      }),
    );
  });

  it.each([
    ["option value", { optionValue: "different-card" }],
    ["visible card id", { optionCardId: "different-card" }],
    ["visible definition", { optionDefinitionId: "different-definition" }],
  ])(
    "fails closed for an optional rez with mismatched %s",
    (_label, options) => {
      expect(() =>
        selectedChoicesForDecision(
          optionalRezInput(optionalRezQuote(), options),
          resolveChoiceAction(),
          unusedDependencies(),
        ),
      ).toThrowError(
        expect.objectContaining({
          code: "window_origin_missing",
        }),
      );
    },
  );

  it.each([
    [
      "missing target server",
      (input: AiDecisionInput) => {
        input.playerView.servers = [];
      },
    ],
    [
      "card in the wrong server zone",
      (input: AiDecisionInput) => {
        const server = input.playerView.servers[0]!;
        server.root = server.ice;
        server.ice = [];
      },
    ],
  ])("fails closed when the optional-rez quote has %s", (_label, mutate) => {
    const input = optionalRezInput(optionalRezQuote());
    mutate(input);
    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "window_origin_missing",
      }),
    );
  });

  it("validates every selectable optional-rez option before selecting one", () => {
    const input = optionalRezInput(optionalRezQuote());
    input.playerView.pendingChoice!.options.push({
      id: "unquoted-second-option",
      label: "Unquoted option",
      value: "unquoted-card",
      card: {
        instanceId: "unquoted-card",
        definitionId: "unquoted-definition",
        known: true,
        type: "ice",
        rezzed: false,
      },
    });
    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "window_origin_missing",
      }),
    );
  });

  it("routes advancement move choices through the Corp score chooser", () => {
    const agenda = {
      ...visibleCard("agenda_1", "agenda"),
      definitionId: "simple_agenda",
      advancementRequirement: 3,
      advancementCounters: 1,
    };
    const vapor = {
      ...visibleCard("vapor_1", "asset"),
      definitionId: "onr_v1_347_vapor-ops",
      advancementCounters: 2,
    };
    const input = inputWithChoice(
      {
        kind: "select_option",
        source:
          "p3_34.move_advancement:onr_v1_347_vapor-ops:vapor_1:source_card:all:8",
        continuation: {
          family: "corp_advancement_counter",
          originActionId: "corp.score-conversion",
          createdAtStateVersion: 7,
        },
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "move_to_vapor_decoy",
            label: "1 auf Decoy",
            value: "vapor_1|decoy_1|1",
          },
          {
            id: "move_to_score",
            label: "2 auf Agenda",
            value: "vapor_1|agenda_1|2",
          },
        ],
      },
      {
        servers: [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [],
            root: [
              agenda,
              vapor,
              { ...visibleCard("decoy_1", "asset"), advancementCounters: 0 },
            ],
          },
        ],
      },
    );
    rememberResidentScoreChoiceContinuation(input, agenda.instanceId);
    const decision = selectedChoicesForDecision(
      input,
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["move_to_score"],
    });
  });

  it("fails a Corp advancement choice without an exact resident score continuation", () => {
    expect(() =>
      selectedChoicesForDecision(
        inputWithChoice({
          kind: "select_option",
          source:
            "p3_34.move_advancement:onr_v1_347_vapor-ops:vapor_1:source_card:all:8",
          minSelections: 1,
          maxSelections: 1,
          options: [
            {
              id: "move_to_score",
              label: "2 auf Agenda",
              value: "vapor_1|agenda_1|2",
            },
          ],
        }),
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });

  it("rejects a resident score continuation bound to a different agenda", () => {
    const input = inputWithChoice({
      kind: "select_option",
      source:
        "p3_34.move_advancement:onr_v1_347_vapor-ops:vapor_1:source_card:all:8",
      continuation: {
        family: "corp_advancement_counter",
        originActionId: "corp.score-conversion",
        createdAtStateVersion: 7,
      },
      minSelections: 1,
      maxSelections: 1,
      options: [
        {
          id: "move_to_score",
          label: "2 auf Agenda",
          value: "vapor_1|agenda_1|2",
        },
      ],
    });
    rememberResidentScoreChoiceContinuation(input, "different_agenda");

    expect(() =>
      selectedChoicesForDecision(
        input,
        resolveChoiceAction(),
        unusedDependencies(),
      ),
    ).toThrowError("window_origin_missing");
  });
});

function inputWithChoice(
  choice: {
    kind: "select_option" | "select_cards";
    source?: string;
    continuation?: NonNullable<
      AiDecisionInput["playerView"]["pendingChoice"]
    >["continuation"];
    minSelections: number;
    maxSelections: number;
    options?: Array<{
      id: string;
      label: string;
      value?: string | number;
      selectable?: boolean;
      card?: NonNullable<
        AiDecisionInput["playerView"]["pendingChoice"]
      >["options"][number]["card"];
      hqInstallRezOptionQuote?: CorpOptionalRezChoiceQuote;
    }>;
  },
  options: {
    gripOrHq?: AiDecisionInput["playerView"]["own"]["gripOrHq"];
    credits?: number;
    opponentCredits?: number;
    servers?: AiDecisionInput["playerView"]["servers"];
    rig?: AiDecisionInput["playerView"]["own"]["rig"];
    scoreArea?: AiDecisionInput["playerView"]["own"]["scoreArea"];
    side?: "corp" | "runner";
  } = {},
): AiDecisionInput {
  const side = options.side ?? "corp";
  return {
    side,
    seed: "selected-choice-test",
    decisionId: "selected-choice-test:7",
    profileId: "selected-choice-test",
    playerView: {
      stateVersion: 7,
      timingPoint: "choice.pending",
      winner: null,
      own: {
        credits: options.credits ?? 5,
        gripOrHq: options.gripOrHq ?? [],
        rig: options.rig ?? [],
        scoreArea: options.scoreArea ?? [],
      },
      servers: options.servers ?? [],
      opponent: {
        credits: options.opponentCredits ?? 5,
      },
      pendingChoice: {
        choiceId: "choice_multi",
        side,
        source:
          choice.source ??
          "card_implementation.agenda_purge_install_targets:test",
        ...(choice.continuation ? { continuation: choice.continuation } : {}),
        prompt: "Choose targets",
        kind: choice.kind,
        options: choice.options ?? [
          { id: "option_a", label: "A" },
          { id: "option_b", label: "B" },
          { id: "option_c", label: "C" },
        ],
        minSelections: choice.minSelections,
        maxSelections: choice.maxSelections,
        stateVersion: 7,
        visibility: "hidden_info_barrier",
      },
      legalActions: [resolveChoiceAction(side)],
    },
    legalActions: [resolveChoiceAction(side)],
  } as unknown as AiDecisionInput;
}

function scoredAgendaCleanupInput(): AiDecisionInput {
  return inputWithChoice(
    {
      kind: "select_cards",
      source: "scored_agenda.hq_agenda_shuffle_credits:downsizing_source:2:7",
      continuation: {
        family: "corp_scored_agenda_hq_shuffle",
        originActionId: "corp.score-conversion",
        agendaInstanceId: "downsizing_source",
        creditPerAgendaPoint: 2,
        createdAtStateVersion: 7,
      },
      minSelections: 0,
      maxSelections: 1,
      options: [
        {
          id: "card_hq_agenda_1",
          label: "HQ-Agenda",
          value: "hq_agenda_1",
        },
      ],
    },
    {
      gripOrHq: [visibleCard("hq_agenda_1", "agenda")],
      scoreArea: [visibleCard("downsizing_source", "agenda")],
    },
  );
}

function rememberResidentScoreChoiceContinuation(
  input: AiDecisionInput,
  targetCardId: string,
  family:
    | "corp_advancement_counter"
    | "corp_scored_agenda_on_score" = "corp_advancement_counter",
): void {
  const priorInput = structuredClone(input);
  priorInput.playerView.stateVersion = input.playerView.stateVersion - 1;
  delete priorInput.playerView.pendingChoice;
  rememberResidentPlanPortfolio(priorInput, {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "corp",
    stateVersion: priorInput.playerView.stateVersion,
    rootForegroundInstanceId: "corp.score_agenda:score-project",
    executorInstanceId: "corp.score_agenda:score-project",
    instances: [
      {
        instanceId: "corp.score_agenda:score-project",
        moduleId: "corp.score_agenda",
        executionState: "executor",
        moduleState: {
          kind: "score",
          signal: { agendaInstanceId: targetCardId },
          choiceContinuation: {
            family,
            selectedActionId: "corp.score-conversion",
            selectedAtStateVersion: priorInput.playerView.stateVersion,
            targetCardId,
          },
        },
      },
    ],
    completionHistory: [],
    transitions: [],
  } as never);
}

function optionalRezQuote(): Extract<
  CorpOptionalRezChoiceQuote,
  { complete: true }
> {
  return {
    schemaVersion: CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
    kind: CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
    context: "hq_to_new_remote_optional_rez",
    choiceId: "choice_multi",
    optionId: "rez_option",
    sourceAgendaId: "data-fort-agenda",
    cardId: "engine-certified-card",
    cardDefinitionId: "engine-certified-definition",
    targetServerId: "remote_1",
    installedZone: "serverIce",
    sequencePosition: 1,
    stateVersion: 7,
    complete: true,
    cardType: "ice",
    baseCredits: 8,
    finalCredits: 8,
    mandatoryAdditionalCosts: { agendaPoints: 0 },
    reductionSourceDefinitionIds: ["modifier-a", "modifier-b"],
    temporaryCreditsAvailable: 5,
    temporaryCreditsApplied: 5,
    regularCreditsAvailable: 5,
    regularCreditsRequired: 3,
    creditPayable: true,
    additionalCostsPayable: true,
    affordable: true,
  };
}

function incompleteOptionalRezQuote(): Extract<
  CorpOptionalRezChoiceQuote,
  { complete: false }
> {
  const quote = optionalRezQuote();
  return {
    schemaVersion: quote.schemaVersion,
    kind: quote.kind,
    context: quote.context,
    choiceId: quote.choiceId,
    optionId: quote.optionId,
    sourceAgendaId: quote.sourceAgendaId,
    cardId: quote.cardId,
    cardDefinitionId: quote.cardDefinitionId,
    targetServerId: quote.targetServerId,
    installedZone: quote.installedZone,
    sequencePosition: quote.sequencePosition,
    stateVersion: quote.stateVersion,
    complete: false,
  };
}

function optionalRezInput(
  quote: CorpOptionalRezChoiceQuote | undefined,
  options: {
    optionValue?: string;
    optionCardId?: string;
    optionDefinitionId?: string;
  } = {},
): AiDecisionInput {
  const input = inputWithChoice(
    {
      kind: "select_cards",
      source:
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:opaque-engine-source",
      minSelections: 0,
      maxSelections: 1,
      options: [
        {
          id: "rez_option",
          label: "Engine-certified installed card",
          value: options.optionValue ?? "engine-certified-card",
          card: {
            instanceId: options.optionCardId ?? "engine-certified-card",
            definitionId:
              options.optionDefinitionId ?? "engine-certified-definition",
            known: true,
            type: "ice",
            rezzed: false,
          },
          ...(quote ? { hqInstallRezOptionQuote: quote } : {}),
        },
      ],
    },
    {
      credits: 5,
      scoreArea: [visibleCard("data-fort-agenda", "agenda")],
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [
            {
              instanceId: "engine-certified-card",
              definitionId: "engine-certified-definition",
              known: true,
              type: "ice",
              rezzed: false,
            },
          ],
          root: [],
        },
      ],
    },
  );
  input.playerView.own.agendaPoints = 0;
  return input;
}

function visibleCard(
  instanceId: string,
  type: "agenda" | "asset" | "ice" | "upgrade",
): AiDecisionInput["playerView"]["own"]["gripOrHq"][number] {
  return {
    instanceId,
    known: true,
    type,
  } as AiDecisionInput["playerView"]["own"]["gripOrHq"][number];
}

function resolveChoiceAction(side: "corp" | "runner" = "corp"): LegalAction {
  return {
    actionId: `${side}.resolve_choice`,
    side,
    type: "resolve_choice",
    label: "Resolve choice",
    source: "game_rule",
    costs: [],
  } as unknown as LegalAction;
}

function resolveChoiceActionForInput(input: AiDecisionInput): LegalAction {
  const choice = input.playerView.pendingChoice;
  if (!choice) throw new Error("Missing pending choice.");
  return {
    ...resolveChoiceAction(input.side),
    timingPoint: input.playerView.timingPoint,
    expiresAtStateVersion: input.playerView.stateVersion,
    choiceRequirements: [
      {
        choiceId: choice.choiceId,
        minSelections: choice.minSelections,
        maxSelections: choice.maxSelections,
        optionIds: choice.options.map((option) => option.id),
      },
    ],
  };
}

function applyRealAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) {
    throw new Error(
      `Missing real ${side} fixture action: ${getLegalActions(state, side)
        .map((candidate) => candidate.type)
        .join(", ")}`,
    );
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function unusedDependencies(): Parameters<
  typeof selectedChoicesForDecision
>[2] {
  return {
    evaluateCorpOpeningHand: () => ({ decision: "keep" }),
    evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
    discardKeepScore: () => ({ total: 0 }),
    selectedRunnerProgramInstallTrashOptionIds: () => [],
    selectedRunnerForcedProgramTrashOptionIds: () => [],
    selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
    extractAiFeatures: () => ({}) as never,
    rolesForCardId: () => [],
  };
}
