import {
  CardImageStore,
  CardImageStoreError,
  DEFAULT_CARD_IMAGE_COLLECTION_ID,
} from "@netgrid/card-images/runtime";

export const PERSONAL_CARD_IMAGE_STORE = new CardImageStore();

export async function currentPersonalCardImageCollectionRevision(): Promise<
  number | undefined
> {
  try {
    return (
      await PERSONAL_CARD_IMAGE_STORE.readCollection(
        DEFAULT_CARD_IMAGE_COLLECTION_ID,
      )
    ).revision;
  } catch (error) {
    if (error instanceof CardImageStoreError) return undefined;
    throw error;
  }
}
