import {
  type AiDecisionInput,
  type AiDifficulty,
  type Side,
} from "@netgrid/shared";

export type AiProfileWeightsData = {
  profileId: string;
  side: Side;
  difficulty: AiDifficulty;
  weights: Record<string, number>;
};

export function profileWeights(
  input: AiDecisionInput,
  profiles: readonly AiProfileWeightsData[],
): Record<string, number> {
  const profile =
    profiles.find((candidate) => candidate.profileId === input.profileId) ??
    profiles.find(
      (candidate) =>
        candidate.side === input.side &&
        candidate.difficulty === input.difficulty,
    );
  return profile?.weights ?? {};
}
