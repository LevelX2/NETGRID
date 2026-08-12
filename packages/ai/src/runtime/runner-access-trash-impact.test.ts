import {
  cardSpecPlanningCardByDefinitionId,
  type CardSpecPlanningCompatibilityCard,
} from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { assessRunnerAccessTrashImpactFromPlanningCard } from "./runner-access-trash-impact";

describe("assessRunnerAccessTrashImpactFromPlanningCard", () => {
  it("justifies trashing a finite campaign with fourteen visible stored credits", () => {
    const assessment = assess({
      definitionId: "onr_v1_309_bbs-whispering-campaign",
      counters: { bit: 14 },
      trashCost: 4,
      runnerCredits: 5,
      economyReserve: 4,
    });

    expect(assessment).toMatchObject({
      recommendation: "trash",
      trashCost: 4,
      creditsAfterTrash: 1,
      visibleImpactValue: 1960,
      impactClasses: ["stored_economy"],
    });
    expect(assessment?.evidenceCodes).toEqual(
      expect.arrayContaining([
        "runner_access_trash_cost:4",
        "runner_access_trash_credits_after:1",
        "runner_access_trash_visible_stored_credits:14",
        "runner_access_trash_uncertainty:conservative",
        "runner_access_trash_opportunity_cost:720",
        expect.stringMatching(/^runner_access_trash_margin:/u),
      ]),
    );
  });

  it("declines an exhausted finite campaign when the trash cost is high", () => {
    const assessment = assess({
      definitionId: "onr_v1_309_bbs-whispering-campaign",
      counters: { bit: 0 },
      trashCost: 4,
      runnerCredits: 5,
      economyReserve: 4,
    });

    expect(assessment).toMatchObject({
      recommendation: "decline",
      visibleImpactValue: 0,
      impactClasses: [],
    });
  });

  it("values a differently named recurring campaign from canonical timing and counters", () => {
    const assessment = assess({
      definitionId: "onr_v1_311_braindance-campaign",
      counters: { bit: 8 },
      trashCost: 7,
      runnerCredits: 16,
      economyReserve: 3,
    });

    expect(assessment).toMatchObject({
      recommendation: "trash",
      impactClasses: ["stored_economy", "recurring_economy"],
    });
    expect(assessment?.evidenceCodes).toContain(
      "runner_access_trash_recurring_economy_per_turn:2",
    );
  });

  it("recognizes visible scoring protection without an economy effect", () => {
    const assessment = assess({
      definitionId: "onr_v1_366_red-herrings",
      trashCost: 1,
      runnerCredits: 5,
      economyReserve: 3,
    });

    expect(assessment).toMatchObject({
      recommendation: "trash",
      impactClasses: ["scoring_support", "defense_or_tax"],
      visibleImpactValue: 1200,
    });
  });

  it("declines an expensive fixture with no current visible impact", () => {
    const source = lookupPlanningCard("onr_v1_366_red-herrings");
    const inert = {
      ...source,
      planning: {
        ...source.planning,
        prospectiveCapabilities: {
          ...source.planning.prospectiveCapabilities,
          capabilities: [],
        },
        planningAnnotations: {
          schemaVersion: "card-planning-annotations-v1",
          card: [],
          capabilities: [],
        },
      },
    } as CardSpecPlanningCompatibilityCard;
    const assessment = assess({
      definitionId: "onr_v1_366_red-herrings",
      trashCost: 6,
      runnerCredits: 10,
      economyReserve: 2,
      planningCard: inert,
    });

    expect(assessment).toMatchObject({
      recommendation: "decline",
      visibleImpactValue: 0,
      opportunityCost: 1080,
      impactClasses: [],
    });
  });

  it("lets a bound parent reserve flip an otherwise attractive trash", () => {
    const unconstrained = assess({
      definitionId: "onr_v1_311_braindance-campaign",
      counters: { bit: 8 },
      trashCost: 7,
      runnerCredits: 16,
      economyReserve: 3,
    });
    const constrained = assess({
      definitionId: "onr_v1_311_braindance-campaign",
      counters: { bit: 8 },
      trashCost: 7,
      runnerCredits: 16,
      economyReserve: 3,
      parentReservedCredits: 15,
    });

    expect(unconstrained?.recommendation).toBe("trash");
    expect(constrained).toMatchObject({
      recommendation: "decline",
      parentReservedCredits: 15,
      creditsAfterTrash: 9,
      liquidityPenalty: 1080,
    });
  });
});

function assess(params: {
  definitionId: string;
  counters?: VisibleCard["counters"];
  trashCost: number;
  runnerCredits: number;
  economyReserve: number;
  parentReservedCredits?: number;
  planningCard?: CardSpecPlanningCompatibilityCard;
}) {
  const planningCard =
    params.planningCard ?? lookupPlanningCard(params.definitionId);
  return assessRunnerAccessTrashImpactFromPlanningCard({
    planningCard,
    accessed: {
      instanceId: `accessed:${params.definitionId}`,
      definitionId: params.definitionId,
      title: "Generic visible Corp card",
      owner: "corp",
      controller: "corp",
      type: planningCard.planning.cardType,
      known: true,
      ...(params.counters ? { counters: params.counters } : {}),
    },
    trashCost: params.trashCost,
    runnerCredits: params.runnerCredits,
    economyReserve: params.economyReserve,
    ...(params.parentReservedCredits !== undefined
      ? { parentReservedCredits: params.parentReservedCredits }
      : {}),
  });
}

function lookupPlanningCard(
  definitionId: string,
): CardSpecPlanningCompatibilityCard {
  const card = cardSpecPlanningCardByDefinitionId(definitionId);
  if (!card) throw new Error(`missing test planning card: ${definitionId}`);
  return card;
}
