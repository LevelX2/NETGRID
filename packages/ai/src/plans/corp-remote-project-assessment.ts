import type { AiDecisionInput } from "@netgrid/shared";
import type {
  RemoteDoctrineProfile,
  RemoteProtectionTarget,
} from "../remote-doctrine-profile";
import { corpRemoteContestabilityAssessment } from "./tactical-plan-corp-score-window";

export type CorpRemoteProtectionBand =
  | "none"
  | "light"
  | "score_window"
  | "taxing"
  | "glacier";

export type CorpRemoteProjectAssessment = {
  serverId: string;
  installedIceCount: number;
  knownIceCount: number;
  contestable: boolean | "unknown";
  visibleBreakCost?: number;
  estimatedRunnerRecoveryTurns: number;
  band: CorpRemoteProtectionBand;
  targetBand: RemoteProtectionTarget;
  targetMet: boolean;
  evidence: string[];
};

const BAND_RANK: Record<CorpRemoteProtectionBand, number> = {
  none: 0,
  light: 1,
  score_window: 2,
  taxing: 3,
  glacier: 4,
};

export function assessCorpRemoteProject(params: {
  input: AiDecisionInput;
  serverId: string;
  doctrine: RemoteDoctrineProfile;
}): CorpRemoteProjectAssessment {
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === params.serverId,
  );
  const installedIceCount = server?.ice.length ?? 0;
  const contestability = corpRemoteContestabilityAssessment(
    params.input,
    params.serverId,
  );
  const estimatedRunnerRecoveryTurns = contestability
    ? contestability.canReachAccess
      ? Math.ceil((contestability.visibleBreakCost ?? 0) / 3)
      : params.doctrine.investmentBudget.targetRecoveryTurns + 1
    : 0;
  const band = protectionBand({
    installedIceCount,
    ...(contestability
      ? {
          contestable: contestability.contestable,
          canReachAccess: contestability.canReachAccess,
        }
      : {}),
    estimatedRunnerRecoveryTurns,
    targetRecoveryTurns: params.doctrine.investmentBudget.targetRecoveryTurns,
  });
  const targetBand = params.doctrine.protectionTarget;
  const targetMet = BAND_RANK[band] >= BAND_RANK[targetBand];
  return {
    serverId: params.serverId,
    installedIceCount,
    knownIceCount: contestability?.assessedKnownIceCount ?? 0,
    contestable: contestability?.contestable ?? "unknown",
    ...(contestability?.visibleBreakCost !== undefined
      ? { visibleBreakCost: contestability.visibleBreakCost }
      : {}),
    estimatedRunnerRecoveryTurns,
    band,
    targetBand,
    targetMet,
    evidence: [
      `remote_project_server:${params.serverId}`,
      `remote_project_installed_ice:${installedIceCount}`,
      `remote_project_known_ice:${contestability?.assessedKnownIceCount ?? 0}`,
      `remote_project_contestable:${contestability?.contestable ?? "unknown"}`,
      `remote_project_visible_break_cost:${contestability?.visibleBreakCost ?? "unknown"}`,
      `remote_project_runner_recovery_turns:${estimatedRunnerRecoveryTurns}`,
      `remote_project_protection_band:${band}`,
      `remote_project_target_band:${targetBand}`,
      `remote_project_target_met:${targetMet}`,
      ...(contestability?.evidence ?? []),
    ],
  };
}

function protectionBand(params: {
  installedIceCount: number;
  contestable?: boolean;
  canReachAccess?: boolean;
  estimatedRunnerRecoveryTurns: number;
  targetRecoveryTurns: number;
}): CorpRemoteProtectionBand {
  if (params.installedIceCount <= 0) return "none";
  if (params.contestable === undefined) return "light";
  const recoveryTargetMet =
    params.estimatedRunnerRecoveryTurns >= params.targetRecoveryTurns;
  if (
    params.contestable === false &&
    params.installedIceCount >= 3 &&
    (recoveryTargetMet || params.canReachAccess === false)
  ) {
    return "glacier";
  }
  if (recoveryTargetMet) return "taxing";
  if (params.contestable === false) return "score_window";
  return "light";
}
