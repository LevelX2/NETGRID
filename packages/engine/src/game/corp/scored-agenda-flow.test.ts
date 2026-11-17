import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import {
  handleScoredAgendaFlowChoice,
  scoreAgenda,
  startScoredAgendaStartDrawChoice,
} from "./scored-agenda-flow";
import type { ScoredAgendaFlowHost } from "./scored-agenda/scored-agenda-flow-host";

function definition(
  id: number,
  type: CardDefinition["type"],
  title = String(id),
  subtypes: string[] = [],
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    type,
    title,
    subtypes,
  } as unknown as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId = cardId as unknown as CardDefinitionId,
  zone: CardInstance["zone"] = { side: "corp", zone: "hq" },
): CardInstance {
  return {
    id: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    zone,
  } as unknown as CardInstance;
}

function playerAction(optionIds: string[]): PlayerAction {
  return {
    side: "corp",
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function makeLegalAction(payload: Record<string, unknown> = {}): LegalAction {
  return {
    side: "corp",
    type: "score_agenda",
    payload,
  } as unknown as LegalAction;
}

type MakeHostInput = {
  legalAction?: LegalAction;
  playerAction?: PlayerAction;
  pendingChoice?: ChoiceRequest;
  definitions?: Record<string, CardDefinition>;
  instances?: Record<string, CardInstance>;
  scoreArea?: CardInstanceId[];
  hq?: CardInstanceId[];
  rd?: CardInstanceId[];
  implementations?: Record<string, CardScoredAgendaImplementation>;
  effectiveDifficulty?: number;
  corpCredits?: number;
};

function makeHost(input: MakeHostInput = {}): ScoredAgendaFlowHost {
  const definitions: Record<string, CardDefinition> = {
    agenda_1: definition(1086434461, "agenda", "Agenda"),
    babylon: definition(1481016916, "agenda", "Project Babylon"),
    boon: definition(1170625995, "agenda", "Corporate Boon"),
    code_agenda: definition(3016177677, "agenda", "Encryption"),
    1160031270: definition(1160031270, "agenda", "Transmutation"),
    code_gate_1: definition(850286914, "ice", "Code Gate 1", ["code_gate"]),
    wall_1: definition(658277277, "ice", "Wall 1", ["wall"]),
    ice_1: {
      ...definition(3274351864, "ice", "ICE 1"),
      subroutines: [{ label: "End the run." }],
    } as unknown as CardDefinition,
    ...input.definitions,
  };
  const cardInstances: Record<string, CardInstance> = {
    agenda_1: {
      ...instance("agenda_1" as CardInstanceId, definitions.agenda_1!.id, {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1" as Exclude<ServerId, "new_remote">,
      }),
      advancementCounters: 3,
    },
    babylon: {
      ...instance("babylon" as CardInstanceId, definitions.babylon!.id, {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1" as Exclude<ServerId, "new_remote">,
      }),
      advancementCounters: 7,
    },
    code_gate_1: {
      ...instance(
        "code_gate_1" as CardInstanceId,
        definitions.code_gate_1!.id,
        {
          side: "corp",
          zone: "serverIce",
          serverId: "remote_1" as Exclude<ServerId, "new_remote">,
        },
      ),
      faceup: false,
      rezzed: false,
    },
    ice_1: {
      ...instance("ice_1" as CardInstanceId, definitions.ice_1!.id, {
        side: "corp",
        zone: "serverIce",
        serverId: "remote_1" as Exclude<ServerId, "new_remote">,
      }),
      faceup: true,
      rezzed: true,
    },
    ...input.instances,
  };
  const counters = new Map<string, number>();
  const removed: CardInstanceId[] = [];
  const employeeResolved: CardInstanceId[] = [];
  const callbacks = {
    dataFort: [] as CardInstanceId[],
    priority: [] as CardInstanceId[],
    downsizing: [] as Array<{
      cardId: CardInstanceId;
      creditPerAgendaPoint: number;
    }>,
    agendaPurge: 0,
    cleanup: 0,
  };
  const state = {
    corp: {
      credits: input.corpCredits ?? 0,
      scoreArea: input.scoreArea ?? [],
      hq: input.hq ?? [],
      rd: input.rd ?? [],
    } as unknown as GameState["corp"],
    cardInstances,
    stateVersion: 7,
    phase: "corp_action_phase",
    activeSide: "corp",
  } as ScoredAgendaFlowHost["state"];
  if (input.pendingChoice) state.pendingChoice = input.pendingChoice;
  return {
    state,
    ...(input.legalAction ? { legalAction: input.legalAction } : {}),
    ...(input.playerAction ? { playerAction: input.playerAction } : {}),
    cards: {
      definitionFor: (cardId) =>
        definitions[cardId] ??
        definitions[cardInstances[cardId]?.definitionId ?? ""]!,
      mustInstance: (cardId) => cardInstances[cardId]!,
      scoredAgendaForDefinition: (cardDefinition) =>
        input.implementations?.[cardDefinition.id],
      effectiveAgendaDifficulty: () => input.effectiveDifficulty ?? 3,
      hasSubtype: (cardDefinition, subtype) =>
        cardDefinition.subtypes?.includes(subtype) ?? false,
      effectiveHasSubtype: (cardId, subtype) => {
        const cardInstance = cardInstances[cardId];
        const cardDefinition =
          definitions[cardId] ?? definitions[cardInstance?.definitionId ?? ""];
        const subtypes =
          cardDefinition?.type === "ice" &&
          cardInstance?.rezzed &&
          cardInstance.variableIceState?.selectedSubtypes?.length
            ? cardInstance.variableIceState.selectedSubtypes
            : cardDefinition?.subtypes;
        return subtypes?.includes(subtype) ?? false;
      },
    },
    zones: {
      removeFromAllZones: (cardId) => removed.push(cardId),
      cleanupEmptyRemotes: () => {
        callbacks.cleanup += 1;
      },
      corpInstalledCardIds: () =>
        Object.keys(cardInstances)
          .filter((cardId) => cardInstances[cardId]?.zone.side === "corp")
          .sort() as CardInstanceId[],
      mustServer: () => ({}),
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) =>
        counters.set(`${cardId}:${counterType}`, amount),
      addCardCounter: (cardId, counterType, amount) =>
        counters.set(
          `${cardId}:${counterType}`,
          (counters.get(`${cardId}:${counterType}`) ?? 0) + amount,
        ),
      cardCounter: (cardId, counterType) =>
        counters.get(`${cardId}:${counterType}`) ?? 0,
    },
    credits: {
      gainCredits: (_side, amount) => {
        state.corp.credits += amount;
      },
      loseAllCorpCredits: () => {
        const lost = state.corp.credits;
        state.corp.credits = 0;
        return lost;
      },
    },
    flags: {
      markScoredBlackOpsAgendaThisTurn: () => undefined,
      scoredAgendaStartDrawChoiceResolvedSourceIds: () => employeeResolved,
      markScoredAgendaStartDrawChoiceResolved: (cardId) =>
        employeeResolved.push(cardId),
      markScoredAgendaStartDrawChoiceSelected: () => undefined,
    },
    effects: {
      executeOnScore: () => undefined,
      appendScoredAgendaStartDrawChoiceEffect: () => undefined,
    },
    draw: {
      drawCorpCard: () => {
        state.corp.rd.shift();
      },
    },
    choices: {
      startHqToNewRemoteInstallRez: (cardId) => callbacks.dataFort.push(cardId),
      startScoredAgendaFreeRez: (cardId) => callbacks.priority.push(cardId),
      startScoredAgendaHqShuffleCredits: (cardId, creditPerAgendaPoint) =>
        callbacks.downsizing.push({ cardId, creditPerAgendaPoint }),
      resolveAgendaPurge: () => {
        callbacks.agendaPurge += 1;
      },
    },
  };
}

describe("scored agenda flow", () => {
  it("moves a scored agenda through the score flow host", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({ legalAction });

    const result = scoreAgenda(host, "agenda_1" as CardInstanceId);

    expect(result.handled).toBe(true);
    expect(host.state.corp.scoreArea).toEqual(["agenda_1"]);
    expect(host.state.cardInstances.agenda_1?.zone).toEqual({
      side: "corp",
      zone: "scoreArea",
    });
    expect(host.state.cardInstances.agenda_1?.faceup).toBe(true);
    expect(host.state.cardInstances.agenda_1?.rezzed).toBe(true);
  });

  it("keeps Project Babylon overadvance bonus stable", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      effectiveDifficulty: 3,
      implementations: {
        1481016916: {
          kind: "overadvance_bonus_agenda_points",
          perExcessAdvancementCounters: 2,
          visibility: "public",
        },
      },
    });

    scoreAgenda(host, "babylon" as CardInstanceId);

    expect(legalAction.payload).toMatchObject({
      overadvanceBonusAgendaPointOveradvance: 4,
      overadvanceBonusAgendaPoints: 2,
    });
  });

  it("applies simple score-time credit and counter effects", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      instances: {
        boon: {
          ...instance(
            "boon" as CardInstanceId,
            1170625995 as CardDefinitionId,
            {
              side: "corp",
              zone: "serverRoot",
              serverId: "remote_1" as Exclude<ServerId, "new_remote">,
            },
          ),
          advancementCounters: 3,
        },
      },
      implementations: {
        1170625995: {
          kind: "add_counters_on_score",
          counterType: "boon",
          amount: 3,
          visibility: "public",
        },
      },
    });

    scoreAgenda(host, "boon" as CardInstanceId);

    expect(legalAction.payload).toMatchObject({
      counterType: "boon",
      addedCounterAmount: 3,
      remainingCounters: 3,
    });
  });

  it("starts and resolves scored subtype reveal choices without public hidden leaks", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      instances: {
        code_agenda: {
          ...instance(
            "code_agenda" as CardInstanceId,
            3016177677 as CardDefinitionId,
            {
              side: "corp",
              zone: "serverRoot",
              serverId: "remote_1" as Exclude<ServerId, "new_remote">,
            },
          ),
          advancementCounters: 3,
        },
      },
      implementations: {
        3016177677: {
          kind: "reveal_installed_ice_subtype_for_credits",
          subtype: "code_gate",
          creditPerRevealedOrRezzed: 2,
          visibility: "hidden_info_barrier",
        },
      },
    });
    scoreAgenda(host, "code_agenda" as CardInstanceId);
    expect(host.state.pendingChoice?.source).toContain(
      "scored_agenda.subtype_reveal",
    );
    const choice = host.state.pendingChoice!;
    expect(choice).toMatchObject({
      sourceCardInstanceId: "code_agenda",
      sourceCardDefinitionId: 3016177677,
    });
    const resolveHost = {
      ...host,
      playerAction: playerAction([choice.options[0]!.id]),
    };

    const result = handleScoredAgendaFlowChoice(resolveHost);

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.cardInstances.code_gate_1?.faceup).toBe(true);
    expect(legalAction.payload).toMatchObject({
      hiddenZoneAction: "scored_subtype_reveal_code_gates",
      revealedCount: 1,
      gainedCredits: 2,
      publicRevealDefinitionIds: "850286914",
    });
  });

  it.each(["99", "1.5", "NaN", "Infinity", "9007199254740992", ""])(
    "rejects a persisted scored subtype reveal credit rate %s before mutation",
    (persistedRate) => {
      const legalAction = makeLegalAction();
      const host = makeHost({
        legalAction,
        instances: {
          code_agenda: {
            ...instance(
              "code_agenda" as CardInstanceId,
              3016177677 as CardDefinitionId,
              {
                side: "corp",
                zone: "serverRoot",
                serverId: "remote_1" as Exclude<ServerId, "new_remote">,
              },
            ),
            advancementCounters: 3,
          },
        },
        implementations: {
          3016177677: {
            kind: "reveal_installed_ice_subtype_for_credits",
            subtype: "code_gate",
            creditPerRevealedOrRezzed: 2,
            visibility: "hidden_info_barrier",
          },
        },
      });
      scoreAgenda(host, "code_agenda" as CardInstanceId);
      const choice = host.state.pendingChoice!;
      const sourceParts = choice.source.split(":");
      sourceParts[3] = persistedRate;
      choice.source = sourceParts.join(":");
      const resolveHost = {
        ...host,
        playerAction: playerAction([]),
      };
      const stateBefore = structuredClone(host.state);
      const payloadBefore = structuredClone(legalAction.payload);

      expect(() => handleScoredAgendaFlowChoice(resolveHost)).toThrow(
        "runtime_invalid_scored_subtype_reveal_credit_rate",
      );
      expect(host.state).toEqual(stateBefore);
      expect(legalAction.payload).toEqual(payloadBefore);
    },
  );

  it("starts and resolves Ice Transmutation target choices", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      implementations: {
        1160031270: {
          kind: "select_rezzed_ice_mark_modifier",
          target: "rezzed_installed_ice",
          counterType: "mark",
          counterAmount: 1,
          strengthBonusPerCounter: 1,
          duplicateEachSelfProvidedSubroutinePerCounter: true,
          visibility: "public",
        },
      },
      instances: {
        transmutation_agenda: {
          ...instance(
            "transmutation_agenda" as CardInstanceId,
            1160031270 as CardDefinitionId,
            {
              side: "corp",
              zone: "serverRoot",
              serverId: "remote_1" as Exclude<ServerId, "new_remote">,
            },
          ),
          advancementCounters: 3,
        },
      },
    });
    scoreAgenda(host, "transmutation_agenda" as CardInstanceId);
    const choice = host.state.pendingChoice!;
    expect(choice.source).toContain(
      "card_implementation_primitive.select_rezzed_ice_mark_modifier",
    );
    expect(choice.visibility).toBe("public");
    expect(choice.options).toEqual([
      {
        id: "card_ice_1",
        label: "ICE 1",
        publicLabel: "ICE 1",
        value: "ice_1",
      },
    ]);
    expect(choice.prompt).toBe(
      "Scored Agenda: Rezzed ICE wählen. Das gewählte ICE bekommt +1 Stärke; jede Subroutine wird direkt nach ihrem ursprünglichen Platz einmal zusätzlich ausgeführt.",
    );
    expect(legalAction.payload).toMatchObject({
      cardImplementationAbilityId: "1160031270:scored_ice_mark:0",
      cardImplementationAbilityKey: "scored_ice_mark:0",
      cardImplementationPrimitiveKind: "select_rezzed_ice_mark_modifier",
      cardImplementationEffectKind: "mark_modifier",
      sourceCardId: "transmutation_agenda",
      sourceDefinitionId: 1160031270,
      cardImplementationTargetKind: "rezzed_installed_ice",
      eligibleIceCount: 1,
    });

    const result = handleScoredAgendaFlowChoice({
      ...host,
      playerAction: playerAction([choice.options[0]!.id]),
    });

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      cardImplementationAbilityId: "1160031270:scored_ice_mark:0",
      cardImplementationAbilityKey: "scored_ice_mark:0",
      cardImplementationPrimitiveKind: "select_rezzed_ice_mark_modifier",
      cardImplementationEffectKind: "mark_modifier",
      agendaAbility: "scored_rezzed_ice_mark_modifier",
      targetIceId: "ice_1",
      cardImplementationTargetKind: "rezzed_installed_ice",
      cardImplementationCounterType: "mark",
      strengthBonus: 1,
      cardImplementationDuplicateEachSelfProvidedSubroutinePerCounter: true,
    });
  });

  it("skips Ice Transmutation without leaking a pending choice when no rezzed ICE exists", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      implementations: {
        1160031270: {
          kind: "select_rezzed_ice_mark_modifier",
          target: "rezzed_installed_ice",
          counterType: "mark",
          counterAmount: 1,
          strengthBonusPerCounter: 1,
          duplicateEachSelfProvidedSubroutinePerCounter: true,
          visibility: "public",
        },
      },
      instances: {
        ice_1: {
          ...instance(
            "ice_1" as CardInstanceId,
            2394377751 as CardDefinitionId,
            {
              side: "corp",
              zone: "serverIce",
              serverId: "remote_1" as Exclude<ServerId, "new_remote">,
            },
          ),
          rezzed: false,
          faceup: false,
        },
        transmutation_agenda: {
          ...instance(
            "transmutation_agenda" as CardInstanceId,
            1160031270 as CardDefinitionId,
            {
              side: "corp",
              zone: "serverRoot",
              serverId: "remote_1" as Exclude<ServerId, "new_remote">,
            },
          ),
          advancementCounters: 3,
        },
      },
    });

    scoreAgenda(host, "transmutation_agenda" as CardInstanceId);

    expect(host.state.pendingChoice).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      cardImplementationPrimitiveKind: "select_rezzed_ice_mark_modifier",
      cardImplementationEffectKind: "mark_modifier",
      scoredAgendaPrimitiveSkippedReason: "no_rezzed_ice",
      scoredIceMarkModifierSkippedReason: "no_rezzed_ice",
    });
  });

  it("starts and resolves Employee Empowerment start-turn draw choices", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      rd: ["rd_1" as CardInstanceId],
      scoreArea: ["employee" as CardInstanceId],
      definitions: {
        4120022065: definition(4120022065, "agenda", "Employee Empowerment"),
      },
      instances: {
        employee: instance(
          "employee" as CardInstanceId,
          4120022065 as CardDefinitionId,
          { side: "corp", zone: "scoreArea" },
        ),
      },
      implementations: {
        4120022065: {
          kind: "corp_start_turn_optional_draw",
          drawCount: 1,
          visibility: "public",
        },
      },
    });

    const startResult = startScoredAgendaStartDrawChoice(host);
    expect(startResult.handled).toBe(true);
    const choice = host.state.pendingChoice!;
    host.state.phase = "corp_draw_phase";
    host.state.timingPoint = "corp_draw.mandatory_draw";

    const result = handleScoredAgendaFlowChoice({
      ...host,
      playerAction: playerAction([choice.options[0]!.id]),
    });

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      choiceVisibility: "public",
      sourceDefinitionId: 4120022065,
      scoredAgendaStartDrawDecision: "draw",
      selectedAdditionalDrawCount: 1,
    });
  });
});
