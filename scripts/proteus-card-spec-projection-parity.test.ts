import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  cardSpecDefinitionById,
  cardSpecImplementationById,
  cardSpecSourceRefs,
} from "../packages/cards/src/engine/index";
import { getPublicCardView } from "../packages/cards/src/server/index";

type ReportCard = {
  cardDefinitionId: string;
  rawCard: Record<string, any>;
  legacyImplementation: Record<string, any>;
  legacyModuleImplementation: Record<string, any>;
  sharedDefinition?: Record<string, any>;
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
};

const report = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "docs/reviews/cards/proteus-card-spec-migration-report.json",
    ),
    "utf8",
  ),
) as MigrationReport;

const NEW_PROJECTOR_FAMILY_CARDS = {
  flatlineReplacementSources: ["onr_proteus_112_identity-donor"],
  hostedProgramCapacity: ["onr_proteus_139_eurocorpse-tm-spin-chip"],
  iceEncounter: ["onr_proteus_035_roadblock"],
  relativeIce: [
    "onr_proteus_012_bug-zapper",
    "onr_proteus_021_dog-pile",
    "onr_proteus_026_hunting-pack",
    "onr_proteus_030_mastermind",
  ],
  runnerEventTargetedEffect: ["onr_proteus_115_personal-touch-the"],
  runnerRunStrengthBoost: ["onr_proteus_091_lockjaw"],
  selfStealCosts: ["onr_proteus_004_fetal-ai"],
  trashPreventionSources: ["onr_proteus_153_time-to-collect"],
  uniqueDirectLongtail: [
    "onr_proteus_144_lucidrinetm-drip-feed",
    "onr_proteus_131_bargain-with-viacox",
  ],
  virusCounter: [
    "onr_proteus_084_crumble",
    "onr_proteus_089_garbage-in",
    "onr_proteus_090_highlighter",
    "onr_proteus_094_scaldan",
    "onr_proteus_097_taxman",
    "onr_proteus_098_vienna-22",
    "onr_proteus_099_viral-pipeline",
  ],
} as const;

const SHARED_SUBTYPE_REORDER_IDS = new Set([
  "onr_proteus_012_bug-zapper",
  "onr_proteus_021_dog-pile",
  "onr_proteus_022_food-fight",
  "onr_proteus_026_hunting-pack",
  "onr_proteus_030_mastermind",
  "onr_proteus_054_bel-digmo-antibody",
  "onr_proteus_057_doppelganger-antibody",
  "onr_proteus_068_pattel-antibody",
  "onr_proteus_075_stereogram-antibody",
]);

