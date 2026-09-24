import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { breakerCardBlocksAccessReachability } from "../../breaker-ontology-consumer";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";

export type HostedBreakerDevelopment = {
  admitted: boolean;
  actionId?: string;
  value: number;
  priorityClass: "P4";
  evidenceCodes: string[];
};

function profile(
  card: VisibleCard,
): { capacityMu: number; creditCapacity: number } | undefined {
  const engine = card.definitionId
    ? cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
    : undefined;
  const host = engine?.hostedProgramCapacity;
  const pool = engine?.restrictedHostedCreditSource;
  if (
    !host ||
    !pool ||
    host.maxHostedPrograms !== 1 ||
    !host.hostedProgramsAreInstalled ||
    !host.allowedProgramSubtypes?.includes("icebreaker") ||
    pool.requireHostedBreakerForIcebreakerUse !== true ||
    pool.usableFor.length !== 1 ||
    pool.usableFor[0] !== "using_icebreaker_during_run" ||
    pool.refresh?.timing !== "start_of_runner_turn" ||
    pool.capacity <= 0
  )
    return undefined;
  return { capacityMu: host.capacityMu, creditCapacity: pool.capacity };
}

function compatible(host: VisibleCard, breaker: VisibleCard) {
  const p = profile(host);
  return (
    p !== undefined &&
    breaker.known &&
    breaker.type === "program" &&
    breaker.subtypes?.includes("icebreaker") &&
    !breakerCardBlocksAccessReachability(breaker.definitionId) &&
    Number.isSafeInteger(breaker.memoryCost) &&
    breaker.memoryCost! > 0 &&
    breaker.memoryCost! <= p.capacityMu &&
    Number.isSafeInteger(breaker.installCost)
  );
}

/** Conditional investment assessment of the existing development owner.
 * Only today's Engine action is executable; future credits are never cash.
 * No unseen ICE or future draw is assumed. Each turn uses the best single
 * known central path, with all existing renewable pools refreshed as well.
 */
