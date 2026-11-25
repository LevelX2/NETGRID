"use client";

import { useEffect, useState } from "react";
import type { CatalogCardList, CatalogPresentationCard } from "./catalog-types";

type CatalogListResult<Data> =
  | { status: "ready"; data: Data }
  | { status: "error" };

export function useCatalogListResource<Data extends CatalogCardList<unknown>>(
  url: string,
  enabled: boolean,
  validate?: (data: Data) => boolean,
) {
  const [result, setResult] = useState<{
    url: string;
    value: CatalogListResult<Data>;
  }>();
  const current = result?.url === url ? result.value : undefined;
  const ready = current?.status === "ready";

  useEffect(() => {
    if (!enabled || ready) return;
    const request = new AbortController();
    setResult((previous) => (previous?.url === url ? undefined : previous));
    void loadCatalogList(url, request.signal, validate).then((value) => {
      if (!request.signal.aborted) setResult({ url, value });
    });
    return () => request.abort();
  }, [enabled, ready, url, validate]);

  return current;
}

export function useCatalogPresentationIndex() {
  return useCatalogListResource<CatalogCardList<CatalogPresentationCard>>(
    "/api/cards/catalog/presentation",
    true,
  );
}

async function loadCatalogList<Data extends CatalogCardList<unknown>>(
  url: string,
  signal: AbortSignal,
  validate: ((data: Data) => boolean) | undefined,
): Promise<CatalogListResult<Data>> {
  try {
    const response = await fetch(url, { cache: "no-store", signal });
    if (!response.ok) return { status: "error" };
    const data = (await response.json()) as Data | null;
    if (!data || !Array.isArray(data.cards) || (validate && !validate(data))) {
      return { status: "error" };
    }
    return { status: "ready", data };
  } catch {
    return { status: "error" };
  }
}
