import type { CardImageMediaType, CardImageVariantKind } from "./store";
import { CardImageStore, CardImageStoreError } from "./store";

export const DEFAULT_CARD_IMAGE_COLLECTION_ID = "personal";
export const DEFAULT_CARD_IMAGE_RUNTIME_VARIANT: CardImageVariantKind = "full";

export type ManagedCardImageResolution = {
  printingId: string;
  collectionId: string;
  assetHash: string;
  variant: CardImageVariantKind;
  blobHash: string;
  relativePath: string;
  absolutePath: string;
  mediaType: CardImageMediaType;
  width: number;
  height: number;
  bytes: number;
};

export type ManagedCardImageRuntimeErrorCode =
  | "invalid_variant"
  | "personal_image_invalid";

export class ManagedCardImageRuntimeError extends Error {
  constructor(
    readonly code: ManagedCardImageRuntimeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ManagedCardImageRuntimeError";
  }
}

export function parseCardImageVariant(
  value: string | null | undefined,
): CardImageVariantKind {
  if (!value) return DEFAULT_CARD_IMAGE_RUNTIME_VARIANT;
  if (
    value === "master" ||
    value === "thumb" ||
    value === "preview" ||
    value === "full"
  )
    return value;
  throw new ManagedCardImageRuntimeError(
    "invalid_variant",
    "Die angeforderte Kartenbildvariante ist ungültig.",
  );
}

export async function resolveManagedCardImage(
  store: CardImageStore,
  printingId: string,
  variant: CardImageVariantKind = DEFAULT_CARD_IMAGE_RUNTIME_VARIANT,
  collectionId = DEFAULT_CARD_IMAGE_COLLECTION_ID,
): Promise<ManagedCardImageResolution | undefined> {
  try {
    const binding = await store.resolveBinding(collectionId, printingId);
    if (!binding) return undefined;

    const asset = await store.readAsset(binding.assetHash);
    const storedVariant = asset.variants[variant];
    if (!storedVariant)
      throw new CardImageStoreError(
        "asset_manifest_invalid",
        `Kartenbild-Asset besitzt keine Variante ${variant}.`,
      );
    await store.verifyVariantBlob(storedVariant);

    return {
      printingId,
      collectionId,
      assetHash: asset.assetHash,
      variant,
      blobHash: storedVariant.blobHash,
      relativePath: storedVariant.relativePath,
      absolutePath: store.absoluteVariantPath(storedVariant),
      mediaType: storedVariant.mediaType,
      width: storedVariant.width,
      height: storedVariant.height,
      bytes: storedVariant.bytes,
    };
  } catch (error) {
    if (error instanceof ManagedCardImageRuntimeError) throw error;
    if (error instanceof CardImageStoreError)
      throw new ManagedCardImageRuntimeError(
        "personal_image_invalid",
        "Das persönliche Kartenbild ist unvollständig oder beschädigt.",
      );
    throw new ManagedCardImageRuntimeError(
      "personal_image_invalid",
      "Das persönliche Kartenbild ist unvollständig oder beschädigt.",
    );
  }
}
