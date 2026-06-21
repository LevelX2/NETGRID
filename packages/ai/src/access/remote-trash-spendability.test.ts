import { describe, expect, it } from "vitest";
import { quoteRemoteTrashSpendability } from "./remote-trash-spendability";

describe("remote trash spendability", () => {
  it("quotes general credits when no dedicated support applies", () => {
    expect(
      quoteRemoteTrashSpendability({
        targetKind: "asset",
        trashCost: 4,
        availableGeneralCredits: 5,
      }),
    ).toMatchObject({
      trashCost: 4,
      dedicatedCreditsUsable: 0,
      generalCreditsRequired: 4,
      freeTrashAvailable: false,
      technicallyAffordable: true,
    });
  });

  it("uses dedicated credits only for matching target kinds", () => {
    expect(
      quoteRemoteTrashSpendability({
        targetKind: "asset",
        trashCost: 5,
        availableGeneralCredits: 2,
        creditSources: [
          { sourceId: "asset-trash-credit", amount: 3, targetKinds: ["asset"] },
          {
            sourceId: "upgrade-trash-credit",
            amount: 5,
            targetKinds: ["upgrade"],
          },
        ],
      }),
    ).toMatchObject({
      dedicatedCreditsUsable: 3,
      generalCreditsRequired: 2,
      technicallyAffordable: true,
    });
  });

  it("does not double count dedicated credits beyond the trash cost", () => {
    expect(
      quoteRemoteTrashSpendability({
        targetKind: "upgrade",
        trashCost: 3,
        availableGeneralCredits: 0,
        creditSources: [
          { sourceId: "a", amount: 2 },
          { sourceId: "b", amount: 4 },
        ],
      }),
    ).toMatchObject({
      dedicatedCreditsUsable: 3,
      generalCreditsRequired: 0,
      technicallyAffordable: true,
    });
  });

  it("treats free trash as waiving general and dedicated payment", () => {
    expect(
      quoteRemoteTrashSpendability({
        targetKind: "asset",
        trashCost: 6,
        availableGeneralCredits: 0,
        creditSources: [{ sourceId: "free-trash", amount: 0, freeTrash: true }],
      }),
    ).toMatchObject({
      dedicatedCreditsUsable: 0,
      generalCreditsRequired: 0,
      freeTrashAvailable: true,
      technicallyAffordable: true,
    });
  });
});

