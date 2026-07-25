import { describe, expect, it } from "vitest";

import {
  allocateCorpCentralDefense,
  type CorpCentralDefenseAllocationInput,
  type CorpCentralDefenseFacts,
} from "./corp-central-defense-allocation.js";

function central(
  serverId: "hq" | "rd",
  overrides: Partial<CorpCentralDefenseFacts> = {},
): CorpCentralDefenseFacts {
  return {
    serverId,
    factsKnown: true,
    threat: "material",
    access: {
      successfulAccessProbability: { numerator: 1, denominator: 1 },
      accessibleCardCount: 1,
      isMultiaccess: false,
      recentRunOrAccessEvents: 0,
      recentSuccessfulAccessRunnerTurns: 0,
      serverBoundEffectIds: [],
    },
    cards: {
      populationCardCount: 5,
      agendaCardCount: 1,
      agendaPointValue: 1,
      importantTrashableCardCount: 0,
    },
    ...overrides,
  };
}

function input(
  hq = central("hq"),
  rd = central("rd"),
): CorpCentralDefenseAllocationInput {
  return {
    observedAtStateVersion: 17,
    turnKey: "corp:4",
    hq,
    rd,
  };
}

describe("allocateCorpCentralDefense", () => {
  it("prefers HQ when its exact agenda density has the larger expected loss", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq", {
          cards: {
            populationCardCount: 5,
            agendaCardCount: 2,
            agendaPointValue: 4,
            importantTrashableCardCount: 0,
          },
        }),
        central("rd", {
          cards: {
            populationCardCount: 10,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 0,
          },
        }),
      ),
    );
    expect(result).toMatchObject({ status: "known", selectedServerId: "hq" });
  });

  it("accounts for important trashable HQ cards after agenda loss", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq", {
          cards: {
            populationCardCount: 5,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 2,
          },
        }),
        central("rd", {
          cards: {
            populationCardCount: 5,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 0,
          },
        }),
      ),
    );
    expect(result).toMatchObject({ status: "known", selectedServerId: "hq" });
  });

  it("lets exact R&D multiaccess win a comparable central allocation", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq"),
        central("rd", {
          access: {
            successfulAccessProbability: { numerator: 1, denominator: 1 },
            accessibleCardCount: 2,
            isMultiaccess: true,
            recentRunOrAccessEvents: 1,
            recentSuccessfulAccessRunnerTurns: 1,
            serverBoundEffectIds: ["effect:rd-dig"],
          },
        }),
      ),
    );
    expect(result).toMatchObject({ status: "known", selectedServerId: "rd" });
  });

  it("keeps real agenda loss ahead of non-terminal multiaccess pressure", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq", {
          threat: "material",
          cards: {
            populationCardCount: 5,
            agendaCardCount: 2,
            agendaPointValue: 4,
            importantTrashableCardCount: 0,
          },
        }),
        central("rd", {
          threat: "acute",
          access: {
            successfulAccessProbability: { numerator: 1, denominator: 1 },
            accessibleCardCount: 3,
            isMultiaccess: true,
            recentRunOrAccessEvents: 3,
            recentSuccessfulAccessRunnerTurns: 2,
            serverBoundEffectIds: ["effect:rd-dig"],
          },
          cards: {
            populationCardCount: 10,
            agendaCardCount: 0,
            agendaPointValue: 0,
            importantTrashableCardCount: 0,
          },
        }),
      ),
    );
    expect(result).toMatchObject({
      status: "known",
      selectedServerId: "hq",
      canonicalNearTieCandidateServerIds: [],
    });
  });

  it("offers one bounded HQ bluff only for the authorized five-card, one-agenda case", () => {
    const result = allocateCorpCentralDefense({
      ...input(
        central("hq"),
        central("rd", {
          access: {
            successfulAccessProbability: { numerator: 1, denominator: 1 },
            accessibleCardCount: 2,
            isMultiaccess: true,
            recentRunOrAccessEvents: 2,
            recentSuccessfulAccessRunnerTurns: 2,
            serverBoundEffectIds: ["effect:rd-dig"],
          },
        }),
      ),
      hqHoldCadence: {
        status: "available",
        receiptId: "receipt:bluff",
        turnKey: "corp:4",
        factsStateVersion: 17,
      },
    });
    expect(result).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      canonicalNearTieCandidateServerIds: [],
      hqHold: { status: "eligible_once", receiptId: "receipt:bluff" },
    });
  });

  it("keeps an eligible one-use HQ hold pending behind near-tie randomization", () => {
    const result = allocateCorpCentralDefense({
      ...input(
        central("hq"),
        central("rd", {
          access: {
            successfulAccessProbability: { numerator: 1, denominator: 1 },
            accessibleCardCount: 2,
            isMultiaccess: true,
            recentRunOrAccessEvents: 1,
            recentSuccessfulAccessRunnerTurns: 1,
            serverBoundEffectIds: ["effect:rd-dig"],
          },
          cards: {
            populationCardCount: 10,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 0,
          },
        }),
      ),
      hqHoldCadence: {
        status: "available",
        receiptId: "receipt:near-tie-bluff",
        turnKey: "corp:4",
        factsStateVersion: 17,
      },
    });

    expect(result).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      canonicalNearTieCandidateServerIds: ["hq", "rd"],
      hqHold: {
        status: "eligible_once",
        receiptId: "receipt:near-tie-bluff",
      },
    });
  });

  it("never offers the hold for terminal, multiaccess, multiple-agenda, or important-trashable HQ facts", () => {
    for (const hq of [
      central("hq", { threat: "terminal" }),
      central("hq", {
        access: {
          successfulAccessProbability: { numerator: 1, denominator: 1 },
          accessibleCardCount: 2,
          isMultiaccess: true,
          recentRunOrAccessEvents: 0,
          recentSuccessfulAccessRunnerTurns: 0,
          serverBoundEffectIds: [],
        },
      }),
      central("hq", {
        cards: {
          populationCardCount: 5,
          agendaCardCount: 2,
          agendaPointValue: 1,
          importantTrashableCardCount: 0,
        },
      }),
      central("hq", {
        cards: {
          populationCardCount: 5,
          agendaCardCount: 1,
          agendaPointValue: 1,
          importantTrashableCardCount: 1,
        },
      }),
    ]) {
      const result = allocateCorpCentralDefense({
        ...input(
          hq,
          central("rd", {
            access: {
              successfulAccessProbability: { numerator: 1, denominator: 1 },
              accessibleCardCount: 2,
              isMultiaccess: true,
              recentRunOrAccessEvents: 2,
              recentSuccessfulAccessRunnerTurns: 2,
              serverBoundEffectIds: ["effect:rd-dig"],
            },
          }),
        ),
        hqHoldCadence: {
          status: "available",
          receiptId: "receipt:bluff",
          turnKey: "corp:4",
          factsStateVersion: 17,
        },
      });
      expect(result).toMatchObject({
        status: "known",
        hqHold: { status: "ineligible" },
      });
    }
  });

  it("blocks a repeated hold through the resident consumed receipt", () => {
    const result = allocateCorpCentralDefense({
      ...input(),
      hqHoldCadence: {
        status: "consumed",
        receiptId: "receipt:bluff",
        turnKey: "corp:2",
        factsStateVersion: 16,
      },
    });
    expect(result).toMatchObject({
      status: "known",
      hqHold: { status: "consumed", receiptId: "receipt:bluff" },
    });
  });

  it("fails closed for unknown central facts", () => {
    const result = allocateCorpCentralDefense(
      input(central("hq", { factsKnown: false })),
    );
    expect(result).toEqual({
      status: "unknown",
      reason: "incomplete_or_invalid_facts",
    });
  });

  it("returns canonical candidates for an exact fully-known tie", () => {
    const result = allocateCorpCentralDefense(input());
    expect(result).toMatchObject({
      status: "known",
      canonicalNearTieCandidateServerIds: ["hq", "rd"],
    });
  });

  it("returns canonical candidates for exact loss projections inside the 80% near-tie band", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq"),
        central("rd", {
          cards: {
            populationCardCount: 4,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 0,
          },
        }),
      ),
    );
    expect(result).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      canonicalNearTieCandidateServerIds: ["hq", "rd"],
    });
  });

  it("does not randomize materially different exact loss projections", () => {
    const result = allocateCorpCentralDefense(
      input(
        central("hq"),
        central("rd", {
          cards: {
            populationCardCount: 2,
            agendaCardCount: 1,
            agendaPointValue: 1,
            importantTrashableCardCount: 0,
          },
        }),
      ),
    );
    expect(result).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      canonicalNearTieCandidateServerIds: [],
    });
  });

  it("fails closed for stale available cadence evidence", () => {
    const result = allocateCorpCentralDefense({
      ...input(),
      hqHoldCadence: {
        status: "available",
        receiptId: "receipt:bluff",
        turnKey: "corp:4",
        factsStateVersion: 16,
      },
    });
    expect(result).toEqual({
      status: "unknown",
      reason: "incomplete_or_invalid_facts",
    });
  });
});
