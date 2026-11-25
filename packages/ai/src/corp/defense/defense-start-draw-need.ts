import type { AiDecisionInput } from "@netgrid/shared";
import { buildCorpIceDensityProfile } from "../../runtime/corp-economy/corp-ice-density";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
} from "../../runtime/corp-score-protection-assessment";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";

const fullAccessProbability = { numerator: 1, denominator: 1 } as const;

/** Defense can nominate a search before any unknown mandatory cards enter HQ. */
export function corpStartDrawDefenseSearchServerId(
  input: AiDecisionInput,
): string | undefined {
  const { own, opponent, servers } = input.playerView;
  if (
    own.clicks < 1 ||
    !opponent.rig ||
    own.gripOrHq.some((card) => !card.known || card.type === "ice")
  )
    return undefined;
  const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  if (allocation.status !== "known") return undefined;
  const { selectedServerId, evidence } = allocation;
  const server = servers.find((candidate) => candidate.id === selectedServerId);
  if (!server || evidence[selectedServerId].threat !== "terminal")
    return undefined;
  const density = buildCorpIceDensityProfile(input);
  if (!density.remainingIceCount) return undefined;

  // Give the installed path every current ICE, irrespective of rez affordability.
  const strongestInstalledPath = assessCorpScoreProtection({
    serverIce: server.ice.map((ice) => ({ ...ice, rezzed: true })),
    runnerRig: opponent.rig,
    runnerCredits: opponent.credits,
    maximumRunnerAccessSuccessProbability: fullAccessProbability,
  });
  return strongestInstalledPath.knowledge === "known" &&
    compareExactProbabilities(
      strongestInstalledPath.runnerAccessSuccessProbability,
      fullAccessProbability,
    ) === 0
    ? selectedServerId
    : undefined;
}
