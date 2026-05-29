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
  startEmployeeEmpowermentStartDrawChoice,
  type ScoredAgendaFlowHost,
} from "./scored-agenda-flow";

function definition(
  id: string,
  type: CardDefinition["type"],
  title = id,
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
  overadvanceDefinitionIds?: string[];
  effectiveDifficulty?: number;
  corpCredits?: number;
};

function makeHost(input: MakeHostInput = {}): ScoredAgendaFlowHost {
  const definitions: Record<string, CardDefinition> = {
    agenda_1: definition("agenda_1_def", "agenda", "Agenda"),
    babylon: definition("project_babylon", "agenda", "Project Babylon"),
    boon: definition("corporate_boon", "agenda", "Corporate Boon"),
    code_agenda: definition("encryption_breakthrough", "agenda", "Encryption"),
    ice_transmutation: definition("ice_transmutation", "agenda", "Transmutation"),
    code_gate_1: definition("code_gate_1_def", "ice", "Code Gate 1", [
      "code_gate",
    ]),
    wall_1: definition("wall_1_def", "ice", "Wall 1", ["wall"]),
    ice_1: {
      ...definition("ice_1_def", "ice", "ICE 1"),
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
      ...instance("code_gate_1" as CardInstanceId, definitions.code_gate_1!.id, {
        side: "corp",
        zone: "serverIce",
        serverId: "remote_1" as Exclude<ServerId, "new_remote">,
      }),
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
    downsizing: [] as Array<{ cardId: CardInstanceId; creditPerAgendaPoint: number }>,
    securityPurge: 0,
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
        definitions[cardId] ?? definitions[cardInstances[cardId]?.definitionId ?? ""]!,
      mustInstance: (cardId) => cardInstances[cardId]!,
      scoredAgendaForDefinition: (cardDefinition) =>
        input.implementations?.[cardDefinition.id],
      effectiveAgendaDifficulty: () => input.effectiveDifficulty ?? 3,
      hasSubtype: (cardDefinition, subtype) =>
        cardDefinition.subtypes?.includes(subtype) ?? false,
      isOveradvanceAgendaDefinition: (definitionId) =>
        input.overadvanceDefinitionIds?.includes(definitionId) ?? false,
    },
    constants: {
      employeeEmpowermentId: "employee_empowerment",
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
      setCorpCredits: (amount) => {
        state.corp.credits = amount;
      },
    },
    flags: {
      markScoredBlackOpsAgendaThisTurn: () => undefined,
      employeeEmpowermentResolvedSourceIds: () => employeeResolved,
      markEmployeeEmpowermentResolved: (cardId) => employeeResolved.push(cardId),
    },
    effects: {
      executeOnScore: () => undefined,
      appendEmployeeEmpowermentDrawEffect: () => undefined,
    },
    draw: {
      drawCorpCard: () => {
        state.corp.rd.shift();
      },
    },
    choices: {
      startDataFortReclamation: (cardId) => callbacks.dataFort.push(cardId),
      startPriorityRequisition: (cardId) => callbacks.priority.push(cardId),
      startCorporateDownsizing: (cardId, creditPerAgendaPoint) =>
        callbacks.downsizing.push({ cardId, creditPerAgendaPoint }),
      resolveSecurityPurge: () => {
        callbacks.securityPurge += 1;
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
        project_babylon: {
          kind: "project_babylon_bonus_points",
          perExcessAdvancementCounters: 2,
          visibility: "public",
        },
      },
    });

    scoreAgenda(host, "babylon" as CardInstanceId);

    expect(legalAction.payload).toMatchObject({
      projectBabylonOveradvance: 4,
      projectBabylonBonusAgendaPoints: 2,
    });
  });

  it("applies simple score-time credit and counter effects", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      instances: {
        boon: {
          ...instance("boon" as CardInstanceId, "corporate_boon" as CardDefinitionId, {
            side: "corp",
            zone: "serverRoot",
            serverId: "remote_1" as Exclude<ServerId, "new_remote">,
          }),
          advancementCounters: 3,
        },
      },
      implementations: {
        corporate_boon: {
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
          ...instance("code_agenda" as CardInstanceId, "encryption_breakthrough" as CardDefinitionId, {
            side: "corp",
            zone: "serverRoot",
            serverId: "remote_1" as Exclude<ServerId, "new_remote">,
          }),
          advancementCounters: 3,
        },
      },
      implementations: {
        encryption_breakthrough: {
          kind: "reveal_installed_ice_subtype_for_credits",
          subtype: "code_gate",
          creditPerRevealedOrRezzed: 2,
          visibility: "hidden_info_barrier",
        },
      },
    });
    scoreAgenda(host, "code_agenda" as CardInstanceId);
    expect(host.state.pendingChoice?.source).toContain(
      "v162.scored_subtype_reveal",
    );
    const choice = host.state.pendingChoice!;
    const resolveHost = {
      ...host,
      playerAction: playerAction([choice.options[0]!.id]),
    };

    const result = handleScoredAgendaFlowChoice(resolveHost);

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.cardInstances.code_gate_1?.faceup).toBe(true);
    expect(legalAction.payload).toMatchObject({
      hiddenZoneAction: "encryption_breakthrough_reveal_code_gates",
      revealedCount: 1,
      gainedCredits: 2,
      publicRevealDefinitionIds: "code_gate_1_def",
    });
  });

  it("starts and resolves Ice Transmutation target choices", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      implementations: {
        ice_transmutation: {
          kind: "ice_transmutation_rezzed_ice_modifier",
          visibility: "public",
        },
      },
      instances: {
        transmutation_agenda: {
          ...instance(
            "transmutation_agenda" as CardInstanceId,
            "ice_transmutation" as CardDefinitionId,
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
    expect(choice.source).toContain("v1920.ice_transmutation");
    expect(choice.prompt).toBe(
      "Ice Transmutation: Rezzed ICE wählen. Das gewählte ICE bekommt +1 Stärke; jede Subroutine wird direkt nach ihrem ursprünglichen Platz einmal zusätzlich ausgeführt.",
    );

    const result = handleScoredAgendaFlowChoice({
      ...host,
      playerAction: playerAction([choice.options[0]!.id]),
    });

    expect(result.handled).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      agendaAbility: "v1920_ice_transmutation",
      targetIceId: "ice_1",
      strengthBonus: 1,
      duplicatedSubroutineCount: 1,
    });
  });

  it("starts and resolves Employee Empowerment start-turn draw choices", () => {
    const legalAction = makeLegalAction();
    const host = makeHost({
      legalAction,
      rd: ["rd_1" as CardInstanceId],
      scoreArea: ["employee" as CardInstanceId],
      definitions: {
        employee_empowerment: definition(
          "employee_empowerment",
          "agenda",
          "Employee Empowerment",
        ),
      },
      instances: {
        employee: instance(
          "employee" as CardInstanceId,
          "employee_empowerment" as CardDefinitionId,
          { side: "corp", zone: "scoreArea" },
        ),
      },
    });

    const startResult = startEmployeeEmpowermentStartDrawChoice(host);
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
      sourceDefinitionId: "employee_empowerment",
      employeeEmpowermentStartDrawDecision: "draw",
      drawnCount: 1,
    });
  });
});
