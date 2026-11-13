import {
  cardImplementationForDefinitionId,
  visibleCorpMandatoryDrawCount,
} from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { exactCurrentBasicCorpDrawCandidate } from "../../runtime/corp-draw-action-facts";
import { turnKey } from "../../runtime/runtime-identifiers";
import { prepareCorpPunishHandAssessment } from "./punish-hand-retention";
import type { CorpPunishDrawNeed } from "./punish-types";

/** One sampling action for one missing component. The possible hit is a
 * conditional development objective, never a current action or kill quote. */
export function corpPunishDevelopmentDrawNeed(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpPunishDrawNeed | undefined {
  const view = input.playerView;
  if (
    input.side !== "corp" ||
    view.activeSide !== "corp" ||
    view.timingPoint !== "corp_action.main" ||
    view.pendingChoice ||
    !Number.isSafeInteger(view.turnSerial) ||
    view.own.clicks < 1 ||
    // A replaced draw is a different, multi-card observation and Choice.
    view.servers.some((server) =>
      server.root.some(
        (card) =>
          card.rezzed &&
          (!card.known ||
            !card.definitionId ||
            cardImplementationForDefinitionId(card.definitionId)?.corpUtility
              ?.kind === "corp_draw_extra_then_bottom_one"),
      ),
    )
  )
    return undefined;
  const draws = candidates.filter((candidate) =>
    exactCurrentBasicCorpDrawCandidate(input, candidate),
  );
  if (draws.length !== 1) return undefined;
  const draw = draws[0]!;
  const options = prepareCorpPunishHandAssessment(input).developmentOptions();
  const hits = options.reduce((sum, option) => sum + option.copies, 0);
  const population = view.own.stackOrRdCount;
  // A narrow single-card sample must have a material hit density.
  if (hits <= 0 || hits * 10 < population) return undefined;
  const attempted = [...view.publicEvents, ...input.eventTail].some(
    (event) =>
      event.type === "draw_card" &&
      event.publicPayload.actor === "corp" &&
      event.turnSerial === view.turnSerial &&
      event.stateVersionAfter <= view.stateVersion,
  );
  const key = turnKey(input);
  return {
    needId: `draw-tag-damage-component:${key}`,
    turnKey: key,
    stateVersion: view.stateVersion,
    actionId: draw.actionId,
    remainingAttempts: attempted ? 0 : 1,
    protectedHqCardIds: [
      ...new Set(options.flatMap((option) => option.line.cardInstanceIds)),
    ].sort(),
    hits,
    population,
    missingRoles: [
      ...new Set(options.map((option) => option.missingRole)),
    ].sort(),
    leastLineCredits: Math.min(...options.map((option) => option.line.credits)),
    leastLineClicks: Math.min(
      ...options.map((option) => option.line.cardInstanceIds.length + 1),
    ),
    nextMandatoryDrawCount: visibleCorpMandatoryDrawCount(view),
  };
}
