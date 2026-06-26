import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";
import { titleForCardId } from "../runtime/card-title";
import type {
  CorpTagPunishUnknownChosenFamily,
  CorpTagPunishUnknownSkipAttribution,
  CorpTagPunishUnknownSkipPlausibility,
  CorpVisibleTagPayoffCategory,
} from "../runtime/corp-tag-punish-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { CorpVisibleTagPunishOpportunity } from "./corp-visible-tag-punish-taken-diagnostics";

export type RunnerSurvivalCounterContext = {
  any: boolean;
  trace: boolean;
  damage: boolean;
  flatline: boolean;
  link: boolean;
};

export type CorpVisibleTagPunishUnknownSkipDiagnosticsDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
  isCorpTraceTagSourceAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createCorpVisibleTagPunishUnknownSkipDiagnosticsContext(
  dependencies: CorpVisibleTagPunishUnknownSkipDiagnosticsDependencies,
): {
  applyCorpVisibleTagPunishUnknownSkipDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    opportunities: CorpVisibleTagPunishOpportunity[],
    survivalContext: RunnerSurvivalCounterContext,
  ) => void;
} {
  function applyCorpVisibleTagPunishUnknownSkipDiagnostics(
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    opportunities: CorpVisibleTagPunishOpportunity[],
    survivalContext: RunnerSurvivalCounterContext,
  ): void {
    const chosenFamily = corpUnknownSkipChosenFamily(input, action);
    const chosenCardId =
      dependencies.sourceDefinitionIdForAction(input, action) || undefined;
    const chosenCardTitle = titleForCardId(chosenCardId);
    const attribution = corpUnknownSkipAttribution(
      action,
      decision,
      opportunities,
      chosenFamily,
      survivalContext,
    );
    const plausibility = corpUnknownSkipPlausibility(attribution);
    const fixGate = corpUnknownSkipFixGate(attribution, opportunities);
    diagnostics.corpVisibleTagPunishUnknownSkipChosenFamily = chosenFamily;
    diagnostics.corpVisibleTagPunishUnknownSkipChosenActionType = action.type;
    if (chosenCardId)
      diagnostics.corpVisibleTagPunishUnknownSkipChosenCardId = chosenCardId;
    if (chosenCardTitle)
      diagnostics.corpVisibleTagPunishUnknownSkipChosenCardTitle =
        chosenCardTitle;
    diagnostics.corpVisibleTagPunishUnknownSkipAttribution = attribution;
    diagnostics.corpVisibleTagPunishUnknownSkipPlausibility = plausibility;
    if (corpUnknownSkipPayoffLethalOrNearLethal(input, opportunities))
      diagnostics.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal = true;
    if (fixGate.eligible)
      diagnostics.corpVisibleTagPunishUnknownSkipFixGateEligible = true;
    if (fixGate.blockedBy)
      diagnostics.corpVisibleTagPunishUnknownSkipFixGateBlockedBy =
        fixGate.blockedBy;
  }

  function corpUnknownSkipChosenFamily(
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTagPunishUnknownChosenFamily {
    if (dependencies.isCorpTraceTagSourceAction(input, action))
      return "trace_tag_source";
    if (action.type === "score_agenda") return "score";
    if (action.type === "advance_card") return "advance";
    if (action.type === "rez_ice") return "rez";
    if (action.type === "play_operation") return "operation";
    if (
      action.type === "activated_card_ability" ||
      action.type === "trigger_ability"
    )
      return "ability";
    if (action.type === "draw_card") return "draw";
    if (action.type === "gain_credit") return "basic_credit";
    if (action.type === "end_turn") return "end_turn";
    if (action.type === "install_card") {
      const definitionId = dependencies.sourceDefinitionIdForAction(
        input,
        action,
      );
      const type =
        RUNTIME_CARDS[definitionId]?.type ??
        DEMO_CARDS_BY_ID[definitionId]?.type;
      if (type === "agenda") return "install_agenda";
      if (type === "ice" || action.payload?.placement === "ice")
        return "install_ice";
      if (type === "asset" || type === "upgrade")
        return "install_asset_or_upgrade";
      return "unknown";
    }
    return "unknown";
  }

  return { applyCorpVisibleTagPunishUnknownSkipDiagnostics };
}

function corpUnknownSkipAttribution(
  action: LegalAction,
  decision: AiDecision,
  opportunities: CorpVisibleTagPunishOpportunity[],
  chosenFamily: CorpTagPunishUnknownChosenFamily,
  survivalContext: RunnerSurvivalCounterContext,
): CorpTagPunishUnknownSkipAttribution {
  const text = `${decision.reasonCode} ${(decision.evidence ?? []).join(" ")}`;
  if (chosenFamily === "score" || text.includes("score_now"))
    return "unknown_skip_plausible_score_window";
  if (
    chosenFamily === "advance" ||
    text.includes("advance_to_score") ||
    text.includes("score_window")
  )
    return "unknown_skip_plausible_advance_to_score";
  if (
    text.includes("remote_safety") ||
    text.includes("unsafe_remote") ||
    text.includes("scoring_remote")
  )
    return "unknown_skip_plausible_remote_safety";
  if (
    text.includes("central") ||
    text.includes("protect_hq") ||
    text.includes("protect_rd") ||
    text.includes("hq_protection") ||
    text.includes("rnd_protection")
  )
    return "unknown_skip_plausible_hq_or_rnd_safety";
  if (
    text.includes("unaffordable") ||
    text.includes("cannot_afford") ||
    text.includes("insufficient_credits")
  )
    return "unknown_skip_plausible_payoff_unaffordable";
  if (survivalContext.damage || survivalContext.flatline)
    return "unknown_skip_plausible_survival_countercontext";
  if (
    text.includes("low_impact") ||
    opportunities.every((opportunity) =>
      ["unknown", "run_lock", "ambush"].includes(opportunity.category),
    )
  )
    return "unknown_skip_plausible_payoff_low_impact";
  if (chosenFamily === "basic_credit")
    return "unknown_skip_suspicious_basic_credit";
  if (chosenFamily === "end_turn") return "unknown_skip_suspicious_end_turn";
  if (
    chosenFamily === "install_asset_or_upgrade" ||
    chosenFamily === "install_ice" ||
    chosenFamily === "install_agenda"
  )
    return "unknown_skip_suspicious_low_value_install";
  if (
    chosenFamily === "operation" &&
    (text.includes("economy") || text.includes("setup"))
  )
    return "unknown_skip_suspicious_economy_or_setup";
  return "unknown_skip_unclassified_missing_evidence";
}

function corpUnknownSkipPlausibility(
  attribution: CorpTagPunishUnknownSkipAttribution,
): CorpTagPunishUnknownSkipPlausibility {
  if (attribution.startsWith("unknown_skip_plausible_")) return "plausible";
  if (attribution.startsWith("unknown_skip_suspicious_")) return "suspicious";
  return "unclassified";
}

function corpUnknownSkipFixGate(
  attribution: CorpTagPunishUnknownSkipAttribution,
  opportunities: Array<{
    category: CorpVisibleTagPayoffCategory;
  }>,
): {
  eligible: boolean;
  blockedBy?:
    | "score"
    | "advance_score"
    | "safety"
    | "affordability"
    | "low_impact";
} {
  switch (attribution) {
    case "unknown_skip_plausible_score_window":
      return { eligible: false, blockedBy: "score" };
    case "unknown_skip_plausible_advance_to_score":
      return { eligible: false, blockedBy: "advance_score" };
    case "unknown_skip_plausible_remote_safety":
    case "unknown_skip_plausible_hq_or_rnd_safety":
    case "unknown_skip_plausible_survival_countercontext":
      return { eligible: false, blockedBy: "safety" };
    case "unknown_skip_plausible_payoff_unaffordable":
      return { eligible: false, blockedBy: "affordability" };
    case "unknown_skip_plausible_payoff_low_impact":
      return { eligible: false, blockedBy: "low_impact" };
    case "unknown_skip_suspicious_basic_credit":
    case "unknown_skip_suspicious_end_turn":
    case "unknown_skip_suspicious_low_value_install":
    case "unknown_skip_suspicious_economy_or_setup":
      return {
        eligible: opportunities.some(
          (opportunity) => opportunity.category !== "unknown",
        ),
      };
    default:
      return { eligible: false };
  }
}

function corpUnknownSkipPayoffLethalOrNearLethal(
  input: AiDecisionInput,
  opportunities: Array<{ category: CorpVisibleTagPayoffCategory }>,
): boolean {
  return (
    opportunities.some((opportunity) => opportunity.category === "damage") &&
    input.playerView.opponent.handCount <= 3
  );
}
