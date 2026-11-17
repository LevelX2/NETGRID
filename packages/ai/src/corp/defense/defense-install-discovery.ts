import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { candidateTargetIds } from "../../actions/action-candidate-facts";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
  corpUpgradePlacementAssessment,
} from "../../runtime/corp-upgrade-placement";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
import { isCorpInstallServerId } from "../../runtime/visible-action-facts";
import {
  corpReservedScoreServerIds,
  corpScoreProjectReservesSlotAfterCampaign,
} from "../../runtime/corp-scoreline/score-hand-support";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { corpSpendConsumesKnownCentralRezReserve } from "./corp-defense-domain-signals";
import { corpCardRoutePreservesScoreReserve } from "./defense-discovery-support";
import type { CorpDefensiveUpgradePlacement } from "./defense-runtime-types";
import {
  corpStructuredIceSupportAssessment,
  corpSupportRetainsFundedIce,
} from "./corp-structured-ice-support";

/** Global passive assets prepare the same structured need their rez consumes. */
export function corpGlobalIceSupportAssetInstallSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
  currentCandidates: readonly ActionSemanticCandidate[],
): CorpGenericDefenseSignal | undefined {
  const placement = corpGlobalIceSupportPlacementSignal(
    input,
    candidate,
    scoreProjects,
  );
  if (!placement || placement.serverId !== "new_remote") return placement;
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  )!;
  const totalCost =
    candidate.costProfile.creditCost! +
    Number(action.payload!.postInstallRezQuoteFinalCredits);
  const protectedEquivalent = currentCandidates.some((other) => {
    if (
      other.sourceCardInstanceId !== candidate.sourceCardInstanceId ||
      other.actionId === candidate.actionId
    )
      return false;
    const supported = corpGlobalIceSupportPlacementSignal(
      input,
      other,
      scoreProjects,
    );
    if (!supported || supported.serverId === "new_remote") return false;
    const otherAction = input.legalActions.find(
      (a) => a.actionId === other.actionId,
    )!;
    return (
      other.costProfile.creditCost! +
        Number(otherAction.payload!.postInstallRezQuoteFinalCredits) <=
        totalCost &&
      other.costProfile.clickCost! <= candidate.costProfile.clickCost!
    );
  });
  return protectedEquivalent ? undefined : placement;
}

function corpGlobalIceSupportPlacementSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpGenericDefenseSignal | undefined {
  if (input.side !== "corp" || candidate.semanticActionType !== "install.card")
    return undefined;
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const source = input.playerView.own.gripOrHq.find(
    (c) => c.instanceId === candidate.sourceCardInstanceId,
  );
  const hint =
    source?.definitionId && AI_HINTS_BY_CARD.get(source.definitionId);
  const target = action?.payload?.serverId;
  const existing = input.playerView.servers.find(
    (server) => server.id === target,
  );
  const profile =
    hint &&
    hint.targetProfiles?.find(
      (p) =>
        "schemaVersion" in p &&
        p.purpose === "rez_support_visible_installed_ice" &&
        p.targetType === "installed_ice" &&
        p.serverScope === "any_visible_server",
    );
  if (
    !action ||
    !source?.known ||
    source.type !== "asset" ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    !profile ||
    action.side !== "corp" ||
    action.source !== source.instanceId ||
    action.payload?.cardId !== source.instanceId ||
    action.payload.placement !== "root" ||
    typeof target !== "string" ||
    (target !== "new_remote" &&
      (!/^r[1-9]\d*$/.test(target) ||
        !existing ||
        existing.root.some(
          (card) => card.type === "asset" || card.type === "agenda",
        ))) ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    !hasExactNonNegativeCostProfile(candidate)
  )
    return undefined;
  // This global asset must survive its preparation. An agenda uses the same
  // exclusive root slot; placing support in a bound scoring fort would make
  // the subsequent agenda installation immediately destroy that investment.
  if (
    existing &&
    corpReservedScoreServerIds(
      input,
      scoreProjects.filter((project) =>
        corpScoreProjectReservesSlotAfterCampaign(input, project),
      ),
    ).has(existing.id)
  )
    return undefined;
  const p = action.payload;
  if (
    p.postInstallRezQuoteComplete !== true ||
    p.postInstallRezQuoteCostKind !== "fixed" ||
    p.postInstallRezQuoteCardId !== source.instanceId ||
    p.postInstallRezQuoteTargetServerId !== target ||
    p.postInstallRezQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion ||
    typeof p.postInstallRezQuoteProjectedServerId !== "string" ||
    !/^r[1-9]\d*$/.test(p.postInstallRezQuoteProjectedServerId) ||
    (target === "new_remote"
      ? input.playerView.servers.some(
          (s) => s.id === p.postInstallRezQuoteProjectedServerId,
        )
      : p.postInstallRezQuoteProjectedServerId !== target) ||
    !Number.isSafeInteger(p.postInstallRezQuoteFinalCredits) ||
    Number(p.postInstallRezQuoteFinalCredits) < 0 ||
    p.postInstallRezQuoteMandatoryAgendaPointCost !== 0 ||
    Number(p.postInstallRezQuoteFinalCredits) +
      candidate.costProfile.creditCost! >
      input.playerView.own.credits
  )
    return undefined;
  const preparation = {
    ...candidate,
    costProfile: {
      ...candidate.costProfile,
      creditCost:
        candidate.costProfile.creditCost! +
        Number(p.postInstallRezQuoteFinalCredits),
    },
  };
  const support = corpStructuredIceSupportAssessment(
    input,
    preparation,
    target,
    hint || undefined,
  );
  if (
    !support?.productive ||
    (existing &&
      !corpSupportRetainsFundedIce(input, preparation, [existing], 1)) ||
    !corpCardRoutePreservesScoreReserve(
      input,
      preparation,
      target,
      scoreProjects,
    ).preservesReserve
  )
    return undefined;
  return {
    kind: "generic",
    defenseId: `install-global-ice-support:${source.instanceId}:${target}`,
    serverId: target,
    phase: "install_defense_support",
    sourceDefinitionIds: [source.definitionId!],
    actionIds: [action.actionId],
    urgent: false,
    value: support.value,
    evidenceCode: `corp_global_ice_support_install_bound_to_existing_targets:${support.evidenceCode}:rez_credits:${p.postInstallRezQuoteFinalCredits}`,
  };
}

