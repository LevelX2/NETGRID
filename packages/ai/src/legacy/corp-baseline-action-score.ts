import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { evaluateCorpOpeningHand } from "../deck-doctrine";
import { classifyCorpScoredAgendaAbility } from "../corp-plans";
import { cardDefinitionTypeForAi } from "../runtime/card-definition-lookup";
import {
  corpSourceAdvancementCounterCreditPayoutAssessment,
  isSourceAdvancementCounterCreditPayoutAction,
} from "../runtime/corp-source-advancement-counter-credit-payout";
import {
  scoreCorpIceInstall,
  scoreCorpOperation,
  scoreCorpRootInstall,
} from "../runtime/corp-card-action-score";
import type { AiFeatures } from "../runtime/ai-features";
import { discardCurrentPlanKind, discardEvidenceForInput } from "../runtime/discard-plan";
import { AI_PROFILES, profileWeights } from "../runtime/profile-weights";
import type { RankedChoice } from "../runtime/ranked-choice";
import { publicRoleEvidence } from "../runtime/role-evidence";
import { scoreConfidence as confidence } from "../runtime/score-confidence";
import { roundSemanticRuntimeScore as roundScore } from "../runtime/semantic-runtime-score-components";
import { tagPunishPayoffPriorityBonus } from "../runtime/tag-punish-payoff-priority";
import { traceTagExpectedSuccessEstimate } from "../runtime/trace-tag-success-estimate";
import type { StructuredTagPunishLegalActionAssessment } from "../tag-punish-ontology-consumer";
import {
  betterScoredAgendaDrawAvailable,
  betterScoredAgendaEconomyAvailable,
  corpScoredAgendaAbilityReasonCode,
  politicalOverthrowEconomyAvailable,
  scoreCorpScoredAgendaAbility,
} from "./corp-scored-agenda-ability-scoring";

