import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import {
  buildScoredAgendaAbilityActions,
  handleScoredAgendaActivatedAbilityAction,
  type ScoredAgendaAbilityHost,
} from "./scored-agenda-abilities";

function definition(
  id: string,
  type: CardDefinition["type"] = "agenda",
  title = id,
): CardDefinition {
  return { id: id as CardDefinitionId, type, title } as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId = cardId as unknown as CardDefinitionId,
): CardInstance {
  return {
    id: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "scoreArea" },
  } as unknown as CardInstance;
}

function legalAction(
  type: LegalAction["type"],
  payload: Record<string, unknown> = {},
): LegalAction {
  return { side: "corp", type, payload } as unknown as LegalAction;
}

type HostInput = {
  legalAction?: LegalAction;
  scoreArea?: CardInstanceId[];
  rd?: CardInstanceId[];
  hq?: CardInstanceId[];
  archives?: CardInstanceId[];
  definitions?: Record<string, CardDefinition>;
  implementations?: Record<string, CardScoredAgendaImplementation>;
  counters?: Record<string, number>;
  activatedSourceId?: CardInstanceId;
};

function makeHost(input: HostInput = {}) {
  const definitions: Record<string, CardDefinition> = {
    ai_cfo: definition("ai_cfo", "agenda", "HQ/Archives-Shuffle-Draw"),
    retreat: definition("retreat", "agenda", "Corporate Retreat"),
    boon: definition("onr_v1_192_corporate-boon", "agenda", "Corporate Boon"),
    ...input.definitions,
  };
  const scoreArea =
    input.scoreArea ?? (["ai_cfo", "retreat", "boon"] as CardInstanceId[]);
  const cardInstances: Record<string, CardInstance> = Object.fromEntries(
    scoreArea.map((cardId) => [
      cardId,
      instance(cardId, definitions[cardId]?.id ?? (cardId as CardDefinitionId)),
    ]),
  );
  const state = {
    corp: {
      credits: 0,
      scoreArea,
      rd: input.rd ?? ["rd_1" as CardInstanceId],
      hq: input.hq ?? [],
      archives: input.archives ?? [],
      servers: [],
    } as unknown as GameState["corp"],
    cardInstances,
    phase: "corp_action_phase",
    activeSide: "corp",
    stateVersion: 7,
    timingPoint: "corp_action.main",
  } as ScoredAgendaAbilityHost["state"];
  const counters = new Map<string, number>(
    Object.entries(
      input.counters ?? {
        "retreat:mark": 1,
      },
    ),
  );
  const calls = {
    pushed: [] as CardInstanceId[],
    activated: 0,
    aiCfo: [] as CardInstanceId[],
  };
  const host: ScoredAgendaAbilityHost = {
    state,
    ...(input.legalAction ? { legalAction: input.legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitions[cardId]!,
      scoredAgendaKindForDefinition: (cardDefinition) =>
        input.implementations?.[cardDefinition.id]?.kind,
      scoredAgendaForDefinition: (cardDefinition) =>
        input.implementations?.[cardDefinition.id],
    },
    actions: {
      createLegalAction: (side, type, label, source, costs, payload) =>
        ({
          actionId: `${side}.${type}.${source}`,
          side,
          type,
          label,
          source,
          costs,
          payload,
          timingPoint: state.timingPoint,
          expiresAtStateVersion: state.stateVersion,
        }) as LegalAction,
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        counters.get(`${cardId}:${counterType}`) ?? 0,
    },
    credits: {
      gainCorpCredits: (amount) => {
        state.corp.credits += amount;
      },
    },
    callbacks: {
      pushActivatedCardImplementationActions: (actions, cardId) => {
        calls.pushed.push(cardId);
        if (cardId === input.activatedSourceId) {
          actions.push({
            side: "corp",
            type: "activated_card_ability",
            abilityRef: {
              sourceCardInstanceId: cardId,
              sourceAbilityId: "test_card:a1",
            },
          } as LegalAction);
        }
      },
      pushActivatedCardImplementationRunActions: (actions, cardId) => {
        calls.pushed.push(cardId);
        if (cardId === input.activatedSourceId) {
          actions.push({
            side: "corp",
            type: "activated_card_ability",
            abilityRef: {
              sourceCardInstanceId: cardId,
              sourceAbilityId: "test_card:a1",
            },
          } as LegalAction);
        }
      },
      resolveActivatedCardImplementationAbility: () => {
        calls.activated += 1;
        return true;
      },
      resolveHqArchivesShuffleDraw: (sourceCardId) => {
        calls.aiCfo.push(sourceCardId);
      },
    },
  };
  return { host, calls };
}

describe("scored agenda activated abilities", () => {
  it("builds scored-area LegalActions with stable payloads", () => {
    const { host, calls } = makeHost({
      activatedSourceId: "boon" as CardInstanceId,
      hq: ["hq_1", "hq_2"] as CardInstanceId[],
      archives: ["archives_1"] as CardInstanceId[],
      rd: ["rd_1", "rd_2"] as CardInstanceId[],
      implementations: {
        ai_cfo: {
          kind: "shuffle_hq_archives_into_rd_then_draw",
          drawCount: 5,
          visibility: "hidden_info_barrier",
        },
        retreat: {
          kind: "scored_agenda_credit_until_install_or_rez",
          counterType: "mark",
          gainAmount: 2,
          visibility: "public",
        },
      },
    });

    const actions = buildScoredAgendaAbilityActions(host);

    expect(calls.pushed).toEqual([
      "ai_cfo",
      "boon",
      "retreat",
    ]);
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "hq_archives_shuffle_draw",
    );
    expect(
      actions.find(
        (action) =>
          action.payload?.agendaAbility === "hq_archives_shuffle_draw",
      )?.payload,
    ).toMatchObject({
      corpZoneTransitionProjectionComplete: true,
      corpZoneTransitionProjectionKind: "shuffle_hq_archives_into_rd_then_draw",
      corpZoneTransitionProjectionGrossDrawCount: 5,
      corpZoneTransitionProjectionHqCardsRecycledBeforeDrawCount: 2,
      corpZoneTransitionProjectionArchivesCardsRecycledBeforeDrawCount: 1,
      corpZoneTransitionProjectionNetHqDelta: 3,
      corpZoneTransitionProjectionNetRdDelta: -2,
      corpZoneTransitionProjectionNetRdConsumption: 2,
    });
    expect(
      actions.find(
        (action) =>
          action.payload?.agendaAbility === "hq_archives_shuffle_draw",
      )?.label,
    ).toBe("HQ/Archives in R&D mischen, 5 ziehen");
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "scored_agenda_credit_until_install_or_rez",
    );
    expect(
      actions.some((action) => action.type === "activated_card_ability"),
    ).toBe(true);
  });

  it("handles Corporate Retreat credit execution", () => {
    const action = legalAction("gain_credit", {
      cardId: "retreat",
      agendaAbility: "scored_agenda_credit_until_install_or_rez",
      gainCreditsAmount: 2,
    });
    const { host } = makeHost({
      legalAction: action,
      implementations: {
        retreat: {
          kind: "scored_agenda_credit_until_install_or_rez",
          counterType: "mark",
          gainAmount: 2,
          visibility: "public",
        },
      },
    });

    const result = handleScoredAgendaActivatedAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.credits).toBe(2);
    expect(action.payload).toMatchObject({
      gainedCredits: 2,
      corpCreditsAfter: 2,
    });
  });

  it("delegates HQ/Archives-Shuffle-Draw execution to the corp-zone handler", () => {
    const action = legalAction("gain_credit", {
      cardId: "ai_cfo",
      agendaAbility: "hq_archives_shuffle_draw",
      drawCardsAmount: 5,
    });
    const { host, calls } = makeHost({
      legalAction: action,
      implementations: {
        ai_cfo: {
          kind: "shuffle_hq_archives_into_rd_then_draw",
          drawCount: 5,
          visibility: "hidden_info_barrier",
        },
      },
    });

    const result = handleScoredAgendaActivatedAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(calls.aiCfo).toEqual(["ai_cfo"]);
    expect(result.drawCount).toBe(5);
  });

  it("delegates CardImplementation scored agenda abilities", () => {
    const action = {
      side: "corp",
      type: "activated_card_ability",
      abilityRef: { sourceCardInstanceId: "boon", abilityId: "boon" },
      payload: {
        cardId: "boon",
        cardImplementationAbility: "activated",
      },
    } as unknown as LegalAction;
    const { host, calls } = makeHost({ legalAction: action });

    const result = handleScoredAgendaActivatedAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(calls.activated).toBe(1);
  });

  it("leaves trace and damage agenda abilities outside this boundary", () => {
    const action = {
      side: "corp",
      type: "activated_card_ability",
      abilityRef: { sourceCardInstanceId: "netwatch", abilityId: "trace" },
      payload: {
        cardId: "netwatch",
        agendaAbility: "trace_to_tag",
      },
    } as unknown as LegalAction;
    const { host } = makeHost({
      legalAction: action,
      scoreArea: ["netwatch" as CardInstanceId],
      definitions: {
        netwatch: definition(
          "onr_v1_207_netwatch-operations-office",
          "agenda",
          "Netwatch Operations Office",
        ),
      },
    });

    expect(handleScoredAgendaActivatedAbilityAction(host).handled).toBe(false);
  });

  it("does not build trace and damage agenda LegalActions inside this boundary", () => {
    const { host, calls } = makeHost({
      scoreArea: ["netwatch" as CardInstanceId],
      definitions: {
        netwatch: definition(
          "onr_v1_207_netwatch-operations-office",
          "agenda",
          "Netwatch Operations Office",
        ),
      },
    });

    expect(buildScoredAgendaAbilityActions(host)).toEqual([]);
    expect(calls.pushed).toEqual(["netwatch"]);
  });

  it("ignores unrelated agendaAbility payloads", () => {
    const action = legalAction("gain_credit", {
      cardId: "netwatch",
      agendaAbility: "trace_to_tag",
    });
    const { host } = makeHost({ legalAction: action });

    expect(handleScoredAgendaActivatedAbilityAction(host).handled).toBe(false);
  });
});
