import type {
  AiDecisionInput,
  EngineRandomizedSecretGuessAssessment,
  EngineRandomizedTraceBidCandidate,
} from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

type Choice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
export function assessSecretGuessCandidates(
  input: AiDecisionInput,
  choice: Choice,
):
  | {
      assessment: EngineRandomizedSecretGuessAssessment;
      candidates: EngineRandomizedTraceBidCandidate[];
      selectedOptionId: string;
    }
  | undefined {
  if (
    input.side !== "corp" ||
    input.difficulty === "easy" ||
    choice.kind !== "bid_amount" ||
    !choice.source.startsWith(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:",
    )
  )
    return undefined;
  const options = choice.options
    .map((o) => ({ optionId: o.id, bid: o.value }))
    .sort((a, b) => Number(a.bid) - Number(b.bid));
  if (
    options.length === 0 ||
    options.some((o, i) => o.bid !== i + 2 || typeof o.optionId !== "string")
  )
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      owner: "rules_contract",
      removalCondition:
        "The secret guess requires the complete current Engine-certified integer option range.",
    });
  return {
    assessment: {
      kind: "secret_guess",
      policy: "uniform_access_denial_v1",
      minimumGuess: 2,
      maximumGuess: Number(options.at(-1)!.bid),
    },
    candidates: options.map((o) => ({
      optionId: o.optionId,
      bid: Number(o.bid),
      weight: 1,
      utility: 1,
    })),
    selectedOptionId: options[0]!.optionId,
  };
}
