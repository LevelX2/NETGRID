import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerPressureSignal } from "../../plans/runner-tactical-plan-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

type Source = {
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  installed: boolean;
};
type Target = { targetIceInstanceId: string; trashCredits: number };
type Quote = { sources: Source[]; targets: Target[] };
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function currentQuote(
  input: AiDecisionInput,
  action: LegalAction,
): Quote | undefined {
  const raw = action.payload?.runnerPostBreakTrashQuoteJson;
  if (raw === undefined) return undefined;
  const fail = (): never => {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [action.actionId],
      owner: "rules_contract",
      removalCondition:
        "Provide a current, action-bound Engine post-break trash quote.",
    });
  };
  let q: unknown;
  try {
    q = typeof raw === "string" ? JSON.parse(raw) : fail();
  } catch {
    return fail();
  }
  if (
    !isRecord(q) ||
    q.schemaVersion !== "runner-post-break-trash-quote-v1" ||
    q.stateVersion !== input.playerView.stateVersion ||
    q.actionId !== action.actionId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    q.serverId !== action.payload?.serverId ||
    !Array.isArray(q.sources) ||
    !Array.isArray(q.targets) ||
    !q.sources.every(
      (s: unknown): s is Source =>
        isRecord(s) &&
        typeof s.sourceCardInstanceId === "string" &&
        typeof s.sourceDefinitionId === "string" &&
        typeof s.installed === "boolean",
    ) ||
    !q.targets.every(
      (t: unknown): t is Target =>
        isRecord(t) &&
        typeof t.targetIceInstanceId === "string" &&
        typeof t.trashCredits === "number" &&
        Number.isSafeInteger(t.trashCredits) &&
        t.trashCredits >= 0,
    )
  )
    return fail();
  return { sources: q.sources, targets: q.targets };
}

/** A preparation phase of an admitted central run, priced over the remaining
 * same-turn accesses. Only a fully quoted all-ETR path proves all subroutines
 * will be broken; partial mitigation never promises the post-pass ability. */
export function runnerPostBreakTrashPreparationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  signals: readonly RunnerPressureSignal[],
  previous?: ResidentPlanPortfolio,
): RunnerPressureSignal[] {
  const view = input.playerView;
  if (
    input.side !== "runner" ||
    view.run ||
    view.timingPoint !== "runner_action.main"
  )
    return [];
  return signals.flatMap((signal) => {
    if (signal.marginalValue <= 0 || signal.routePreparation) return [];
    const server = view.servers.find((s) => s.id === signal.serverId);
    if (!server || server.ice.length !== 1) return [];
    const ice = server.ice[0]!;
    if (
      !ice.known ||
      !ice.rezzed ||
      !ice.effectiveRunQuote?.subroutines.length ||
      ice.effectiveRunQuote.subroutines.some((s) => s.type !== "end_the_run") ||
      (ice.effectiveRunQuote.conditionalEncounterEffects?.length ?? 0) > 0
    )
      return [];
    const run = input.legalActions.find(
      (a) =>
        a.type === "start_run" &&
        a.payload?.serverId === server.id &&
        signal.runActionIds?.includes(a.actionId) &&
        a.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) === 1,
    );
    if (!run) return [];
    const quote = currentQuote(input, run);
    const target = quote?.targets.find(
      (t) => t.targetIceInstanceId === ice.instanceId,
    );
    if (!quote || !target) return [];
    const priorState = previous?.instances.find(
      (instance) =>
        instance.moduleId === "runner.pressure_central" &&
        instance.dedupeKey === signal.pressureId,
    )?.moduleState as
      | { kind: "central_pressure"; signal: RunnerPressureSignal }
      | undefined;
    const commitment = priorState?.signal.postBreakTrashCommitment;
    if (
      commitment &&
      commitment.serverId === server.id &&
      commitment.targetIceInstanceId === target.targetIceInstanceId &&
      commitment.observedAtStateVersion <= view.stateVersion &&
      quote.sources.some(
        (source) =>
          source.installed &&
          source.sourceCardInstanceId === commitment.sourceCardInstanceId &&
          view.own.rig?.some(
            (card) =>
              card.instanceId === source.sourceCardInstanceId &&
              card.definitionId === source.sourceDefinitionId,
          ),
      )
    ) {
      const startCredits = run.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
      const path = assessKnownRezzedIcePath(
        server.ice,
        view.own.rig ?? [],
        view.own.credits - startCredits - target.trashCredits,
        server.root,
        view.opponent.credits,
      );
      if (
        path.canReachAccess &&
        path.creditsAfterPath >= 0 &&
        (path.unavoidableVisibleIceHazardCount ?? 0) === 0
      ) {
        // Installation already changed the board. A higher-priority hand or
        // safety step may pause this parent; it does not erase its removal
        // goal. Reachability and priority still come from the current owner.
        return [
          {
            ...signal,
            ...(signal.reachable
              ? {
                  evidenceCode:
                    "runner_post_break_trash_installed_goal_revalidated",
                }
              : {}),
            postBreakTrashCommitment: {
              ...commitment,
              trashCredits: target.trashCredits,
              observedAtStateVersion: view.stateVersion,
            },
          },
        ];
      }
    }
    if (!signal.reachable) return [];
    const routes = quote.sources
      .flatMap((source) => {
        const card = (
          source.installed ? view.own.rig : view.own.gripOrHq
        )?.find(
          (c) =>
            c.instanceId === source.sourceCardInstanceId &&
            c.definitionId === source.sourceDefinitionId,
        );
        if (!card) return [];
        const install = source.installed
          ? undefined
          : input.legalActions.find(
              (a) =>
                a.type === "install_card" &&
                a.source === card.instanceId &&
                !a.actionId.includes("trash_before") &&
                !a.choiceRequirements?.length &&
                candidates.some((c) => c.actionId === a.actionId),
            );
        if (!source.installed && !install) return [];
        const installCredits =
          install?.costs.reduce((n, c) => n + (c.credits ?? 0), 0) ?? 0;
        const installClicks =
          install?.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) ?? 0;
        const remainingRuns = view.own.clicks - installClicks;
        if (remainingRuns < 2) return [];
        const startCredits = run.costs.reduce(
          (n, c) => n + (c.credits ?? 0),
          0,
        );
        const path = assessKnownRezzedIcePath(
          server.ice,
          view.own.rig ?? [],
          view.own.credits -
            startCredits -
            installCredits -
            target.trashCredits,
          server.root,
          view.opponent.credits,
        );
        if (
          !path.canReachAccess ||
          (path.unavoidableVisibleIceHazardCount ?? 0) !== 0 ||
          path.visibleBreakCost === undefined ||
          path.creditsAfterPath < 0
        )
          return [];
        const savings =
          (remainingRuns - 1) * path.visibleBreakCost -
          target.trashCredits -
          installCredits -
          installClicks;
        if (savings <= 0) return [];
        return [{ source, install, savings }];
      })
      .sort(
        (a, b) =>
          b.savings - a.savings ||
          a.source.sourceCardInstanceId.localeCompare(
            b.source.sourceCardInstanceId,
          ),
      );
    const best = routes[0];
    if (!best) return [];
    return [
      {
        ...signal,
        evidenceCode: `runner_post_break_trash_same_turn_savings:${best.savings}`,
        postBreakTrashCommitment: {
          sourceCardInstanceId: best.source.sourceCardInstanceId,
          targetIceInstanceId: target.targetIceInstanceId,
          serverId: server.id,
          trashCredits: target.trashCredits,
          observedAtStateVersion: view.stateVersion,
        },
        ...(best.install
          ? {
              routePreparation: "develop_payoff" as const,
              preparationActionIds: [best.install.actionId],
              sourceDefinitionIds: [best.source.sourceDefinitionId],
            }
          : {}),
      },
    ];
  });
}
