import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ManagedCardImageRuntimeError,
  parseCardImageVariant,
  resolveManagedCardImage,
} from "./runtime";
import { CardImageStore } from "./store";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("managed card image runtime", () => {
  it("resolves the requested variant after a fresh store instance", async () => {
    const root = await temporaryRoot();
    const writer = new CardImageStore({ root });
    const asset = await writer.putAssetVariants({
      variants: [
        variant("master", "master"),
        variant("thumb", "thumb"),
        variant("preview", "preview"),
        variant("full", "full"),
      ],
    });
    await writer.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: asset.assetHash },
    ]);

    const resolution = await resolveManagedCardImage(
      new CardImageStore({ root }),
      "simple_agenda",
      "thumb",
    );

    expect(resolution).toMatchObject({
      printingId: "simple_agenda",
      collectionId: "personal",
      assetHash: asset.assetHash,
      variant: "thumb",
      mediaType: "image/webp",
      width: 100,
      height: 140,
    });
    expect(resolution?.absolutePath).toContain(root);
  });

  it("returns no override again after its binding is removed", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({
      variants: [variant("master", "master"), variant("full", "full")],
    });
    await store.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: asset.assetHash },
    ]);
    await store.removeBinding("personal", "simple_agenda");

    await expect(
      resolveManagedCardImage(
        new CardImageStore({ root }),
        "simple_agenda",
        "full",
      ),
    ).resolves.toBeUndefined();
  });

  it("invalidates cached bindings after an atomic cross-process update", async () => {
    const root = await temporaryRoot();
    const writer = new CardImageStore({ root });
    const reader = new CardImageStore({ root });
    const first = await writer.putAssetVariants({
      variants: [variant("master", "first-master"), variant("full", "first")],
    });
    const second = await writer.putAssetVariants({
      variants: [
        variant("master", "second-master"),
        variant("full", "second"),
      ],
    });
    await writer.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: first.assetHash },
    ]);

    const initial = await resolveManagedCardImage(
      reader,
      "simple_agenda",
      "full",
    );
    await writer.applyBindings(
      "personal",
      [{ printingId: "simple_agenda", assetHash: second.assetHash }],
      "replace",
    );
    const replaced = await resolveManagedCardImage(
      reader,
      "simple_agenda",
      "full",
    );

    expect(initial).toMatchObject({
      assetHash: first.assetHash,
      collectionRevision: 1,
    });
    expect(replaced).toMatchObject({
      assetHash: second.assetHash,
      collectionRevision: 2,
    });
  });

  it("fails closed without exposing store paths when a bound blob is corrupt", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({
      variants: [variant("master", "master"), variant("full", "full")],
    });
    await store.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: asset.assetHash },
    ]);
    const resolved = await resolveManagedCardImage(
      store,
      "simple_agenda",
      "full",
    );
    await writeFile(resolved!.absolutePath, "corrupt");

    const failure = await resolveManagedCardImage(
      store,
      "simple_agenda",
      "full",
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ManagedCardImageRuntimeError);
    expect((failure as Error).message).not.toContain(root);
    expect((failure as ManagedCardImageRuntimeError).code).toBe(
      "personal_image_invalid",
    );
  });

  it("invalidates a cached asset manifest and fails closed", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({
      variants: [variant("master", "master"), variant("full", "full")],
    });
    await store.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: asset.assetHash },
    ]);
    await resolveManagedCardImage(store, "simple_agenda", "full");
    await writeFile(
      path.join(root, "assets", `${asset.assetHash}.json`),
      "{}",
    );

    const failure = await resolveManagedCardImage(
      store,
      "simple_agenda",
      "full",
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ManagedCardImageRuntimeError);
    expect((failure as ManagedCardImageRuntimeError).code).toBe(
      "personal_image_invalid",
    );
    expect((failure as Error).message).not.toContain(root);
  });

  it("accepts only the four supported runtime variants", () => {
    expect(parseCardImageVariant(undefined)).toBe("full");
    expect(parseCardImageVariant("preview")).toBe("preview");
    expect(() => parseCardImageVariant("../../secret")).toThrowError(
      ManagedCardImageRuntimeError,
    );
  });
});

function variant(kind: "master" | "thumb" | "preview" | "full", text: string) {
  return {
    kind,
    content: Buffer.from(text),
    mediaType: "image/webp" as const,
    width: kind === "thumb" ? 100 : 200,
    height: kind === "thumb" ? 140 : 280,
  };
}

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-card-runtime-"));
  temporaryRoots.push(root);
  return root;
}
