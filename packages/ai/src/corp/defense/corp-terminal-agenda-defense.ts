import {
  visibleFortPassProtection,
  visibleRunnerPreparationIncomePerClick,
} from "@netgrid/engine";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessBestFundedCorpScoreProtection,
  projectCorpFundedIceInstallRoute,
  type CorpFundedRemoteAccessRiskNeed,
  type KnownCorpFundedScoreProtectionAssessment,
} from "../../runtime/corp-funded-score-protection";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";

export type CorpTerminalAgendaDefense = Readonly<{
  observedAtStateVersion: number;
  serverId: string;
  parentProjectId: string;
  need: CorpFundedRemoteAccessRiskNeed;
  best: KnownCorpFundedScoreProtectionAssessment;
  requiredCredits: number;
  preparationCreditClicks: number;
  install?: Readonly<{
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    placement: "ice" | "root";
    credits: number;
    clicks: number;
  }>;
  unknownRoutes: readonly string[];
}>;

const ZERO_ACCESS = { numerator: 0, denominator: 1 } as const;
const NO_RESERVE = { creditBreakdown: [], hardClickReserve: 0 } as const;

/** Compare current ICE and one exact installation, including the basic income
 * still payable before the Runner window. This is a bounded preparation quote,
 * not an authorization for future actions or a whole-turn survival guarantee. */
