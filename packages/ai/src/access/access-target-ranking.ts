import type { AccessTargetKind } from "./access-decision-types";
import type { KnownRemoteAccessCommitment } from "../decision/known-remote-access-commitment";
import type { AccessDecisionProjection } from "../decision/access-decision-projection";

export type KnownRemoteAccessCandidate = {
  positionKey: string;
  instanceId?: string;
  definitionId: string;
  targetKind: AccessTargetKind;
  commitment: KnownRemoteAccessCommitment;
  projection: AccessDecisionProjection;
  valueScore: number;
};

export type RankedKnownRemoteAccessCandidate = KnownRemoteAccessCandidate & {
  rankScore: number;
  rankEvidence: string[];
};

export function rankKnownRemoteAccessTargets(
  candidates: readonly KnownRemoteAccessCandidate[],
): RankedKnownRemoteAccessCandidate[] {
  return candidates
    .map((candidate) => {
      const rankScore = knownRemoteAccessRankScore(candidate);
      return {
        ...candidate,
        rankScore,
        rankEvidence: [
          `access_target_rank_position:${candidate.positionKey}`,
          `access_target_rank_kind:${candidate.targetKind}`,
          `access_target_rank_intent:${candidate.commitment.intendedAccessAction}`,
          `access_target_rank_score:${rankScore}`,
        ],
      };
    })
    .sort((left, right) => {
      if (right.rankScore !== left.rankScore) {
        return right.rankScore - left.rankScore;
      }
      return left.positionKey.localeCompare(right.positionKey);
    });
}

function knownRemoteAccessRankScore(
  candidate: KnownRemoteAccessCandidate,
): number {
  if (
    candidate.targetKind === "agenda" ||
    candidate.commitment.reason === "agenda_payoff"
  ) {
    return 10_000 + candidate.valueScore;
  }
  if (candidate.commitment.intendedAccessAction === "trash") {
    return 1_000 + candidate.valueScore * 100;
  }
  if (candidate.commitment.intendedAccessAction === "access_only") {
    return 100 + candidate.valueScore;
  }
  return candidate.valueScore;
}

