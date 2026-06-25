import {
  type AiDecisionInput,
  type AiDifficulty,
  type Side,
} from "@netgrid/shared";
import aiProfilesData from "../../../../data/ai/ai-profiles-0.9.json";

export type AiProfileWeightsData = {
  profileId: string;
  side: Side;
  difficulty: AiDifficulty;
  weights: Record<string, number>;
};

export const AI_PROFILES = aiProfilesData.profiles as AiProfileWeightsData[];

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
