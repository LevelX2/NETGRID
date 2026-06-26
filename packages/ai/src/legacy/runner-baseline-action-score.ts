import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { evaluateRunnerOpeningHand } from "../deck-doctrine";
import { cardDefinitionTypeForAi } from "../runtime/card-definition-lookup";
import { selectableChoiceOptions } from "../runtime/choice-option";
import { runnerReachedAccessMovement } from "../runtime/current-encounter";
import { discardCurrentPlanKind, discardEvidenceForInput } from "../runtime/discard-plan";
import type { AiFeatures } from "../runtime/ai-features";
import type { createRunnerEncounterBreakContext } from "../runtime/runner-encounter-break-context";
import { encounterRunRemainderEffectAssessment } from "../runtime/runner-run-remainder-effect-assessment";
import type { createRunnerPumpViabilityContext } from "../runtime/runner-pump-viability-context";
import type { RunnerMuPressureContext } from "../runtime/runner-mu-pressure-context";
import type { RunnerPersistentInstallContext } from "../runtime/runner-persistent-install-context";
import type { RunnerProgramInstallTrashContext } from "../runtime/runner-program-install-trash-context";
import { recentRemoteJackOutRepeatRunPenalty } from "../runtime/runner-remote-repeat-run-score";
import {
  rndFreshRepeatRunBoost,
  staleKnownRndRepeatRunPenalty,
} from "../runtime/runner-rnd-repeat-run-score";
import { staleKnownArchivesRepeatRunPenalty } from "../runtime/runner-archives-repeat-run-score";
import { staleKnownHqRepeatRunPenalty } from "../runtime/runner-hq-repeat-run-score";
import {
  runnerRunReasonCode,
  runTargetEvidence,
  scoreRunTarget,
} from "../runtime/runner-run-target-score";
import { scoreRunnerEvent, scoreRunnerInstall } from "../runtime/runner-card-action-score";
import { AI_PROFILES, profileWeights } from "../runtime/profile-weights";
import type { RankedChoice } from "../runtime/ranked-choice";
import { publicRoleEvidence } from "../runtime/role-evidence";
import { scoreConfidence as confidence } from "../runtime/score-confidence";
import { roundSemanticRuntimeScore as roundScore } from "../runtime/semantic-runtime-score-components";
import {
  shellTradersAbility,
  shellTradersTargetValue,
} from "../runtime/shell-traders-action";
import {
  shellTradersBacklog,
  shellTradersDirectInstallAction,
  shellTradersDirectInstallPreparePenalty,
  shellTradersImmediateRemoveAvailable,
  shellTradersPrepareBaselinePenalty,
} from "../runtime/shell-traders-context";
import { shellTradersDirectInstallUrgency } from "../runtime/shell-traders-urgency";
import { findVisibleCard } from "../runtime/visible-card-lookup";
import type { RunnerRemoteTrashAccessContext } from "../simulation/remote-trash-access-context";

type RunnerEncounterBreakContext = ReturnType<
  typeof createRunnerEncounterBreakContext
>;
type RunnerPumpViabilityContext = ReturnType<typeof createRunnerPumpViabilityContext>;

export type LegacyRunnerActionScorerDependencies = {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (cardId: string | undefined) => string[];
  runnerProgramInstallTrashAssessment: RunnerProgramInstallTrashContext["runnerProgramInstallTrashAssessment"];
  runnerProgramInstallTrashAssessmentForAction: RunnerProgramInstallTrashContext["runnerProgramInstallTrashAssessmentForAction"];
  runnerProgramInstallDisplacementPenalty: RunnerProgramInstallTrashContext["runnerProgramInstallDisplacementPenalty"];
  runnerRemoteTrashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRemoteTrashAccessContext;
  encounterBreakReserveContext: RunnerEncounterBreakContext["encounterBreakReserveContext"];
  pumpViabilityAssessment: RunnerPumpViabilityContext["pumpViabilityAssessment"];
  runnerMuPressureInstallPriorityBonus: RunnerMuPressureContext["runnerMuPressureInstallPriorityBonus"];
  runnerMuPressureFundingPriorityBonus: RunnerMuPressureContext["runnerMuPressureFundingPriorityBonus"];
  runnerPersistentInstallEvaluationForAction: RunnerPersistentInstallContext["runnerPersistentInstallEvaluationForAction"];
  runnerPersistentInstallLegacyScoreDelta: RunnerPersistentInstallContext["runnerPersistentInstallLegacyScoreDelta"];
};

