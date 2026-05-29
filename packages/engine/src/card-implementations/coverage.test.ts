import { readdirSync, readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEMO_CARDS_BY_ID } from "../index";
import {
  CARD_IMPLEMENTATION_COVERAGE_ENTRIES,
  CARD_IMPLEMENTATION_COVERAGE_OVERRIDES,
  cardImplementationCoverageForDefinitionId,
  isCurrentCardImplementationReleaseScopeDefinitionId,
} from "./coverage";
import {
  CARD_IMPLEMENTATIONS,
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  cardImplementationForDefinitionId,
} from "./registry";

type ProteusCardSet = {
  setId: string;
  cards: Array<{
    cardId: string;
    setId: string;
    title: string;
  }>;
};

type ProteusCardSupportManifest = {
  setId: string;
  cards: Array<{
    cardId: string;
    setId: string;
    statuses: {
      implemented: boolean;
      engine_supported: boolean;
      playable: boolean;
      human_playable: boolean;
      ai_supported: boolean;
      deck_legal: boolean;
      format_legal: boolean;
      blocked: boolean;
    };
    support: {
      resolverRef: string | null;
    };
  }>;
};

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

function readJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

function findTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return findTypeScriptFiles(path);
    if (entry.isFile() && path.endsWith(".ts")) return [path];
    return [];
  });
}

