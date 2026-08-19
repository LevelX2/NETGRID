import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { parseCardImageMappingCsv, serializeCardImageMappingCsv } from "./csv";
import {
  CARD_IMAGE_PACK_IMPORTER_VERSION,
  CARD_IMAGE_PACK_MANIFEST_FILE,
  PRIVATE_CARD_IMAGE_PACK_PROFILES,
  __cardImagePackTestOnly,
  createPrivateCardImagePackTemplate,
  type CardImagePackManifest,
  type CardImagePackProgress,
  type PrivateCardImagePackProfile,
} from "./packs";
import { CardImageStore } from "./store";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("private card image packs", () => {
  it("pins the three production profiles to the current catalog", () => {
    const cards = Object.values(createRuntimeCardsById());
    for (const profile of Object.values(PRIVATE_CARD_IMAGE_PACK_PROFILES)) {
      const template = createPrivateCardImagePackTemplate(
        profile.profileId,
        cards,
      );
      const rows = parseCardImageMappingCsv(template, cards);
      expect(rows).toHaveLength(profile.expectedCardCount);
      expect(rows.every((row) => row.setId === profile.setId)).toBe(true);
      expect(rows.every((row) => !row.enabled)).toBe(true);
    }
    expect(PRIVATE_CARD_IMAGE_PACK_PROFILES.originalset.expectedCardCount).toBe(
      374,
    );
    expect(PRIVATE_CARD_IMAGE_PACK_PROFILES.proteus.expectedCardCount).toBe(
      154,
    );
    expect(PRIVATE_CARD_IMAGE_PACK_PROFILES.classic.expectedCardCount).toBe(54);
  });

  it("builds a self-contained local pack and imports it through the atomic core", async () => {
    const fixture = await packFixture();
    const buildProgress: CardImagePackProgress[] = [];
    const built = await buildFixturePack(fixture, false, {
      onProgress: (progress) => buildProgress.push(progress),
    });
    expect(built.manifest).toMatchObject({
      schemaVersion: "netgrid-card-image-pack-v1",
      minimumImporterVersion: CARD_IMAGE_PACK_IMPORTER_VERSION,
      profileId: "classic",
      setId: fixture.profile.setId,
      cardCount: 2,
    });
    expect(built.manifest.entries).toHaveLength(2);
    expect(buildProgress).toEqual([
      { phase: "building", completed: 0, total: 2 },
      {
        phase: "building",
        completed: 1,
        total: 2,
        printingId: fixture.cards[0]!.printingId,
      },
      {
        phase: "building",
        completed: 2,
        total: 2,
        printingId: fixture.cards[1]!.printingId,
      },
    ]);
    const bundledMapping = await readFile(
      path.join(built.outputDirectory, "mapping.csv"),
      "utf8",
    );
    expect(parseCardImageMappingCsv(bundledMapping, fixture.cards)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          expectedSha256: expect.any(String),
        }),
      ]),
    );

    const store = new CardImageStore({
      root: path.join(fixture.root, "store"),
    });
    const importProgress: CardImagePackProgress[] = [];
    const imported = await __cardImagePackTestOnly.importCardImagePack(
      { profile: fixture.profile, cards: fixture.cards },
      built.manifest,
      built.outputDirectory,
      {
        packDirectory: built.outputDirectory,
        store,
        collectionId: "personal",
        onProgress: (progress) => importProgress.push(progress),
      },
    );
    expect(imported.importReport.summary.bound).toBe(2);
    expect(
      Object.keys((await store.readCollection("personal")).bindings),
    ).toHaveLength(2);
    expect(importProgress[0]).toEqual({
      phase: "validating",
      completed: 0,
      total: 6,
    });
    expect(importProgress.at(-1)).toEqual({
      phase: "importing",
      completed: 6,
      total: 6,
      printingId: fixture.cards[1]!.printingId,
    });
  });

  it("uses the caller-provided local source resolver for package builds", async () => {
    const fixture = await packFixture();
    const resolved: string[] = [];
    await buildFixturePack(fixture, false, {
      localSourceResolver: async (source, _mappingDirectory, printingId) => {
        resolved.push(`${printingId}:${source}`);
        return source;
      },
    });
    expect(resolved).toEqual(
      fixture.cards.map(
        (card, index) => `${card.printingId}:${fixture.imageFiles[index]}`,
      ),
    );
  });

  it("rejects incomplete and remote builder mappings before creating output", async () => {
    const fixture = await packFixture();
    const incomplete = serializeCardImageMappingCsv(
      fixture.cards,
      new Map([
        [fixture.cards[0]!.printingId, { source: fixture.imageFiles[0]! }],
      ]),
    );
    await writeFile(fixture.mappingFile, incomplete, "utf8");
    await expect(buildFixturePack(fixture)).rejects.toMatchObject({
      code: "pack_mapping_incomplete",
    });

    await writeFile(
      fixture.mappingFile,
      serializeCardImageMappingCsv(
        fixture.cards,
        new Map(
          fixture.cards.map((card) => [
            card.printingId,
            { source: "https://images.example/card.png" },
          ]),
        ),
      ),
      "utf8",
    );
    await expect(buildFixturePack(fixture)).rejects.toMatchObject({
      code: "pack_source_remote_forbidden",
    });
  });

  it("rejects tampered image bytes without activating any binding", async () => {
    const fixture = await packFixture();
    const built = await buildFixturePack(fixture);
    const first = built.manifest.entries[0]!;
    await writeFile(
      path.join(built.outputDirectory, ...first.relativePath.split("/")),
      Buffer.from("tampered"),
    );
    const store = new CardImageStore({
      root: path.join(fixture.root, "store"),
    });
    await expect(
      __cardImagePackTestOnly.importCardImagePack(
        { profile: fixture.profile, cards: fixture.cards },
        built.manifest,
        built.outputDirectory,
        { packDirectory: built.outputDirectory, store },
      ),
    ).rejects.toMatchObject({ code: "pack_file_hash_mismatch" });
    expect((await store.readCollection("personal")).bindings).toEqual({});
  });

  it("rejects a newer importer requirement and unsafe manifest paths", async () => {
    const fixture = await packFixture();
    const built = await buildFixturePack(fixture);
    await expect(
      __cardImagePackTestOnly.importCardImagePack(
        { profile: fixture.profile, cards: fixture.cards },
        {
          ...built.manifest,
          minimumImporterVersion: CARD_IMAGE_PACK_IMPORTER_VERSION + 1,
        },
        built.outputDirectory,
        { packDirectory: built.outputDirectory },
      ),
    ).rejects.toMatchObject({ code: "pack_importer_too_old" });

    const unsafe: CardImagePackManifest = {
      ...built.manifest,
      entries: built.manifest.entries.map((entry, index) =>
        index === 0 ? { ...entry, relativePath: "../escape.png" } : entry,
      ),
    };
    await expect(
      __cardImagePackTestOnly.importCardImagePack(
        { profile: fixture.profile, cards: fixture.cards },
        unsafe,
        built.outputDirectory,
        { packDirectory: built.outputDirectory },
      ),
    ).rejects.toMatchObject({ code: "pack_manifest_invalid" });
  });

  it("does not overwrite an existing build unless replace is explicit", async () => {
    const fixture = await packFixture();
    const first = await buildFixturePack(fixture);
    await expect(buildFixturePack(fixture)).rejects.toMatchObject({
      code: "pack_output_exists",
    });
    const replaced = await buildFixturePack(fixture, true);
    expect(replaced.outputDirectory).toBe(first.outputDirectory);
    expect(
      JSON.parse(
        await readFile(
          path.join(replaced.outputDirectory, CARD_IMAGE_PACK_MANIFEST_FILE),
          "utf8",
        ),
      ),
    ).toMatchObject({ packId: fixture.profile.packId, cardCount: 2 });
  });
});

