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
}
