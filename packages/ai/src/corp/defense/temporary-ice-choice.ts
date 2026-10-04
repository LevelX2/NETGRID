import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

type Option = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>["options"][number];

/** The caller sorted legal effect-bearing choices by their Engine cost.
 * null is a proved absence of current defense value, not missing information.
 */
export function preferUnbreakableEquivalentTemporaryIce(
  input: AiDecisionInput,
  options: readonly Option[],
): Option | null | undefined {
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
  const quotes = options.map((option) => {
    const types = option.metadata?.temporaryEncounterSubroutineTypes;
    if (
      option.metadata?.temporaryEncounterHasAdditionalMechanics !== false ||
      !Array.isArray(types) ||
      types.length === 0 ||
      !(
        types.every((type) => type === "end_the_run") ||
        (types.length === 1 && types[0] === "initiate_trace")
      )
    )
      return { option, quote: undefined, traceRunEnd: false };
    const traceRunEnd =
      option.metadata?.temporaryEncounterSubroutineTypes?.[0] ===
      "initiate_trace";
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
          (quote.requiredCredits as number) < 0)) ||
      (traceRunEnd &&
        quote.status !== "unmodeled" &&
        (!["trace_run_end", "trace_tag"].includes(String(quote.effectClass)) ||
          (quote.effectClass === "trace_tag" &&
            quote.guaranteedRunEnd !== false) ||
          typeof quote.guaranteedRunEnd !== "boolean" ||
          quote.corpBid !== 0 ||
          !Number.isSafeInteger(quote.corpTraceStrength) ||
          (quote.corpTraceStrength as number) < 0 ||
          !Number.isSafeInteger(quote.maximumRunnerTraceStrength) ||
          (quote.maximumRunnerTraceStrength as number) < 0 ||
          input.playerView.traceRulesProfile !== "modern_open"))
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
    return { option, quote, traceRunEnd };
  });
  // A complete free full break cannot protect access or tax the current run.
  // Preserve the HQ card even with only one option or no agenda in this fort.
  const candidates = quotes.filter(
    (entry) =>
      !(
        entry.quote?.status === "breakable" && entry.quote.requiredCredits === 0
      ),
  );
  if (options.length > 0 && candidates.length === 0) return null;
  // Unknown effects do not certify equivalent outcomes. Keep the existing
  // qualitative comparison until the Engine can quote the complete option set.
  if (
    !agendaExposed ||
    candidates.length < 2 ||
    candidates.some(
      (entry) => !entry.quote || entry.quote.status === "unmodeled",
    )
  )
    return candidates[0]?.option;
  return (
    candidates.find((entry) =>
      entry.traceRunEnd
        ? entry.quote!.guaranteedRunEnd === true
        : entry.quote!.status === "unaffordable" ||
          entry.quote!.status === "no_visible_breaker",
    )?.option ?? candidates[0]?.option
  );
}
