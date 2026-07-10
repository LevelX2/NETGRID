import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedChoicesForDecision } from "./selected-choices-for-decision";

describe("selectedChoicesForDecision", () => {
  it("selects enough generic options for mandatory multi-select choices", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 2,
        maxSelections: 2,
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["option_a", "option_b"],
    });
  });

  it("keeps optional generic single-choice fallback behavior", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 0,
        maxSelections: 1,
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["option_a"],
    });
  });

  it("spreads mandatory generic choices across structured option groups", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 2,
        maxSelections: 2,
        options: [
          { id: "ice_a_hq", label: "ICE A HQ", value: "ice_a|hq" },
          { id: "ice_a_rd", label: "ICE A R&D", value: "ice_a|rd" },
          { id: "ice_b_hq", label: "ICE B HQ", value: "ice_b|hq" },
          { id: "ice_b_rd", label: "ICE B R&D", value: "ice_b|rd" },
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

  it("selects only an affordable subset for the optional Data Fort Reclamation rez choice", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source:
            "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:12",
          minSelections: 0,
          maxSelections: 4,
          options: [
            { id: "card_puzzle_1", label: "Puzzle", value: "puzzle_1" },
            {
              id: "card_colonel_1",
              label: "Colonel Failure",
              value: "colonel_1",
            },
            { id: "card_syd_1", label: "Syd", value: "syd_1" },
            { id: "card_dreff_1", label: "Dr. Dreff", value: "dreff_1" },
          ],
        },
        {
          credits: 4,
          servers: [
            visibleServer("remote_1", [
              visibleRezCard("puzzle_1", "ice", 2),
              visibleRezCard("colonel_1", "ice", 17),
              visibleRezCard("syd_1", "asset", 0),
              visibleRezCard("dreff_1", "upgrade", 0),
            ]),
          ],
        },
      ),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_puzzle_1", "card_syd_1", "card_dreff_1"],
    });
  });

  it("declines an optional Data Fort Reclamation rez choice when no card is affordable", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source:
            "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:12",
          minSelections: 0,
          maxSelections: 1,
          options: [
            {
              id: "card_colonel_1",
              label: "Colonel Failure",
              value: "colonel_1",
            },
          ],
        },
        {
          credits: 0,
          servers: [
            visibleServer("remote_1", [
              visibleRezCard("colonel_1", "ice", 17),
            ]),
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

  it("uses regular Corp credits after temporary rez credits", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice(
        {
          kind: "select_cards",
          source:
            "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:12",
          minSelections: 0,
          maxSelections: 2,
          options: [
            { id: "card_ice_1", label: "ICE A", value: "ice_1" },
            { id: "card_ice_2", label: "ICE B", value: "ice_2" },
          ],
        },
        {
          credits: 3,
          servers: [
            visibleServer("remote_1", [
              visibleRezCard("ice_1", "ice", 8),
              visibleRezCard("ice_2", "ice", 5),
            ]),
          ],
        },
      ),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["card_ice_1", "card_ice_2"],
    });
  });
});

function inputWithChoice(
  choice: {
    kind: "select_option" | "select_cards";
    source?: string;
    minSelections: number;
    maxSelections: number;
    options?: Array<{ id: string; label: string; value?: string }>;
  },
  options: {
    gripOrHq?: AiDecisionInput["playerView"]["own"]["gripOrHq"];
    credits?: number;
    servers?: AiDecisionInput["playerView"]["servers"];
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits: options.credits ?? 5,
        gripOrHq: options.gripOrHq ?? [],
      },
      servers: options.servers ?? [],
      pendingChoice: {
        choiceId: "choice_multi",
        side: "corp",
        source: choice.source ?? "card_implementation.agenda_purge_install_targets:test",
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
    },
  } as unknown as AiDecisionInput;
}

function visibleRezCard(
  instanceId: string,
  type: "asset" | "ice" | "upgrade",
  rezCost: number,
): AiDecisionInput["playerView"]["servers"][number]["ice"][number] {
  return {
    instanceId,
    known: true,
    type,
    rezCost,
  } as AiDecisionInput["playerView"]["servers"][number]["ice"][number];
}

function visibleServer(
  id: "remote_1",
  cards: AiDecisionInput["playerView"]["servers"][number]["ice"],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: "Remote 1",
    ice: cards.filter((card) => card.type === "ice"),
    root: cards.filter((card) => card.type !== "ice"),
  };
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

function resolveChoiceAction(): LegalAction {
  return {
    actionId: "corp.resolve_choice",
    side: "corp",
    type: "resolve_choice",
    label: "Resolve choice",
    costs: [],
  } as unknown as LegalAction;
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
    extractAiFeatures: () => ({}) as never,
    rolesForCardId: () => [],
  };
}