describe("Proteus CardSpec projection parity before source cutover", () => {
  it("keeps all 102 prior source specs byte-exact while adding the new slice", () => {
    const newIds = new Set(
      report.cards.map(({ cardDefinitionId }) => cardDefinitionId),
    );
    const priorPaths = recursiveCardSpecPaths(
      path.join(process.cwd(), "packages/cards/src/specs"),
    )
      .filter((relativePath) => {
        const cardId = path.basename(relativePath, ".card-spec.ts");
        return !newIds.has(cardId);
      })
      .sort();
    expect(priorPaths).toHaveLength(102);
    const aggregate = priorPaths
      .map(
        (relativePath) =>
          `${relativePath}\n${readFileSync(path.join(process.cwd(), relativePath), "utf8")}`,
      )
      .join("\n");
    expect(createHash("sha256").update(aggregate).digest("hex")).toBe(
      "f964c60c6d4433739c609113b58d3f852bd90128fb6c417596ebb7653d0aa972",
    );
  });

  it("registers the exact 151 generated sources beside the prior three specs", () => {
    const proteusRefs = cardSpecSourceRefs().filter(({ sourcePath }) =>
      sourcePath.includes("/proteus/"),
    );
    expect(proteusRefs).toHaveLength(154);
    expect(
      new Set(proteusRefs.map(({ cardDefinitionId }) => cardDefinitionId)).size,
    ).toBe(154);
    expect(report.cards).toHaveLength(151);
  });

  it("preserves every pinned public fact including variable play cost and strength", () => {
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
            ? (rawCard.playCost ?? {
                kind: "fixed",
                credits: rawCard.numeric.cost,
              })
            : null,
        strength:
          rawCard.variableStrength ??
          (rawCard.numeric.strength === null
            ? { kind: "not_applicable" }
            : { kind: "fixed", value: rawCard.numeric.strength }),
        rulesText: rawCard.text,
        markCounterDisplay: rawCard.markCounterDisplay,
        printings: [
          {
            printingId: cardDefinitionId,
            setId: "proteus",
            collectorNumber: rawCard.collectorNumber,
            ...(rawCard.rarity?.code === undefined
              ? {}
              : { rarity: rawCard.rarity.code }),
          },
        ],
      });
    }
  });

  it("preserves the exact 46 pinned Shared definitions and all 20 static subroutines semantically", () => {
    const sharedCards = report.cards.filter(
      ({ sharedDefinition }) => sharedDefinition !== undefined,
    );
    expect(sharedCards).toHaveLength(46);
    const reordered: string[] = [];
    let sharedSubroutineCount = 0;
    for (const { cardDefinitionId, sharedDefinition } of sharedCards) {
      const actual = getPublicCardView(cardDefinitionId)!;
      expect(
        {
          title: actual.title,
          side: actual.side,
          type: actual.cardType,
          installCost: actual.numeric.installCost,
          memoryCost: actual.numeric.memoryCost,
          rezCost: actual.numeric.rezCost,
          trashCost: actual.numeric.trashCost,
          agendaPoints: actual.numeric.agendaPoints,
          advancementRequirement: actual.numeric.advancementRequirement,
          strength:
            actual.strength.kind === "fixed" ? actual.strength.value : null,
        },
        cardDefinitionId,
      ).toEqual({
        title: sharedDefinition!.title,
        side: sharedDefinition!.side,
        type: sharedDefinition!.type,
        installCost: sharedDefinition!.installCost ?? null,
        memoryCost: sharedDefinition!.memoryCost ?? null,
        rezCost: sharedDefinition!.rezCost ?? null,
        trashCost: sharedDefinition!.trashCost ?? null,
        agendaPoints: sharedDefinition!.agendaPoints ?? null,
        advancementRequirement:
          sharedDefinition!.advancementRequirement ?? null,
        strength: sharedDefinition!.strength ?? null,
      });
      expect([...actual.subtypes].sort(), cardDefinitionId).toEqual(
        [...(sharedDefinition!.subtypes ?? [])].sort(),
      );
      if (
        actual.subtypes.join("\n") !==
        (sharedDefinition!.subtypes ?? []).join("\n")
      )
        reordered.push(cardDefinitionId);

      const sharedSubroutines = sharedDefinition!.subroutines ?? [];
      sharedSubroutineCount += sharedSubroutines.length;
      if (sharedSubroutines.length > 0)
        expect(
          cardSpecDefinitionById(cardDefinitionId)?.subroutines.map(
            stripSubroutineIdentity,
          ),
          cardDefinitionId,
        ).toEqual(
          sharedSubroutines.map((subroutine: Record<string, unknown>) =>
            normalizedSharedSubroutine(cardDefinitionId, subroutine),
          ),
        );
    }
    expect(sharedSubroutineCount).toBe(20);
    expect(reordered.sort()).toEqual([...SHARED_SUBTYPE_REORDER_IDS].sort());
  });

  it("preserves 148 implementation projections and leaves three printed-only definitions owner-complete", () => {
    let projected = 0;
    const definitionOnly: string[] = [];
    for (const { cardDefinitionId, legacyImplementation } of report.cards) {
      const expected = normalizeLegacyImplementation(
        cardDefinitionId,
        legacyImplementation,
      );
      const actual = cardSpecImplementationById(cardDefinitionId);
      if (Object.keys(expected).length === 1) {
        expect(actual, cardDefinitionId).toBeUndefined();
        definitionOnly.push(cardDefinitionId);
        continue;
      }
      projected += 1;
      expect(stripCanonicalIdentity(actual), cardDefinitionId).toEqual(
        expected,
      );
    }
    expect(projected).toBe(148);
    expect(definitionOnly).toEqual([
      "onr_proteus_011_brain-wash",
      "onr_proteus_015_colonel-failure",
      "onr_proteus_041_toughoniumtm-wall",
    ]);
  });

  it("projects all 41 implementation and Shared subroutines with reviewed canonical ids", () => {
    let count = 0;
    for (const { cardDefinitionId, legacyImplementation } of report.cards) {
      const printed = legacyImplementation.printedSubroutines ?? [];
      if (printed.length === 0) continue;
      count += printed.length;
      expect(cardSpecDefinitionById(cardDefinitionId)?.subroutines).toEqual(
        printed.map((subroutine: Record<string, any>, sourceIndex: number) =>
          expectedSubroutine(cardDefinitionId, sourceIndex, subroutine),
        ),
      );
    }
    expect(count).toBe(41);
  });

  it("binds relative dynamic damage to the canonical printed subroutine and rejects the stale Armageddon install counter token", () => {
    for (const cardDefinitionId of [
      "onr_proteus_012_bug-zapper",
      "onr_proteus_021_dog-pile",
      "onr_proteus_030_mastermind",
    ]) {
      const implementation = cardSpecImplementationById(
        cardDefinitionId,
      ) as Record<string, any>;
      const definition = cardSpecDefinitionById(cardDefinitionId)!;
      const dynamicSubroutineId =
        implementation.relativeIce.dynamicDamageSubroutine.subroutineId;
      expect(
        definition.subroutines.some(
          (subroutine) => subroutine.id === dynamicSubroutineId,
        ),
        cardDefinitionId,
      ).toBe(true);
    }
    expect(
      (
        cardSpecImplementationById("onr_proteus_078_armageddon") as Record<
          string,
          any
        >
      ).virusCounter,
    ).toBeUndefined();
  });

  it("projects the exact ten newly supported family-to-card sets without mutation", () => {
    for (const [family, expectedIds] of Object.entries(
      NEW_PROJECTOR_FAMILY_CARDS,
    )) {
      const actualIds = report.cards
        .filter(({ legacyImplementation }) =>
          Object.hasOwn(legacyImplementation, family),
        )
        .map(({ cardDefinitionId }) => cardDefinitionId)
        .sort();
      expect(actualIds, family).toEqual([...expectedIds].sort());
      for (const cardDefinitionId of actualIds) {
        const legacy = report.cards.find(
          (entry) => entry.cardDefinitionId === cardDefinitionId,
        )!.legacyImplementation[family];
        const actual = cardSpecImplementationById(cardDefinitionId) as Record<
          string,
          unknown
        >;
        expect(
          stripCanonicalIdentity(actual[family]),
          `${family}:${cardDefinitionId}`,
        ).toEqual(
          family === "hostedProgramCapacity"
            ? {
                ...(stripCanonicalIdentity(stripAuthorText(legacy)) as object),
                capacityMu: 1,
              }
            : stripCanonicalIdentity(stripAuthorText(legacy)),
        );
        expect(
          Object.isFrozen(actual[family]),
          `${family}:${cardDefinitionId}`,
        ).toBe(true);
      }
    }
  });
});

function recursiveCardSpecPaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return recursiveCardSpecPaths(absolute);
    if (!entry.isFile() || !entry.name.endsWith(".card-spec.ts")) return [];
    return [path.relative(process.cwd(), absolute).replaceAll("\\", "/")];
  });
}

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
    markCounterDisplay: value.markCounterDisplay,
    printings: value.printings,
  };
}

function normalizeLegacyImplementation(
  cardDefinitionId: string,
  value: Record<string, any>,
) {
  const {
    printedSubroutines: _printed,
    regionBaseline: _region,
    ...rest
  } = value;
  const normalized = stripCanonicalIdentity(stripAuthorText(rest)) as Record<
    string,
    any
  >;
  if (cardDefinitionId !== "onr_proteus_139_eurocorpse-tm-spin-chip")
    return normalized;
  return {
    ...normalized,
    hostedProgramCapacity: {
      ...normalized.hostedProgramCapacity,
      capacityMu: 1,
    },
  };
}

function stripAuthorText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAuthorText);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "text")
      .map(([key, entry]) => [key, stripAuthorText(entry)]),
  );
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

function stripSubroutineIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSubroutineIdentity);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "id")
      .map(([key, entry]) => [key, stripSubroutineIdentity(entry)]),
  );
}

function normalizedSharedSubroutine(
  cardDefinitionId: string,
  value: Record<string, unknown>,
): unknown {
  const { traceBidLimit, ...rest } = value;
  if (traceBidLimit === undefined) return stripSubroutineIdentity(value);
  expect(cardDefinitionId).toBe("onr_proteus_025_homing-missile");
  expect(traceBidLimit).toBe(0);
  const variableRez = report.cards.find(
    (card) => card.cardDefinitionId === cardDefinitionId,
  )?.legacyImplementation.variableRez;
  expect(variableRez).toMatchObject({
    traceBaseFromValue: true,
    traceBidLimitFromValue: true,
  });
  return stripSubroutineIdentity(rest);
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
      damageType:
        subroutine.damageType === "brain" ? "core" : subroutine.damageType,
      amount: subroutine.amount,
    };
  if (subroutine.kind === "end_the_run") return { id, type: "end_the_run" };
  if (subroutine.kind === "trash_program")
    return { id, type: "trash_installed_program" };
  if (subroutine.kind === "trash_program_unless_runner_pays")
    return {
      id,
      type: "trash_installed_program_unless_runner_pays",
      amount: subroutine.amount,
    };
  if (subroutine.kind === "end_the_run_unless_runner_pays")
    return {
      id,
      type: "end_the_run_unless_runner_pays",
      amount: subroutine.amount,
    };
  if (subroutine.kind === "run_duration_ice_strength")
    return {
      id,
      type: "set_run_future_strength_bonus",
      amount: subroutine.amount,
      runFutureStrengthCancelPaymentAmount:
        subroutine.runnerMayCancelOnPassingSource.amount,
    };
  if (subroutine.kind === "trace") {
    const effects = subroutine.onSuccess;
    if (
      effects.length === 2 &&
      effects.some(
        (effect: Record<string, any>) => effect.kind === "end_run",
      ) &&
      effects.some(
        (effect: Record<string, any>) =>
          effect.kind === "runner_run_lock_until_action_paid",
      )
    ) {
      const runLock = effects.find(
        (effect: Record<string, any>) =>
          effect.kind === "runner_run_lock_until_action_paid",
      );
      return {
        id,
        type: "initiate_trace",
        baseTraceStrength: subroutine.baseTraceStrength,
        traceSuccessEffect: {
          type: "end_run_and_run_lock",
          amount: runLock.amount,
        },
      };
    }
    const effect = effects[0];
    return {
      id,
      type: "initiate_trace",
      baseTraceStrength: subroutine.baseTraceStrength,
      traceSuccessEffect:
        effect.kind === "preventable_damage"
          ? { type: "net_damage", amount: effect.amount }
          : {
              type: "add_counter",
              counterType: effect.counterType,
              amount: effect.amount,
            },
    };
  }
  if (
    subroutine.kind === "corp_gain_credit" ||
    subroutine.kind === "runner_lose_credits" ||
    subroutine.kind === "give_runner_tag"
  )
    return { id, type: subroutine.kind, amount: subroutine.amount };
  throw new Error(`unhandled_proteus_subroutine:${subroutine.kind}`);
}