export function assessHostedBreakerDevelopment(
  input: AiDecisionInput,
  card: VisibleCard,
  minimumCreditFloor: number,
): HostedBreakerDevelopment | undefined {
  const own = input.playerView.own;
  const rig = own.rig ?? [];
  const installingHost = profile(card) !== undefined;
  const actions = input.legalActions.filter(
    (a) =>
      a.type === "install_card" &&
      a.side === "runner" &&
      a.source === card.instanceId &&
      a.expiresAtStateVersion === input.playerView.stateVersion &&
      !a.payload?.runnerProgramTrashBeforeInstall &&
      !a.choiceRequirements?.length,
  );
  const hostedActions = actions.filter(
    (a) =>
      typeof a.payload?.hostOnCardId === "string" &&
      rig.some((h) => h.instanceId === a.payload?.hostOnCardId && profile(h)),
  );
  if (!installingHost && !hostedActions.length) return undefined;
  const defer = (reason: string): HostedBreakerDevelopment => ({
    admitted: false,
    value: 0,
    priorityClass: "P4",
    evidenceCodes: [`runner_hosted_breaker_deferred:${reason}`],
  });
  const horizon = Math.min(
    5,
    own.stackOrRdCount,
    input.playerView.opponent.deckCount - 1,
  );
  if (
    input.playerView.timingPoint !== "runner_action.main" ||
    own.tags > 0 ||
    horizon < 3 ||
    own.agendaPoints >= input.playerView.agendaPointsToWin - 2 ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    input.playerView.servers.some(
      (s) =>
        !["hq", "rd", "archives"].includes(s.id) &&
        s.root.some(
          (c) => c.type === "agenda" || (c.advancementCounters ?? 0) > 0,
        ),
    )
  )
    return defer("urgent_or_short_horizon");
  const pairs = installingHost
    ? own.gripOrHq
        .filter((b) => b.instanceId !== card.instanceId && compatible(card, b))
        .flatMap((b) =>
          actions
            .filter((a) => !a.targetRequirements.length)
            .map((action) => ({ host: card, breaker: b, action })),
        )
    : hostedActions.flatMap((action) => {
        const host = rig.find(
          (h) => h.instanceId === action.payload?.hostOnCardId,
        )!;
        return compatible(host, card) ? [{ host, breaker: card, action }] : [];
      });
  const quotes = pairs.flatMap(({ host, breaker, action }) => {
    const p = profile(host)!;
    if (
      rig.some((c) => c.hostedOn === host.instanceId) ||
      rig.some(
        (b) =>
          b.definitionId === breaker.definitionId &&
          b.hostedOn &&
          rig.some((h) => h.instanceId === b.hostedOn && profile(h)),
      )
    )
      return [];
    // Do not buy a second empty host when a suitable one is already available.
    if (
      installingHost &&
      rig.some(
        (h) =>
          compatible(h, breaker) &&
          !rig.some((b) => b.hostedOn === h.instanceId),
      )
    )
      return [];
    const existing = rig.some((b) => b.definitionId === breaker.definitionId);
    const credits =
      action.costs.reduce((n, c) => n + (c.credits ?? 0), 0) +
      (installingHost ? breaker.installCost! : 0);
    const clicks =
      action.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) +
      (installingHost ? 1 : 0);
    const cash = own.credits - credits;
    if (
      clicks > own.clicks ||
      cash < minimumCreditFloor ||
      !Number.isSafeInteger(own.memoryUsed) ||
      !Number.isSafeInteger(own.memoryLimit)
    )
      return [];
    const refreshed = rig.map((c) =>
      c.counterDisplays
        ? {
            ...c,
            counterDisplays: c.counterDisplays.map((d) =>
              d.creditPool?.refresh &&
              Number.isSafeInteger(d.creditPool.capacity)
                ? { ...d, amount: d.creditPool.capacity! }
                : d,
            ),
          }
        : c,
    );
    const before = existing ? refreshed : [...refreshed, breaker];
    const projectedHost: VisibleCard = {
      ...host,
      counterDisplays: [
        {
          id: `${host.instanceId}:conditional_pool`,
          displayKind: "restricted_pool",
          label: "Run credits",
          ariaLabel: "Conditional refreshed run credits",
          amount: p.creditCapacity,
          creditPool: {
            kind: "restricted_credit",
            uses: ["using_icebreaker_during_run"],
            requireHostedBreakerForIcebreakerUse: true,
          },
        },
      ],
    };
    const after = [
      ...refreshed.filter((c) => c.instanceId !== host.instanceId),
      projectedHost,
      { ...breaker, hostedOn: host.instanceId },
    ];
    const savings = input.playerView.servers
      .filter(
        (s) =>
          ["hq", "rd"].includes(s.id) &&
          s.ice.length > 0 &&
          s.ice.every((c) => c.known && c.rezzed),
      )
      .flatMap((server) => {
        const cost = (cards: readonly VisibleCard[]) => {
          const path = assessKnownRezzedIcePath(
            server.ice,
            [...cards],
            runnerRunPathCreditBudgetWithVisiblePools(cash, cards),
            server.root,
            input.playerView.opponent.credits,
          );
          if (
            !path.canReachAccess ||
            path.blocked ||
            (path.futureClicksLost ?? 0) > 0 ||
            path.conditionalAccessReasons?.length ||
            path.conditionalRiskReasons?.length ||
            path.postEncounterBreakerBranches?.length ||
            (path.unavoidableVisibleIceHazardCount ?? 0) > 0
          )
            return undefined;
          return cash - path.creditsAfterPath;
        };
        const b = cost(before),
          a = cost(after);
        return b === undefined ||
          a === undefined ||
          cash - a < minimumCreditFloor
          ? []
          : [Math.max(0, b - a)];
      });
    const perTurn = Math.max(0, ...savings);
    // Initial hosted installation avoids normal MU immediately. A second copy
    // leaves the old breaker intact; its later removal is NOT booked as free MU.
    const savedMu = existing ? 0 : breaker.memoryCost!;
    const freeMu = own.memoryLimit! - own.memoryUsed!;
    const demand = own.gripOrHq.some(
      (c) =>
        c.instanceId !== breaker.instanceId &&
        c.type === "program" &&
        c.known &&
        (c.memoryCost ?? 0) > Math.max(0, freeMu - breaker.memoryCost!) &&
        !rig.some((r) => r.definitionId === c.definitionId),
    );
    const memoryValue = savedMu * (demand ? 1.5 : 0.5);
    const baselineCredits = existing ? 0 : breaker.installCost!;
    const baselineClicks = existing ? 0 : 1;
    const net =
      perTurn * horizon +
      memoryValue -
      (credits - baselineCredits) -
      (clicks - baselineClicks);
    // No MU-only justification for an expensive empty credit host.
    if (perTurn <= 0 || net <= 0) return [];
    return [
      {
        admitted: true,
        actionId: action.actionId,
        priorityClass: "P4" as const,
        value: Math.min(300, Math.round(net * 100)),
        evidenceCodes: [
          "runner_hosted_breaker_investment",
          `runner_hosted_breaker_host:${host.instanceId}`,
          `runner_hosted_breaker_consumer:${breaker.instanceId}`,
          `runner_hosted_breaker_future_turns:${horizon}`,
          `runner_hosted_breaker_saving_per_turn:${perTurn}`,
          `runner_hosted_breaker_saved_mu:${savedMu}`,
          `runner_hosted_breaker_memory_value:${memoryValue}`,
          `runner_hosted_breaker_net:${net}`,
          "runner_hosted_breaker_future_savings_not_spendable",
          ...(existing
            ? ["runner_hosted_breaker_old_copy_retained_until_memory_demand"]
            : []),
        ],
      },
    ];
  });
  return (
    quotes.sort(
      (a, b) => b.value - a.value || a.actionId.localeCompare(b.actionId),
    )[0] ?? defer("no_affordable_marginal_return")
  );
}