async function packFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-private-pack-"));
  temporaryDirectories.push(root);
  const cards = [
    fixtureCard({
      catalogCardId: "pack-one",
      printingId: "onr_pack_001_one",
      collectorNumber: "1",
      title: "Pack One",
    }),
    fixtureCard({
      catalogCardId: "pack-two",
      printingId: "onr_pack_002_two",
      collectorNumber: "2",
      title: "Pack Two",
    }),
  ];
  const profile: PrivateCardImagePackProfile = {
    profileId: "classic",
    packId: "netgrid-private-test-images",
    displayName: "NETGRID private Testbilder",
    setId: "fixture-set",
    expectedCardCount: 2,
  };
  const imageFiles = [path.join(root, "one.png"), path.join(root, "two.jpg")];
  await sharp({
    create: { width: 300, height: 420, channels: 3, background: "#123456" },
  })
    .png()
    .toFile(imageFiles[0]!);
  await sharp({
    create: { width: 300, height: 420, channels: 3, background: "#654321" },
  })
    .jpeg()
    .toFile(imageFiles[1]!);
  const mappingFile = path.join(root, "mapping.csv");
  await writeFile(
    mappingFile,
    serializeCardImageMappingCsv(
      cards,
      new Map(
        cards.map((card, index) => [
          card.printingId,
          { source: imageFiles[index]! },
        ]),
      ),
    ),
    "utf8",
  );
  return { root, cards, profile, imageFiles, mappingFile };
}

async function buildFixturePack(
  fixture: Awaited<ReturnType<typeof packFixture>>,
  replace = false,
  options: {
    localSourceResolver?: (
      source: string,
      mappingDirectory: string,
      printingId: string,
    ) => Promise<string>;
    onProgress?: (progress: CardImagePackProgress) => void;
  } = {},
) {
  return __cardImagePackTestOnly.buildCardImagePack(
    { profile: fixture.profile, cards: fixture.cards },
    {
      mappingFile: fixture.mappingFile,
      buildRoot: path.join(fixture.root, "build"),
      replace,
      now: () => new Date("2026-08-19T15:00:00.000Z"),
      ...options,
    },
  );
}

function fixtureCard(overrides: Partial<CatalogCard>): CatalogCard {
  const base = Object.values(createRuntimeCardsById())[0]!;
  return {
    ...base,
    setId: "fixture-set",
    side: "runner",
    ...overrides,
  };
}
