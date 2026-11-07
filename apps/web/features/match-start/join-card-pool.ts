import { isApiUserErrorCode, type ApiMatchCardPool } from "@netgrid/shared";
import { configuredServerHttp } from "../../lib/server-endpoint";

export class JoinCardPoolError extends Error {
  readonly owner = "match_join_info";
  constructor(readonly code: string) {
    super(code);
    this.name = "JoinCardPoolError";
  }
}

/** The invitation's server-owned pool is independent of local host preferences. */
export async function fetchJoinCardPool(
  matchId: string,
  token: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<ApiMatchCardPool> {
  const query = new URLSearchParams();
  if (token) query.set("token", token);
  const response = await fetcher(
    `${configuredServerHttp()}/api/matches/${encodeURIComponent(matchId)}/join-info?${query}`,
    { cache: "no-store", credentials: "include", signal },
  );
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new JoinCardPoolError("join_info_response_invalid");
  }
  if (!payload || typeof payload !== "object")
    throw new JoinCardPoolError("join_info_response_invalid");
  if ("code" in payload && typeof payload.code === "string") {
    if (
      "diagnosticCode" in payload &&
      payload.diagnosticCode === "join_info_card_pool_missing"
    )
      throw new JoinCardPoolError("join_info_card_pool_missing");
    throw new JoinCardPoolError(
      isApiUserErrorCode(payload.code) ? payload.code : "join_info_rejected",
    );
  }
  if (!response.ok) throw new JoinCardPoolError("join_info_request_failed");
  if (!("matchId" in payload) || payload.matchId !== matchId)
    throw new JoinCardPoolError("join_info_match_mismatch");
  if (!("cardPool" in payload))
    throw new JoinCardPoolError("join_info_card_pool_missing");
  const pool = payload.cardPool;
  if (
    pool !== "originalset" &&
    pool !== "originalset_classic" &&
    pool !== "originalset_proteus" &&
    pool !== "originalset_classic_proteus"
  )
    throw new JoinCardPoolError("join_info_card_pool_invalid");
  return pool;
}
