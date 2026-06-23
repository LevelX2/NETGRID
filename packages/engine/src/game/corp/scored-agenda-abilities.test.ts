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
import type { ScoredAgendaActionProfile } from "../../mechanics/agenda-scoring";
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
  definitions?: Record<string, CardDefinition>;
  implementations?: Record<string, CardScoredAgendaImplementation>;
  profile?: ScoredAgendaActionProfile;
  counters?: Record<string, number>;
  activatedSourceId?: CardInstanceId;
};

function makeHost(input: HostInput = {}) {
  const definitions: Record<string, CardDefinition> = {
    ai_cfo: definition("ai_cfo", "agenda", "AI CFO"),
    retreat: definition("retreat", "agenda", "Corporate Retreat"),
    reveal: definition("reveal", "agenda", "Reveal Agenda"),
    stored: definition("stored", "agenda", "Stored Credits"),
    boon: definition(
      "onr_v1_192_corporate-boon",
      "agenda",
      "Corporate Boon",
    ),
    ...input.definitions,
  };
  const scoreArea =
    input.scoreArea ??
    (["ai_cfo", "retreat", "reveal", "stored", "boon"] as CardInstanceId[]);
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
    } as unknown as GameState["corp"],
    cardInstances,
    phase: "corp_action_phase",
    activeSide: "corp",
  } as ScoredAgendaAbilityHost["state"];
  const counters = new Map<string, number>(
    Object.entries(input.counters ?? {
      "retreat:mark": 1,
      "stored:power": 2,
    }),
  );
  const calls = {
    pushed: [] as CardInstanceId[],
    activated: 0,
    reveal: 0,
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
      isScoredRevealAgendaDefinition: (definitionId) => definitionId === "reveal",
    },
    actions: {
      createLegalAction: (side, type, label, source, costs, payload) =>
        ({ side, type, label, source, costs, payload }) as LegalAction,
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        counters.get(`${cardId}:${counterType}`) ?? 0,
      spendVisibleCardCounter: (cardId, counterType, amount) => {
        const key = `${cardId}:${counterType}`;
        counters.set(key, (counters.get(key) ?? 0) - amount);
        return { remainingCounters: counters.get(key) ?? 0 };
      },
    },
    credits: {
      gainCorpCredits: (amount) => {
        state.corp.credits += amount;
      },
    },
    actionProfiles: {
      scoredAgendaCounterCreditProfileForDefinition: (definitionId) =>
        input.profile?.sourceDefinitionId === definitionId
          ? input.profile
          : undefined,
      scoredAgendaCounterCreditProfileForPayload: (definitionId) =>
        input.profile?.sourceDefinitionId === definitionId
          ? input.profile
          : undefined,
      scoredAgendaCounterCreditPayload: (profile, cardId) => ({
        cardId,
        agendaAbility: profile.agendaAbility,
        removePowerCounterAmount: profile.removeCounterAmount,
        gainCreditsAmount: profile.creditGain,
      }),
    },
    callbacks: {
      pushActivatedCardImplementationActions: (actions, cardId) => {
        calls.pushed.push(cardId);
        if (cardId === input.activatedSourceId) {
          actions.push({
            side: "corp",
            type: "activated_card_ability",
            abilityRef: { sourceCardInstanceId: cardId, abilityId: "a1" },
          } as LegalAction);
        }
      },
      resolveActivatedCardImplementationAbility: () => {
        calls.activated += 1;
        return true;
      },
      revealCorpRdTop: () => {
        calls.reveal += 1;
      },
      resolveAiChiefFinancialOfficer: (sourceCardId) => {
        calls.aiCfo.push(sourceCardId);
      },
    },
  };
  return { host, calls };
}

const storedProfile: ScoredAgendaActionProfile = {
  profileId: "stored",
  sourceDefinitionId: "stored",
  agendaAbility: "stored_take_credits",
  side: "corp",
  clickCost: 1,
  counterType: "power",
  removeCounterAmount: 1,
  creditGain: 3,
  label: "3 Credits nehmen",
};

describe("scored agenda activated abilities", () => {
  it("builds scored-area LegalActions with stable payloads", () => {
    const { host, calls } = makeHost({
      profile: storedProfile,
      activatedSourceId: "boon" as CardInstanceId,
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

    expect(calls.pushed).toEqual(["boon"]);
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "ai_chief_financial_officer",
    );
    expect(
      actions.find(
        (action) =>
          action.payload?.agendaAbility === "ai_chief_financial_officer",
      )?.label,
    ).toBe("HQ/Archives in R&D mischen, 5 ziehen");
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "scored_agenda_credit_until_install_or_rez",
    );
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "v1919_scored_agenda_reveal_rd_top",
    );
    expect(actions.map((action) => action.payload?.agendaAbility)).toContain(
      "stored_take_credits",
    );
    expect(actions.some((action) => action.type === "activated_card_ability")).toBe(
      true,
    );
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

  it("delegates AI CFO execution to the corp-zone handler", () => {
    const action = legalAction("gain_credit", {
      cardId: "ai_cfo",
      agendaAbility: "ai_chief_financial_officer",
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

  it("handles stored-credit scored agenda actions", () => {
    const action = legalAction("gain_credit", {
      cardId: "stored",
      agendaAbility: "stored_take_credits",
      removePowerCounterAmount: 1,
      gainCreditsAmount: 3,
    });
    const { host } = makeHost({ legalAction: action, profile: storedProfile });

    const result = handleScoredAgendaActivatedAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.credits).toBe(3);
    expect(action.payload).toMatchObject({
      spentPowerCounters: 1,
      gainedCredits: 3,
      remainingPowerCounters: 1,
    });
  });

  it("delegates CardImplementation scored agenda abilities", () => {
    const action = {
      side: "corp",
      type: "activated_card_ability",
      abilityRef: { sourceCardInstanceId: "boon", abilityId: "boon" },
      payload: { cardId: "boon" },
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
      activatedSourceId: "netwatch" as CardInstanceId,
    });

    expect(buildScoredAgendaAbilityActions(host)).toEqual([]);
    expect(calls.pushed).toEqual([]);
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
