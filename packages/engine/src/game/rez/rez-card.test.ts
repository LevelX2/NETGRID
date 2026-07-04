import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  rezCard,
  type RezCardHost,
} from "./rez-card";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type { CardVariableRezImplementation } from "../../ability-engine/definition-types";
import type { CostQuote } from "../payment";

describe("rez card execution", () => {
  it("rezzes installed ICE by mutating the existing card instance and continuing the encounter", () => {
    const iceId = "ice_1" as CardInstanceId;
    const iceDefinition = definition("ice_def", "ice", { rezCost: 3 });
    const state = minimalState({
      cardInstances: {
        [iceId]: instance(iceId, iceDefinition.id, "serverIce"),
      },
    });
    const calls = testCalls();
    const action = rezAction(iceId);

    rezCard(testHost(state, { [iceDefinition.id]: iceDefinition }, calls), iceId, false, action);

    expect(state.corp.credits).toBe(7);
    expect(state.cardInstances[iceId]).toMatchObject({
      id: iceId,
      rezzed: true,
      faceup: true,
    });
    expect(state.runnerTurnFlags?.corpRezzedIceThisTurn).toBe(1);
    expect(calls.beginEncounter).toEqual([iceId]);
    expect(calls.rootRez).toEqual([]);
    expect(calls.lifecycle).toEqual([iceId]);
  });

  it("preserves variable ICE rez payload validation and stored variable state", () => {
    const iceId = "variable_ice" as CardInstanceId;
    const iceDefinition = definition("variable_ice_def", "ice", { rezCost: 2 });
    const state = minimalState({
      cardInstances: {
        [iceId]: instance(iceId, iceDefinition.id, "serverIce"),
      },
    });
    const action = rezAction(iceId, {
      variableRezKind: "x_strength",
      variableRezAdditionalCost: 3,
      variableRezValue: 3,
      variableRezCap: 5,
      effectiveStrengthAfterRez: 3,
      rezCostPaid: 5,
    });
    action.costs = [{ credits: 5 }];
    const variableRez = {
      kind: "x_strength",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 5,
    } as CardVariableRezImplementation;

    rezCard(
      testHost(state, { [iceDefinition.id]: iceDefinition }, testCalls(), {
        variableRez,
      }),
      iceId,
      false,
      action,
    );

    expect(state.corp.credits).toBe(5);
    expect(state.cardInstances[iceId]?.variableIceState).toEqual({
      family: "x_strength",
      additionalCostPaid: 3,
      value: 3,
      cap: 5,
      strength: 3,
    });
  });

  it("keeps ACME agenda-point rez payloads stable", () => {
    const assetId = "acme" as CardInstanceId;
    const assetDefinition = definition("acme_def", "asset", { rezCost: 0 });
    const state = minimalState({
      cardInstances: {
        [assetId]: instance(assetId, assetDefinition.id, "serverRoot"),
      },
    });
    state.activeObligationDebtCount = 2;
    state.corpBonusAgendaPoints = 1;
    const action = rezAction(assetId, { agendaPointCost: 1 });

    rezCard(
      testHost(state, { [assetDefinition.id]: assetDefinition }, testCalls(), {
        acmeDefinitions: new Set([assetDefinition.id]),
      }),
      assetId,
      true,
      action,
    );

    expect(action.payload).toMatchObject({
      agendaPointCost: 1,
      agendaPointCostPaid: 1,
      obligationDebtAbility: "rez_with_agenda_point_cost",
      obligationDebtCountBefore: 2,
      corpBonusAgendaPointsSpent: 1,
    });
  });

  it("spends Glacier's public agenda-point self-rez cost", () => {
    const glacierId = "glacier" as CardInstanceId;
    const glacierDefinition = definition("onr_classic_011_glacier", "ice", {
      rezCost: 0,
    });
    const state = minimalState({
      cardInstances: {
        [glacierId]: instance(glacierId, glacierDefinition.id, "serverIce"),
      },
    });
    state.corpBonusAgendaPoints = 1;
    const action = rezAction(glacierId, { agendaPointCost: 1 });

    rezCard(
      testHost(state, { [glacierDefinition.id]: glacierDefinition }),
      glacierId,
      false,
      action,
    );

    expect(state.corpBonusAgendaPoints).toBe(0);
    expect(state.cardInstances[glacierId]).toMatchObject({
      rezzed: true,
      faceup: true,
    });
    expect(action.payload).toMatchObject({
      agendaPointCost: 1,
      agendaPointCostPaid: 1,
      selfRezAdditionalCostKind: "agenda_point",
      corpBonusAgendaPointsSpent: 1,
    });
  });

  it("preserves Paris trace-pool counter payloads", () => {
    const upgradeId = "paris" as CardInstanceId;
    const upgradeDefinition = definition("paris_def", "upgrade", { rezCost: 1 });
    const state = minimalState({
      cardInstances: {
        [upgradeId]: instance(upgradeId, upgradeDefinition.id, "serverRoot"),
      },
    });
    const action = rezAction(upgradeId);

    rezCard(
      testHost(state, { [upgradeDefinition.id]: upgradeDefinition }, testCalls(), {
        parisCapacity: new Map([[upgradeId, 4]]),
      }),
      upgradeId,
      true,
      action,
    );

    expect(state.cardInstances[upgradeId]?.counters).toEqual({ bit: 4 });
    expect(action.payload).toMatchObject({
      sourceDefinitionId: upgradeDefinition.id,
      counterType: "bit",
      addedCounterAmount: 4,
      remainingCounters: 4,
    });
  });

  it("does not import from index.ts", () => {
    const source = readFileSync(new URL("./rez-card.ts", import.meta.url), "utf8");

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
  });
});