export function createLegacyRunnerActionScorer(
  dependencies: LegacyRunnerActionScorerDependencies,
): {
  scoreRunnerAction: (
    input: AiDecisionInput,
    features: AiFeatures,
    action: LegalAction,
  ) => RankedChoice;
} {
  const {
    rolesForAction,
    rolesForCardId,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerRemoteTrashAccessContext,
    encounterBreakReserveContext,
    pumpViabilityAssessment,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerPersistentInstallEvaluationForAction,
    runnerPersistentInstallLegacyScoreDelta,
  } = dependencies;

function scoreRunnerAction(
  input: AiDecisionInput,
  features: AiFeatures,
  action: LegalAction,
): RankedChoice {
  const roles = rolesForAction(input, action);
  const profile = profileWeights(input, AI_PROFILES);
  let score = 0;
  let reasonCode = "runner.fallback.low_value";
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
        const opening = evaluateRunnerOpeningHand(input);
        score = 920;
        reasonCode =
          opening.decision === "mulligan"
            ? "runner.setup.mulligan"
            : "runner.setup.keep";
        explanation =
          opening.decision === "mulligan"
            ? "Der Runner nimmt anhand von Start-Hand und Deckprofil einen Mulligan."
            : "Der Runner behält eine startfähige Hand anhand von Start-Hand und Deckprofil.";
        evidence.push(
          "choice_legal",
          "choice_source:setup.mulligan",
          ...opening.reasons,
          ...opening.evidence,
        );
      } else {
        const postBidTraceLink =
          input.playerView.pendingChoice?.source.startsWith(
            "trace_post_bid_link",
          ) === true;
        const programTrashAssessment =
          input.playerView.pendingChoice?.source.startsWith(
            "runner_program_trash_before_install",
          ) === true && input.playerView.pendingChoice.kind === "select_cards"
            ? runnerProgramInstallTrashAssessment(
                input,
                input.playerView.pendingChoice,
                selectableChoiceOptions(input.playerView.pendingChoice.options),
              )
            : null;
        score =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? 900
            : postBidTraceLink
              ? 880
              : programTrashAssessment
                ? 640
                : 620;
        reasonCode =
          input.playerView.pendingChoice?.kind === "bid_amount"
            ? "runner.trace.bid_visible_amount"
            : postBidTraceLink
              ? "runner.trace.post_bid_link"
              : "runner.choice.resolve";
        explanation = programTrashAssessment
          ? "Der Runner bewertet side-sicher, ob installierte Programme fuer MU getrasht werden."
          : postBidTraceLink
            ? "Der Runner nutzt nach offen gelegten Trace-Bids eine legale Link-Faehigkeit."
            : "Der Runner beantwortet eine sichtbare legale Choice.";
        evidence.push(
          "choice_legal",
          `choice_kind:${input.playerView.pendingChoice?.kind ?? "unknown"}`,
        );
        if (programTrashAssessment)
          evidence.push(...programTrashAssessment.evidence);
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
    case "steal_agenda":
      score = 1000;
      reasonCode = "runner.access.steal_agenda";
      explanation = "Eine sichtbare Agenda kann legal gestohlen werden.";
      evidence.push("access_agenda_visible");
      if (input.profileId.includes("v1.4.2") && input.ownDeckDoctrine) {
        evidence.push("steal_trash_protected_from_followup:true");
      }
      break;
    case "access_card":
      score = 850;
      reasonCode = "runner.access.open_card";
      explanation = "Der Runner nutzt den erreichten Zugriff.";
      evidence.push("access_window");
      break;
    case "trash_accessed_card":
      {
        const trashContext = runnerRemoteTrashAccessContext(input, action);
        score = trashContext.deferredByBudget
          ? trashContext.acuteThreat
            ? 640
            : 360
          : trashContext.affordableRelevant
            ? trashContext.role === "scoring_protection"
              ? 940
              : trashContext.role === "run_tax"
                ? 875
                : trashContext.finitePoolEconomy
                  ? trashContext.bbsWhisperingCampaign
                    ? 1120
                    : 1040
                  : 890
            : trashContext.trashable && trashContext.role === "low_value"
              ? 430
              : 780;
        if (
          trashContext.finitePoolEconomy &&
          trashContext.corpValueRemaining >=
            Math.max(trashContext.trashCost + 4, 8)
        )
          score += 90;
        if (trashContext.dedicatedTrashCredits > 0) score += 80;
        evidence.push(...trashContext.evidence);
      }
      reasonCode = "runner.access.trash_value";
      explanation = "Eine zugreifbare Karte kann legal entfernt werden.";
      evidence.push("trash_legal");
      if (input.profileId.includes("v1.4.2") && input.ownDeckDoctrine) {
        evidence.push("steal_trash_protected_from_followup:true");
      }
      break;
    case "decline_trash":
      {
        const trashContext = runnerRemoteTrashAccessContext(input, action);
        score = trashContext.deferredByBudget
          ? 900
          : trashContext.affordableRelevant && trashContext.finitePoolEconomy
            ? 35
            : trashContext.affordableRelevant
              ? 120
              : trashContext.trashable && trashContext.role === "low_value"
                ? 760
                : 650;
        evidence.push(...trashContext.evidence);
      }
      reasonCode = "runner.access.decline_trash";
      explanation =
        "Der Runner lehnt das Trashen im Zugriff bewusst ab, wenn kein höherwertiger Trash-Plan greift.";
      evidence.push("decline_trash_legal");
      break;
    case "break_subroutine":
      {
        const runEffect = encounterRunRemainderEffectAssessment(input, action);
        const reserveContext = encounterBreakReserveContext(input, action);
        score = runEffect.ignoredBecauseNoRemainingIce
          ? 115
          : reserveContext.preserveReserve &&
              runEffect.hasRunRemainderEffect &&
              !runEffect.mustBreak
            ? 260
            : runEffect.mustBreak
              ? 940
              : runEffect.hasRunRemainderEffect
                ? 805
                : 740;
        reasonCode = runEffect.ignoredBecauseNoRemainingIce
          ? "runner.encounter.skip_irrelevant_future_effect_break"
          : runEffect.hasRunRemainderEffect
            ? "runner.encounter.break_run_remainder_effect"
            : "runner.encounter.break_etr";
        explanation = runEffect.ignoredBecauseNoRemainingIce
          ? "Eine sichtbare Subroutine wirkt nur auf spätere ICE; im aktuellen Run gibt es danach kein ICE mehr."
          : runEffect.hasRunRemainderEffect
            ? "Eine sichtbare Subroutine wuerde den restlichen Run verteuern oder gefaehrlicher machen."
            : "Eine sichtbare Subroutine kann legal gebrochen werden.";
        evidence.push(
          "encounter_solution",
          ...runEffect.evidence,
          ...reserveContext.evidence,
        );
      }
      break;
    case "pump_breaker":
      {
        const pumpAssessment = pumpViabilityAssessment(input, action);
        if (pumpAssessment.canLeadToBreak) {
          const runEffect = encounterRunRemainderEffectAssessment(input);
          score = runEffect.mustBreak ? 760 : 690;
          reasonCode = runEffect.mustBreak
            ? "runner.encounter.pump_run_remainder_effect"
            : "runner.encounter.pump_breaker";
          explanation =
            "Ein installierter Breaker kann die Begegnung verbessern.";
          evidence.push(
            "breaker_visible",
            "pump_can_enable_break",
            ...pumpAssessment.evidence,
            ...runEffect.evidence,
          );
        } else {
          score = 90;
          reasonCode = "runner.encounter.pump_without_matching_breaker";
          explanation =
            "Der sichtbare Breaker passt nicht zu diesem ICE; Pumpen verbessert die Begegnung nicht.";
          evidence.push(
            "breaker_visible",
            "pump_cannot_break_encountered_ice",
            ...pumpAssessment.evidence,
          );
        }
      }
      break;
    case "continue_run":
      {
        const runEffect = encounterRunRemainderEffectAssessment(input, action);
        score = runEffect.mustBreak
          ? 180
          : runEffect.hasRunRemainderEffect
            ? input.difficulty === "easy"
              ? 330
              : 470
            : input.difficulty === "easy"
              ? 360
              : 520;
        if (runEffect.paidConditionalPaymentRemediatesEffect) {
          score += 220;
        }
        if (runEffect.paidConditionalPaymentWithoutBeneficialEffect) {
          score -= 120;
        }
        reasonCode = runEffect.mustBreak
          ? "runner.encounter.continue_visible_future_path_risk"
          : "runner.encounter.continue";
        explanation = runEffect.mustBreak
          ? "Eine ungelöste sichtbare Subroutine wuerde den restlichen Run stark verschlechtern."
          : "Der Run kann nach sichtbarer Bewertung fortgesetzt werden.";
        evidence.push("continue_legal", ...runEffect.evidence);
      }
      break;
    case "jack_out":
      if (runnerReachedAccessMovement(input)) {
        score = 80;
        reasonCode = "runner.run.jack_out_before_access_low_value";
        explanation =
          "Der Runner hat den Server erreicht; Jack-out wuerde den Zugriff ohne sichtbaren Nutzen aufgeben.";
        evidence.push("jack_out_legal", "access_window_reached");
      } else {
        score = 610;
        reasonCode = "runner.run.jack_out_safe_exit";
        explanation =
          "Der Runner kann vor weiterer sichtbarer Run-Gefahr legal auschecken.";
        evidence.push("jack_out_legal", "pre_access_window");
      }
      break;
    case "remove_tag":
      score = features.tags > 0 ? 760 + (profile.riskTolerance ?? 1) * 40 : 300;
      reasonCode = "runner.tag.clear_visible_tag";
      explanation =
        "Ein öffentlicher Tag wird entfernt, bevor er gefährlich wird.";
      evidence.push(`tags:${features.tags}`);
      break;
    case "install_card":
      {
        const sacrificeAssessment =
          runnerProgramInstallTrashAssessmentForAction(input, action);
        const sacrificePenalty =
          runnerProgramInstallDisplacementPenalty(sacrificeAssessment);
        const muPressureBonus = runnerMuPressureInstallPriorityBonus(
          input,
          action,
        );
        const persistentInstallEvaluation =
          runnerPersistentInstallEvaluationForAction(input, action);
        score =
          scoreRunnerInstall(roles, features, profile) +
          muPressureBonus.value -
          sacrificePenalty +
          runnerPersistentInstallLegacyScoreDelta(persistentInstallEvaluation);
        if (
          sacrificeAssessment?.memoryRequired &&
          !sacrificeAssessment.canFreeRequiredMemory
        ) {
          score = Math.min(score, 120);
          reasonCode = "runner.setup.install_blocked_by_program_sacrifice";
          explanation =
            "Die Installation wuerde ein wichtiges installiertes Programm opfern; die KI bricht den Pflicht-Trash-Pfad ab.";
        } else {
          reasonCode =
            muPressureBonus.value > 0
              ? "runner.setup.install_memory_support"
              : roles.some((role) => role.startsWith("breaker_"))
                ? "runner.setup.install_missing_breaker"
                : "runner.setup.install_support";
          explanation =
            muPressureBonus.value > 0
              ? "Die Runner-KI baut bei sichtbarem MU-Druck Memory-Support auf."
              : "Die Runner-KI verbessert sichtbare Rig- oder Setup-Rollen.";
        }
        evidence.push(
          "own_card_role_known",
          ...publicRoleEvidence(roles),
          ...muPressureBonus.evidence,
          ...(persistentInstallEvaluation
            ? [
                "persistent_install_evaluation:true",
                ...persistentInstallEvaluation.evidence.slice(0, 16),
              ]
            : []),
          ...(sacrificeAssessment?.memoryRequired
            ? [
                `program_sacrifice_penalty:${sacrificePenalty}`,
                ...sacrificeAssessment.evidence,
              ]
            : []),
        );
      }
      break;
    case "play_event":
      score = scoreRunnerEvent(roles, features, profile);
      reasonCode = roles.includes("run_pressure")
        ? "runner.run.event_pressure"
        : roles.includes("draw")
          ? "runner.economy.draw_setup"
          : "runner.economy.event";
      explanation =
        "Ein Event verbessert anhand sichtbarer Rollen die Runner-Position.";
      evidence.push("own_event_role_known", ...publicRoleEvidence(roles));
      break;
    case "trigger_ability":
      const ability = shellTradersAbility(action);
      if (ability === "set_aside_from_grip") {
        const counterAmount =
          typeof action.payload?.shellCounterAmount === "number"
            ? action.payload.shellCounterAmount
            : 0;
        const targetCardId =
          typeof action.payload?.targetCardId === "string"
            ? action.payload.targetCardId
            : "";
        const targetDefinitionId =
          typeof action.payload?.targetCardDefinitionId === "string"
            ? action.payload.targetCardDefinitionId
            : findVisibleCard(input, targetCardId)?.definitionId;
        const targetRoles = rolesForCardId(targetDefinitionId);
        const directInstall = shellTradersDirectInstallAction(input, action);
        const installedRigRoles = new Set(
          (input.playerView.own.rig ?? []).flatMap((card) =>
            rolesForCardId(card.definitionId),
          ),
        );
        const directInstallUrgency = directInstall
          ? shellTradersDirectInstallUrgency(
              input,
              targetRoles,
              directInstall,
              installedRigRoles,
            )
          : 0;
        const directInstallPenalty = directInstall
          ? shellTradersDirectInstallPreparePenalty(
              directInstallUrgency,
              directInstall,
              input,
            )
          : 0;
        const backlog = shellTradersBacklog(input);
        const immediateRemoveAvailable =
          shellTradersImmediateRemoveAvailable(input);
        const backlogPenalty = shellTradersPrepareBaselinePenalty(
          input,
          backlog,
          immediateRemoveAvailable,
        );
        score =
          620 +
          Math.max(0, counterAmount) * 30 +
          Math.min(
            60,
            shellTradersTargetValue(targetRoles, counterAmount) / 3,
          ) -
          backlogPenalty -
          directInstallPenalty;
        reasonCode = "runner.shell_traders.prepare_install";
        explanation =
          "The Shell Traders bereitet ein eigenes Programm oder eine Hardwarekarte für die verzögerte kostenlose Installation vor.";
        evidence.push(
          "shell_traders",
          `shell_counters:${counterAmount}`,
          `shell_traders_backlog:${backlog.preparedCount}`,
          `shell_traders_prepare_backlog_penalty:${backlogPenalty}`,
          `shell_traders_direct_install_available:${Boolean(directInstall)}`,
          `shell_traders_direct_install_urgency:${directInstallUrgency}`,
          `shell_traders_direct_install_penalty:${directInstallPenalty}`,
          `shell_traders_immediate_remove:${immediateRemoveAvailable}`,
        );
      } else if (ability === "remove_shell_counter") {
        const remaining =
          typeof action.payload?.remainingCounters === "number"
            ? action.payload.remainingCounters
            : 1;
        score = remaining <= 1 ? 650 : 360;
        reasonCode = "runner.shell_traders.remove_counter";
        explanation =
          "Ein Shell-Counter kann legal entfernt werden, um die vorbereitete Installation zu beschleunigen.";
        evidence.push("shell_counter_remove", `credits:${features.credits}`);
      } else {
        score = 260;
        reasonCode = "runner.card_ability.visible";
        explanation = "Eine sichtbare Kartenfähigkeit ist legal verfügbar.";
        evidence.push("trigger_ability");
      }
      break;
    case "start_run":
      const staleCentralRepeatPenalty =
        staleKnownRndRepeatRunPenalty(input, action) +
        staleKnownHqRepeatRunPenalty(input, action) +
        staleKnownArchivesRepeatRunPenalty(input, action) +
        recentRemoteJackOutRepeatRunPenalty(input, action);
      const rndRepeatPressureBoost = rndFreshRepeatRunBoost(input, action);
      score = scoreRunTarget(
        action,
        features,
        profile,
        input.difficulty,
        staleCentralRepeatPenalty,
      );
      score += rndRepeatPressureBoost;
      reasonCode = runnerRunReasonCode(action, features);
      explanation =
        reasonCode === "runner.run.blocked_by_rezzed_ice"
          ? "Ein bereits gerezztes ICE stoppt diesen Server sichtbar; Setup oder Wirtschaft ist gerade wertvoller."
          : reasonCode === "runner.run.empty_remote_low_value"
            ? "Der Außenserver hat kein sichtbares Root-Ziel; ein Run ist derzeit wenig wertvoll."
            : "Der Serverdruck ist anhand sichtbarer Lage vertretbar.";
      evidence.push(
        `server:${String(action.payload?.serverId ?? "unknown")}`,
        `known_pressure:${features.knownServerPressure}`,
        ...runTargetEvidence(action, features),
        ...(staleCentralRepeatPenalty > 0
          ? [`known_stale_central_repeat_penalty:${staleCentralRepeatPenalty}`]
          : []),
        ...(rndRepeatPressureBoost > 0
          ? [`rnd_repeat_pressure_boost:${rndRepeatPressureBoost}`]
          : []),
      );
      break;
    case "gain_credit":
      {
        const muPressureFunding = runnerMuPressureFundingPriorityBonus(
          input,
          action,
        );
        score =
          (input.difficulty === "easy"
            ? 560
            : features.credits < 4
              ? 540
              : 380) + muPressureFunding.value;
        reasonCode =
          muPressureFunding.value > 0
            ? "runner.setup.fund_memory_support"
            : "runner.economy.basic_credit";
        explanation =
          muPressureFunding.value > 0
            ? "Credits finanzieren sichtbaren Memory-Support gegen aktuellen MU-Druck."
            : "Credits verbessern die sichtbare Handlungsfähigkeit.";
        evidence.push("basic_economy", ...muPressureFunding.evidence);
      }
      break;
    case "draw_card":
      score = features.handCount < 3 ? 430 : 320;
      if (features.citySurveillanceSourceCount > 0) {
        const projectedCreditsPaid = Number(
          action.payload?.drawTaxProjectedCreditsPaid ??
            action.payload?.citySurveillanceProjectedCreditsPaid ??
            0,
        );
        const projectedTagsAdded = Number(
          action.payload?.drawTaxProjectedTagsAdded ??
            action.payload?.citySurveillanceProjectedTagsAdded ??
            0,
        );
        score -=
          (Number.isFinite(projectedCreditsPaid) ? projectedCreditsPaid : 0) *
            185 +
          (Number.isFinite(projectedTagsAdded) ? projectedTagsAdded : 0) * 620;
        if (projectedTagsAdded > 0 && features.tags > 0)
          score -= Math.min(360, features.tags * 20);
        if (
          projectedCreditsPaid > 0 &&
          features.credits <= projectedCreditsPaid + 1
        )
          score -= 120;
      }
      reasonCode = "runner.economy.draw_card";
      explanation = "Eine Karte zu ziehen verbessert das sichtbare Setup.";
      evidence.push(`hand_count:${features.handCount}`);
      if (features.citySurveillanceSourceCount > 0) {
        evidence.push(
          `city_surveillance_sources:${features.citySurveillanceSourceCount}`,
          `city_surveillance_decision:${String(action.payload?.drawTaxDecision ?? action.payload?.citySurveillanceDrawDecision ?? "unknown")}`,
          `city_surveillance_projected_credits:${Number(action.payload?.drawTaxProjectedCreditsPaid ?? action.payload?.citySurveillanceProjectedCreditsPaid ?? 0)}`,
          `city_surveillance_projected_tags:${Number(action.payload?.drawTaxProjectedTagsAdded ?? action.payload?.citySurveillanceProjectedTagsAdded ?? 0)}`,
        );
      }
      break;
    case "end_turn":
      score = 120 + (features.clicks <= 0 ? 500 : 0);
      reasonCode = "runner.end_turn";
      explanation = "Der Zug wird ohne bessere sichtbare Option beendet.";
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

  return { scoreRunnerAction };
}
