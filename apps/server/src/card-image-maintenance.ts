export const CARD_IMAGE_MAINTENANCE_API_PREFIX =
  "/api/storage/maintenance/card-images";

export type CardImageMaintenanceCapabilities = {
  schemaVersion: "netgrid-card-image-maintenance-capabilities-v1";
  localOnly: true;
  collectionId: "personal";
  importModes: readonly ["local", "https", "pack"];
  conflictModes: readonly ["fail", "skip", "replace"];
  httpsRequiresRightsConfirmation: true;
  mutationsRequireReauthentication: true;
};

export class CardImageMaintenanceService {
  private readonly inboxOptions: CardImageInboxOptions;
  private readonly store: CardImageStore;

  constructor(
    options: {
      inbox?: CardImageInboxOptions;
      store?: CardImageStore;
    } = {},
  ) {
    this.inboxOptions = options.inbox ?? {};
    this.store = options.store ?? new CardImageStore();
  }

  capabilities(): CardImageMaintenanceCapabilities {
    return {
      schemaVersion: "netgrid-card-image-maintenance-capabilities-v1",
      localOnly: true,
      collectionId: "personal",
      importModes: ["local", "https", "pack"],
      conflictModes: ["fail", "skip", "replace"],
      httpsRequiresRightsConfirmation: true,
      mutationsRequireReauthentication: true,
    };
  }

  async inventory(): Promise<CardImageCollectionInventory> {
    return inventoryCardImageCollection({ store: this.store });
  }

  async inbox(): Promise<CardImageInboxInventory> {
    return inventoryCardImageInbox(this.inboxOptions);
  }

  mappingTemplate(profileId: PrivateCardImagePackProfileId | "all"): {
    fileName: string;
    content: string;
  } {
    const profile =
      profileId === "all"
        ? undefined
        : PRIVATE_CARD_IMAGE_PACK_PROFILES[profileId];
    return {
      fileName: `netgrid-card-images-${profileId}.csv`,
      content: createCurrentCardImageMappingTemplate(
        profile ? { setId: profile.setId } : {},
      ),
    };
  }
}
import {
  CardImageStore,
  createCurrentCardImageMappingTemplate,
  inventoryCardImageCollection,
  inventoryCardImageInbox,
  PRIVATE_CARD_IMAGE_PACK_PROFILES,
  type CardImageCollectionInventory,
  type CardImageInboxInventory,
  type CardImageInboxOptions,
  type PrivateCardImagePackProfileId,
} from "@netgrid/card-images";
