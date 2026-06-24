import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  isScoredAgendaFreeRezChoiceSource,
  resolveScoredAgendaFreeRezChoice,
  startScoredAgendaFreeRezChoice,
} from "./scored-agenda-free-rez-sequence";
import type { CorpInstallRezSequenceHandlerHost } from "./scored-agenda-sequence-host";

describe("priority requisition sequence routing", () => {
  it("recognizes priority requisition choice sources", () => {
    expect(
      isScoredAgendaFreeRezChoiceSource(
        "card_implementation.scored_agenda_free_rez:priority_agenda:8",
      ),
    ).toBe(true);
    expect(
      isScoredAgendaFreeRezChoiceSource(
        "card_implementation.agenda_purge_install_targets:agenda_purge_agenda:ice_1:8",
      ),
    ).toBe(false);
  });

  it("uses actor-private labels but public option labels for free-rez candidates", () => {
    const host = makeScoredAgendaFreeRezHost();

    startScoredAgendaFreeRezChoice(host, "priority_agenda" as CardInstanceId);

    expect(host.state.pendingChoice?.options).toMatchObject([
      {
        label: "Archer",
        publicLabel: "Installiertes ICE",
        value: "ice_1",
      },
      { label: "Überspringen", publicLabel: "Überspringen" },
    ]);
    expect(host.legalAction.payload).toMatchObject({
      scoredAgendaFreeRezChoiceOpened: true,
      scoredAgendaFreeRezCandidateCount: 1,
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("Archer");
  });

  it("resolves the selected ICE at no cost with explicit waived-cost payload", () => {
    const host = makeScoredAgendaFreeRezHost({
      pendingChoice: selectChoice(["ice_1" as CardInstanceId]),
      playerAction: {
        selectedChoices: { selectedOptionIds: ["card_ice_1"] },
      } as unknown as PlayerAction,
    });

    const result = resolveScoredAgendaFreeRezChoice(host);

    expect(result.rezzedCardIds).toEqual(["ice_1"]);
    expect(host.state.cardInstances.ice_1?.rezzed).toBe(true);
    expect(host.state.corp.credits).toBe(5);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "scored_agenda_free_rez",
      scoredAgendaFreeRezFreeRez: true,
      scoredAgendaFreeRezTarget: "ice_1",
      scoredAgendaFreeRezTargetDefinitionId: "ice_1_def",
      rezCostPaid: 0,
    });
  });
});

type ScoredAgendaFreeRezHostInput = {
  pendingChoice?: ChoiceRequest;
  playerAction?: PlayerAction;
};

function makeScoredAgendaFreeRezHost(
  input: ScoredAgendaFreeRezHostInput = {},
): CorpInstallRezSequenceHandlerHost {
  const server = {
    id: "remote_1",
    label: "Remote 1",
    kind: "remote",
    ice: ["ice_1" as CardInstanceId],
    root: [],
  } as CorpServer;
  const definitions: Record<string, CardDefinition> = {
    ice_1: {
      id: "ice_1_def" as CardDefinitionId,
      type: "ice",
      title: "Archer",
      rezCost: 7,
    } as CardDefinition,
    priority_agenda: {
      id: "priority_agenda_def" as CardDefinitionId,
      type: "agenda",
      title: "Priority Requisition",
    } as CardDefinition,
  };
  const iceInstance = {
    id: "ice_1" as CardInstanceId,
    definitionId: "ice_1_def" as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
  } as unknown as CardInstance;
  const instances: Record<string, CardInstance> = { ice_1: iceInstance };
  const state = {
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: ["priority_agenda" as CardInstanceId],
      servers: [server],
    },
    cardInstances: { ice_1: iceInstance },
    pendingChoice: input.pendingChoice,
    stateVersion: 7,
  };
  return {
    state: {
      ...state,
    },
    legalAction: { side: "corp", payload: {}, costs: [] } as never,
    playerAction: input.playerAction,
    cards: {
      definitionFor: (cardId: CardInstanceId) =>
        definitions[cardId] ?? definitions.ice_1,
      mustInstance: (cardId: CardInstanceId) => {
        const instance = instances[cardId];
        if (!instance) throw new Error(`missing ${cardId}`);
        return instance;
      },
      scoredAgendaKind: (cardId: CardInstanceId) =>
        cardId === "priority_agenda"
          ? "score_rez_installed_ice_at_no_cost"
          : undefined,
      scoredAgendaForCard: () => undefined,
      isCorpInstallableCardType: () => false,
      canInstallCorpRootCardInServer: () => false,
      isRegionUpgrade: () => false,
      rootInstallRezzesOnInstall: () => false,
      rezCostForCard: () => 7,
      isScoredAgendaFreeRezCandidate: (cardId: CardInstanceId) =>
        cardId === "ice_1",
    },
    zones: {
      removeFromAllZones: () => undefined,
      moveCardToArchivesFaceup: () => undefined,
    },
    servers: {
      createRemote: () => server,
      mustServer: () => server,
      trashOlderRegionUpgradesInServer: () => undefined,
    },
    credits: {
      spendCorpCredits: (amount: number) => {
        state.corp.credits -= amount;
      },
    },
    callbacks: {
      resolveCorpRootRez: () => undefined,
    },
  } as unknown as CorpInstallRezSequenceHandlerHost;
}

function selectChoice(cardIds: CardInstanceId[]): ChoiceRequest {
  return {
    choiceId: "choice_priority",
    side: "corp",
    source: "card_implementation.scored_agenda_free_rez:priority_agenda:8",
    prompt: "Priority Requisition",
    kind: "select_cards",
    options: cardIds.map((cardId) => ({
      id: `card_${cardId}`,
      label: "Archer",
      publicLabel: "Installiertes ICE",
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };
}