export type LegacyCorpActionScorerDependencies = {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (cardId: string | undefined) => string[];
  corpTagPunishOntologyAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => StructuredTagPunishLegalActionAssessment | undefined;
  corpOntologyPayoffAvailableForTagSource: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createLegacyCorpActionScorer(
  dependencies: LegacyCorpActionScorerDependencies,
): {
  scoreCorpAction: (
    input: AiDecisionInput,
    features: AiFeatures,
    action: LegalAction,
  ) => RankedChoice;
} {
  const {
    rolesForAction,
    rolesForCardId,
    corpTagPunishOntologyAssessmentForAction,
    corpOntologyPayoffAvailableForTagSource,
  } = dependencies;

function scoreCorpAction(
  input: AiDecisionInput,
  features: AiFeatures,
  action: LegalAction,
): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input, AI_PROFILES);
  let score = 0;
  let reasonCode = "corp.fallback.low_value";
  let explanation =
    "Die Aktion bleibt legal, hat aber wenig sichtbaren Nutzen.";
  const evidence = [
    `difficulty:${input.difficulty}`,
    `credits:${features.credits}`,
    `clicks:${features.clicks}`,
  ];

  switch (action.type) {
    case "resolve_choice":
      if (input.playerView.pendingChoice?.source === "setup.mulligan") {
        const opening = evaluateCorpOpeningHand(input);
        score = 920;
        reasonCode =
          opening.decision === "mulligan"
            ? "corp.setup.mulligan"
            : "corp.setup.keep";
        explanation =
          opening.decision === "mulligan"
            ? "Die Corp nimmt anhand von Start-Hand und Deckprofil einen Mulligan."
            : "Die Corp behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push(
          "choice_legal",
          "choice_source:setup.mulligan",
          ...opening.reasons,
          ...opening.evidence,
        );
      } else {
        score =
          input.playerView.pendingChoice?.kind === "bid_amount" ? 900 : 620;
        reasonCode =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? "corp.trace.bid_visible_amount"
            : "corp.choice.resolve";
        explanation = "Die Corp beantwortet eine sichtbare legale Choice.";
        evidence.push(
          "choice_legal",
          `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`,
        );
        if (input.playerView.pendingChoice?.source === "discard_phase")
          evidence.push(
            "choice_source:discard_phase",
            "discard_selection:keep_value",
            ...discardEvidenceForInput(
              input,
              discardCurrentPlanKind(input, {
                rolesForCardId,
                definitionTypeForCardId: cardDefinitionTypeForAi,
              }),
            ),
          );
      }
      break;
    case "mandatory_draw":
      score = 1000;
      reasonCode = "corp.mandatory_draw";
      explanation = "Die Corp zieht ihre Pflichtkarte.";
      evidence.push("mandatory_window");
      break;
    case "score_agenda":
      score = 960;
      reasonCode = "corp.score_available_agenda";
      explanation =
        "Eine scorebare Agenda ist legal und sichtbar für die Corp.";
      evidence.push("score_window");
      break;
    case "rez_ice":
      score = 820 + (profile.rez ?? 1) * 30;
      reasonCode = "corp.rez.defensive_card";
      explanation =
        "Eine defensive Karte kann im Run-Fenster legal gerezzt werden.";
      evidence.push("run_window", `runner_credits:${features.opponentCredits}`);
      break;
    case "decline_rez":
      score = 180;
      reasonCode = "corp.rez.decline";
      explanation =
        "Rez wird abgelehnt, wenn sichtbarer Nutzen niedrig bleibt.";
      evidence.push("rez_decline_legal");
      break;
    case "advance_card":
      score = 720 + (profile.score ?? 1) * 30;
      reasonCode = "corp.remote.advance_score_plan";
      explanation = "Eine Installation im Außenserver kann ausgebaut werden.";
      evidence.push("advance_legal");
      break;
    case "install_card":
      if (action.payload?.placement === "ice") {
        score = scoreCorpIceInstall(action, features, profile);
        reasonCode = "corp.ice.install_defense";
        explanation =
          "Eine ICE-Installation schützt einen sichtbaren Außenserver-Plan.";
        evidence.push(
          `server:${String(action.payload?.serverId ?? "unknown")}`,
        );
      } else {
        score = scoreCorpRootInstall(roles, action, features, profile);
        reasonCode = roles.some((role) => role.startsWith("agenda_"))
          ? "corp.remote.install_score_plan"
          : "corp.remote.install_asset_plan";
        explanation =
          "Die Corp baut eine Installation im Außenserver aus eigener Information auf.";
        evidence.push("own_card_role_known", ...publicRoleEvidence(roles));
      }
      break;
    case "play_operation":
      {
        const tagPunish = corpTagPunishOntologyAssessmentForAction(
          input,
          action,
        );
        const ontologyPayoffAvailable =
          tagPunish !== undefined &&
          tagPunish.isPunishPayoff &&
          features.opponentTags > 0;
        const ontologyTagSourceWithPayoff =
          Boolean(tagPunish?.isTagSource) &&
          corpOntologyPayoffAvailableForTagSource(input, action);
        score = scoreCorpOperation(roles, features, profile);
        if (ontologyPayoffAvailable && tagPunish) {
          score = Math.max(
            score,
            820 + tagPunishPayoffPriorityBonus(tagPunish),
          );
        } else if (ontologyTagSourceWithPayoff) {
          score = Math.max(
            score,
            720 + Math.round(traceTagExpectedSuccessEstimate(input) * 60),
          );
        } else if (tagPunish?.isTagSource) {
          score = Math.max(score, 500);
        }
        reasonCode = ontologyPayoffAvailable
          ? "corp.tag.punish_visible_tag"
          : ontologyTagSourceWithPayoff
            ? "corp.tag.source_visible_payoff"
            : roles.includes("tag_punishment")
              ? "corp.tag.punish_visible_tag"
              : roles.includes("draw_operation")
                ? "corp.economy.draw_operation"
                : "corp.economy.operation";
        evidence.push(...(tagPunish?.evidence ?? []));
        if (tagPunish?.isTagSource) {
          evidence.push(
            ontologyTagSourceWithPayoff
              ? "corp_tag_source_taken_with_ontology_payoff_available:true"
              : "corp_tag_source_taken_without_ontology_payoff:true",
          );
        }
      }
      explanation =
        "Eine legale Operation verbessert anhand eigener sichtbarer Rollen die Corp-Position.";
      evidence.push(
        "own_operation_role_known",
        ...publicRoleEvidence(roles),
        `runner_tags:${features.opponentTags}`,
      );
      break;
    case "trash_resource":
      score =
        features.opponentTags > 0 ? 760 + (profile.remote ?? 1) * 20 : 140;
      reasonCode = "corp.tag.trash_visible_resource";
      explanation =
        "Die Corp nutzt einen sichtbaren Tag, um eine öffentliche Resource zu trashen.";
      evidence.push(
        "resource_trash_legal",
        `runner_tags:${features.opponentTags}`,
      );
      break;
    case "activated_card_ability":
    case "trigger_ability": {
      const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
      if (scoredAgenda) {
        score = scoreCorpScoredAgendaAbility(scoredAgenda, features);
        reasonCode = corpScoredAgendaAbilityReasonCode(scoredAgenda.kind);
        explanation =
          "Die Corp nutzt eine sichtbare Fähigkeit einer gescorten Agenda.";
        evidence.push(
          ...scoredAgenda.evidence,
          "scored_agenda_action_taken:true",
          ...(scoredAgenda.kind === "scored_agenda_economy" ||
          scoredAgenda.kind === "scored_agenda_counter_economy"
            ? ["scored_agenda_economy_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_counter_economy"
            ? ["scored_agenda_counter_economy_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_draw" ||
          scoredAgenda.kind === "scored_agenda_shuffle_draw"
            ? ["scored_agenda_draw_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_extra_action"
            ? ["scored_agenda_extra_action_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_trace_tag"
            ? ["scored_agenda_trace_tag_taken:true"]
            : []),
          ...(scoredAgenda.kind === "scored_agenda_damage_punish"
            ? ["scored_agenda_damage_punish_taken:true"]
            : []),
          ...(scoredAgenda.sourceDefinitionId ===
          "onr_v1_210_political-overthrow"
            ? ["political_overthrow_taken:true"]
            : []),
        );
      } else if (
        action.type === "activated_card_ability" &&
        isSourceAdvancementCounterCreditPayoutAction(action)
      ) {
        const assessment = corpSourceAdvancementCounterCreditPayoutAssessment(
          input,
          action,
          features.credits,
        );
        score = assessment.score;
        reasonCode =
          "corp.installed_economy.source_advancement_counter_credit_payout";
        explanation =
          assessment.payout > 0
            ? "Die Corp nutzt eine vorbereitete Advancement-Counter-Credit-Quelle."
            : "Die Fähigkeit ist legal, hat ohne Advancement-Counter aber keinen Credit-Wert.";
        evidence.push(...assessment.evidence);
      } else {
        score = 260;
        reasonCode = "corp.card_ability.visible";
        explanation = "Eine sichtbare Kartenfähigkeit ist legal verfügbar.";
        evidence.push("corp_card_ability");
      }
      break;
    }
    case "purge_virus_counters":
      score = 780;
      reasonCode = "corp.purge.visible_virus_counters";
      explanation =
        "Die Corp nutzt die legale Purge-Aktion gegen sichtbare Virus-Counter.";
      evidence.push("purge_legal");
      break;
    case "gain_credit":
      {
        const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
        if (scoredAgenda) {
          score = scoreCorpScoredAgendaAbility(scoredAgenda, features);
          reasonCode = corpScoredAgendaAbilityReasonCode(scoredAgenda.kind);
          explanation =
            "Die Corp nutzt eine sichtbare Fähigkeit einer gescorten Agenda.";
          evidence.push(
            ...scoredAgenda.evidence,
            "scored_agenda_action_taken:true",
            ...(scoredAgenda.kind === "scored_agenda_economy" ||
            scoredAgenda.kind === "scored_agenda_counter_economy"
              ? ["scored_agenda_economy_taken:true"]
              : []),
            ...(scoredAgenda.kind === "scored_agenda_counter_economy"
              ? ["scored_agenda_counter_economy_taken:true"]
              : []),
          );
        } else {
          const betterAgendaEconomy = betterScoredAgendaEconomyAvailable(
            input,
            action,
          );
          const politicalOverthrowAvailable =
            politicalOverthrowEconomyAvailable(input, action);
          score = features.credits < 5 ? 500 : 350;
          if (betterAgendaEconomy) score -= 220;
          reasonCode = betterAgendaEconomy
            ? "corp.economy.basic_credit_deferred_for_scored_agenda"
            : "corp.economy.basic_credit";
          explanation = "Credits verbessern Rez- und Score-Fenster.";
          evidence.push(
            "basic_economy",
            ...(betterAgendaEconomy
              ? [
                  "basic_credit_taken_while_better_agenda_economy_available:true",
                  "scored_agenda_economy_skipped_for_basic_credit:true",
                  ...(politicalOverthrowAvailable
                    ? ["political_overthrow_skipped_for_basic_credit:true"]
                    : []),
                ]
              : []),
          );
        }
      }
      break;
    case "draw_card":
      {
        const betterAgendaDraw = betterScoredAgendaDrawAvailable(input, action);
        score = features.handCount < 4 ? 460 : 320;
        if (betterAgendaDraw) score -= 180;
        reasonCode = betterAgendaDraw
          ? "corp.economy.basic_draw_deferred_for_scored_agenda"
          : "corp.economy.draw_card";
      }
      explanation =
        "Eine Karte zu ziehen verbessert die sichtbare Corp-Auswahl.";
      evidence.push(
        `hand_count:${features.handCount}`,
        ...(betterScoredAgendaDrawAvailable(input, action)
          ? ["basic_draw_taken_while_better_agenda_draw_available:true"]
          : []),
      );
      break;
    case "end_turn":
      score = 120 + (features.clicks <= 0 ? 500 : 0);
      reasonCode = "corp.end_turn";
      explanation = "Die Corp beendet den Zug ohne bessere sichtbare Option.";
      evidence.push("low_visible_value");
      break;
    default:
      score = 150;
  }

  return {
    action,
    score: roundScore(score),
    reasonCode,
    explanation,
    confidence: confidence(score),
    evidence,
  };
}

  return { scoreCorpAction };
}
