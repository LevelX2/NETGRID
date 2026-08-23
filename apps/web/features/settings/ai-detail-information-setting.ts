"use client";

import { useCallback, useEffect, useState } from "react";

export const AI_DETAIL_INFORMATION_STORAGE_KEY =
  "netgrid.ai-detail-information.enabled";

const AI_DETAIL_INFORMATION_CHANGED_EVENT =
  "netgrid:ai-detail-information-changed";

type LocalStorageReader = Pick<Storage, "getItem">;
type LocalStorageWriter = Pick<Storage, "setItem">;

export function readAiDetailInformationEnabled(
  storage: LocalStorageReader | null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(AI_DETAIL_INFORMATION_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeAiDetailInformationEnabled(
  storage: LocalStorageWriter | null,
  enabled: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(
      AI_DETAIL_INFORMATION_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  } catch {
    // Die optionale lokale Anzeigepräferenz darf andere Optionen oder
    // Spielflächen bei blockiertem Browserspeicher nicht beeinträchtigen.
  }
}

export function useAiDetailInformationSetting(): readonly [
  boolean,
  (enabled: boolean) => void,
] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncFromStorage = () =>
      setEnabled(readAiDetailInformationEnabled(window.localStorage));
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(
      AI_DETAIL_INFORMATION_CHANGED_EVENT,
      syncFromStorage,
    );
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(
        AI_DETAIL_INFORMATION_CHANGED_EVENT,
        syncFromStorage,
      );
    };
  }, []);

  const updateEnabled = useCallback((nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    writeAiDetailInformationEnabled(window.localStorage, nextEnabled);
    window.dispatchEvent(new Event(AI_DETAIL_INFORMATION_CHANGED_EVENT));
  }, []);

  return [enabled, updateEnabled] as const;
}