function definition(
  id: string,
  type: CardDefinition["type"],
  extras: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type,
    installCost: 0,
    rezCost: 0,
    agendaPoints: 0,
    advancementRequirement: 0,
    mechanics: [],
    subtypes: [],
    ...extras,
  } as CardDefinition;
}

function instance(
  id: CardInstanceId,
  definitionId: CardDefinitionId,
  zone: "serverIce" | "serverRoot",
): CardInstance {
  return {
    id,
    definitionId,
    owner: "corp",
    controller: "corp",
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone, serverId: "remote_1" },
  } as unknown as CardInstance;
}

function minimalState(input: {
  cardInstances: Record<CardInstanceId, CardInstance>;
}): GameState {
  return {
    stateVersion: 1,
    randomCounter: 0,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    runner: {
      clicks: 4,
      credits: 5,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      clicks: 3,
      credits: 10,
      rd: [],
      hq: [],
      archives: [],
      scoreArea: [],
      badPublicity: 0,
      servers: [
        {
          id: "remote_1",
          kind: "remote",
          label: "Remote 1",
          ice: [],
          root: [],
        },
      ],
    },
    cardInstances: input.cardInstances,
    eventLog: [],
  } as unknown as GameState;
}

function rezAction(
  cardId: CardInstanceId,
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `corp.rez_ice.${cardId}`,
    type: "rez_ice",
    side: "corp",
    label: "Rez",
    source: cardId,
    timing: "run",
    costs: [{ credits: Number(payload.rezCostPaid ?? 0) }],
    payload: { cardId, ...payload },
  } as unknown as LegalAction;
}

type TestCalls = {
  beginEncounter: CardInstanceId[];
  rootRez: CardInstanceId[];
  lifecycle: CardInstanceId[];
};

function testCalls(): TestCalls {
  return {
    beginEncounter: [],
    rootRez: [],
    lifecycle: [],
  };
}

type HostOptions = {
  variableRez?: CardVariableRezImplementation;
  acmeDefinitions?: Set<CardDefinitionId>;
  parisCapacity?: Map<CardInstanceId, number>;
};

function testHost(
  state: GameState,
  definitions: Record<CardDefinitionId, CardDefinition>,
  calls = testCalls(),
  options: HostOptions = {},
): RezCardHost {
  const definitionFor = (cardId: CardInstanceId) => {
    const definition = definitions[state.cardInstances[cardId]!.definitionId];
    if (!definition) throw new Error(`Definition fehlt: ${cardId}`);
    return definition;
  };
  return {
    state,
    cards: {
      definitionFor,
      mustInstance: (cardId) => state.cardInstances[cardId]!,
      hasCardImplementationForDefinition: () => false,
      variableRezForDefinition: () => options.variableRez,
      stableSubtypeList: (subtypes) =>
        [...new Set(subtypes.map((subtype) => subtype.toLowerCase()))].sort(),
    },
    run: {
      mustRun: () => {
        state.run ??= {
          runId: "run_1",
          attackedServerId: "remote_1",
          phase: "encounter_ice",
          approachedIceId: undefined,
          encounteredIceId: undefined,
          position: 0,
        } as unknown as NonNullable<GameState["run"]>;
        return state.run;
      },
      handleRunRootRezPostRez: (cardId) => {
        calls.rootRez.push(cardId);
      },
      beginEncounter: (cardId) => {
        calls.beginEncounter.push(cardId);
      },
    },
    payment: {
      rezCostForCard: (cardId) => definitionFor(cardId).rezCost ?? 0,
      assertCorpRezCostQuoteValid: (cardId, legalAction) =>
        quote(cardId, Number(definitionFor(cardId).rezCost ?? 0), legalAction),
      creditCostForAction: (legalAction) =>
        legalAction.costs.reduce(
          (sum, cost) => sum + Number(cost.credits ?? 0),
          0,
        ),
      spendCredits: (side: Side, amount) => {
        state[side].credits -= amount;
      },
    },
    corp: {
      isObligationDebtDefinition: (definitionId) =>
        options.acmeDefinitions?.has(definitionId) ?? false,
      spendCorpAgendaPointCost: (requiredPoints) => {
        const paidPoints = Math.min(
          requiredPoints,
          Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)),
        );
        state.corpBonusAgendaPoints =
          Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)) -
          paidPoints;
        return {
          paidPoints,
          bonusPointsSpent: paidPoints,
          spentAgendaIds: [],
          spentAgendaDefinitionIds: [],
        };
      },
      activeObligationCount: () =>
        Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0)),
    },
    runner: {
      ensureTurnFlags: () =>
        (state.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        }),
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) => {
        const key = counterType as CounterType;
        const card = state.cardInstances[cardId]!;
        card.counters = { ...(card.counters ?? {}), [key]: amount };
      },
    },
    lifecycle: {
      executeOnRez: (_legalAction, _definition, cardId) => {
        calls.lifecycle.push(cardId);
      },
    },
    fort: {
      isFortTraceBitPoolSource: (cardId) =>
        options.parisCapacity?.has(cardId) ?? false,
      fortTraceBitPoolCapacityForCard: (cardId) =>
        options.parisCapacity?.get(cardId) ?? 0,
    },
  };
}

function quote(
  cardId: CardInstanceId,
  finalCredits: number,
  legalAction: LegalAction,
): CostQuote {
  return {
    purpose: "corp_rez",
    side: "corp",
    targetCardId: cardId,
    baseCredits: finalCredits,
    finalCredits,
    costs: [{ credits: finalCredits }],
    modifiers: [],
    canPay: true,
    publicPayload: {
      ...(legalAction.payload ?? {}),
      rezCostPaid: finalCredits,
    },
  };
}
