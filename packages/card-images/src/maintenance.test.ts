import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CardImageInboxError,
  inventoryCardImageCollection,
  inventoryCardImageInbox,
  resolveCardImageInboxEntry,
  writeCardImageInboxMapping,
  writeCardImageInboxPackageFile,
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

  it("stores a selected CSV under a safe relative inbox path", async () => {
    const inboxRoot = await temporaryRoot();
    const uploaded = await writeCardImageInboxMapping(
      "eigene-bilder.csv",
      "# Hinweis\naktiv;printingId;setId;sammlernummer;seite;titel;quelle;sha256\n",
      { inboxRoot },
    );

    expect(uploaded).toMatchObject({
      relativePath: "mappings/eigene-bilder.csv",
      usage: "mapping",
    });
    await expect(
      readFile(path.join(inboxRoot, uploaded.relativePath), "utf8"),
    ).resolves.toContain("aktiv;printingId");
    await expect(
      writeCardImageInboxMapping("../escape.csv", "x", { inboxRoot }),
    ).rejects.toMatchObject({ code: "inbox_mapping_invalid" });
    await expect(
      writeCardImageInboxMapping("eigene-bilder.csv", "x", { inboxRoot }),
    ).rejects.toMatchObject({ code: "inbox_mapping_exists" });
  });

  it("accepts only bounded IMG07 package files and recognizes the manifest last", async () => {
    const inboxRoot = await temporaryRoot();
    await writeCardImageInboxPackageFile(
      "upload-classic",
      "mapping.csv",
      Buffer.from("mapping"),
      { inboxRoot },
    );
    await writeCardImageInboxPackageFile(
      "upload-classic",
      "images/onr_classic_001_data-fort-remapping.png",
      Buffer.from("png"),
      { inboxRoot },
    );
    expect(
      (await inventoryCardImageInbox({ inboxRoot })).entries.find(
        (entry) => entry.relativePath === "uploads/upload-classic",
      ),
    ).toMatchObject({ usage: "directory" });

    await writeCardImageInboxPackageFile(
      "upload-classic",
      CARD_IMAGE_PACK_MANIFEST_FILE,
      Buffer.from("{}"),
      { inboxRoot },
    );
    expect(
      (await inventoryCardImageInbox({ inboxRoot })).entries.find(
        (entry) => entry.relativePath === "uploads/upload-classic",
      ),
    ).toMatchObject({ usage: "pack" });
    await expect(
      writeCardImageInboxPackageFile(
        "upload-classic",
        "private.txt",
        Buffer.from("x"),
        { inboxRoot },
      ),
    ).rejects.toMatchObject({ code: "inbox_upload_invalid" });
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
