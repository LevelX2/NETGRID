import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  cardSpecDefinitionById,
  cardSpecImplementationById,
  cardSpecSourceRefs,
} from "../packages/cards/src/engine/index";
import { getPublicCardView } from "../packages/cards/src/server/index";
import { CARD_IMPLEMENTATION_CATALOG } from "../packages/engine/src/card-implementations/subregistries/card-implementation-catalog";
import { CARD_DEFINITIONS_BY_ID as LEGACY_CARD_DEFINITIONS_BY_ID } from "../packages/shared/src/card-definitions";

type ReportCard = {
  cardDefinitionId: string;
  rawCard: Record<string, any>;
  legacyImplementation: Record<string, any>;
};
type ReportNode = {
  cardDefinitionId: string;
  family: string;
  sourceIndex: number;
  capabilityKey: string;
};
type MigrationReport = {
  cards: ReportCard[];
  addressableNodes: ReportNode[];
  reviewedRuleReconciliations?: Array<{
    cardDefinitionId: string;
    reconciliations: string[];
  }>;
};

const report = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "docs/reviews/cards/classic-card-spec-migration-report.json",
    ),
    "utf8",
  ),
) as MigrationReport;

describe("Classic CardSpec projection parity", () => {
  it("keeps the post-cut Classic partition absent from every legacy authority", () => {
    const removedSources = [
      "data/cards/classic-cards.json",
      "data/manifests/classic-card-support.json",
      "packages/engine/src/card-implementations/classic",
      "packages/engine/src/card-implementations/subregistries/classic-corp-agenda-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-corp-asset-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-corp-ice-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-corp-operation-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-corp-upgrade-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-runner-event-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-runner-hardware-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-runner-program-implementations.ts",
      "packages/engine/src/card-implementations/subregistries/classic-runner-resource-implementations.ts",
    ];
    expect(removedSources.filter((source) => existsSync(source))).toEqual([]);

    const legacyHints = JSON.parse(
      readFileSync("data/ai/ai-card-hints-active.json", "utf8"),
    ) as { cards: Array<{ cardId: string }> };
    expect(legacyHints.cards).toHaveLength(0);
    expect(
      legacyHints.cards.filter(({ cardId }) =>
        cardId.startsWith("onr_classic_"),
      ),
    ).toEqual([]);
    expect(
      Object.keys(LEGACY_CARD_DEFINITIONS_BY_ID).filter((cardId) =>
        cardId.startsWith("onr_classic_"),
      ),
    ).toEqual([]);
    expect(
      CARD_IMPLEMENTATION_CATALOG.filter(({ cardDefinitionId }) =>
        cardDefinitionId.startsWith("onr_classic_"),
      ),
    ).toEqual([]);

    const classicSourceRefs = cardSpecSourceRefs().filter(({ sourcePath }) =>
      sourcePath.includes("/classic/"),
    );
    expect(classicSourceRefs).toHaveLength(54);
    expect(
      new Set(classicSourceRefs.map(({ cardDefinitionId }) => cardDefinitionId))
        .size,
    ).toBe(54);
  });

  it("preserves all 54 public card facts from pinned migration evidence", () => {
    expect(report.cards).toHaveLength(54);
    for (const { cardDefinitionId, rawCard } of report.cards) {
      const actual = getPublicCardView(cardDefinitionId);
      expect(actual, cardDefinitionId).toBeDefined();
      expect(normalizedPinnedPublicFacts(actual), cardDefinitionId).toEqual({
        schemaVersion: "public-card-view-v1",
        cardDefinitionId,
        title: rawCard.title,
        side: rawCard.side,
        cardType: rawCard.type,
        faction: rawCard.faction,
        subtypes: rawCard.subtypes,
        numeric: {
          installCost: rawCard.numeric.installCost,
          memoryCost: rawCard.numeric.memoryCost,
          rezCost: rawCard.numeric.rezCost,
          trashCost: rawCard.numeric.trashCost,
          advancementRequirement: rawCard.numeric.advancementRequirement,
          agendaPoints: rawCard.numeric.agendaPoints,
        },
        playCost:
          rawCard.type === "event" || rawCard.type === "operation"
            ? { kind: "fixed", credits: rawCard.numeric.cost }
            : null,
        strength:
          rawCard.numeric.strength === null
            ? { kind: "not_applicable" }
            : { kind: "fixed", value: rawCard.numeric.strength },
        rulesText: reviewedRulesText(cardDefinitionId, rawCard.text),
        printings: [
          {
            printingId: cardDefinitionId,
            setId: "classic",
            collectorNumber: rawCard.collectorNumber,
            ...(rawCard.rarity?.code === undefined
              ? {}
              : { rarity: rawCard.rarity.code }),
          },
        ],
      });
    }
  });

  it("preserves 50 implementation projections, with reviewed reconciliations owned by the generator", () => {
    let projected = 0;
    const reviewedIds = new Set(
      report.reviewedRuleReconciliations?.map(
        ({ cardDefinitionId }) => cardDefinitionId,
      ) ?? [],
    );
    for (const { cardDefinitionId, legacyImplementation } of report.cards) {
      const expected = normalizeLegacyImplementation(legacyImplementation);
      const actual = cardSpecImplementationById(cardDefinitionId);
      if (Object.keys(expected).length === 1) {
        expect(actual, cardDefinitionId).toBeUndefined();
        continue;
      }
      projected += 1;
      if (reviewedIds.has(cardDefinitionId)) {
        expect(actual, cardDefinitionId).toBeDefined();
        continue;
      }
      expect(stripCanonicalIdentity(actual), cardDefinitionId).toEqual(
        expected,
      );
    }
    expect(projected).toBe(50);
  });

  it("projects all 18 printed subroutines with canonical semantic ids", () => {
    let count = 0;
    for (const { cardDefinitionId, legacyImplementation } of report.cards) {
      const printed = legacyImplementation.printedSubroutines ?? [];
      if (printed.length === 0) continue;
      count += printed.length;
      const definition = cardSpecDefinitionById(cardDefinitionId);
      expect(definition?.subroutines, cardDefinitionId).toEqual(
        printed.map((subroutine: Record<string, any>, sourceIndex: number) =>
          expectedSubroutine(cardDefinitionId, sourceIndex, subroutine),
        ),
      );
    }
    expect(count).toBe(18);
  });
});

