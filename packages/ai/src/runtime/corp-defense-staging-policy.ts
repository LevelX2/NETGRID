import type { AiDecisionInput } from "@netgrid/shared";
import type { KnownCorpFundedIceInstallRouteProjection } from "./corp-funded-score-protection";

export type CorpFundingOnlyIceStagingInput = {
  phase: string;
  serverId: string;
  urgent: boolean;
  centralPressure?: "material" | "acute" | "terminal";
  installRoute?: Readonly<{
    disposition: "productive" | "funding_only";
    rezFundingGap?: number;
    projection: KnownCorpFundedIceInstallRouteProjection;
  }>;
};

export function assessFundingOnlyIceStaging(params: {
  input: AiDecisionInput;
  signal: CorpFundingOnlyIceStagingInput;
  productiveAlternativeExists: boolean;
  fundingAlternativeExists: boolean;
}):
  | {
      admissible: true;
      disposition: "stage_for_later_rez" | "bounded_bluff";
      bluffValue: number;
      reasonCode: string;
    }
  | { admissible: false; reasonCode: string } {
  const route = params.signal.installRoute;
  if (
    params.signal.phase !== "install_ice" ||
    route?.disposition !== "funding_only" ||
    route.projection.knowledge !== "known"
  ) {
    return { admissible: false, reasonCode: "not_funding_only_defense" };
  }
  if (params.productiveAlternativeExists) {
    return {
      admissible: false,
      reasonCode: "productive_defense_install_available",
    };
  }
  if (params.fundingAlternativeExists) {
    return {
      admissible: false,
      reasonCode: "exact_funding_before_install_available",
    };
  }
  if (
    params.signal.serverId !== "hq" &&
    params.signal.serverId !== "rd" &&
    !params.signal.urgent
  ) {
    return {
      admissible: false,
      reasonCode: "noncentral_staging_without_bound_urgency",
    };
  }
  const projection = route.projection;
  const gap =
    projection.after.minimumAdditionalCreditsToSatisfy ??
    route.rezFundingGap ??
    Number.POSITIVE_INFINITY;
  if (
    !Number.isSafeInteger(gap) ||
    gap <= 0 ||
    gap > 3 ||
    projection.installClicks > params.input.playerView.own.clicks ||
    projection.installCredits > params.input.playerView.own.credits
  ) {
    return {
      admissible: false,
      reasonCode: "staging_funding_horizon_not_credible",
    };
  }
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === params.signal.serverId,
  );
  if (!server) {
    return { admissible: false, reasonCode: "target_server_missing" };
  }
  const centralPressure =
    params.signal.centralPressure === "material" ||
    params.signal.centralPressure === "acute" ||
    params.signal.centralPressure === "terminal";
  if (
    projection.effect === "no_progress" &&
    server.ice.length > 0 &&
    !centralPressure
  ) {
    return {
      admissible: false,
      reasonCode: "bluff_has_no_defense_or_tempo_basis",
    };
  }
  if (projection.effect === "no_progress") {
    return {
      admissible: true,
      disposition: "bounded_bluff",
      bluffValue: Math.min(3, server.ice.length === 0 ? 3 : 1),
      reasonCode: "bounded_central_bluff_with_credible_funding_horizon",
    };
  }
  return {
    admissible: true,
    disposition: "stage_for_later_rez",
    bluffValue: 0,
    reasonCode: "structured_defense_progress_with_later_rez",
  };
}
