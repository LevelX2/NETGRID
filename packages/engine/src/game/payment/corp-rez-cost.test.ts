import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstance,
  type CardInstanceId,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "./corp-rez-cost";

const BASKERVILLE_ID = "baskerville_1" as CardInstanceId;
const BASKERVILLE_DEFINITION_ID = "onr_classic_005_baskerville";
const GLACIER_ID = "glacier_1" as CardInstanceId;
const GLACIER_DEFINITION_ID = "onr_classic_011_glacier";

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
});
