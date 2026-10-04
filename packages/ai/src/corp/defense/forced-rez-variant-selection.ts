import type {
  AiDecisionInput,
  CorpForcedIceRezChoiceQuote,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
} from "../../runtime/corp-score-protection-assessment";
import { scoreContinuationClaims } from "./corp-defense-score-reserve";

/** Mandatory retention starts at the lowest certified cost. More spending
 * needs a known marginal access benefit and preserves published score cash. */
export function selectForcedRezVariant(
  input: AiDecisionInput,
  server: PlayerView["servers"][number],
  ice: VisibleCard,
  variants: readonly CorpForcedIceRezChoiceQuote[],
  projects: readonly CorpScoreProjectSignal[],
): CorpForcedIceRezChoiceQuote | undefined {
  const ordered = variants
    .slice()
    .sort(
      (a, b) =>
        a.rezCredits - b.rezCredits ||
        a.mandatoryAgendaPointCost - b.mandatoryAgendaPointCost ||
        a.optionId.localeCompare(b.optionId),
    );
  let selected = ordered[0];
  if (!selected) return undefined;
  const runnerRig = input.playerView.opponent.rig;
  // Unknown defense benefit never certifies paying an optional upgrade.
  if (!Array.isArray(runnerRig)) return selected;
  const assess = (quote: CorpForcedIceRezChoiceQuote) =>
    assessCorpScoreProtection({
      serverIce: server.ice.map((card) =>
        card.instanceId === ice.instanceId
          ? {
              ...card,
              rezzed: true,
              subtypes: quote.effectiveSubtypes,
              strength: quote.effectiveRunQuote.effectiveStrength,
              effectiveRunQuote: quote.effectiveRunQuote,
            }
          : card,
      ),
      serverRoot: server.root,
      runnerRig,
      ...(input.playerView.specialZones?.setAside !== undefined
        ? { runnerSetAside: input.playerView.specialZones.setAside }
        : {}),
      ...(input.playerView.opponent.memoryUsed !== undefined
        ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
        : {}),
      ...(input.playerView.opponent.memoryLimit !== undefined
        ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
        : {}),
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
  let protection = assess(selected);
  const claim = scoreContinuationClaims(projects)[0];
  for (const variant of ordered.slice(1)) {
    if (
      claim &&
      (variant.creditsAfterRez < claim.requiredCreditsBeforeNextCorpTurn ||
        (claim.terminalScore &&
          variant.agendaPointsAfterRez + claim.agendaPoints <
            input.playerView.agendaPointsToWin))
    )
      continue;
    const next = assess(variant);
    if (protection.knowledge !== "known" || next.knowledge !== "known")
      continue;
    const comparison = compareExactProbabilities(
      next.runnerAccessSuccessProbability,
      protection.runnerAccessSuccessProbability,
    );
    if (
      comparison === -1 ||
      (comparison === 0 &&
        next.runnerCreditsRemainingOnBestAccessPath <
          protection.runnerCreditsRemainingOnBestAccessPath)
    ) {
      selected = variant;
      protection = next;
    }
  }
  return selected;
}
