import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

type Option = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>["options"][number];

/** The caller already sorted legal productive choices by their Engine cost. */
export function preferUnbreakableEquivalentTemporaryIce(
  input: AiDecisionInput,
  options: readonly Option[],
): Option | undefined {
  const attackedServerId = input.playerView.run?.attackedServerId;
  const agendaExposed =
    input.playerView.servers
      .find((server) => server.id === attackedServerId)
      ?.root.some((card) => card.known && card.type === "agenda") ||
    (attackedServerId === "hq" &&
      input.playerView.own.gripOrHq.some(
        (card) => card.known && card.type === "agenda",
      ));
  // Extra HQ-card/credit investment needs a concrete access-defense purpose.
  // A harder encounter alone is not a reason to pay more for an empty fort.
  if (!agendaExposed) return options[0];
  if (
    options.length < 2 ||
    options.some((option) => {
      const types = option.metadata?.temporaryEncounterSubroutineTypes;
      return (
        option.metadata?.temporaryEncounterHasAdditionalMechanics !== false ||
        !Array.isArray(types) ||
        types.length === 0 ||
        types.some((type) => type !== "end_the_run")
      );
    })
  )
    return options[0];
  const quotes = options.map((option) => {
    const raw = option.metadata?.temporaryEncounterBreakQuoteJson;
    let quote: Record<string, unknown> | undefined;
    try {
      if (typeof raw === "string") quote = JSON.parse(raw);
    } catch {
      /* rejected below */
    }
    if (
      !quote ||
      quote.stateVersion !== input.playerView.stateVersion ||
      quote.cardId !== option.value ||
      quote.runId !== input.playerView.run?.runId ||
      quote.serverId !== input.playerView.run?.attackedServerId ||
      ![
        "unmodeled",
        "no_visible_breaker",
        "breakable",
        "unaffordable",
      ].includes(String(quote.status)) ||
      (["breakable", "unaffordable"].includes(String(quote.status)) &&
        (!Number.isSafeInteger(quote.requiredCredits) ||
          (quote.requiredCredits as number) < 0))
    ) {
      throw new PlanResolutionFailure("window_origin_missing", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((a) => a.type),
        unresolvedActionIds: input.legalActions
          .filter((a) => a.type === "resolve_choice")
          .map((a) => a.actionId),
        owner: "plan_module",
        planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
        removalCondition:
          "Provide the current Engine temporary-encounter break quote bound to this option, run, fort and StateVersion.",
      });
    }
    return { option, quote };
  });
  // Unknown effects do not certify equivalent outcomes. Keep the existing
  // qualitative comparison until the Engine can quote the complete option set.
  if (quotes.some((entry) => entry.quote.status === "unmodeled"))
    return options[0];
  return (
    quotes.find(
      (entry) =>
        entry.quote.status === "unaffordable" ||
        entry.quote.status === "no_visible_breaker",
    )?.option ?? options[0]
  );
}
