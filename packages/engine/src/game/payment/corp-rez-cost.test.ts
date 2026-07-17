import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { hashState } from "../hash";
import {
  assertCorpRootRezCostQuoteValid,
  quoteCorpRezCost,
  quoteCorpRootRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "./corp-rez-cost";

const BASKERVILLE_ID = "baskerville_1" as CardInstanceId;
const BASKERVILLE_DEFINITION_ID = "onr_classic_005_baskerville";
const GLACIER_ID = "glacier_1" as CardInstanceId;
const GLACIER_DEFINITION_ID = "onr_classic_011_glacier";
const ACME_ID = "acme_1" as CardInstanceId;
const ACME_DEFINITION_ID = "onr_v1_308_acme-savings-and-loan";

function makeState(noisyUsed = false): GameState {
  return {
    matchId: "classic_05_rez_cost",
    baseline: { engineSchemaVersion: "0.99.0" },
    stateVersion: 1,
    seed: "classic_05_rez_cost",
    randomCounter: 0,
    randomDrawRecords: [],
    activeSide: "corp",
    phase: "run",
    timingPoint: "run.approach_ice",
    corp: {
      credits: 20,
      clicks: 3,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: [BASKERVILLE_ID],
          root: [],
        },
        { id: "hq", kind: "hq", label: "HQ", ice: [], root: [] },
        {
          id: "archives",
          kind: "archives",
          label: "Archives",
          ice: [],
          root: [],
        },
      ],
    },
    runner: {
      credits: 5,
      clicks: 4,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
      coreDamage: 0,
    },
    cardInstances: {
      [BASKERVILLE_ID]: {
        id: BASKERVILLE_ID,
        definitionId: BASKERVILLE_DEFINITION_ID,
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      } as unknown as CardInstance,
      [GLACIER_ID]: {
        id: GLACIER_ID,
        definitionId: GLACIER_DEFINITION_ID,
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      } as unknown as CardInstance,
    },
    eventLog: [],
    winner: null,
    agendaPointsToWin: 7,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "approach_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      approachedIceId: BASKERVILLE_ID,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      ...(noisyUsed ? { usedNoisyIcebreakerThisRun: true } : {}),
    },
  } as unknown as GameState;
}

describe("corp rez costs", () => {
  it("applies Classic Sleepy self-rez reduction only after noisy breaker use this run", () => {
    const normalState = makeState(false);
    expect(rezCostForCard(normalState, BASKERVILLE_ID)).toBe(10);
    expect(quoteCorpRezCost(normalState, BASKERVILLE_ID).modifiers).toEqual([]);

    const noisyState = makeState(true);
    const quote = quoteCorpRezCost(noisyState, BASKERVILLE_ID);
    expect(rezCostForCard(noisyState, BASKERVILLE_ID)).toBe(5);
    expect(quote).toMatchObject({
      baseCredits: 10,
      finalCredits: 5,
      costs: [{ credits: 5 }],
      publicPayload: {
        rezCostReductionSourceDefinitionIds: BASKERVILLE_DEFINITION_ID,
        rezCostReductionAmount: 5,
        rezCostPaid: 5,
      },
    });
    expect(quote.modifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: BASKERVILLE_ID,
        sourceDefinitionId: BASKERVILLE_DEFINITION_ID,
        amount: 5,
        kind: "reduction",
      }),
    ]);
    expect(
      rezCostReductionSourceDefinitionIdsFor(
        noisyState,
        BASKERVILLE_ID,
        CARD_DEFINITIONS_BY_ID[BASKERVILLE_DEFINITION_ID]!,
      ),
    ).toEqual([BASKERVILLE_DEFINITION_ID]);
  });

  it("requires Glacier's public agenda-point self-rez cost in the rez quote", () => {
    const state = makeState(false);
    state.run!.approachedIceId = GLACIER_ID;
    state.corp.servers[0]!.ice = [GLACIER_ID];

    const blockedQuote = quoteCorpRezCost(state, GLACIER_ID);
    expect(blockedQuote).toMatchObject({
      finalCredits: 0,
      costs: [{ credits: 0 }],
      canPay: false,
      publicPayload: {
        cardId: GLACIER_ID,
        agendaPointCost: 1,
        selfRezAdditionalCostKind: "agenda_point",
      },
    });

    state.corpBonusAgendaPoints = 1;
    const payableQuote = quoteCorpRezCost(state, GLACIER_ID);
    expect(payableQuote).toMatchObject({
      canPay: true,
      publicPayload: {
        agendaPointCost: 1,
        selfRezAdditionalCostKind: "agenda_point",
      },
    });
  });

  it("quotes ACME root rez credits and agenda points without mutating StateHash", () => {
    const state = makeRootRezState();
    const beforeHash = hashState(state);

    expect(quoteCorpRootRezCost(state, ACME_ID)).toMatchObject({
      canPay: false,
      publicPayload: {
        cardId: ACME_ID,
        rootRez: true,
        serverId: "rd",
        agendaPointCost: 1,
        obligationDebtAbility: "rez_with_agenda_point_cost",
      },
    });
    expect(hashState(state)).toBe(beforeHash);

    state.corpBonusAgendaPoints = 1;
    const quote = quoteCorpRootRezCost(state, ACME_ID);
    expect(quote.canPay).toBe(true);
    expect(quote.costs).toEqual([{ credits: quote.finalCredits }]);
  });

  it("rejects stale or manipulated root-rez quote contracts", () => {
    const state = makeRootRezState();
    state.corpBonusAgendaPoints = 1;
    const quote = quoteCorpRootRezCost(state, ACME_ID);
    const action = {
      actionId: "corp.rez_card.acme_1.rd.acme_1",
      type: "rez_card",
      side: "corp",
      label: "ACME rezzen",
      source: ACME_ID,
      timingPoint: "corp_action.main",
      costs: quote.costs.map((cost) => ({ ...cost })),
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: state.stateVersion,
      payload: { ...quote.publicPayload },
    } as LegalAction;

    expect(assertCorpRootRezCostQuoteValid(state, ACME_ID, action)).toEqual(
      quote,
    );

    const manipulatedCost = structuredClone(action);
    manipulatedCost.costs = [{ credits: quote.finalCredits + 1 }];
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, ACME_ID, manipulatedCost),
    ).toThrow("Root-Rez-Kosten sind nicht mehr gueltig");

    const manipulatedPayload = structuredClone(action);
    manipulatedPayload.payload = {
      ...manipulatedPayload.payload,
      agendaPointCost: 2,
    };
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, ACME_ID, manipulatedPayload),
    ).toThrow("Root-Rez-Kostenpayload ist nicht mehr gueltig");

    const staleState = structuredClone(state);
    staleState.corpBonusAgendaPoints = 0;
    expect(() =>
      assertCorpRootRezCostQuoteValid(staleState, ACME_ID, action),
    ).toThrow("Corp kann die Root-Rez-Kosten nicht zahlen");
  });
});

function makeRootRezState(): GameState {
  const state = makeState(false);
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  delete state.run;
  state.corp.servers[0]!.root = [ACME_ID];
  state.cardInstances[ACME_ID] = {
    id: ACME_ID,
    definitionId: ACME_DEFINITION_ID,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
    faceup: false,
    rezzed: false,
  } as unknown as CardInstance;
  return state;
}
