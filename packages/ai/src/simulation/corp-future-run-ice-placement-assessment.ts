import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import {
  buildCorpIceCardFacts,
  visibleSourceCardForCorpIcePlacement,
} from "../runtime/corp-ice-placement/corp-ice-placement";

export type CorpFutureRunIceClass =
  | "ball_and_chain"
  | "canis"
  | "bolter_or_data_darts"
  | "future_run_ice";

export type CorpIcePlacementDiagnosticsAssessment = {
  definitionId: string;
  title: string;
  futureRunIceClass: CorpFutureRunIceClass;
  serverId: string;
  existingIceCount: number;
  installedOnEmptyServer: boolean;
  resultingPosition: CorpIcePlacementResultingPosition;
};

export type CorpIcePlacementResultingPosition =
  | "outermost"
  | "known_engine_position"
  | "unknown";

// Historical simulation buckets only. They preserve metric continuity and are
// deliberately unavailable to the production decision graph.
const CORP_FUTURE_RUN_ICE_CLASS_BY_DEFINITION: Readonly<
  Record<string, CorpFutureRunIceClass>
> = {
  "onr_v1_222_ball-and-chain": "ball_and_chain",
  "onr_v1_224_bolter-cluster": "bolter_or_data_darts",
  "onr_v1_225_canis-major": "canis",
  "onr_v1_226_canis-minor": "canis",
  "onr_v1_234_data-darts": "bolter_or_data_darts",
  "onr_v1_242_fatal-attractor": "future_run_ice",
  onr_v1_274_tutor: "future_run_ice",
  "onr_v1_276_viral-15": "future_run_ice",
  onr_v1_277_virizz: "future_run_ice",
};

export function classifyCorpFutureRunIcePlacementProfile(
  definitionId: string | undefined,
  card?: VisibleCard,
): CorpFutureRunIceClass | undefined {
  if (!definitionId) return undefined;
  const historicalClass = CORP_FUTURE_RUN_ICE_CLASS_BY_DEFINITION[definitionId];
  if (historicalClass) return historicalClass;
  const profile = buildCorpIceCardFacts(
    card ?? {
      instanceId: `definition:${definitionId}`,
      known: true,
      definitionId,
    },
  );
  return profile.requiresOtherIceContext ? "future_run_ice" : undefined;
}

export function assessCorpIcePlacementForDiagnostics(
  input: AiDecisionInput,
  action: LegalAction,
): CorpIcePlacementDiagnosticsAssessment | undefined {
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "install_card" ||
    action.payload?.placement !== "ice"
  ) {
    return undefined;
  }
  const sourceCard = visibleSourceCardForCorpIcePlacement(input, action);
  const definitionId = sourceCard?.definitionId;
  const futureRunIceClass = classifyCorpFutureRunIcePlacementProfile(
    definitionId,
    sourceCard,
  );
  const serverId = corpIcePlacementServerId(action);
  if (!sourceCard || !definitionId || !futureRunIceClass || !serverId) {
    return undefined;
  }
  const existingIceCount =
    serverId === "new_remote"
      ? 0
      : input.playerView.servers.find((server) => server.id === serverId)?.ice
          .length;
  if (existingIceCount === undefined) return undefined;
  return {
    definitionId,
    title: sourceCard.title ?? definitionId,
    futureRunIceClass,
    serverId,
    existingIceCount,
    installedOnEmptyServer: existingIceCount === 0,
    resultingPosition: corpIcePlacementResultingPosition(action),
  };
}

function corpIcePlacementServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

function corpIcePlacementResultingPosition(
  action: LegalAction,
): CorpIcePlacementResultingPosition {
  const position = action.payload?.position ?? action.payload?.installPosition;
  if (position === "outermost") return "outermost";
  if (typeof position === "string") return "known_engine_position";
  return "unknown";
}
