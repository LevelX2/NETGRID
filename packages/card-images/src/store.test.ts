import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CardImageStore, CardImageStoreError } from "./store";

const temporaryDirectories: string[] = [];
const fixedNow = new Date("2026-08-19T10:00:00.000Z");

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("CardImageStore", () => {
  it("deduplicates immutable blobs by content hash", async () => {
    const store = await temporaryStore();
    const first = await putAsset(store, "first");
    const second = await putAsset(store, "first");

    expect(second).toEqual(first);
    const master = first.variants.master!;
    expect(await readFile(store.absoluteVariantPath(master), "utf8")).toBe(
      "first",
    );
  });

  it("reuses frozen validated manifests while their files are unchanged", async () => {
    const store = await temporaryStore();
    const asset = await putAsset(store, "first");
    await store.applyBindings("personal", [
      { printingId: "onr_v1_001_afreet", assetHash: asset.assetHash },
    ]);

    const firstCollection = await store.readCollection("personal");
    const secondCollection = await store.readCollection("personal");
    const firstAsset = await store.readAsset(asset.assetHash);
    const secondAsset = await store.readAsset(asset.assetHash);

    expect(secondCollection).toBe(firstCollection);
    expect(secondAsset).toBe(firstAsset);
    expect(Object.isFrozen(secondCollection)).toBe(true);
    expect(Object.isFrozen(secondCollection.bindings)).toBe(true);
    expect(Object.isFrozen(secondAsset)).toBe(true);
    expect(Object.isFrozen(secondAsset.variants)).toBe(true);
  });

  it("applies fail, skip and replace without overwriting blobs", async () => {
    const store = await temporaryStore();
    const first = await putAsset(store, "first");
    const second = await putAsset(store, "second");

    await expect(
      store.applyBindings("personal", [
        { printingId: "onr_v1_001_afreet", assetHash: first.assetHash },
      ]),
    ).resolves.toEqual([
      expect.objectContaining({ status: "bound", assetHash: first.assetHash }),
    ]);
    await expect(
      store.applyBindings("personal", [
        { printingId: "onr_v1_001_afreet", assetHash: second.assetHash },
      ]),
    ).rejects.toMatchObject({ code: "binding_exists" });
    await expect(
      store.applyBindings(
        "personal",
        [{ printingId: "onr_v1_001_afreet", assetHash: second.assetHash }],
        "skip",
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "skipped",
        assetHash: second.assetHash,
      }),
    ]);
    await expect(
      store.applyBindings(
        "personal",
        [{ printingId: "onr_v1_001_afreet", assetHash: second.assetHash }],
        "replace",
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "replaced",
        assetHash: second.assetHash,
        previousAssetHash: first.assetHash,
      }),
    ]);
    expect(
      await store.resolveBinding("personal", "onr_v1_001_afreet"),
    ).toMatchObject({ assetHash: second.assetHash });
    expect(await store.removeBinding("personal", "onr_v1_001_afreet")).toBe(
      true,
    );
    expect(
      await store.resolveBinding("personal", "onr_v1_001_afreet"),
    ).toBeUndefined();
  });

  it("validates every asset before atomically changing a collection", async () => {
    const store = await temporaryStore();
    const first = await putAsset(store, "first");
    const missingHash = "f".repeat(64);

    await expect(
      store.applyBindings("personal", [
        { printingId: "onr_v1_001_afreet", assetHash: first.assetHash },
        { printingId: "onr_v1_002_deadringer", assetHash: missingHash },
      ]),
    ).rejects.toMatchObject({ code: "asset_not_found" });
    expect((await store.readCollection("personal")).bindings).toEqual({});
  });

  it("rejects unsafe identifiers and duplicate changes", async () => {
    const store = await temporaryStore();
    const asset = await putAsset(store, "first");

    await expect(store.readCollection("../outside")).rejects.toMatchObject({
      code: "invalid_collection_id",
    });
    await expect(
      store.applyBindings("personal", [
        { printingId: "../outside", assetHash: asset.assetHash },
      ]),
    ).rejects.toMatchObject({ code: "invalid_printing_id" });
    await expect(
      store.applyBindings("personal", [
        { printingId: "onr_v1_001_afreet", assetHash: asset.assetHash },
        { printingId: "onr_v1_001_afreet", assetHash: asset.assetHash },
      ]),
    ).rejects.toMatchObject({ code: "duplicate_binding_change" });
  });

  it("detects a corrupt existing content-addressed blob", async () => {
    const store = await temporaryStore();
    const asset = await putAsset(store, "first");
    const master = asset.variants.master!;
    await writeFile(store.absoluteVariantPath(master), "changed", "utf8");

    await expect(
      store.applyBindings("personal", [
        { printingId: "onr_v1_001_afreet", assetHash: asset.assetHash },
      ]),
    ).rejects.toMatchObject({ code: "asset_blob_corrupt" });
  });
});

async function temporaryStore(): Promise<CardImageStore> {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-image-store-"));
  temporaryDirectories.push(root);
  return new CardImageStore({ root, now: () => fixedNow });
}

async function putAsset(store: CardImageStore, content: string) {
  return store.putMasterAsset({
    content: Buffer.from(content),
    mediaType: "image/png",
    width: 609,
    height: 855,
  });
}
