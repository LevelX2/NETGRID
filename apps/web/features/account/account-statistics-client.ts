import type {
  ApiAccountMatchHistory,
  ApiAccountStatistics,
  ApiAccountStatisticsPeriod,
  ApiMatchMode,
  ApiPlayerIdentityKind,
  Side,
} from "@netgrid/shared";
import { accountRequest, type AccountFetch } from "./account-client";

export type AccountStatisticsFilters = {
  period: ApiAccountStatisticsPeriod;
  side?: Side;
  opponentKind?: ApiPlayerIdentityKind;
  matchMode?: ApiMatchMode;
};

export function loadAccountStatistics(
  filters: AccountStatisticsFilters,
  fetcher: AccountFetch = fetch,
): Promise<ApiAccountStatistics> {
  return accountRequest(
    fetcher,
    `/api/account/statistics?${statisticsParams(filters)}`,
    { method: "GET" },
  );
}

export function loadAccountMatchHistory(
  filters: AccountStatisticsFilters,
  options: { cursor?: string; limit?: number } = {},
  fetcher: AccountFetch = fetch,
): Promise<ApiAccountMatchHistory> {
  const params = statisticsParams(filters);
  params.set("limit", String(options.limit ?? 20));
  if (options.cursor) params.set("cursor", options.cursor);
  return accountRequest(fetcher, `/api/account/match-history?${params}`, {
    method: "GET",
  });
}

function statisticsParams(filters: AccountStatisticsFilters): URLSearchParams {
  const params = new URLSearchParams({ period: filters.period });
  if (filters.side) params.set("side", filters.side);
  if (filters.opponentKind) params.set("opponentKind", filters.opponentKind);
  if (filters.matchMode) params.set("matchMode", filters.matchMode);
  return params;
}
