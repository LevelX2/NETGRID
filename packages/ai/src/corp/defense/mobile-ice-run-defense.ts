import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { quoteCorpRemotePath } from "../../runtime/corp-remote-maturity-assessment";
import { isRemoteServerTarget } from "../../runtime/server-target";
import type { CorpRunDefenseAbilityAssessment } from "./defense-runtime-types";

type Quote = {
  schemaVersion: string;
  stateVersion: number;
  actionId: string;
  sourceIceInstanceId: string;
  sourceServerId: string;
  targetServerId: string;
  corpCreditsAfterMove: number;
  continuation: {
    requiresRez: boolean;
    rezCredits: number;
    mandatoryAgendaPoints: number;
    corpCreditsAfterDefense: number;
    corpAgendaPointsAfterDefense: number;
  };
  beforeIce: VisibleCard[];
  afterIce: VisibleCard[];
};

export function assessMobileIceRunDefense(
  input: AiDecisionInput,
  action: LegalAction,
): CorpRunDefenseAbilityAssessment | undefined {
  if (
    action.payload?.fortRunWindowAbility !==
    "move_self_to_outermost_position_on_other_fort"
  )
    return undefined;
  const run = input.playerView.run,
    targetId = action.payload.targetServerId;
  const reject = (evidenceCode: string): CorpRunDefenseAbilityAssessment => ({
    productive: false,
    serverId: String(targetId),
    value: 0,
    evidenceCode,
  });
  const raw = action.payload.corpMobileIceMoveQuoteJson;
  if (raw === undefined)
    return reject("corp_mobile_ice_requires_complete_current_move_quote");
  const fail = (): never => {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [action.actionId],
      owner: "rules_contract",
      removalCondition:
        "Supply a complete current action-bound Engine mobile-ICE movement quote.",
    });
  };
  let q: Quote;
  try {
    q = typeof raw === "string" ? JSON.parse(raw) : fail();
  } catch {
    return fail();
  }
  const origin = input.playerView.servers.find(
    (s) => s.id === q?.sourceServerId,
  );
  const target = input.playerView.servers.find(
    (s) => s.id === q?.targetServerId,
  );
  const cost = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const source = origin?.ice.find((c) => c.instanceId === action.source);
  const payment = q?.continuation;
  const exactNonNegative = (n: unknown): n is number =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const validIce = (card: VisibleCard) =>
    card?.known === true &&
    card.rezzed === true &&
    card.type === "ice" &&
    card.effectiveRunQuote?.iceInstanceId === card.instanceId &&
    card.effectiveRunQuote.iceDefinitionId === card.definitionId &&
    Array.isArray(card.effectiveRunQuote.subroutines);
  if (
    !q ||
    q.schemaVersion !== "corp-mobile-ice-move-v2" ||
    q.stateVersion !== input.playerView.stateVersion ||
    q.actionId !== action.actionId ||
    q.sourceIceInstanceId !== action.source ||
    q.targetServerId !== targetId ||
    action.side !== "corp" ||
    action.type !== "trigger_ability" ||
    action.expiresAtStateVersion !== q.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    !origin ||
    !target ||
    !source?.known ||
    !payment ||
    payment.requiresRez !== (source.rezzed !== true) ||
    !exactNonNegative(payment.rezCredits) ||
    !exactNonNegative(payment.mandatoryAgendaPoints) ||
    !exactNonNegative(payment.corpCreditsAfterDefense) ||
    !exactNonNegative(payment.corpAgendaPointsAfterDefense) ||
    (source.rezzed === true &&
      (payment.rezCredits !== 0 || payment.mandatoryAgendaPoints !== 0)) ||
    payment.corpCreditsAfterDefense !==
      q.corpCreditsAfterMove - payment.rezCredits ||
    payment.corpAgendaPointsAfterDefense !==
      input.playerView.own.agendaPoints - payment.mandatoryAgendaPoints ||
    q.corpCreditsAfterMove !== input.playerView.own.credits - cost ||
    q.corpCreditsAfterMove < 0 ||
    !Array.isArray(q.beforeIce) ||
    !Array.isArray(q.afterIce) ||
    !q.beforeIce.every(validIce) ||
    !q.afterIce.every(validIce) ||
    q.beforeIce.length !== target.ice.length ||
    q.afterIce.length !== q.beforeIce.length + 1 ||
    !q.beforeIce.every((c, i) => c.instanceId === target.ice[i]?.instanceId) ||
    !q.afterIce.every(
      (c, i) =>
        c.instanceId ===
        (i === q.beforeIce.length ? action.source : q.beforeIce[i]?.instanceId),
    )
  )
    return fail();
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "run.approach_ice" ||
    run?.attackedServerId !== target.id ||
    !isRemoteServerTarget(origin.id) ||
    origin.root.length > 0 ||
    origin.id === target.id
  )
    return reject("corp_mobile_ice_has_no_current_run_or_empty_origin");
  const protectedCards =
    target.id === "hq" ? input.playerView.own.gripOrHq : target.root;
  const terminalAgenda = protectedCards.some(
    (c) =>
      c.known &&
      c.type === "agenda" &&
      (c.agendaPoints ?? 0) + input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin,
  );
  if (!terminalAgenda)
    return reject("corp_mobile_ice_has_no_bound_current_terminal_agenda");
  const rig = input.playerView.opponent.rig ?? [];
  const budget = () =>
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.opponent.credits + (run.badPublicityCredits ?? 0),
      rig,
      { liquidCredits: input.playerView.opponent.credits },
    );
  const beforeAssessment = assessKnownRezzedIcePath(
    q.beforeIce,
    rig,
    budget(),
    target.root,
    input.playerView.own.credits,
  );
  const before = quoteCorpRemotePath({
    assessment: beforeAssessment,
    expectedKnownIceCount: q.beforeIce.length,
    runnerCreditBudgetBefore: budget(),
  });
  const after = assessKnownRezzedIcePath(
    q.afterIce,
    rig,
    budget(),
    target.root,
    payment.corpCreditsAfterDefense,
  );
  // The path assessor stops at a proven unaffordable ETR. Its assessed prefix
  // therefore need not contain inner ICE, whose complete Engine quotes were
  // validated above. Do not label that successful short-circuit "unknown".
  if (
    before.accessStatus !== "reachable" ||
    after.blocked !== true ||
    after.canReachAccess !== false ||
    after.noAccessReason !== "known_path_unpayable" ||
    after.hasBypassOrSpecialAccessPlan ||
    (after.conditionalAccessReasons?.length ?? 0) > 0
  )
    return reject("corp_mobile_ice_does_not_prove_terminal_access_block");
  return {
    productive: true,
    serverId: target.id,
    value: 1000,
    evidenceCode: `corp_mobile_ice_blocks_current_terminal_agenda:${origin.id}:${target.id}:${action.actionId}`,
  };
}
