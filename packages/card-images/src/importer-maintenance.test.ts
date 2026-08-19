import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRuntimeCardsById } from "@netgrid/catalog";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  importCardImagesFromCsv,
  type CardImageImportProgress,
} from "./importer";
import { resolveCardImageInboxSource } from "./maintenance";
import { serializeCardImageMappingCsv } from "./csv";
import { CardImageStore } from "./store";

describe("IMG08 importer progress and inbox confinement", () => {
  it("reports preparation and storage progress while binding an inbox image", async () => {
    const root = await temporaryRoot();
    const inboxRoot = path.join(root, "inbox");
    const mappingFile = path.join(inboxRoot, "mapping.csv");
    const imageFile = path.join(inboxRoot, "images", "afreet.png");
    await mkdir(path.dirname(imageFile), { recursive: true });
    await writeCardPng(imageFile);
    const card = createRuntimeCardsById()["onr_v1_001_afreet"]!;
    await writeFile(
      mappingFile,
      serializeCardImageMappingCsv(
        [card],
        new Map([[card.printingId, { source: "images/afreet.png" }]]),
      ),
    );
    const store = new CardImageStore({ root: path.join(root, "store") });
    const progress: CardImageImportProgress[] = [];

    const report = await importCardImagesFromCsv({
      mappingFile,
      store,
      localSourceResolver: (source, mappingDirectory) =>
        resolveCardImageInboxSource(source, mappingDirectory, { inboxRoot }),
      onProgress: (event) => progress.push(event),
    });

    expect(report.summary.bound).toBe(1);
    expect(progress).toEqual([
      { phase: "preparing", completed: 0, total: 2 },
      {
        phase: "preparing",
        completed: 1,
        total: 2,
        printingId: card.printingId,
      },
      {
        phase: "storing",
        completed: 2,
        total: 2,
        printingId: card.printingId,
      },
    ]);
    await expect(
      store.resolveBinding("personal", card.printingId),
    ).resolves.toMatchObject({ printingId: card.printingId });
  });

  it("rejects a CSV source outside the managed inbox before binding", async () => {
    const root = await temporaryRoot();
    const inboxRoot = path.join(root, "inbox");
    const mappingFile = path.join(inboxRoot, "mapping.csv");
    const outsideImage = path.join(root, "outside.png");
    await mkdir(inboxRoot, { recursive: true });
    await writeCardPng(outsideImage);
    const card = createRuntimeCardsById()["onr_v1_001_afreet"]!;
    await writeFile(
      mappingFile,
      serializeCardImageMappingCsv(
        [card],
        new Map([[card.printingId, { source: outsideImage }]]),
      ),
    );
    const store = new CardImageStore({ root: path.join(root, "store") });

    await expect(
      importCardImagesFromCsv({
        mappingFile,
        store,
        localSourceResolver: (source, mappingDirectory) =>
          resolveCardImageInboxSource(source, mappingDirectory, { inboxRoot }),
      }),
    ).rejects.toMatchObject({ code: "inbox_entry_invalid" });
    await expect(
      store.resolveBinding("personal", card.printingId),
    ).resolves.toBeUndefined();
  });
});

async function temporaryRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "netgrid-img08-import-job-"));
}

async function writeCardPng(file: string): Promise<void> {
  await sharp({
    create: { width: 300, height: 420, channels: 3, background: "#334455" },
  })
    .png()
    .toFile(file);
}
