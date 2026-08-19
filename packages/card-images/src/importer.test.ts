import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { parseCardImageMappingCsv, serializeCardImageMappingCsv } from "./csv";
import { importCardImagesFromCsv } from "./importer";
import { CardImageStore } from "./store";
import {
  createCurrentCardImageMappingTemplate,
  currentCardImageTemplateCards,
} from "./template";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("card image CSV workflow", () => {
  it("generates every current printing exactly once in stable order", () => {
    const cards = currentCardImageTemplateCards();
    const allCards = Object.values(createRuntimeCardsById());
    expect(cards).toHaveLength(allCards.length);
    expect(new Set(cards.map((card) => card.printingId)).size).toBe(
      cards.length,
    );
    expect(createCurrentCardImageMappingTemplate()).toMatch(
      /^\uFEFFaktiv;printingId;/,
    );
  });

  it("round-trips quoted catalog values and rejects duplicate rows", () => {
    const card = fixtureCard({ title: 'Quote; "Runner"' });
    const csv = serializeCardImageMappingCsv([card]);
    const rows = parseCardImageMappingCsv(csv, [card]);
    expect(rows[0]).toMatchObject({
      enabled: false,
      printingId: card.printingId,
      title: card.title,
    });
    const duplicate = `${csv.trimEnd()}\r\n${csv.split("\r\n")[1]}\r\n`;
    expect(() => parseCardImageMappingCsv(duplicate, [card])).toThrowError(
      expect.objectContaining({ code: "csv_duplicate_printing_id" }),
    );
  });

  it("dry-runs without writing blobs or bindings and then imports locally", async () => {
    const root = await temporaryDirectory("netgrid-card-import-");
    const store = new CardImageStore({ root: path.join(root, "store") });
    const card = fixtureCard();
    await writePng(path.join(root, "card.png"), 609, 855, "#224466");
    const mapping = path.join(root, "mapping.csv");
    await writeFile(mapping, activeCsv([{ card, source: "card.png" }]), "utf8");

    const dryRun = await importCardImagesFromCsv({
      mappingFile: mapping,
      store,
      cards: [card],
      dryRun: true,
      now: () => new Date("2026-08-19T11:00:00.000Z"),
    });
    expect(dryRun.summary.bound).toBe(1);
    expect((await store.readCollection("personal")).bindings).toEqual({});

    const imported = await importCardImagesFromCsv({
      mappingFile: mapping,
      store,
      cards: [card],
    });
    expect(imported.summary.bound).toBe(1);
    expect(
      await store.resolveBinding("personal", card.printingId),
    ).toMatchObject({ assetHash: imported.results[0]!.assetHash });
  });

  it("does not activate any row when one selected source is invalid", async () => {
    const root = await temporaryDirectory("netgrid-card-import-atomic-");
    const store = new CardImageStore({ root: path.join(root, "store") });
    const first = fixtureCard();
    const second = fixtureCard({
      catalogCardId: "second",
      printingId: "onr_v1_002_second",
      collectorNumber: "2",
      title: "Second",
    });
    await writePng(path.join(root, "first.png"), 609, 855, "#224466");
    const mapping = path.join(root, "mapping.csv");
    await writeFile(
      mapping,
      activeCsv([
        { card: first, source: "first.png" },
        { card: second, source: "missing.png" },
      ]),
      "utf8",
    );

    await expect(
      importCardImagesFromCsv({
        mappingFile: mapping,
        store,
        cards: [first, second],
      }),
    ).rejects.toMatchObject({ code: "source_file_missing" });
    expect((await store.readCollection("personal")).bindings).toEqual({});
  });

  it("rejects remote sources during the local-only phase", async () => {
    const root = await temporaryDirectory("netgrid-card-import-remote-");
    const card = fixtureCard();
    const mapping = path.join(root, "mapping.csv");
    await writeFile(
      mapping,
      activeCsv([{ card, source: "https://example.test/card.png" }]),
      "utf8",
    );

    await expect(
      importCardImagesFromCsv({
        mappingFile: mapping,
        store: new CardImageStore({ root: path.join(root, "store") }),
        cards: [card],
      }),
    ).rejects.toMatchObject({ code: "source_remote_not_allowed" });
  });
});

function fixtureCard(overrides: Partial<CatalogCard> = {}): CatalogCard {
  const base = Object.values(createRuntimeCardsById())[0]!;
  return {
    ...base,
    catalogCardId: "fixture",
    printingId: "onr_v1_001_fixture",
    setId: "originalset-v1",
    collectorNumber: "1",
    side: "runner",
    title: "Fixture",
    ...overrides,
  };
}

function activeCsv(
  entries: readonly { card: CatalogCard; source: string }[],
): string {
  const cards = entries.map((entry) => entry.card);
  const sourceByPrintingId = new Map(
    entries.map((entry) => [entry.card.printingId, entry.source]),
  );
  const lines = serializeCardImageMappingCsv(cards).split("\r\n");
  return lines
    .map((line, index) => {
      if (index === 0 || !line) return line;
      const printingId = line.split(";")[1]!;
      const source = sourceByPrintingId.get(printingId)!;
      const fields = line.split(";");
      fields[0] = "ja";
      fields[6] = source;
      return fields.join(";");
    })
    .join("\r\n");
}

async function writePng(
  file: string,
  width: number,
  height: number,
  background: string,
): Promise<void> {
  await sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toFile(file);
}

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}