export function corpDefensiveUpgradePlacement(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefensiveUpgradePlacement | undefined {
  if (
    candidate.semanticActionType !== "install.card" ||
    !candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const exactAgendaStealTax =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "accessed_card" &&
        effect.timing === "on_access" &&
        effect.target === "agenda_steal_cost" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true;
  const exactRemoteAgendaStealTax =
    exactAgendaStealTax &&
    hint?.effects?.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent" &&
        effect.target === "remote.agenda_steal_tax",
    ) === true;
  const exactCentralAgendaStealTax =
    exactAgendaStealTax &&
    hint?.functionSignals?.includes("access.agenda_steal_tax") === true;
  const exactFortRezSupport =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "rez_discount" &&
        effect.scope === "fort" &&
        effect.timing === "during_run" &&
        effect.target === "ice.corp_rez_discount",
    ) === true;
  const exactPassIceTax =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "fort" &&
        effect.timing === "during_run" &&
        effect.target === "run.corp_pay_or_end_run" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true &&
    hint.effects.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent" &&
        effect.target === "remote.scoring_protection",
    );
  const assignedToDefense =
    exactFortRezSupport ||
    exactPassIceTax ||
    exactRemoteAgendaStealTax ||
    exactCentralAgendaStealTax ||
    (hint?.roles?.includes("remote_support") === true &&
      hint?.remoteRole?.kind === "scoring_protection" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.functionSignals?.includes("remote.scoring_protection") === true &&
      hint.functionSignals.includes("run.corp_pay_or_end_run")) ||
    (hint?.remoteRole?.kind === "agenda_steal_tax" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.planRoles?.includes("remote_upgrade_tax") === true &&
      hint.planRoles.includes("protect_remote") &&
      hint.functionSignals?.includes("remote.agenda_steal_tax") === true &&
      hint.functionSignals.includes("tax.runner_credit") &&
      hint.effects?.some(
        (effect) =>
          effect.kind === "run_tax" &&
          effect.scope === "accessed_card" &&
          effect.timing === "on_access" &&
          typeof effect.amount === "number" &&
          effect.amount > 0,
      ) === true &&
      hint.effects.some(
        (effect) =>
          effect.kind === "remote_protection" &&
          effect.scope === "fort" &&
          effect.timing === "persistent",
      ));
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const sourceCard = candidate.sourceCardInstanceId
    ? input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      )
    : undefined;
  const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
  if (!legalAction || !sourceCard || !serverId) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Every defensive upgrade install requires a visible source card, exact LegalAction, and exact target server before the defense portfolio may assess it.",
    });
  }
  if (
    exactCentralAgendaStealTax &&
    (serverId === "hq" || serverId === "rd") &&
    (centralAllocation?.status !== "known" ||
      centralAllocation.selectedServerId !== serverId ||
      centralAllocation.evidence[serverId].threat === "none")
  ) {
    return {
      evidenceCode: `corp_defense_support_rejected:${serverId}:central_allocation_${
        centralAllocation?.status === "known"
          ? centralAllocation.selectedServerId
          : "unknown"
      }`,
    };
  }
  const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
  const placement = corpUpgradePlacementAssessment({
    input,
    action: legalAction,
    roles,
    actionSemanticCandidate: candidate,
    sourceCard,
    serverId,
  });
  if (!placement) {
    if (!assignedToDefense) return undefined;
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment.",
    });
  }
  if (
    hasExactNonNegativeCostProfile(candidate) &&
    corpSpendConsumesKnownCentralRezReserve(
      input,
      centralAllocation,
      input.playerView.own.credits - candidate.costProfile.creditCost!,
      input.playerView.own.clicks - candidate.costProfile.clickCost!,
    )
  ) {
    return {
      evidenceCode: `corp_defense_support_rejected:${serverId}:consumes_known_central_rez_reserve`,
    };
  }
  if (!assignedToDefense && placement.recommendation !== "defer") {
    return undefined;
  }
  const component =
    legalAction.payload?.regionReplacementWarning === true
      ? corpRegionReplacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        })
      : corpUpgradeInstallPlacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        });
  const activeRegionReplacement =
    legalAction.payload?.regionReplacementWarning === true &&
    placement.recommendation === "allow" &&
    placement.candidateActiveUtility.length > 0;
  if (!component) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment and value component.",
    });
  }
  const evidenceCode =
    activeRegionReplacement ||
    (placement.recommendation === "allow" &&
      placement.candidateActiveUtility.length > 0 &&
      component.value > 0)
      ? `corp_defense_support_install:${serverId}:${component.key}`
      : `corp_defense_support_rejected:${serverId}:${placement.reason}:${component.key}`;
  const reserveAssessment = corpCardRoutePreservesScoreReserve(
    input,
    candidate,
    serverId,
    scoreProjects,
  );
  if (
    (!activeRegionReplacement &&
      (placement.recommendation !== "allow" ||
        placement.candidateActiveUtility.length === 0 ||
        component.value <= 0)) ||
    !reserveAssessment.preservesReserve
  ) {
    return {
      evidenceCode: reserveAssessment.preservesReserve
        ? evidenceCode
        : `corp_defense_support_rejected:${serverId}:score_reserve:${reserveAssessment.requiredCreditsAfterAction}`,
    };
  }
  const centralPressure =
    exactCentralAgendaStealTax &&
    centralAllocation?.status === "known" &&
    (serverId === "hq" || serverId === "rd")
      ? centralAllocation.evidence[serverId].threat
      : undefined;
  return {
    evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    signal: {
      kind: "generic",
      defenseId: `install-defense-support:${candidate.sourceCardInstanceId}:${serverId}`,
      serverId,
      phase: "install_defense_support",
      sourceDefinitionIds: [candidate.sourceDefinitionId],
      actionIds: [candidate.actionId],
      urgent: centralPressure === "acute" || centralPressure === "terminal",
      ...(centralPressure && centralPressure !== "none"
        ? { centralPressure }
        : {}),
      value: 100 + Math.max(0, component.value),
      evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    },
  };
}