export function assessCorpTerminalAgendaDefense(
  input: AiDecisionInput,
  serverId: string,
  parentProjectId: string,
): CorpTerminalAgendaDefense | undefined {
  const view = input.playerView;
  const server = view.servers.find((entry) => entry.id === serverId);
  if (!server || input.side !== "corp") return undefined;
  const position = view.run?.position;
  const serverIce =
    position?.kind === "ice" && position.serverId === serverId
      ? server.ice.slice(0, position.iceIndex + 1)
      : server.ice;
  const canPrepare =
    view.activeSide === "corp" &&
    view.phase !== "run" &&
    input.legalActions.some(
      (action) =>
        action.type === "gain_credit" &&
        action.source === "basic_action" &&
        action.payload?.gainCreditsAmount === 1 &&
        action.expiresAtStateVersion === view.stateVersion &&
        exactCost(action, "clicks") === 1 &&
        exactCost(action, "credits") === 0,
    );
  const preparationClicks = canPrepare ? view.own.clicks : 0;
  const runner = {
    runnerRig: view.opponent.rig ?? [],
    runnerSetAside: view.specialZones?.setAside ?? [],
    ...(view.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: view.opponent.memoryUsed }
      : {}),
    ...(view.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: view.opponent.memoryLimit }
      : {}),
    runnerCredits: view.opponent.credits,
    ...(view.activeSide === "corp" &&
    view.phase !== "run" &&
    view.runnerNextTurnCreditClicks !== undefined
      ? {
          runnerPreparationCreditClicks:
            view.runnerNextTurnCreditClicks *
            visibleRunnerPreparationIncomePerClick(view.opponent.rig ?? []),
        }
      : {}),
  };
  const assess = (credits: number, clicks: number, root = server.root) =>
    assessBestFundedCorpScoreProtection({
      ...runner,
      serverIce,
      serverRoot: root,
      targetServerId: server.id,
      observedAtStateVersion: view.stateVersion,
      availableCorpCredits: credits,
      availableCorpClicks: clicks,
      availableCorpAgendaPoints: view.own.agendaPoints,
      scoreReserve: NO_RESERVE,
      maximumRunnerAccessSuccessProbability: ZERO_ACCESS,
    });
  const current = assess(view.own.credits, view.own.clicks);
  if (current.knowledge !== "known") return undefined;
  const need: CorpFundedRemoteAccessRiskNeed = {
    needId: `score-protection:${parentProjectId}`,
    parentProjectId,
    targetServerId: server.id,
    observedAtStateVersion: view.stateVersion,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability: ZERO_ACCESS,
      policySource: "terminal_agenda_best_fundable_access_prevention",
    },
    scoreReserve: NO_RESERVE,
    baseline: current,
  };
  const prepared = assess(
    view.own.credits + preparationClicks,
    view.own.clicks,
  );
  if (prepared.knowledge !== "known") return undefined;
  const unknownRoutes: string[] = [];
  const routes: CorpTerminalAgendaDefense[] = [
    {
      observedAtStateVersion: view.stateVersion,
      serverId,
      parentProjectId,
      need,
      best: prepared,
      requiredCredits: prepared.totalSelectedRezCost,
      preparationCreditClicks: Math.max(
        0,
        prepared.totalSelectedRezCost - view.own.credits,
      ),
      unknownRoutes,
    },
  ];
  for (const action of input.legalActions) {
    if (
      !canPrepare ||
      action.type !== "install_card" ||
      action.side !== "corp" ||
      action.expiresAtStateVersion !== view.stateVersion ||
      action.payload?.serverId !== serverId ||
      action.targetRequirements.length > 0 ||
      (action.choiceRequirements?.length ?? 0) > 0 ||
      action.payload.regionReplacementWarning === true
    )
      continue;
    const source = view.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    );
    const credits = exactCost(action, "credits");
    const clicks = exactCost(action, "clicks");
    if (
      !source?.known ||
      !source.definitionId ||
      credits === undefined ||
      clicks === undefined ||
      credits > view.own.credits ||
      clicks > view.own.clicks
    )
      continue;
    const available = view.own.credits + preparationClicks - clicks;
    let best: KnownCorpFundedScoreProtectionAssessment;
    const placement = action.payload.placement;
    if (placement === "root") {
      const quote = visibleFortPassProtection(source);
      if (!quote.complete) {
        unknownRoutes.push(`${action.actionId}:${quote.reason}`);
        continue;
      }
      if (quote.kind !== "end_run_on_pass" || !quote.activeOnInstall) continue;
      const projected = assess(available - credits, view.own.clicks - clicks, [
        ...server.root,
        { ...source, rezzed: true },
      ]);
      if (projected.knowledge !== "known") {
        unknownRoutes.push(`${action.actionId}:${projected.unknownReason}`);
        continue;
      }
      best = projected;
    } else if (placement === "ice") {
      const baseline = assess(available, view.own.clicks);
      const projected = projectCorpFundedIceInstallRoute({
        ...runner,
        need: { ...need, baseline },
        action,
        currentStateVersion: view.stateVersion,
        currentCorpCredits: available,
        currentCorpClicks: view.own.clicks,
        currentCorpAgendaPoints: view.own.agendaPoints,
        visibleCorpHand: view.own.gripOrHq,
        currentServer: server,
        projectedInstallCredits: credits,
        projectedInstallClicks: clicks,
      });
      if (projected.knowledge !== "known") {
        unknownRoutes.push(`${action.actionId}:${projected.unknownReason}`);
        continue;
      }
      best = projected.after;
    } else continue;
    routes.push({
      observedAtStateVersion: view.stateVersion,
      serverId,
      parentProjectId,
      need,
      best,
      requiredCredits: credits + best.totalSelectedRezCost,
      preparationCreditClicks: Math.max(
        0,
        credits + best.totalSelectedRezCost - view.own.credits,
      ),
      install: {
        actionId: action.actionId,
        sourceCardInstanceId: source.instanceId,
        sourceDefinitionId: source.definitionId,
        placement,
        credits,
        clicks,
      },
      unknownRoutes,
    });
  }
  return routes.sort(
    (left, right) =>
      compareExactProbabilities(
        left.best.protection.runnerAccessSuccessProbability,
        right.best.protection.runnerAccessSuccessProbability,
      )! ||
      left.best.totalSelectedAgendaPointCost -
        right.best.totalSelectedAgendaPointCost ||
      left.requiredCredits - right.requiredCredits ||
      (left.install?.clicks ?? 0) - (right.install?.clicks ?? 0) ||
      (left.install?.actionId ?? "").localeCompare(
        right.install?.actionId ?? "",
      ),
  )[0];
}

function exactCost(
  action: LegalAction,
  kind: "credits" | "clicks",
): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    if (Object.keys(cost).some((key) => key !== "credits" && key !== "clicks"))
      return undefined;
    const amount = cost[kind] ?? 0;
    if (!Number.isSafeInteger(amount) || amount < 0) return undefined;
    total += amount;
  }
  return Number.isSafeInteger(total) ? total : undefined;
}
