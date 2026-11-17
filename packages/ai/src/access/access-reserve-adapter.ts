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
  source: "runner_economy_posture" | "remote_phase_policy";
  evidence: string[];
};

export function quoteAccessReserve(params: {
  input: AiDecisionInput;
  economyPosture?: AccessReserveEconomyPosture;
  remotePhaseReserve: () => number;
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
        ...(params.economyPosture.creditReservePolicy?.reserveDrivers ?? [])
          .slice(0, 6)
          .map((driver) => `access_reserve_driver:${driver}`),
        ...(params.economyPosture.creditReservePolicy?.reserveOverrides ?? [])
          .slice(0, 6)
          .map((override) => `access_reserve_override:${override}`),
      ],
    };
  }

  const remotePhaseReserve = Math.max(
    0,
    Math.floor(params.remotePhaseReserve()),
  );
  return {
    desiredCreditReserve: remotePhaseReserve,
    source: "remote_phase_policy",
    evidence: [
      "access_reserve_source:remote_phase_policy",
      `access_reserve_desired:${remotePhaseReserve}`,
      `access_reserve_input_state_version:${params.input.playerView.stateVersion}`,
    ],
  };
}
