import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleCorpZoneChoice,
  resolveAiChiefFinancialOfficer,
  resolveReschedulerHqShuffleDraw,
  startCorporateDownsizingScoreChoice,
  startCorporateNegotiatingCenterChoice,
  type CorpZoneChoiceHandlerHost,
} from "./corp-zone-choice-handlers";

const cncDefinitionId = "corp_negotiating_center" as CardDefinitionId;
const downsizingDefinitionId = "corporate_downsizing" as CardDefinitionId;
const aiCfoDefinitionId = "ai_cfo" as CardDefinitionId;

function definition(
  id: string,
  type: CardDefinition["type"],
  title = id,
  agendaPoints?: number,
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    type,
    title,
    ...(agendaPoints === undefined ? {} : { agendaPoints }),
  } as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId: CardDefinitionId = cardId as unknown as CardDefinitionId,
): CardInstance {
  return {
    id: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  } as unknown as CardInstance;
}

function playerAction(optionIds: string[]): PlayerAction {
  return {
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function selectCardsChoice(
  source: string,
  ids: CardInstanceId[],
): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "corp",
    source,
    prompt: "Choice",
    kind: "select_cards",
    options: ids.map((cardId) => ({
      id: `card_${cardId}`,
      label: cardId,
      value: cardId,
      publicLabel: "HQ-Agenda",
    })),
    minSelections: 0,
    maxSelections: ids.length,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };
}

