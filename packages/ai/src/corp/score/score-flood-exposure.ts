import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "../../actions/risk-action-projection";
import { corpGuaranteedOnPlayAdvancementCountersPerTarget } from "../../runtime/corp-canonical-card-facts";
import { assessBestFundedCorpScoreProtection } from "../../runtime/corp-funded-score-protection";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import { visibleCardIsAgenda } from "../../runtime/visible-action-facts";
import {
  requireVisibleAgendaAdvancementRequirement,
  requireVisibleAgendaPoints,
} from "../../runtime/visible-agenda-facts";

function isPlainStealableAgenda(
  input: AiDecisionInput,
  card: VisibleCard,
): boolean {
  if (!visibleCardIsAgenda(input, card) || !card.definitionId) return false;
  const spec = cardSpecPlanningCardByDefinitionId(card.definitionId);
  return (
    spec !== undefined &&
    !spec.planning.engine.selfStealCosts?.length &&
    !spec.planning.engine.accessEffects?.some(
      (effect) =>
        effect.kind === "on_access" && effect.sourceZones.includes("installed"),
    )
  );
}

/** A narrow exact exposure bound for the emergency installation exception.
 * A bare one-agenda remote consumes a base run. A pair with one paid ICE path
 * needs an exact, affordable defense comparison and two reserved run clicks. */
export function corpFloodInstallCreatesCombinedTerminalExposure(
  input: AiDecisionInput,
  agenda: VisibleCard,
  serverId: string | undefined,
  installActionId: string,
): boolean {
  const view = input.playerView;
  // The Engine already reserves one run in this public next-turn click budget.
  const otherRunSlots = view.runnerNextTurnCreditClicks;
  if (
    !serverId ||
    !isFiniteNonNegativeInteger(otherRunSlots) ||
    otherRunSlots === 0 ||
    !isPlainStealableAgenda(input, agenda)
  )
    return false;
  if (serverId !== "new_remote") {
    const target = view.servers.find((server) => server.id === serverId);
    if (!target || target.ice.length !== 0 || target.root.length !== 0)
      return false;
  }

  const otherOpenAgendaPoints = view.servers
    .flatMap((server) => {
      if (
        server.id === serverId ||
        !server.id.startsWith("remote_") ||
        server.ice.length !== 0 ||
        server.root.length !== 1
      )
        return [];
      const exposed = server.root[0]!;
      return isPlainStealableAgenda(input, exposed)
        ? [requireVisibleAgendaPoints(input, exposed)]
        : [];
    })
    .sort((left, right) => right - left)
    .slice(0, otherRunSlots);
  const pointsAfterNewAgenda =
    view.opponent.agendaPoints + requireVisibleAgendaPoints(input, agenda);
  return (
    (otherOpenAgendaPoints.length > 0 &&
      pointsAfterNewAgenda +
        otherOpenAgendaPoints.reduce((total, points) => total + points, 0) >=
        view.agendaPointsToWin) ||
    paidRemoteCompletesFloodExposure(
      input,
      installActionId,
      serverId,
      pointsAfterNewAgenda,
      otherRunSlots - 1,
    )
  );
}

