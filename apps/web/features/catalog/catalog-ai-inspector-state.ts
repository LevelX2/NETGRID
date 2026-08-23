export const CATALOG_AI_INSPECTOR_OPEN_STORAGE_KEY =
  "netgrid.catalog.ai-inspector.open";

type SessionStorageReader = Pick<Storage, "getItem">;
type SessionStorageWriter = Pick<Storage, "setItem">;

export function readCatalogAiInspectorOpen(
  storage: SessionStorageReader | null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(CATALOG_AI_INSPECTOR_OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeCatalogAiInspectorOpen(
  storage: SessionStorageWriter | null,
  isOpen: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(
      CATALOG_AI_INSPECTOR_OPEN_STORAGE_KEY,
      isOpen ? "true" : "false",
    );
  } catch {
    // Der Klappzustand ist Komfortzustand; ein blockierter Browserspeicher
    // darf den Katalog nicht unbenutzbar machen.
  }
}