function makeHost(input: {
  hq?: CardInstanceId[];
  rd?: CardInstanceId[];
  archives?: CardInstanceId[];
  scoreArea?: CardInstanceId[];
  rezzedRoot?: CardInstanceId[];
  pendingChoice?: ChoiceRequest;
  playerAction?: PlayerAction;
  definitions?: Record<string, CardDefinition>;
  scoredKinds?: Record<string, string>;
  scoredDrawCounts?: Record<string, number>;
  hasImplementation?: Set<CardDefinitionId>;
  shuffleInputs?: Array<{ ids: CardInstanceId[]; purpose: string }>;
  drawCalls?: number[];
} = {}): CorpZoneChoiceHandlerHost {
  const definitions: Record<string, CardDefinition> = {
    cnc_source: definition(cncDefinitionId, "asset", "Corporate Negotiating Center"),
    downsizing_source: definition(
      downsizingDefinitionId,
      "agenda",
      "Corporate Downsizing",
      2,
    ),
    ai_cfo_source: definition(aiCfoDefinitionId, "agenda", "AI CFO", 2),
    hq_agenda_1: definition("agenda_alpha", "agenda", "Agenda Alpha", 2),
    hq_agenda_2: definition("agenda_beta", "agenda", "Agenda Beta", 3),
    hq_operation: definition("operation_alpha", "operation", "Operation Alpha"),
    rd_1: definition("rd_alpha", "operation", "R&D Alpha"),
    archives_1: definition("archives_alpha", "operation", "Archives Alpha"),
    ...input.definitions,
  };
  const allIds = [
    ...(input.hq ?? []),
    ...(input.rd ?? []),
    ...(input.archives ?? []),
    ...(input.scoreArea ?? []),
    ...(input.rezzedRoot ?? []),
  ];
  const cardInstances: Record<string, CardInstance> = Object.fromEntries(
    allIds.map((cardId) => [
      cardId,
      instance(cardId, definitions[cardId]?.id ?? (cardId as CardDefinitionId)),
    ]),
  );
  const legalAction = { side: "corp", payload: {} } as LegalAction;
  const state = {
    stateVersion: 7,
    randomCounter: 2,
    pendingChoice: input.pendingChoice,
    cardInstances,
    corp: {
      credits: 4,
      hq: input.hq ?? [],
      rd: input.rd ?? [],
      archives: input.archives ?? [],
      scoreArea: input.scoreArea ?? [],
    },
  } as unknown as CorpZoneChoiceHandlerHost["state"];
  const shuffleInputs = input.shuffleInputs ?? [];
  const drawCalls = input.drawCalls ?? [];
  return {
    state,
    legalAction,
    ...(input.playerAction ? { playerAction: input.playerAction } : {}),
    constants: {
      corpHqAgendaRevealCardId: cncDefinitionId,
    },
    cards: {
      definitionFor: (cardId) => definitions[cardId] ?? definition(cardId, "operation"),
      hasCardImplementation: (definitionId) =>
        input.hasImplementation?.has(definitionId) ?? false,
      mustInstance: (cardId) => {
        const found = cardInstances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
      scoredAgendaKind: (cardId) => input.scoredKinds?.[cardId],
      scoredAgendaDrawCount: (cardId) => input.scoredDrawCounts?.[cardId] ?? 5,
    },
    zones: {
      rezzedCorpRootCardIds: () => input.rezzedRoot ?? [],
      shuffleCorpRnd: (ids, purpose) => {
        shuffleInputs.push({ ids: ids.slice(), purpose });
        state.randomCounter += 1;
        return ids.slice();
      },
    },
    credits: {
      gainCorpCredits: (amount) => {
        state.corp.credits += amount;
      },
    },
    draw: {
      drawCorpCards: (amount) => {
        drawCalls.push(amount);
        const drawn = state.corp.rd.splice(0, amount);
        state.corp.hq.push(...drawn);
      },
    },
  };
}

describe("corp zone choice handlers", () => {
  it("starts Corporate Negotiating Center with hidden HQ agenda options", () => {
    const host = makeHost({
      hq: ["hq_agenda_2", "hq_operation", "hq_agenda_1"] as CardInstanceId[],
      rezzedRoot: ["cnc_source"] as CardInstanceId[],
    });

    startCorporateNegotiatingCenterChoice(host);

    expect(host.state.pendingChoice?.source).toBe(
      "v1917.corp_negotiating_center:cnc_source:8",
    );
    expect(host.state.pendingChoice?.options.map((option) => option.value)).toEqual([
      "hq_agenda_1",
      "hq_agenda_2",
    ]);
    expect(host.state.pendingChoice?.options[0]?.publicLabel).toBe("HQ-Agenda");
  });

  it("resolves Corporate Negotiating Center without leaking unselected HQ cards", () => {
    const host = makeHost({
      hq: ["hq_agenda_1", "hq_agenda_2"] as CardInstanceId[],
      rezzedRoot: ["cnc_source"] as CardInstanceId[],
      pendingChoice: selectCardsChoice(
        "v1917.corp_negotiating_center:cnc_source:8",
        ["hq_agenda_1", "hq_agenda_2"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_hq_agenda_1"]),
    });

    const result = handleCorpZoneChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.credits).toBe(5);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1917_corporate_negotiating_center_hq_agenda_reveal",
      revealedCount: 1,
      gainedCredits: 1,
      publicRevealDefinitionIds: "agenda_alpha",
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("hq_agenda_2");
  });

  it("rejects Corporate Negotiating Center non-agenda selections", () => {
    const host = makeHost({
      hq: ["hq_operation"] as CardInstanceId[],
      rezzedRoot: ["cnc_source"] as CardInstanceId[],
      pendingChoice: selectCardsChoice(
        "v1917.corp_negotiating_center:cnc_source:8",
        ["hq_operation"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_hq_operation"]),
    });

    expect(() => handleCorpZoneChoice(host)).toThrow(
      "Corporate Negotiating Center darf nur HQ-Agenden zeigen.",
    );
  });

  it("starts and resolves Corporate Downsizing agenda reveal and R&D shuffle", () => {
    const shuffleInputs: Array<{ ids: CardInstanceId[]; purpose: string }> = [];
    const host = makeHost({
      hq: ["hq_agenda_1", "hq_agenda_2"] as CardInstanceId[],
      rd: ["rd_1"] as CardInstanceId[],
      scoreArea: ["downsizing_source"] as CardInstanceId[],
      scoredKinds: { downsizing_source: "corporate_downsizing_hq_agendas" },
      shuffleInputs,
    });

    startCorporateDownsizingScoreChoice(host, {
      sourceCardId: "downsizing_source" as CardInstanceId,
      creditPerAgendaPoint: 2,
    });
    expect(host.state.pendingChoice?.source).toBe(
      "p3_50.corporate_downsizing:downsizing_source:2:8",
    );

    host.playerAction = playerAction(["card_hq_agenda_1", "card_hq_agenda_2"]);
    const result = handleCorpZoneChoice(host);

    expect(result.handled).toBe(true);
    expect(result.combinedAgendaPoints).toBe(5);
    expect(result.gainedCredits).toBe(10);
    expect(host.state.corp.credits).toBe(14);
    expect(host.state.corp.hq).toEqual([]);
    expect(shuffleInputs).toEqual([
      {
        ids: ["rd_1", "hq_agenda_1", "hq_agenda_2"],
        purpose: "p3_50.corporate_downsizing.hq_agendas_into_rd.downsizing_source.8",
      },
    ]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "corporate_downsizing_hq_agendas",
      shownCardDefinitionIds: "agenda_alpha,agenda_beta",
      shownCount: 2,
      shuffledIntoRndCount: 2,
      combinedAgendaPoints: 5,
      gainedCredits: 10,
      randomCounterAfter: 3,
    });
  });

  it("rejects Corporate Downsizing selections outside HQ agendas", () => {
    const host = makeHost({
      hq: ["hq_agenda_1"] as CardInstanceId[],
      scoreArea: ["downsizing_source"] as CardInstanceId[],
      scoredKinds: { downsizing_source: "corporate_downsizing_hq_agendas" },
      pendingChoice: selectCardsChoice(
        "p3_50.corporate_downsizing:downsizing_source:2:8",
        ["hq_operation"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_hq_operation"]),
    });

    expect(() => handleCorpZoneChoice(host)).toThrow(
      "Corporate Downsizing darf nur HQ-Agenden zeigen.",
    );
  });

  it("resolves Rescheduler with HQ count, shuffle callback, and draw callback", () => {
    const shuffleInputs: Array<{ ids: CardInstanceId[]; purpose: string }> = [];
    const drawCalls: number[] = [];
    const host = makeHost({
      hq: ["hq_agenda_1", "hq_operation"] as CardInstanceId[],
      rd: ["rd_1"] as CardInstanceId[],
      shuffleInputs,
      drawCalls,
    });

    const result = resolveReschedulerHqShuffleDraw(
      host,
      "rescheduler_source" as CardInstanceId,
    );

    expect(result.handled).toBe(true);
    expect(drawCalls).toEqual([2]);
    expect(shuffleInputs[0]).toEqual({
      ids: ["rd_1", "hq_agenda_1", "hq_operation"],
      purpose: "v1917.rescheduler.hq_into_rd.rescheduler_source.8",
    });
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1917_rescheduler_hq_shuffle_draw",
      hqCardCount: 2,
      drawnCount: 2,
      randomCounterAfter: 3,
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("hq_agenda_1");
  });

  it("resolves AI CFO with HQ/Archives counts and draw five", () => {
    const shuffleInputs: Array<{ ids: CardInstanceId[]; purpose: string }> = [];
    const drawCalls: number[] = [];
    const host = makeHost({
      hq: ["hq_agenda_1"] as CardInstanceId[],
      rd: ["rd_1"] as CardInstanceId[],
      archives: ["archives_1"] as CardInstanceId[],
      scoredKinds: {
        ai_cfo_source: "ai_cfo_shuffle_hq_archives_into_rd_draw",
      },
      scoredDrawCounts: { ai_cfo_source: 5 },
      shuffleInputs,
      drawCalls,
    });

    const result = resolveAiChiefFinancialOfficer(
      host,
      "ai_cfo_source" as CardInstanceId,
    );

    expect(result.handled).toBe(true);
    expect(result.sourceZoneCounts).toEqual({ hq: 1, archives: 1 });
    expect(drawCalls).toEqual([5]);
    expect(shuffleInputs[0]).toEqual({
      ids: ["rd_1", "hq_agenda_1", "archives_1"],
      purpose: "v192.shuffle.ai_cfo.hq_archives_into_rd.8",
    });
    expect(host.state.corp.archives).toEqual([]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd",
      shuffledCardsCount: 2,
      drawnCardsCount: 3,
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("archives_1");
  });
});
