import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
} from "../../plans/corp-defense-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";

function currentSavings(
  input: AiDecisionInput,
  rez: LegalAction,
  install: LegalAction,
): number | undefined {
  const raw = rez.payload?.rootRezIceInstallCostQuoteJson;
  if (typeof raw !== "string") return undefined;
  let quote: Record<string, unknown>;
  try {
    quote = JSON.parse(raw);
  } catch {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [rez.actionId],
      owner: "rules_contract",
      removalCondition:
        "The root-rez installation-cost quote must be valid Engine JSON.",
    });
  }
  const view = input.playerView;
  const server = view.servers.find((s) => s.id === install.payload?.serverId);
  const source = server?.root.find((c) => c.instanceId === rez.source);
  if (
    !quote ||
    typeof quote !== "object" ||
    quote.schemaVersion !== "corp-root-rez-ice-install-cost-quote-v1" ||
    quote.actionId !== rez.actionId ||
    quote.sourceCardInstanceId !== rez.source ||
    quote.targetServerId !== server?.id ||
    quote.stateVersion !== view.stateVersion ||
    !Array.isArray(quote.installs) ||
    !source?.known ||
    source.rezzed ||
    input.side !== "corp" ||
    view.activeSide !== "corp" ||
    view.timingPoint !== "corp_action.main" ||
    view.run ||
    view.own.clicks < 1 ||
    rez.type !== "rez_card" ||
    install.type !== "install_card" ||
    install.payload?.placement !== "ice" ||
    rez.side !== "corp" ||
    install.side !== "corp" ||
    [rez, install].some(
      (a) =>
        a.expiresAtStateVersion !== view.stateVersion ||
        a.timingPoint !== view.timingPoint,
    ) ||
    rez.costs.some((c) => Object.values(c).some((v) => v !== 0))
  )
    return undefined;
  const entries = quote.installs.filter(
    (q: unknown): q is Record<string, unknown> =>
      !!q &&
      typeof q === "object" &&
      !Array.isArray(q) &&
      (q as Record<string, unknown>).cardInstanceId === install.source,
  );
  if (entries.length !== 1) return undefined;
  const entry = entries[0]!;
  const before = entry.beforeCredits,
    after = entry.afterCredits;
  if (
    typeof before !== "number" ||
    !Number.isSafeInteger(before) ||
    before < 1 ||
    typeof after !== "number" ||
    !Number.isSafeInteger(after) ||
    after < 0 ||
    after >= before ||
    install.payload.iceInstallTotalCost !== before ||
    install.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0) !== before
  )
    return undefined;
  return before - after;
}

/** Attach preparation only to an already admitted installation of this owner. */
export function corpIceInstallCostSupportSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  needs: readonly CorpDefenseSignal[],
): CorpGenericDefenseSignal[] {
  return needs.flatMap((need) => {
    if (
      need.kind !== "generic" ||
      (need.phase !== "install_ice" && need.phase !== "install_defense_support")
    )
      return [];
    const install = input.legalActions.find(
      (a) =>
        need.actionIds?.includes(a.actionId) &&
        a.type === "install_card" &&
        a.payload?.placement === "ice",
    );
    if (!install) return [];
    return input.legalActions.flatMap((rez) => {
      const saving = currentSavings(input, rez, install);
      const candidate = candidates.find((c) => c.actionId === rez.actionId);
      if (saving === undefined || !candidate?.sourceDefinitionId) return [];
      return [
        {
          kind: "generic" as const,
          defenseId: `install-cost-support:${install.actionId}:${rez.actionId}`,
          serverId: need.serverId,
          phase: "rez_response" as const,
          sourceDefinitionIds: [candidate.sourceDefinitionId],
          actionIds: [rez.actionId],
          targetIceInstanceId: rez.source,
          followupIceInstanceId: install.source,
          immediateInstallSupport: true,
          iceInstallCostSupportActionId: install.actionId,
          urgent: false,
          rezWindowVerdict: "productive" as const,
          value: need.value,
          evidenceCode: `corp_free_rez_saves_selected_ice_install_credits:${saving}`,
        },
      ];
    });
  });
}

/** The portfolio chooses the installation first. Only its exact free cost
 * preparation may become the next step; no other server gets a new priority.
 */
export function prepareSelectedCorpIceInstallation(
  context: PlanSchedulerContext,
  selected: PlanMaterialization["candidates"],
  signals: readonly CorpGenericDefenseSignal[],
): PlanMaterialization["candidates"] {
  return selected.map((head) => {
    const install = context.input.legalActions.find(
      (a) => a.actionId === head.candidate.actionId,
    );
    if (
      !install ||
      install.type !== "install_card" ||
      install.payload?.placement !== "ice"
    )
      return head;
    const supports = signals
      .flatMap((signal) => {
        if (
          signal.iceInstallCostSupportActionId !== install.actionId ||
          signal.followupIceInstanceId !== install.source ||
          signal.serverId !== install.payload?.serverId
        )
          return [];
        return context.actionCandidates.flatMap((candidate) => {
          if (!signal.actionIds?.includes(candidate.actionId)) return [];
          const action = context.input.legalActions.find(
            (a) => a.actionId === candidate.actionId,
          );
          const saving = action
            ? currentSavings(context.input, action, install)
            : undefined;
          return saving === undefined ? [] : [{ candidate, saving }];
        });
      })
      .sort(
        (a, b) =>
          b.saving - a.saving ||
          a.candidate.actionId.localeCompare(b.candidate.actionId),
      );
    return supports[0]
      ? { candidate: supports[0].candidate, stepValue: head.stepValue }
      : head;
  });
}
