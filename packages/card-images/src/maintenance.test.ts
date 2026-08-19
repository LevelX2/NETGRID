import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CardImageInboxError,
  inventoryCardImageCollection,
  inventoryCardImageInbox,
  resolveCardImageInboxEntry,
} from "./maintenance";
import { CARD_IMAGE_PACK_MANIFEST_FILE } from "./packs";
import { CardImageStore } from "./store";

describe("IMG08 managed card image maintenance inbox", () => {
  it("creates an empty inbox and exposes only relative entries", async () => {
    const inboxRoot = await temporaryRoot();
    const inventory = await inventoryCardImageInbox({ inboxRoot });

    expect(inventory).toEqual({
      schemaVersion: "netgrid-card-image-inbox-v1",
      entries: [],
    });
  });

  it("classifies mappings, images and package directories without absolute paths", async () => {
    const inboxRoot = await temporaryRoot();
    await mkdir(path.join(inboxRoot, "originalset", "images"), {
      recursive: true,
    });
    await writeFile(path.join(inboxRoot, "originalset", "mapping.csv"), "x");
    await writeFile(
      path.join(inboxRoot, "originalset", "images", "a.png"),
      "png",
    );
    await writeFile(
      path.join(inboxRoot, "originalset", CARD_IMAGE_PACK_MANIFEST_FILE),
      "{}",
    );

    const inventory = await inventoryCardImageInbox({ inboxRoot });

    expect(inventory.entries).toEqual(
      expect.arrayContaining([
        {
          relativePath: "originalset",
          kind: "directory",
          usage: "pack",
        },
        expect.objectContaining({
          relativePath: "originalset/mapping.csv",
          kind: "file",
          usage: "mapping",
        }),
        expect.objectContaining({
          relativePath: "originalset/images/a.png",
          kind: "file",
          usage: "image",
        }),
      ]),
    );
    expect(JSON.stringify(inventory)).not.toContain(inboxRoot);
  });

  it("resolves only existing regular entries below the inbox root", async () => {
    const inboxRoot = await temporaryRoot();
    await mkdir(path.join(inboxRoot, "mappings"), { recursive: true });
    await writeFile(path.join(inboxRoot, "mappings", "cards.csv"), "x");

    await expect(
      resolveCardImageInboxEntry("mappings/cards.csv", "file", { inboxRoot }),
    ).resolves.toBe(path.join(inboxRoot, "mappings", "cards.csv"));
    await expect(
      resolveCardImageInboxEntry("../outside.csv", "file", { inboxRoot }),
    ).rejects.toMatchObject({ code: "inbox_entry_invalid" });
    await expect(
      resolveCardImageInboxEntry("mappings", "file", { inboxRoot }),
    ).rejects.toMatchObject({ code: "inbox_entry_type_invalid" });
  });

  it("rejects symlink entries fail-closed when the platform permits creating one", async () => {
    const inboxRoot = await temporaryRoot();
    const outsideRoot = await temporaryRoot();
    await writeFile(path.join(outsideRoot, "outside.csv"), "x");
    try {
      await symlink(
        path.join(outsideRoot, "outside.csv"),
        path.join(inboxRoot, "linked.csv"),
        "file",
      );
    } catch {
      return;
    }

    await expect(inventoryCardImageInbox({ inboxRoot })).rejects.toBeInstanceOf(
      CardImageInboxError,
    );
  });
});

describe("IMG08 card image collection inventory", () => {
  it("reports the fixed profile totals and current bindings", async () => {
    const store = new CardImageStore({ root: await temporaryRoot() });
    const empty = await inventoryCardImageCollection({ store });

    expect(
      empty.sets.map(({ profileId, total, bound, missing }) => ({
        profileId,
        total,
        bound,
        missing,
      })),
    ).toEqual([
      { profileId: "originalset", total: 374, bound: 0, missing: 374 },
      { profileId: "proteus", total: 154, bound: 0, missing: 154 },
      { profileId: "classic", total: 54, bound: 0, missing: 54 },
    ]);

    const firstPrintingId = empty.sets[0]!.missingPrintingIds[0]!;
    const asset = await store.putMasterAsset({
      content: Buffer.from("synthetic-image"),
      mediaType: "image/png",
      width: 10,
      height: 10,
    });
    await store.applyBindings("personal", [
      { printingId: firstPrintingId, assetHash: asset.assetHash },
      { printingId: "private-unknown-printing", assetHash: asset.assetHash },
    ]);

    const bound = await inventoryCardImageCollection({ store });
    expect(bound.sets[0]).toMatchObject({ bound: 1, missing: 373 });
    expect(bound.totalBindings).toBe(2);
    expect(bound.unknownBindings).toBe(1);
  });
});

async function temporaryRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "netgrid-img08-maintenance-"));
}
