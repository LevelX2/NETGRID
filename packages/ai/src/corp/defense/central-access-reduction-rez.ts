import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  corpCurrentRunAccessServerId,
  readCorpCentralAgendaExposure,
} from "./corp-central-defense-facts-adapter";
import type { CorpExactCardRezSupportAssessment } from "./defense-runtime-types";

/** Additional stored cards skipped only if the installed upgrade is rezzed. */
function rezBoundReduction(card: VisibleCard): number {
  if (!card.known || card.type !== "upgrade" || card.definitionId === undefined)
    return 0;
  const effects =
    planningCardByDefinitionId(card.definitionId)?.engine.accessEffects ?? [];
  let amount = 0;
  for (const effect of effects) {
    if (
      effect.kind !== "on_access" ||
      !effect.sourceZones.includes("installed") ||
      effect.ignoreIfAccessedFrom?.includes("installed") ||
      (effect.installedSourceActivation !== undefined &&
        effect.installedSourceActivation !== "requires_rezzed") ||
      effect.condition ||
      effect.cost ||
      effect.optional
    )
      continue;
    for (const step of effect.effects) {
      if (
        step.kind === "reduce_current_access_queue" &&
        step.target === "remaining_stored_cards_in_this_fort" &&
        Number.isSafeInteger(step.amount) &&
        step.amount > 0
      )
        amount += step.amount;
    }
  }
  return amount;
}

// The public start event binds this exact run. Replacement or unmodeled
// card effects cannot certify that an ordinary stored-card access will occur.
function hasOrdinaryBreachOrigin(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  if (run?.runId === undefined) return false;
  const start = input.eventTail.find(
    (event) => event.stateVersionAfter === run.runId,
  )?.publicPayload;
  if (start?.actor !== "runner") return false;
  if (start.actionType === "start_run") return true;
  const kind =
    start.actionType === "play_event"
      ? "on_play"
      : start.actionType === "activated_card_ability"
        ? "activated"
        : undefined;
  if (!kind || typeof start.cardDefinitionId !== "number") return false;
  const abilities = planningCardByDefinitionId(
    start.cardDefinitionId,
  )?.engine.abilities?.filter((ability) => ability.kind === kind);
  if (abilities?.length !== 1 || abilities[0]!.effects.length !== 1)
    return false;
  const effect = abilities[0]!.effects[0];
  return (
    typeof effect === "object" &&
    effect !== null &&
    "kind" in effect &&
    effect.kind === "make_run" &&
    Object.keys(effect).every((key) =>
      [
        "kind",
        "target",
        "visibility",
        "accessServerOverride",
        "successfulRunServerOverride",
        "bypassFirstIce",
      ].includes(key),
    )
  );
}

export function assessCentralAccessReductionRez(
  input: AiDecisionInput,
  source: VisibleCard,
  serverId: string,
): CorpExactCardRezSupportAssessment | undefined {
  const reduction = rezBoundReduction(source);
  if (!reduction) return undefined;
  const view = input.playerView;
  const reject = (evidenceCode: string) => ({
    productive: false,
    value: 0,
    serverId,
    evidenceCode,
  });
  if (
    (serverId !== "hq" && serverId !== "rd") ||
    source.rezzed ||
    view.timingPoint !== "run.movement_rez_window" ||
    view.run?.position?.kind !== "server" ||
    view.run.breach ||
    corpCurrentRunAccessServerId(input) !== serverId ||
    !hasOrdinaryBreachOrigin(input)
  )
    return reject(
      "corp_central_access_reduction_no_current_stored_access_window",
    );
  const exposure = readCorpCentralAgendaExposure(input, serverId);
  if (!exposure || exposure.expectedPoints <= 0)
    return reject("corp_central_access_reduction_no_known_agenda_exposure");
  const quote = view.corpCentralAccessQuotes?.find(
    (q) =>
      q.serverId === serverId &&
      q.complete &&
      q.stateVersion === view.stateVersion,
  );
  const server = view.servers.find((s) => s.id === serverId);
  if (!quote || !server)
    return reject("corp_central_access_reduction_no_current_access_quote");
  const alreadyCovered = server.root.reduce(
    (sum, card) => sum + (card.rezzed ? rezBoundReduction(card) : 0),
    0,
  );
  const population =
    serverId === "hq" ? view.own.gripOrHq.length : view.own.stackOrRdCount;
  const remaining =
    Math.min(quote.effectiveAccessCount, population) - alreadyCovered;
  if (remaining <= 0)
    return reject("corp_central_access_reduction_stored_slots_already_covered");
  return {
    productive: true,
    serverId,
    value: 180,
    evidenceCode: `corp_central_access_reduction_protects_stored_agenda_access:${Math.min(reduction, remaining)}`,
  };
}