function paidRemoteCompletesFloodExposure(
  input: AiDecisionInput,
  installActionId: string,
  targetServerId: string,
  pointsAfterNewAgenda: number,
  runnerPreparationClicks: number,
): boolean {
  const view = input.playerView;
  const runnerRig = view.opponent.rig?.filter(
    (card) =>
      randomBreakOrDamageRiskProfileForDefinitionId(card.definitionId) ===
      undefined,
  );
  const install = input.legalActions.find(
    (action) => action.actionId === installActionId,
  );
  if (
    !runnerRig ||
    !install ||
    install.type !== "install_card" ||
    install.expiresAtStateVersion !== view.stateVersion ||
    install.costs.reduce((total, cost) => total + (cost.clicks ?? 0), 0) !==
      1 ||
    install.costs.some((cost) => (cost.credits ?? 0) !== 0)
  )
    return false;
  const remainingCorpClicks = view.own.clicks - 1;
  if (remainingCorpClicks < 0 || remainingCorpClicks > 1) return false;

  return view.servers.some((server) => {
    const existing = server.root[0];
    if (
      server.id === targetServerId ||
      !server.id.startsWith("remote_") ||
      server.statuses?.some((status) => status.kind === "run_prohibited") ||
      server.root.length !== 1 ||
      !existing ||
      !isPlainStealableAgenda(input, existing) ||
      pointsAfterNewAgenda + requireVisibleAgendaPoints(input, existing) <
        view.agendaPointsToWin ||
      server.ice.length === 0 ||
      !server.ice.every((ice) => hasOnlyCertifiedRunStops(input, ice))
    )
      return false;

    const remainingAdvances =
      requireVisibleAgendaAdvancementRequirement(input, existing) -
      (existing.advancementCounters ?? 0);
    const availableCorpCredits = fundedUnchangedRemoteCredits(
      input,
      remainingCorpClicks,
      existing,
      server.id,
      remainingAdvances,
    );
    if (availableCorpCredits === undefined) return false;
    const access = assessBestFundedCorpScoreProtection({
      serverIce: server.ice,
      serverRoot: server.root,
      runnerRig,
      runnerSetAside: view.specialZones?.setAside ?? [],
      runnerCredits: view.opponent.credits,
      runnerCreditPoolHorizon: "next_runner_turn",
      runnerPreparationCreditClicks: runnerPreparationClicks,
      targetServerId: server.id,
      observedAtStateVersion: view.stateVersion,
      availableCorpCredits,
      availableCorpClicks: remainingCorpClicks,
      availableCorpAgendaPoints: view.own.agendaPoints,
      scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
    return (
      access.knowledge === "known" &&
      compareExactProbabilities(
        access.protection.runnerAccessSuccessProbability,
        { numerator: 1, denominator: 1 },
      ) === 0
    );
  });
}

/** Permit only plain ETR ICE for this proof. The protection calculator can
 * ignore side effects for other callers, but two-run survival cannot. */
function hasOnlyCertifiedRunStops(
  input: AiDecisionInput,
  ice: VisibleCard,
): boolean {
  if (!ice.known || !ice.definitionId) return false;
  const post = ice.effectivePostRezRunQuote;
  const effective = ice.rezzed
    ? ice.effectiveRunQuote
    : post?.complete &&
        post.expiresAtStateVersion === input.playerView.stateVersion
      ? post.effectiveRunQuote
      : undefined;
  if (effective) {
    return (
      effective.iceInstanceId === ice.instanceId &&
      effective.iceDefinitionId === ice.definitionId &&
      !effective.conditionalEncounterEffects?.length &&
      effective.subroutines.length > 0 &&
      effective.subroutines.every(
        (subroutine) => subroutine.type === "end_the_run",
      )
    );
  }
  const rez = ice.effectiveRezCostQuote;
  // The shared Defense solver quotes both subtype modes from this exact
  // Engine price binding and the same canonical subroutines.
  const subroutines = CARD_DEFINITIONS_BY_ID[ice.definitionId]?.subroutines;
  return (
    !ice.rezzed &&
    post?.complete === false &&
    post.reason === "variable_rez_choice_required" &&
    rez?.complete === true &&
    rez.expiresAtStateVersion === input.playerView.stateVersion &&
    rez.variableParameter?.kind === "alternate_subtype" &&
    !!subroutines?.length &&
    subroutines.every((subroutine) => subroutine.type === "end_the_run")
  );
}

function fundedUnchangedRemoteCredits(
  input: AiDecisionInput,
  remainingClicks: number,
  existing: VisibleCard,
  existingServerId: string,
  remainingAdvances: number,
): number | undefined {
  if (!isFiniteNonNegativeInteger(remainingAdvances) || remainingAdvances === 0)
    return undefined;
  const affordable = input.legalActions.filter(
    (action) =>
      action.costs.reduce((total, cost) => total + (cost.clicks ?? 0), 0) <=
      remainingClicks,
  );
  const basicCredit = (action: LegalAction) =>
    action.type === "gain_credit" &&
    action.source === "basic_action" &&
    action.payload?.gainCreditsAmount === 1;
  for (const action of affordable) {
    if (
      basicCredit(action) ||
      action.type === "end_turn" ||
      (action.type === "draw_card" && action.source === "basic_action")
    )
      continue;
    const source = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    );
    if (
      action.type === "install_card" &&
      source &&
      visibleCardIsAgenda(input, source) &&
      action.payload?.placement === "root" &&
      action.payload.serverId !== existingServerId &&
      action.payload.rootReplacement === undefined
    )
      continue;
    if (
      action.type === "advance_card" &&
      action.source === existing.instanceId &&
      remainingAdvances > 1
    )
      continue;
    const placed = corpGuaranteedOnPlayAdvancementCountersPerTarget(
      source?.definitionId,
    );
    if (
      action.type === "play_operation" &&
      placed > 0 &&
      placed < remainingAdvances
    )
      continue;
    return undefined;
  }
  return input.playerView.own.credits + (affordable.some(basicCredit) ? 1 : 0);
}
