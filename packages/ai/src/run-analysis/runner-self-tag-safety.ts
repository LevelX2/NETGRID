import { countAvoidableRunnerTags } from "../runtime/visible-runner-tag-prevention";
import type { AiDecisionInput } from "@netgrid/shared";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import type { RunActionProjection } from "./runner-run-target-types";

/** A safety fact for the existing run quote, never an action chooser. */
export function runnerPostRunSelfTagHandSafety(params: {
  input: AiDecisionInput;
  projection: RunActionProjection;
  handAfterAction: number;
  clicksAfterRun: number;
  creditsAfterRun: number;
  preservesAgendaAccess: boolean;
}): string | undefined {
  const { input, projection } = params;
  if (
    projection.accessReplacementRequiresCorpCredits === true &&
    input.playerView.opponent.credits <= 0
  )
    return undefined;
  const tags = projection.successfulRunSelfTags ?? 0;
  if (tags <= 0 || params.clicksAfterRun > 0 || params.preservesAgendaAccess)
    return undefined;
  const threat = runnerDamageThreatAssessment(input, params.handAfterAction);
  if (
    threat.deckBelief.visibleDamagePayoffCount === 0 ||
    !["confirmed", "critical"].includes(threat.flatlineRisk.level) ||
    params.handAfterAction >= threat.flatlineRisk.recommendedHandFloor
  )
    return undefined;

  // Only installed, canonical avoidance can remove this final-click liability.
  // A held card still needs an installation action before the run.
  const remaining =
    tags -
    countAvoidableRunnerTags(
      input.playerView.own.rig ?? [],
      tags,
      params.creditsAfterRun,
      "current",
    );
  if (remaining === 0) return undefined;
  return [
    "runner_post_run_self_tag_hand_buffer_unrecoverable",
    `tags:${tags}`,
    `unavoided_tags:${remaining}`,
    `hand_after_action:${params.handAfterAction}`,
    `required_floor:${threat.flatlineRisk.recommendedHandFloor}`,
    "remaining_clicks:0",
    "punish_evidence:observed_definition_not_secret_hand",
  ].join("|");
}