function duplicateIds(ids: readonly string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

function toRepoPath(path: string): string {
  return relative(repoRoot, path).split(sep).join("/");
}

type ProteusImplementationRow = {
  cardDefinitionId: string;
  filePath: string;
};

type ProteusCoverageReport = {
  cardSet: ProteusCardSet;
  manifest: ProteusCardSupportManifest;
  implementationRows: ProteusImplementationRow[];
  proteusCardIds: string[];
  manifestCardIds: string[];
  fileDefinitionIds: string[];
  uniqueFileDefinitionIds: string[];
  registryDefinitionIds: string[];
  missingCards: Array<{ cardDefinitionId: string; title: string }>;
  filesWithoutDefinitionId: string[];
  nonProteusFiles: ProteusImplementationRow[];
  unknownFileDefinitionIds: ProteusImplementationRow[];
  unregisteredProteusFiles: ProteusImplementationRow[];
  registeredProteusImplementationsWithoutFile: string[];
  duplicateFileDefinitionIds: string[];
  duplicateRegistryDefinitionIds: string[];
  manifestImplementedIds: string[];
  manifestImplementedWithoutFile: string[];
  manifestMissingImplementedForFile: string[];
  manifestStatusDrift: string[];
  manifestResolverDrift: string[];
  manifestLegalFlagDrift: string[];
};

function buildProteusCoverageReport(): ProteusCoverageReport {
  const cardSet = readJson<ProteusCardSet>(
    new URL("../../../../data/cards/proteus-cards.json", import.meta.url),
  );
  const manifest = readJson<ProteusCardSupportManifest>(
    new URL(
      "../../../../data/manifests/proteus-card-support.json",
      import.meta.url,
    ),
  );
  const implementationFiles = findTypeScriptFiles(
    fileURLToPath(new URL("./proteus", import.meta.url)),
  );
  const implementationRows = implementationFiles.map((filePath) => {
    const match = readFileSync(filePath, "utf8").match(
      /cardDefinitionId:\s*["']([^"']+)["']/,
    );
    return {
      cardDefinitionId: match?.[1] ?? "",
      filePath: toRepoPath(filePath),
    };
  });

  const proteusCardIds = cardSet.cards.map((card) => card.cardId);
  const proteusCardIdSet = new Set(proteusCardIds);
  const titleById = new Map(
    cardSet.cards.map((card) => [card.cardId, card.title]),
  );
  const manifestCardIds = manifest.cards.map((card) => card.cardId);
  const fileDefinitionIds = implementationRows.map(
    (row) => row.cardDefinitionId,
  );
  const uniqueFileDefinitionIds = [
    ...new Set(fileDefinitionIds.filter(Boolean)),
  ].sort();
  const uniqueFileDefinitionIdSet = new Set(uniqueFileDefinitionIds);
  const registryDefinitionIds = CARD_IMPLEMENTATIONS.filter((implementation) =>
    implementation.cardDefinitionId.startsWith("onr_proteus_"),
  ).map((implementation) => implementation.cardDefinitionId);
  const registryDefinitionIdSet = new Set(registryDefinitionIds);
  const manifestImplementedIds = manifest.cards
    .filter((card) => card.statuses.implemented)
    .map((card) => card.cardId)
    .sort();

  const filesWithoutDefinitionId = implementationRows
    .filter((row) => row.cardDefinitionId === "")
    .map((row) => row.filePath)
    .sort();
  const nonProteusFiles = implementationRows
    .filter(
      (row) =>
        row.cardDefinitionId !== "" &&
        !row.cardDefinitionId.startsWith("onr_proteus_"),
    )
    .sort((a, b) => a.filePath.localeCompare(b.filePath));
  const unknownFileDefinitionIds = implementationRows
    .filter(
      (row) =>
        row.cardDefinitionId !== "" &&
        !proteusCardIdSet.has(row.cardDefinitionId),
    )
    .sort((a, b) => a.cardDefinitionId.localeCompare(b.cardDefinitionId));
  const unregisteredProteusFiles = implementationRows
    .filter(
      (row) =>
        row.cardDefinitionId.startsWith("onr_proteus_") &&
        !registryDefinitionIdSet.has(row.cardDefinitionId),
    )
    .sort((a, b) => a.cardDefinitionId.localeCompare(b.cardDefinitionId));
  const registeredProteusImplementationsWithoutFile = registryDefinitionIds
    .filter((definitionId) => !uniqueFileDefinitionIdSet.has(definitionId))
    .sort();

  const missingCards = cardSet.cards
    .filter((card) => !uniqueFileDefinitionIdSet.has(card.cardId))
    .map((card) => ({
      cardDefinitionId: card.cardId,
      title: titleById.get(card.cardId) ?? card.cardId,
    }))
    .sort((a, b) => a.cardDefinitionId.localeCompare(b.cardDefinitionId));

  const manifestStatusDrift: string[] = [];
  const manifestResolverDrift: string[] = [];
  const manifestLegalFlagDrift: string[] = [];

  for (const card of manifest.cards) {
    const isImplementedByFile = uniqueFileDefinitionIdSet.has(card.cardId);
    if (
      card.statuses.ai_supported ||
      card.statuses.deck_legal ||
      card.statuses.format_legal
    ) {
      manifestLegalFlagDrift.push(card.cardId);
    }

    if (isImplementedByFile) {
      if (
        !card.statuses.implemented ||
        !card.statuses.engine_supported ||
        !card.statuses.playable ||
        !card.statuses.human_playable ||
        card.statuses.blocked
      ) {
        manifestStatusDrift.push(card.cardId);
      }
      if (card.support.resolverRef !== `engine:${card.cardId}`) {
        manifestResolverDrift.push(card.cardId);
      }
    } else {
      if (
        card.statuses.implemented ||
        card.statuses.engine_supported ||
        card.statuses.playable ||
        card.statuses.human_playable ||
        !card.statuses.blocked
      ) {
        manifestStatusDrift.push(card.cardId);
      }
      if (card.support.resolverRef !== null) {
        manifestResolverDrift.push(card.cardId);
      }
    }
  }

  return {
    cardSet,
    manifest,
    implementationRows,
    proteusCardIds,
    manifestCardIds,
    fileDefinitionIds,
    uniqueFileDefinitionIds,
    registryDefinitionIds,
    missingCards,
    filesWithoutDefinitionId,
    nonProteusFiles,
    unknownFileDefinitionIds,
    unregisteredProteusFiles,
    registeredProteusImplementationsWithoutFile,
    duplicateFileDefinitionIds: duplicateIds(fileDefinitionIds).sort(),
    duplicateRegistryDefinitionIds: duplicateIds(registryDefinitionIds).sort(),
    manifestImplementedIds,
    manifestImplementedWithoutFile: manifestImplementedIds
      .filter((definitionId) => !uniqueFileDefinitionIdSet.has(definitionId))
      .sort(),
    manifestMissingImplementedForFile: uniqueFileDefinitionIds
      .filter((definitionId) => !manifestImplementedIds.includes(definitionId))
      .sort(),
    manifestStatusDrift: manifestStatusDrift.sort(),
    manifestResolverDrift: manifestResolverDrift.sort(),
    manifestLegalFlagDrift: manifestLegalFlagDrift.sort(),
  };
}

function formatProteusCoverageReport(report: ProteusCoverageReport): string {
  const lines = [
    "Proteus CardImplementation verify:",
    `- total Proteus cards: ${report.proteusCardIds.length}`,
    `- unique implemented Proteus cardDefinitionIds from files: ${report.uniqueFileDefinitionIds.length}`,
    `- missing CardImplementation files: ${report.missingCards.length}`,
    `- unregistered Proteus files: ${report.unregisteredProteusFiles.length}`,
    `- registered Proteus implementations without file: ${report.registeredProteusImplementationsWithoutFile.length}`,
    `- duplicate file cardDefinitionIds: ${report.duplicateFileDefinitionIds.length}`,
    `- duplicate registry cardDefinitionIds: ${report.duplicateRegistryDefinitionIds.length}`,
    `- manifest implemented-without-file drift: ${report.manifestImplementedWithoutFile.length}`,
    `- manifest missing-implemented-for-file drift: ${report.manifestMissingImplementedForFile.length}`,
    `- manifest status drift: ${report.manifestStatusDrift.length}`,
    `- manifest resolverRef drift: ${report.manifestResolverDrift.length}`,
    `- manifest deck_legal/format_legal/ai_supported drift: ${report.manifestLegalFlagDrift.length}`,
    "Missing Proteus CardImplementation files:",
    ...report.missingCards.map(
      (card) => `- ${card.cardDefinitionId} :: ${card.title}`,
    ),
  ];
  return lines.join("\n");
}

describe("CardImplementation coverage and registry invariants", () => {
  const p344SimpleIcebreakers = [
    "onr_v1_039_krash",
    "onr_v1_014_codecracker",
    "onr_v1_016_cyfermaster",
    "onr_v1_052_raffles",
    "onr_v1_070_tinweasel",
    "onr_v1_073_wizards-book",
    "onr_v1_021_dwarf",
    "onr_v1_074_worm",
    "onr_v1_006_black-dahlia",
    "onr_v1_015_codeslinger",
    "onr_v1_040_loony-goon",
    "onr_v1_054_raptor",
    "onr_v1_060_shaka",
    "onr_v1_072_wild-card",
    "onr_v1_027_flak",
    "onr_v1_018_dogcatcher",
    "onr_v1_055_reflector",
    "onr_v1_056_replicator",
  ] as const;

  it("migrates P3.44 simple icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p344SimpleIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(
        implementation?.icebreakerAbilities?.length,
        definitionId,
      ).toBeGreaterThan(0);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.some(
        (entry) => entry.cardDefinitionId === "onr_v1_039_krash",
      ),
    ).toBe(false);
  });

  const p345SpecialIcebreakers = [
    "onr_v1_031_hammer",
    "onr_v1_036_jackhammer",
    "onr_v1_047_pile-driver",
    "onr_v1_053_ramming-piston",
    "onr_v1_019_dropp",
    "onr_v1_030_grubb",
    "onr_v1_037_japanese-water-torture",
    "onr_v1_066_snowball",
    "onr_v1_002_ai-boon",
    "onr_v1_007_blink",
    "onr_v1_005_bartmoss-memorial-icebreaker",
    "onr_v1_020_dupre",
    "onr_v1_023_evil-twin",
  ] as const;

  it("migrates P3.45 special icebreakers into CardImplementation coverage", () => {
    for (const definitionId of p345SpecialIcebreakers) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(
        implementation?.icebreakerAbilities?.length,
        definitionId,
      ).toBeGreaterThan(0);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_023_evil-twin"),
    ).toMatchObject({
      damagePreventionSources: expect.any(Array),
    });
  });

  it("migrates P3.46 daemon hosting and Chimera into CardImplementation coverage", () => {
    const daemonSpecs = [
      ["onr_v1_001_afreet", 3, true],
      ["onr_v1_033_imp", 2, true],
      ["onr_v1_069_succubus", 3, false],
    ] as const;
    for (const [definitionId, capacityMu, reducesStrength] of daemonSpecs) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.hostedProgramCapacity).toMatchObject({
        capacityMu,
        allowedCardTypes: ["program"],
        hostedProgramsAreInstalled: true,
        hostLeavesPlayTrashesHosted: true,
      });
      expect(Boolean(implementation?.hostedProgramModifiers?.length)).toBe(
        reducesStrength,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_353_chimera")?.accessEffects,
    ).toEqual([
      {
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_cards",
            target: "daemon",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ]);
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_353_chimera"),
    ).toMatchObject({
      cardDefinitionId: "onr_v1_353_chimera",
      status: "implemented",
    });
  });

  it("migrates P3.47 runner recycle preps into CardImplementation coverage", () => {
    expect(
      cardImplementationForDefinitionId("onr_v1_100_misc-for-sale")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "trash_own_installed_cards_for_credits",
            target: "chosen_installed_runner_cards",
            min: 0,
            max: "any",
            gainPerTrashed: 3,
            visibility: "public",
          },
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_103_organ-donor")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "trash_cards_from_grip_for_credits",
            target: "chosen_runner_grip_cards",
            max: 5,
            gainPerTrashed: 2,
            visibility: "hidden_info_barrier",
          },
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_101_mit-west-tier")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          {
            kind: "shuffle_grip_trash_and_stack_then_draw",
            drawCount: 5,
            removePlayedCardFromGame: true,
            visibility: "hidden_info_barrier",
          },
        ],
      }),
    );
    for (const definitionId of [
      "onr_v1_100_misc-for-sale",
      "onr_v1_101_mit-west-tier",
      "onr_v1_103_organ-donor",
    ] as const) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_131_microtech-backup-drive",
      )?.status,
    ).toBe("implemented");
  });

  it("migrates P3.48 run control cards into CardImplementation coverage", () => {
    const implemented = [
      "onr_v1_076_all-nighter",
      "onr_v1_094_inside-job",
      "onr_v1_112_stumble-through-wilderspace",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_080_core-command-jettison-ice",
      "onr_v1_109_security-code-worm-chip",
      "onr_v1_044_netspace-inverter",
      "onr_v1_086_forged-activation-orders",
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_123_bodyweight-data-creche")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "optional_make_run_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_044_netspace-inverter")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "reverse_ice_on_successful_run_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_088_fortress-respecification"),
    ).toBeDefined();
  });

  it("migrates P3.51 Corp utility operations and nodes into CardImplementation coverage", () => {
    const p351Cards = [
      "onr_v1_297_overtime-incentives",
      "onr_v1_289_edgerunner-inc-temps",
      "onr_v1_296_off-site-backups",
      "onr_v1_298_planning-consultants",
      "onr_v1_306_trojan-horse",
      "onr_v1_303_silver-lining-recovery-protocol",
      "onr_v1_286_corporate-detective-agency",
      "onr_v1_299_power-grid-overload",
      "onr_v1_322_euromarket-consortium",
      "onr_v1_336_rescheduler",
      "onr_v1_316_cowboy-sysop",
      "onr_v1_333_omniscience-foundation",
      "onr_v1_319_disinfectant-inc",
      "onr_v1_332_newsgroup-taunting",
      "onr_v1_330_krumz",
    ] as const;

    for (const definitionId of p351Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_319_disinfectant-inc")
        ?.corpUtility,
    ).toMatchObject({ kind: "disinfectant_avoid_virus_counter" });
    expect(
      cardImplementationForDefinitionId("onr_v1_330_krumz")?.corpUtility,
    ).toMatchObject({ kind: "krumz_trace_bit" });
  });

  it("migrates P3.52 fort ICE-control windows into CardImplementation coverage", () => {
    const p352Cards = [
      "onr_v1_363_olivia-salazar",
      "onr_v1_364_omni-kismet-ph-d",
      "onr_v1_369_singapore-city-grid",
      "onr_v1_026_false-echo",
    ] as const;

    for (const definitionId of p352Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_363_olivia-salazar")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "discounted_rez_ice_on_this_fort",
        discount: "half_rez_cost_rounded_down",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_364_omni-kismet-ph-d")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_369_singapore-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_026_false-echo")
        ?.successfulRunFollowups,
    ).toContainEqual(
      expect.objectContaining({
        kind: "force_rez_ice_outermost_inward_after_successful_run",
      }),
    );
  });

  it("migrates P3.53 run/encounter interventions into CardImplementation coverage", () => {
    const p353Cards = [
      "onr_v1_065_smarteye",
      "onr_v1_067_speed-trap",
      "onr_v1_242_fatal-attractor",
      "onr_v1_247_haunting-inquisition",
      "onr_v1_271_tko-2-0",
    ] as const;

    for (const definitionId of p353Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_065_smarteye")
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "approach_ice_expose_then_jack_out_before_rez",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_067_speed-trap")
        ?.runEncounterInterventions,
    ).toContainEqual(
      expect.objectContaining({
        kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_242_fatal-attractor")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({
        kind: "next_encounter_unless_fully_break_damage",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_247_haunting-inquisition")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({ kind: "runner_run_lock_actions", amount: 6 }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_271_tko-2-0")
        ?.printedSubroutines,
    ).toContainEqual(
      expect.objectContaining({ kind: "runner_forgoes_next_action" }),
    );
  });

  it("migrates P3.54 delayed fort run windows into CardImplementation coverage", () => {
    const p354Cards = [
      "onr_v1_349_aardvark",
      "onr_v1_358_dr-dreff",
      "onr_v1_359_jenny-jett",
      "onr_v1_372_turbeau-delacroix",
      "onr_v1_373_twenty-four-hour-surveillance",
    ] as const;

    for (const definitionId of p354Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_358_dr-dreff")?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "temporary_hq_ice_encounter_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_359_jenny-jett")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "install_hq_ice_innermost_after_successful_run",
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_373_twenty-four-hour-surveillance",
      )?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "block_stealth_bits_during_runs_on_this_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_372_turbeau-delacroix")
        ?.accessEffects?.[0]?.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "trace",
        baseTraceStrength: 10,
      }),
    );
  });

  it("migrates P3.55 fort region longtail cards into CardImplementation coverage", () => {
    const p355Cards = [
      "onr_v1_365_paris-city-grid",
      "onr_v1_367_rio-de-janeiro-city-grid",
      "onr_v1_368_roving-submarine",
      "onr_v1_371_tokyo-chiba-infighting",
      "onr_v1_361_namatoki-plaza",
    ] as const;

    for (const definitionId of p355Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_365_paris-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "corp_trace_bits_during_runs_on_this_fort",
        amount: 3,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_367_rio-de-janeiro-city-grid")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "roll_die_on_pass_rezzed_ice_on_same_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_368_roving-submarine")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "can_run_fort_only_if_last_corp_turn_activity_on_fort",
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_371_tokyo-chiba-infighting")
        ?.fortRunWindows,
    ).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits_after_unsuccessful_run_on_same_fort",
        amount: 2,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_v1_361_namatoki-plaza")
        ?.fortCapacityModifiers,
    ).toContainEqual(
      expect.objectContaining({
        kind: "additional_agenda_or_node_slot_inside_fort",
        amount: 1,
      }),
    );
  });

  it("migrates P3.56 remaining Corp ICE longtail subroutines into CardImplementation coverage", () => {
    const p356Cards = [
      "onr_v1_222_ball-and-chain",
      "onr_v1_228_cinderella",
      "onr_v1_248_homewrecker",
      "onr_v1_260_pocket-virtual-reality",
      "onr_v1_272_too-many-doors",
      "onr_v1_275_vacuum-link",
      "onr_v1_276_viral-15",
    ] as const;

    for (const definitionId of p356Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_260_pocket-virtual-reality")
        ?.iceEncounter,
    ).toMatchObject({
      kind: "add_encounter_temporary_credits",
      amount: 4,
    });
    expect(
      cardImplementationForDefinitionId("onr_v1_276_viral-15")
        ?.printedSubroutines,
    ).toHaveLength(2);
  });

  it("migrates Proteus Phase 1a reuse-only cards into CardImplementation coverage", () => {
    const phase1aCards = [
      "onr_proteus_041_toughoniumtm-wall",
      "onr_proteus_065_networked-center",
      "onr_proteus_072_research-bunker",
      "onr_proteus_077_weapons-depot",
      "onr_proteus_150_streetware-distributor",
    ] as const;

    for (const definitionId of phase1aCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_041_toughoniumtm-wall")
        ?.printedSubroutines,
    ).toHaveLength(4);
    expect(
      cardImplementationForDefinitionId(
        "onr_proteus_150_streetware-distributor",
      )?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
    });
  });

  it("migrates Proteus Phase 1b dynamic public ETR ICE into CardImplementation coverage", () => {
    const phase1bCards = [
      "onr_proteus_031_minotaur",
      "onr_proteus_034_riddler",
    ] as const;

    for (const definitionId of phase1bCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_031_minotaur")
        ?.modifiers?.[0],
    ).toMatchObject({
      kind: "additional_subroutine",
      sourceZone: "corp_installed",
      appliesTo: { sourceCardOnly: true },
      repeat: {
        kind: "for_each_rezzed_installed_ice",
        subtypeAnyOf: ["code_gate", "wall"],
        excludeSource: true,
      },
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_034_riddler")
        ?.abilities?.[0],
    ).toMatchObject({
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
    });
  });

  it("migrates Proteus Phase 1d public fort pass windows into CardImplementation coverage", () => {
    const phase1dCards = [
      "onr_proteus_062_lesley-major",
      "onr_proteus_070_rasmin-bridger",
    ] as const;

    for (const definitionId of phase1dCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_proteus_062_lesley-major")
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
      timing: "pass_last_ice_on_this_fort",
      target: "advanceable_installed_card_in_this_fort",
    });
    expect(
      cardImplementationForDefinitionId("onr_proteus_070_rasmin-bridger")
        ?.fortRunWindows?.[0],
    ).toMatchObject({
      kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      timing: "pass_ice_on_this_fort",
      amount: 1,
    });
  });

  it("migrates Proteus Phase 1g post-pass derez utility into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_085_disintegrator";
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail,
    ).toMatchObject({
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: { kind: "credit", amount: 2 },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
    });
  });

  it("migrates Proteus Phase 8d runner virus run counters into CardImplementation coverage", () => {
    const implemented = [
      "onr_proteus_090_highlighter",
      "onr_proteus_097_taxman",
      "onr_proteus_098_vienna-22",
      "onr_proteus_099_viral-pipeline",
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 8e virus access-trash programs into CardImplementation coverage", () => {
    const implemented = [
      "onr_proteus_084_crumble",
      "onr_proteus_089_garbage-in",
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 8f random Bad-Publicity virus longtails into CardImplementation coverage", () => {
    const implemented = [
      "onr_proteus_078_armageddon",
      "onr_proteus_094_scaldan",
    ] as const;

    for (const definitionId of implemented) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
        definitionId,
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates Proteus Phase 2b scored-agenda Bad Publicity into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_002_charity-takeover";
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.lifecycle?.on_score,
    ).toEqual([
      expect.objectContaining({
        kind: "gain_credits",
        recipient: "corp",
        amount: 9,
      }),
      expect.objectContaining({
        kind: "add_bad_publicity",
        amount: 1,
      }),
    ]);
  });

  it("migrates Proteus Phase 2c direct runner event BP damage into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_108_faked-hit";
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.abilities?.[0],
    ).toMatchObject({
      kind: "on_play",
      costs: "printed",
      effects: [
        { kind: "add_bad_publicity", amount: 1 },
        {
          kind: "damage",
          damageType: "core",
          amount: 2,
          preventable: false,
        },
      ],
    });
  });

  it("migrates Proteus Phase 2d installed-connection BP cost into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_117_poisoned-water-supply";
    expect(
      cardImplementationForDefinitionId(definitionId),
      definitionId,
    ).toBeDefined();
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
    expect(
      cardImplementationForDefinitionId(definitionId)?.runnerEventLongtail,
    ).toMatchObject({
      kind: "trash_installed_runner_connections_then_add_bad_publicity",
      count: 2,
      badPublicity: 1,
      visibility: "hidden_info_barrier",
    });
  });

  it("migrates Proteus Phase 3a variable ICE into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_020_digiconda",
        variableRez: {
          kind: "x_strength",
          additionalCostPerValue: 1,
          minValue: 0,
          maxValue: 6,
        },
      },
      {
        definitionId: "onr_proteus_022_food-fight",
        variableRez: {
          kind: "paid_end_the_run_subroutines",
          additionalCostPerSubroutine: 2,
          minSubroutines: 0,
        },
      },
    ] as const;

    for (const { definitionId, variableRez } of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.variableRez,
      ).toMatchObject(variableRez);
    }
  });

  it("migrates Proteus Phase 3b variable ICE into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_013_caryatid",
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: "onr_proteus_017_credit-blocks",
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: "onr_proteus_023_galatea",
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: "onr_proteus_024_gatekeeper",
        variableRez: { kind: "paid_end_the_run_subroutines" },
      },
      {
        definitionId: "onr_proteus_025_homing-missile",
        variableRez: {
          kind: "x_strength",
          maxValue: 8,
          traceBaseFromValue: true,
          traceBidLimitFromValue: true,
        },
      },
      {
        definitionId: "onr_proteus_028_lesser-arcana",
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
      {
        definitionId: "onr_proteus_036_sandstorm",
        variableRez: { kind: "paid_end_the_run_subroutines" },
      },
      {
        definitionId: "onr_proteus_039_sphinx-2006",
        variableRez: { kind: "alternate_subtype", additionalCost: 4 },
      },
      {
        definitionId: "onr_proteus_040_sumo-2008",
        variableRez: { kind: "alternate_subtype", additionalCost: 1 },
      },
    ] as const;

    for (const { definitionId, variableRez } of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.variableRez,
      ).toMatchObject(variableRez);
    }
  });

  it("migrates Proteus Phase 3c relative ICE into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_012_bug-zapper",
      "onr_proteus_021_dog-pile",
      "onr_proteus_026_hunting-pack",
      "onr_proteus_030_mastermind",
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.relativeIce,
      ).toMatchObject({
        kind: "rezzed_ice_outside_this_ice",
      });
    }
  });

  it("migrates Proteus Phase 3e ICE repositioning into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_033_mobile-barricade",
      "onr_proteus_044_walking-wall",
    ] as const;

    for (const definitionId of cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(definitionId)?.fortRunWindows?.[0],
      ).toMatchObject({
        kind: "move_self_to_different_position_on_same_fort",
        timing: "start_of_run_on_this_fort",
        target: "different_position_on_same_fort",
      });
    }
  });

  it("migrates Proteus PRO004 simple icebreakers into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_079_big-frackin-gun",
        breakCost: 6,
        matcher: { kind: "ice_subtype", subtype: "sentry" },
        count: 5,
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_081_boring-bit",
        breakCost: 2,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_083_corrosion",
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_093_redecorator",
        breakCost: 1,
        matcher: { kind: "ice_subtype", subtype: "sentry" },
        count: 2,
        pumpCost: 3,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_095_skeleton-passkeys",
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "code_gate" },
        pumpCost: 3,
        pumpAmount: 4,
      },
      {
        definitionId: "onr_proteus_100_wrecking-ball",
        breakCost: 0,
        matcher: { kind: "ice_subtype", subtype: "wall" },
        pumpCost: 2,
        pumpAmount: 1,
        stealthLoss: 1,
      },
    ] as const;

    for (const testCase of cases) {
      const implementation = cardImplementationForDefinitionId(
        testCase.definitionId,
      );
      expect(implementation, testCase.definitionId).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });

      const abilities = implementation?.icebreakerAbilities ?? [];
      expect(abilities.length, testCase.definitionId).toBeGreaterThanOrEqual(2);

      const breakAbility = abilities.find(
        (ability) => ability.kind === "break_subroutine",
      );
      expect(breakAbility, testCase.definitionId).toMatchObject({
        kind: "break_subroutine",
        cost: { kind: "credit", amount: testCase.breakCost },
        matches: testCase.matcher,
        visibility: "public",
      });
      if ("count" in testCase) {
        expect(breakAbility, testCase.definitionId).toMatchObject({
          count: testCase.count,
        });
      } else {
        expect(breakAbility, testCase.definitionId).not.toHaveProperty("count");
      }
      if ("stealthLoss" in testCase) {
        expect(breakAbility, testCase.definitionId).toMatchObject({
          onSuccessfulBreak: [
            {
              kind: "lose_bits_from_stealth_sources",
              amount: testCase.stealthLoss,
              mode: "up_to_if_available",
            },
          ],
        });
      }

      expect(
        abilities.find((ability) => ability.kind === "increase_strength"),
        testCase.definitionId,
      ).toMatchObject({
        kind: "increase_strength",
        cost: { kind: "credit", amount: testCase.pumpCost },
        amount: testCase.pumpAmount,
        duration: "current_encounter",
        visibility: "public",
      });
    }
  });

  it("migrates Proteus PRO005 simple runner economy/draw events into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_103_cruising-for-netwatch",
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          },
        ],
      },
      {
        definitionId: "onr_proteus_124_stakeout",
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 2,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(testCase.definitionId)?.abilities,
      ).toContainEqual(
        expect.objectContaining({
          kind: "on_play",
          costs: "printed",
          effects: testCase.effects,
        }),
      );
    }
  });

  it("migrates Proteus Phase 9d data-fort creation lock into CardImplementation coverage", () => {
    const definitionId = "onr_proteus_146_precision-bribery";

    expect(cardImplementationForDefinitionId(definitionId)).toMatchObject({
      modifiers: [
        {
          kind: "new_data_fort_creation_lock",
          activeWhile: "installed",
          sourceZone: "runner_installed",
          blocks: "corp_new_remote_installs",
          corpTrashSourceCost: { clicks: 1, credits: 4 },
        },
      ],
    });
    expect(
      cardImplementationCoverageForDefinitionId(definitionId),
    ).toMatchObject({
      cardDefinitionId: definitionId,
      status: "implemented",
    });
  });

  it("migrates P3.57 runner sabotage prep cards into CardImplementation coverage", () => {
    const p357Cards = [
      "onr_v1_077_anonymous-tip",
      "onr_v1_082_deal-with-militech",
      "onr_v1_083_desperate-competitor",
      "onr_v1_090_hot-tip-for-wns",
      "onr_v1_098_lucidrine-booster-drug",
      "onr_v1_113_synchronized-attack-on-hq",
      "onr_v1_115_terrorist-reprisal",
      "onr_v1_117_valu-pak-software-bundle",
    ] as const;

    for (const definitionId of p357Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_088_fortress-respecification"),
    ).toBeDefined();
    expect(
      cardImplementationForDefinitionId("onr_v1_111_social-engineering"),
    ).toBeDefined();
  });

  it("migrates P3.58 hidden replacement longtail cards into CardImplementation coverage", () => {
    const p358Cards = [
      "onr_v1_088_fortress-respecification",
      "onr_v1_111_social-engineering",
      "onr_v1_294_new-blood",
      "onr_v1_176_the-shell-traders",
      "onr_v1_351_bizarre-encryption-scheme",
      "onr_v1_155_code-viral-cache",
    ] as const;

    for (const definitionId of p358Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_131_microtech-backup-drive"),
    ).toBeDefined();
  });

  it("migrates P3.59 runner utility longtail cards into CardImplementation coverage", () => {
    const p359Cards = [
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_068_startup-immolator",
      "onr_v1_051_rabbit",
      "onr_v1_182_submarine-uplink",
      "onr_v1_032_i-spy",
      "onr_v1_162_field-reporter-for-ice-and-data",
      "onr_v1_171_preying-mantis",
      "onr_v1_172_quest-for-cattekin",
      "onr_v1_132_microtech-trode-set",
    ] as const;

    for (const definitionId of p359Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.60 Corporate Ally Karl de Veres Smith's Pawnshop Databroker Wilson Nevinyrral I Got a Rock Schlaghund Crash Everett unique direct CardImplementation coverage", () => {
    const p360ImplementedCards = [
      "onr_v1_156_corporate-ally",
      "onr_v1_166_karl-de-veres-corporate-stooge",
      "onr_v1_180_smiths-pawnshop",
      "onr_v1_159_databroker",
      "onr_v1_331_nevinyrral",
      "onr_v1_327_i-got-a-rock",
      "onr_v1_339_schlaghund",
    ] as const;

    for (const definitionId of p360ImplementedCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_187_wilson-weeflerunner-apprentice",
      ),
    ).toBeDefined();
    expect(
      cardImplementationForDefinitionId(
        "onr_v1_157_crash-everett-inventive-fixer",
      ),
    ).toBeDefined();
  });

  it("migrates P3.61 remaining replacement longtail CardImplementation coverage", () => {
    const p361Cards = [
      "onr_v1_157_crash-everett-inventive-fixer",
      "onr_v1_187_wilson-weeflerunner-apprentice",
      "onr_v1_308_acme-savings-and-loan",
      "onr_v1_329_investment-firm",
      "onr_v1_313_city-surveillance",
      "onr_v1_325_hacker-tracker-central",
      "onr_v1_354_crybaby",
    ] as const;

    for (const definitionId of p361Cards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
  });

  it("migrates P3.62 remaining singleton CardImplementation coverage", () => {
    const implementedCards = [
      "onr_v1_012_clown",
      "onr_v1_104_playful-ai",
      "onr_v1_173_restrictive-net-zoning",
    ] as const;

    for (const definitionId of implementedCards) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_220_tycho-extension"),
    ).toBeUndefined();
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_220_tycho-extension"),
    ).toMatchObject({
      cardDefinitionId: "onr_v1_220_tycho-extension",
      status: "no_engine_behavior_required",
    });
  });

  it("reconciles Proteus manifest support against concrete files and registry", () => {
    const report = buildProteusCoverageReport();
    process.stdout.write(`${formatProteusCoverageReport(report)}\n`);

    expect(report.cardSet.setId).toBe("proteus");
    expect(report.proteusCardIds).toHaveLength(154);
    expect(report.manifest.setId).toBe("proteus");
    expect(report.manifest.cards).toHaveLength(154);
    expect([...report.manifestCardIds].sort()).toEqual(
      [...report.proteusCardIds].sort(),
    );
    expect(duplicateIds(report.proteusCardIds)).toEqual([]);
    expect(duplicateIds(report.manifestCardIds)).toEqual([]);

    expect(report.implementationRows.length).toBeGreaterThan(0);
    expect(report.filesWithoutDefinitionId).toEqual([]);
    expect(report.nonProteusFiles).toEqual([]);
    expect(report.unknownFileDefinitionIds).toEqual([]);
    expect(report.duplicateFileDefinitionIds).toEqual([]);
    expect(report.duplicateRegistryDefinitionIds).toEqual([]);
    expect(report.unregisteredProteusFiles).toEqual([]);
    expect(report.registeredProteusImplementationsWithoutFile).toEqual([]);
    expect([...report.registryDefinitionIds].sort()).toEqual(
      [...report.uniqueFileDefinitionIds].sort(),
    );
    expect(report.manifestImplementedIds).toEqual(
      [...report.uniqueFileDefinitionIds].sort(),
    );
    expect(report.manifestImplementedWithoutFile).toEqual([]);
    expect(report.manifestMissingImplementedForFile).toEqual([]);
    expect(report.manifestStatusDrift).toEqual([]);
    expect(report.manifestResolverDrift).toEqual([]);
    expect(report.manifestLegalFlagDrift).toEqual([]);

    for (const row of report.implementationRows) {
      expect(row.cardDefinitionId, row.filePath).toMatch(/^onr_proteus_/);
      expect(report.proteusCardIds, row.filePath).toContain(
        row.cardDefinitionId,
      );
    }

    for (const card of report.manifest.cards) {
      const isImplemented = report.uniqueFileDefinitionIds.includes(
        card.cardId,
      );
      expect(card.setId, card.cardId).toBe("proteus");
      expect(card.statuses.ai_supported, card.cardId).toBe(false);
      expect(card.statuses.deck_legal, card.cardId).toBe(false);
      expect(card.statuses.format_legal, card.cardId).toBe(false);

      if (isImplemented) {
        expect(card.statuses, card.cardId).toMatchObject({
          implemented: true,
          engine_supported: true,
          playable: true,
          human_playable: true,
          blocked: false,
        });
        expect(card.support.resolverRef, card.cardId).toBe(
          `engine:${card.cardId}`,
        );
      } else {
        expect(card.statuses, card.cardId).toMatchObject({
          implemented: false,
          engine_supported: false,
          playable: false,
          human_playable: false,
          blocked: true,
        });
        expect(card.support.resolverRef, card.cardId).toBeNull();
      }
    }
  });

  it("requires implementation coverage for every demo card", () => {
    const implementationIds = CARD_IMPLEMENTATIONS.map(
      (implementation) => implementation.cardDefinitionId,
    );
    expect(duplicateIds(implementationIds)).toEqual([]);
    const coverageIds = CARD_IMPLEMENTATION_COVERAGE_ENTRIES.map(
      (entry) => entry.cardDefinitionId,
    );
    expect(duplicateIds(coverageIds)).toEqual([]);
    expect(
      duplicateIds(
        CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.map(
          (entry) => entry.cardDefinitionId,
        ),
      ),
    ).toEqual([]);

    for (const definitionId of Object.keys(DEMO_CARDS_BY_ID)) {
      const coverage = cardImplementationCoverageForDefinitionId(definitionId);
      expect(coverage, definitionId).toBeDefined();
      expect(coverage?.cardDefinitionId).toBe(definitionId);
      expect(coverage?.reason.trim(), definitionId).not.toBe("");
    }

    for (const entry of CARD_IMPLEMENTATION_COVERAGE_ENTRIES) {
      if (
        entry.status !== "implemented" &&
        entry.status !== "partial_implementation"
      )
        continue;
      const implementation =
        CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[entry.cardDefinitionId];
      if (entry.status === "partial_implementation") {
        expect(entry.reason, entry.cardDefinitionId).toMatch(
          /missing|fehlt|removed|no generic/i,
        );
        if (!implementation) continue;
      }
      expect(implementation, entry.cardDefinitionId).toBeDefined();
    }

    for (const implementation of CARD_IMPLEMENTATIONS) {
      expect(
        cardImplementationCoverageForDefinitionId(
          implementation.cardDefinitionId,
        )?.status,
        implementation.cardDefinitionId,
      ).toMatch(/^(implemented|partial_implementation)$/);
    }
  });

  it("reconciles CardImplementation coverage against the ONR-v1 release scope", () => {
    const coverageByStatus = new Map<string, number>();
    for (const entry of CARD_IMPLEMENTATION_COVERAGE_ENTRIES) {
      coverageByStatus.set(
        entry.status,
        (coverageByStatus.get(entry.status) ?? 0) + 1,
      );
    }

    const currentReleaseDefinitionIds = Object.keys(DEMO_CARDS_BY_ID).filter(
      (definitionId) =>
        isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );
    const outsideScopeDefinitionIds = Object.keys(DEMO_CARDS_BY_ID).filter(
      (definitionId) =>
        !isCurrentCardImplementationReleaseScopeDefinitionId(definitionId),
    );

    expect(currentReleaseDefinitionIds).toHaveLength(374);
    expect(outsideScopeDefinitionIds).toHaveLength(206);
    expect(CARD_IMPLEMENTATIONS).toHaveLength(527);
    expect(coverageByStatus.get("implemented")).toBe(527);
    expect(coverageByStatus.get("no_engine_behavior_required")).toBe(1);
    expect(coverageByStatus.get("outside_current_release_scope")).toBe(52);
    expect(coverageByStatus.get("pending_implementation") ?? 0).toBe(0);
    expect(coverageByStatus.get("partial_implementation") ?? 0).toBe(0);
    expect(coverageByStatus.get("legacy_engine_special_case") ?? 0).toBe(0);

    for (const definitionId of currentReleaseDefinitionIds) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).not.toBe("outside_current_release_scope");
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).not.toBe("pending_implementation");
    }

    for (const definitionId of outsideScopeDefinitionIds) {
      if (CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId]) {
        expect(
          cardImplementationCoverageForDefinitionId(definitionId)?.status,
          definitionId,
        ).toBe("implemented");
      } else {
        expect(
          cardImplementationCoverageForDefinitionId(definitionId)?.status,
          definitionId,
        ).toBe("outside_current_release_scope");
      }
    }
  });

  it("registers migrated runner successful-run and access-interface cards as implemented", () => {
    const p332Cases = [
      "onr_v1_081_custodial-position",
      "onr_v1_084_edited-shipping-manifests",
      "onr_v1_085_executive-wiretaps",
      "onr_v1_096_kilroy-was-here",
      "onr_v1_105_priority-wreck",
      "onr_v1_106_private-ldl-access",
      "onr_v1_107_romp-through-hq",
      "onr_v1_118_weather-to-finance-pipe",
      "onr_v1_062_shredder-uplink-protocol",
      "onr_v1_050_r-and-d-protocol-files",
      "onr_v1_129_hq-interface",
      "onr_v1_139_r-and-d-interface",
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_183_technician-lover",
      "onr_v1_041_microtech-ai-interface",
      "onr_v1_142_record-reconstructor",
    ] as const;

    for (const definitionId of p332Cases) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("migrates Proteus PRO006 simple Corp ICE resolvers into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_011_brain-wash",
        printedSubroutines: [
          {
            kind: "damage",
            damageType: "brain",
            amount: 1,
            preventable: true,
            text: "*Do 1 brain damage.",
          },
        ],
      },
      {
        definitionId: "onr_proteus_015_colonel-failure",
        printedSubroutines: [
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "trash_program", text: "*Trash a program." },
          { kind: "end_the_run", text: "*End the run." },
          { kind: "end_the_run", text: "*End the run." },
        ],
      },
      {
        definitionId: "onr_proteus_032_misleading-access-menus",
        printedSubroutines: [
          {
            kind: "end_the_run_unless_runner_pays",
            amount: 1,
            text: "*End the run unless Runner pays [1].",
          },
        ],
        lifecycle: {
          on_rez: [
            {
              kind: "gain_credits",
              recipient: "corp",
              amount: 3,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: "onr_proteus_038_snowbank",
        printedSubroutines: [
          {
            kind: "end_the_run_unless_runner_pays",
            amount: 1,
            text: "*End the run unless Runner pays [1].",
          },
        ],
        lifecycle: {
          on_rez: [
            {
              kind: "gain_credits",
              recipient: "corp",
              amount: 3,
              visibility: "public",
            },
          ],
        },
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(testCase.definitionId)
          ?.printedSubroutines,
        testCase.definitionId,
      ).toEqual(testCase.printedSubroutines);
      if ("lifecycle" in testCase) {
        expect(
          cardImplementationForDefinitionId(testCase.definitionId)?.lifecycle,
          testCase.definitionId,
        ).toEqual(testCase.lifecycle);
      }
    }
  });

  it("migrates Proteus PRO007 Corp Operation economy, trace, and history cards into CardImplementation coverage", () => {
    const cases = [
      {
        definitionId: "onr_proteus_047_credit-consolidation",
        ability: {
          kind: "on_play",
          costs: "printed",
          effects: [
            {
              kind: "gain_credits",
              recipient: "controller",
              amount: 15,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: "onr_proteus_048_data-sifters",
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_trashed_node_last_turn" },
          effects: [
            {
              kind: "add_tags",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      },
      {
        definitionId: "onr_proteus_050_manhunt",
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_attempted_run_last_turn", minimumRuns: 1 },
          effects: [
            {
              kind: "trace",
              baseTraceStrength: 6,
              visibility: "public",
              onSuccess: [
                {
                  kind: "add_tags_by_trace_margin_over_runner_link",
                  recipient: "runner",
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
      {
        definitionId: "onr_proteus_052_schlaghund-pointers",
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_attempted_run_this_game", minimumRuns: 1 },
          effects: [
            {
              kind: "trace",
              baseTraceStrength: 3,
              additionalPlayCostPerBaseTracePointAboveZero: 1,
              visibility: "public",
              onSuccess: [
                {
                  kind: "add_tags",
                  recipient: "runner",
                  amount: 1,
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
      {
        definitionId: "onr_proteus_053_underworld-mole",
        ability: {
          kind: "on_play",
          costs: "printed",
          condition: { kind: "runner_installed_resource_last_turn" },
          effects: [
            {
              kind: "trace",
              baseTraceStrength: 4,
              visibility: "public",
              onSuccess: [
                {
                  kind: "trash_runner_resource_and_add_tag",
                  target: "runner_resource_installed_last_turn",
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        cardImplementationForDefinitionId(testCase.definitionId),
        testCase.definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(testCase.definitionId),
      ).toMatchObject({
        cardDefinitionId: testCase.definitionId,
        status: "implemented",
      });
      expect(
        cardImplementationForDefinitionId(testCase.definitionId)?.abilities,
      ).toContainEqual(testCase.ability);
    }
  });

  it("migrates Proteus PRO008 Runner Event Run/Economy/Followup Suite into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_101_all-hands",
      "onr_proteus_104_decoy-signal",
      "onr_proteus_105_demolition-run",
      "onr_proteus_106_disgruntled-ice-technician",
      "onr_proteus_107_drone-for-a-day",
      "onr_proteus_114_on-the-fast-track",
      "onr_proteus_118_prearranged-drop",
      "onr_proteus_120_reconnaissance",
      "onr_proteus_121_remote-detonator",
      "onr_proteus_122_rush-hour",
      "onr_proteus_127_weefle-initiation",
      "onr_proteus_130_back-door-to-rivals",
      "onr_proteus_148_runner-sensei",
    ] as const;

    for (const definitionId of cases) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId("onr_proteus_101_all-hands")?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        kind: "on_play",
        effects: [
          expect.objectContaining({
            kind: "make_run",
            target: { kind: "central_server", server: "hq" },
            accessCount: 4,
            prohibitNoisyIcebreakers: true,
          }),
        ],
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_proteus_130_back-door-to-rivals")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        timing: "trace_base_link_window",
        effects: [
          expect.objectContaining({
            kind: "use_base_link",
            baseLink: 2,
            rewardCreditsOnAvoidTrace: 1,
          }),
        ],
      }),
    );
  });

  it("migrates Proteus PRO011 hidden resource economy/access suite into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_128_airport-locker",
      "onr_proteus_133_chiba-bank-account",
      "onr_proteus_142_hq-mole",
      "onr_proteus_143_liberated-savings-account",
      "onr_proteus_147_r-and-d-mole",
      "onr_proteus_149_simulacrum",
      "onr_proteus_152_swiss-bank-account",
      "onr_proteus_153_time-to-collect",
    ] as const;

    for (const definitionId of cases) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId("onr_proteus_152_swiss-bank-account")
        ?.abilities,
    ).toHaveLength(2);
    expect(
      cardImplementationForDefinitionId("onr_proteus_153_time-to-collect")
        ?.trashPreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        protectsCardTypes: ["resource"],
        excludesSelf: true,
        cost: { kind: "tap_source" },
      }),
    );
  });

  it("migrates Proteus PRO012 hidden resource prevention/sabotage suite into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_129_back-door-to-netwatch",
      "onr_proteus_132_bolt-hole",
      "onr_proteus_136_credit-subversion",
      "onr_proteus_137_death-from-above",
      "onr_proteus_140_expendable-family-member",
      "onr_proteus_141_get-ready-to-rumble",
      "onr_proteus_145_mercenary-subcontract",
      "onr_proteus_154_wired-switchboard",
    ] as const;

    for (const definitionId of cases) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId("onr_proteus_132_bolt-hole")
        ?.damagePreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        damageTypes: ["meat"],
        amount: 2,
        cost: { kind: "tap_source" },
      }),
    );
    expect(
      cardImplementationForDefinitionId(
        "onr_proteus_140_expendable-family-member",
      )?.tagPreventionSources,
    ).toContainEqual(
      expect.objectContaining({
        amount: 1,
        cost: { kind: "credit_and_tap_source", amount: 1 },
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_proteus_154_wired-switchboard")
        ?.abilities,
    ).toContainEqual(
      expect.objectContaining({
        timing: "trace_post_bid_link_window",
        costs: [{ kind: "tap_source", amount: 1 }],
      }),
    );
  });

  it("migrates Proteus PRO013 agenda steal and overadvance suite into CardImplementation coverage", () => {
    const cases = [
      "onr_proteus_003_corporate-headhunters",
      "onr_proteus_004_fetal-ai",
      "onr_proteus_005_marked-accounts",
      "onr_proteus_008_project-zurich",
      "onr_proteus_010_world-domination",
      "onr_proteus_102_blackmail",
      "onr_proteus_116_pirate-broadcast",
      "onr_proteus_119_promises-promises",
    ] as const;

    for (const definitionId of cases) {
      expect(cardImplementationForDefinitionId(definitionId), definitionId).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId("onr_proteus_004_fetal-ai")
        ?.selfStealCosts,
    ).toContainEqual(
      expect.objectContaining({
        kind: "current_access_self_steal_cost",
        amount: 2,
      }),
    );
    expect(
      cardImplementationForDefinitionId("onr_proteus_116_pirate-broadcast")
        ?.abilities?.[0]?.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "make_run_each_data_fort_sequence",
        onAllSuccessful: "gain_runner_event_agenda_point",
        onAnyUnsuccessful: "forgo_next_action",
      }),
    );
  });
});