function normalizedPinnedPublicFacts(
  value: ReturnType<typeof getPublicCardView>,
) {
  if (value === undefined) return undefined;
  return {
    schemaVersion: value.schemaVersion,
    cardDefinitionId: value.cardDefinitionId,
    title: value.title,
    side: value.side,
    cardType: value.cardType,
    faction: value.faction,
    subtypes: value.subtypes,
    numeric: value.numeric,
    playCost: value.playCost,
    strength: value.strength,
    rulesText: value.rulesText,
    printings: value.printings,
  };
}

function reviewedRulesText(cardDefinitionId: string, sourceText: string) {
  const reviewed = {
    "onr_classic_021_satellite-monitors":
      "At the start of each of your turns, you may roll a die for each run Runner made during his or her last turn. For each 1, give Runner a tag.",
    onr_classic_024_sterdroid: sourceText.replace(
      "ist strength",
      "its strength",
    ),
    "onr_classic_052_zetatech-portastation": sourceText.replace(
      "Portostation",
      "Portastation",
    ),
  } as const;
  return reviewed[cardDefinitionId as keyof typeof reviewed] ?? sourceText;
}

function normalizeLegacyImplementation(value: Record<string, any>) {
  const {
    printedSubroutines: _printed,
    regionBaseline: _region,
    ...rest
  } = value;
  return rest;
}

function stripCanonicalIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCanonicalIdentity);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) =>
          key !== "capabilityKey" &&
          key !== "abilityKey" &&
          key !== "addressability",
      )
      .map(([key, entry]) => [key, stripCanonicalIdentity(entry)]),
  );
}

function expectedSubroutine(
  cardDefinitionId: string,
  sourceIndex: number,
  subroutine: Record<string, any>,
) {
  const id = report.addressableNodes.find(
    (node) =>
      node.cardDefinitionId === cardDefinitionId &&
      node.family === "printedSubroutines" &&
      node.sourceIndex === sourceIndex,
  )?.capabilityKey;
  expect(id, `${cardDefinitionId}:${sourceIndex}`).toBeDefined();
  if (subroutine.kind === "damage")
    return {
      id,
      type: "do_damage",
      damageType: subroutine.damageType === "brain" ? "core" : "net",
      amount: subroutine.amount,
    };
  if (subroutine.kind === "random_damage")
    return {
      id,
      type: "random_damage",
      dieFaces: subroutine.dieFaces,
      damageOnResults: subroutine.damageOnResults,
      damageType: "core",
      amount: subroutine.amount,
    };
  if (subroutine.kind === "trace") {
    const effect = subroutine.onSuccess[0];
    return {
      id,
      type: "initiate_trace",
      traceLimit: subroutine.traceLimit ?? subroutine.baseTraceStrength,
      traceSuccessEffect: {
        type: "add_counter",
        counterType: effect.counterType,
        amount: effect.amount,
      },
    };
  }
  if (subroutine.kind === "end_the_run") return { id, type: "end_the_run" };
  if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
    return { id, type: "end_the_run_and_trash_source_at_end_of_turn" };
  if (subroutine.kind === "trash_program")
    return { id, type: "trash_installed_program" };
  if (subroutine.kind === "prohibit_break_next_ice")
    return { id, type: "set_next_encounter_no_break_subroutines" };
  if (subroutine.kind === "deflect_run")
    return {
      id,
      type: "deflect_run",
      deflectorTarget: subroutine.target,
      ...(subroutine.cost === undefined
        ? {}
        : { deflectorCost: subroutine.cost.amount }),
      ...(subroutine.autoBreakIfNoTarget
        ? { deflectorAutoBreakIfNoTarget: true }
        : {}),
    };
  throw new Error(`unhandled_classic_subroutine:${subroutine.kind}`);
}
