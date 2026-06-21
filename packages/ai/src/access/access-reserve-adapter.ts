import type { AiDecisionInput } from "@netgrid/shared";

export type AccessReserveEconomyPosture = {
  desiredCreditReserve: number;
  creditReservePolicy?: {
    reserveDrivers?: readonly string[];
    reserveOverrides?: readonly string[];
  };
};

export type AccessReserveQuote = {
  desiredCreditReserve: number;
  source: "runner_economy_posture" | "fallback";
  evidence: string[];
};

export function quoteAccessReserve(params: {
  input: AiDecisionInput;
  economyPosture?: AccessReserveEconomyPosture;
  fallbackReserve: number;
}): AccessReserveQuote {
  if (params.economyPosture) {
    const desiredCreditReserve = Math.max(
      0,
      Math.floor(params.economyPosture.desiredCreditReserve),
    );
    return {
      desiredCreditReserve,
      source: "runner_economy_posture",
      evidence: [
        "access_reserve_source:runner_economy_posture",
        `access_reserve_desired:${desiredCreditReserve}`,
        ...(
          params.economyPosture.creditReservePolicy?.reserveDrivers ?? []
        )
          .slice(0, 6)
          .map((driver) => `access_reserve_driver:${driver}`),
        ...(
          params.economyPosture.creditReservePolicy?.reserveOverrides ?? []
        )
          .slice(0, 6)
          .map((override) => `access_reserve_override:${override}`),
      ],
    };
  }

  const fallbackReserve = Math.max(0, Math.floor(params.fallbackReserve));
  return {
    desiredCreditReserve: fallbackReserve,
    source: "fallback",
    evidence: [
      "access_reserve_source:fallback",
      `access_reserve_desired:${fallbackReserve}`,
      `access_reserve_input_state_version:${params.input.playerView.stateVersion}`,
    ],
  };
}

