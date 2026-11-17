import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";

import { corpTagPunishSkipReason } from "../runtime/corp-tag-punish-skip-reason";
import { sortedUnique } from "../runtime/collection";
import { traceTagExpectedSuccessEstimate } from "../runtime/trace-tag-success-estimate";
import type { StructuredTagPunishLegalActionAssessment } from "../tag-punish-ontology-consumer";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { CorpVisibleTagPunishOpportunity } from "./corp-visible-tag-punish-opportunities";
import type { RunnerSurvivalCounterContext } from "./runner-survival-counter-context";

export type TagPunishWindowDiagnosticsContextDependencies = {
  corpVisibleTagPunishOpportunities: (
    input: AiDecisionInput,
  ) => CorpVisibleTagPunishOpportunity[];
  runnerSurvivalCounterContextForInput: (
    input: AiDecisionInput,
  ) => RunnerSurvivalCounterContext;
  corpTagPunishOntologyAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => StructuredTagPunishLegalActionAssessment | undefined;
  applyTagPunishOntologyDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    assessment: StructuredTagPunishLegalActionAssessment | undefined,
  ) => void;
  applyCorpVisibleTagPunishTakenWindowDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    chosenOpportunity: CorpVisibleTagPunishOpportunity,
    opportunities: CorpVisibleTagPunishOpportunity[],
  ) => void;
  applyCorpVisibleTagPunishUnknownSkipDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    opportunities: CorpVisibleTagPunishOpportunity[],
    survivalContext: RunnerSurvivalCounterContext,
  ) => void;
  corpTagSourceOpportunities: (
    input: AiDecisionInput,
  ) => { action: LegalAction; traceTag: boolean }[];
  corpOntologyPayoffAvailableForTagSource: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  applyActualTagCreationDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    stateBeforeAction: GameState,
    result: PublicGameEvent["publicPayload"],
  ) => void;
};

export function createTagPunishWindowDiagnosticsContext(
  dependencies: TagPunishWindowDiagnosticsContextDependencies,
): {
  tagPunishWindowDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    stateBeforeAction: GameState,
    stateAfterAction: GameState,
    publicResult: PublicGameEvent["publicPayload"],
  ) => Partial<AiSimulationSummary["actionSequence"][number]>;
} {
  function tagPunishWindowDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    stateBeforeAction: GameState,
    stateAfterAction: GameState,
    publicResult: PublicGameEvent["publicPayload"],
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    const runnerTagsBefore = stateBeforeAction.runner.tags;
    const runnerTagsAfter = stateAfterAction.runner.tags;
    const diagnostics: Partial<AiSimulationSummary["actionSequence"][number]> =
      {
        runnerTagsBeforeAction: runnerTagsBefore,
        runnerTagsAfterAction: runnerTagsAfter,
      };
    if (input.side === "corp") {
      const visiblePunishOpportunities =
        dependencies.corpVisibleTagPunishOpportunities(input);
      const visiblePayoffCategories = sortedUnique(
        visiblePunishOpportunities.map((opportunity) => opportunity.category),
      );
      const visiblePayoffCards = sortedUnique(
        visiblePunishOpportunities
          .map((opportunity) => opportunity.cardId)
          .filter((cardId): cardId is string => Boolean(cardId)),
      );
      const survivalContext =
        dependencies.runnerSurvivalCounterContextForInput(input);
      const selectedOntology =
        dependencies.corpTagPunishOntologyAssessmentForAction(input, action);
      dependencies.applyTagPunishOntologyDiagnostics(
        diagnostics,
        selectedOntology,
      );
      if (runnerTagsBefore > 0) {
        diagnostics.runnerTaggedAtCorpDecision = true;
        if (visiblePunishOpportunities.length > 0)
          diagnostics.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown = true;
        else diagnostics.runnerTaggedAtCorpDecisionWithoutPayoffKnown = true;
      }
      if (isCorpTurnStartDecision(action, stateBeforeAction))
        diagnostics.runnerTaggedAtStartOfCorpTurn = runnerTagsBefore > 0;
      if (visiblePunishOpportunities.length > 0) {
        diagnostics.corpVisibleTagPunishLegalActions =
          visiblePunishOpportunities.length;
        diagnostics.corpVisibleTagPunishDecisionWindow = true;
        diagnostics.corpVisibleTagPayoffLegalActionKinds =
          visiblePayoffCategories;
        diagnostics.corpVisibleTagPayoffLegalActionCards = visiblePayoffCards;
        if (visiblePunishOpportunities.length > 1)
          diagnostics.corpVisibleTagPunishDecisionWindowWithMultiplePayoffs = true;
        const visiblePayoffCategorySet = new Set(visiblePayoffCategories);
        if (visiblePayoffCategorySet.has("damage"))
          diagnostics.corpVisibleTagDamagePunishLegalActions = true;
        if (visiblePayoffCategorySet.has("economic"))
          diagnostics.corpVisibleTagEconomicPunishLegalActions = true;
        if (visiblePayoffCategorySet.has("trash"))
          diagnostics.corpVisibleTagTrashPunishLegalActions = true;
        if (visiblePayoffCategorySet.has("run_lock"))
          diagnostics.corpVisibleTagRunLockPunishLegalActions = true;
        if (visiblePayoffCategorySet.has("ambush"))
          diagnostics.corpVisibleTagAmbushPunishLegalActions = true;
        if (survivalContext.any) {
          diagnostics.runnerSurvivalCounterContextAvailable = true;
          if (survivalContext.damage)
            diagnostics.runnerDamagePreventionVisibleAtPayoffWindow = true;
          if (survivalContext.flatline)
            diagnostics.runnerFlatlinePreventionVisibleAtPayoffWindow = true;
        }
      }
      const chosenPunishOpportunity = visiblePunishOpportunities.find(
        (opportunity) => opportunity.action.actionId === action.actionId,
      );
      const punishOpportunity =
        chosenPunishOpportunity ?? visiblePunishOpportunities[0];
      if (punishOpportunity) {
        const punishOntology =
          dependencies.corpTagPunishOntologyAssessmentForAction(
            input,
            punishOpportunity.action,
          );
        dependencies.applyTagPunishOntologyDiagnostics(
          diagnostics,
          punishOntology,
        );
        diagnostics.corpPunishOpportunity = true;
        diagnostics.corpPunishKind = punishOpportunity.kind;
        if (punishOntology?.isPunishPayoff)
          diagnostics.corpPunishOpportunityConfirmedByOntology = true;
        if (chosenPunishOpportunity) {
          diagnostics.corpPunishTaken = true;
          diagnostics.corpVisibleTagPunishTaken = true;
          diagnostics.corpVisibleTagPunishDecisionWindowTaken = true;
          if (punishOntology?.isPunishPayoff)
            diagnostics.corpOntologyPunishOpportunityConverted = true;
          dependencies.applyCorpVisibleTagPunishTakenWindowDiagnostics(
            diagnostics,
            input,
            action,
            decision,
            chosenPunishOpportunity,
            visiblePunishOpportunities,
          );
        } else {
          const skippedReason = corpTagPunishSkipReason(action, decision);
          diagnostics.corpPunishSkippedReason = skippedReason;
          diagnostics.corpVisibleTagPunishSkipped = true;
          diagnostics.corpVisibleTagPunishSkippedReason = skippedReason;
          diagnostics.corpVisibleTagPunishDecisionWindowSkipped = true;
          diagnostics.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen = true;
          if (
            skippedReason === "unknown_higher_priority" ||
            skippedReason === "unknown"
          )
            dependencies.applyCorpVisibleTagPunishUnknownSkipDiagnostics(
              diagnostics,
              input,
              action,
              decision,
              visiblePunishOpportunities,
              survivalContext,
            );
          if (
            diagnostics.corpVisibleTagPunishUnknownSkipFixGateEligible === true
          ) {
            diagnostics.corpVisibleTagPunishFixGateEligibleWindowNormalized = true;
            if (
              diagnostics.corpVisibleTagPunishUnknownSkipPlausibility ===
              "suspicious"
            )
              diagnostics.corpVisibleTagPunishFixGateSuspiciousSkipNormalized = true;
          }
          if (
            skippedReason === "unknown_higher_priority" ||
            skippedReason === "unknown"
          )
            diagnostics.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization = true;
          if (survivalContext.any)
            diagnostics.runnerSurvivalCounterContextSuppressedPunishValue = true;
          if (punishOntology?.isPunishPayoff)
            diagnostics.corpPunishSkippedDespiteOntologyOpportunity = true;
        }
      }
      const tagSources = dependencies.corpTagSourceOpportunities(input);
      const chosenTagSource = tagSources.find(
        (source) => source.action.actionId === action.actionId,
      );
      const tagSourceOpportunity = chosenTagSource ?? tagSources[0];
      const traceTagSource = chosenTagSource?.traceTag
        ? chosenTagSource
        : tagSources.find((source) => source.traceTag);
      if (tagSourceOpportunity) {
        const tagSourceOntology =
          dependencies.corpTagPunishOntologyAssessmentForAction(
            input,
            tagSourceOpportunity.action,
          );
        dependencies.applyTagPunishOntologyDiagnostics(
          diagnostics,
          tagSourceOntology,
        );
        diagnostics.corpTagSourceOpportunity = true;
        if (
          dependencies.corpOntologyPayoffAvailableForTagSource(
            input,
            tagSourceOpportunity.action,
          )
        )
          diagnostics.corpFunnelSourcePayoffPairSeenInDeck = true;
        if (survivalContext.any)
          diagnostics.runnerSurvivalCounterContextAvailable = true;
        if (survivalContext.trace)
          diagnostics.runnerTraceDefenseVisibleAtTagSource = true;
        if (traceTagSource && survivalContext.link)
          diagnostics.runnerLinkDefenseVisibleAtTrace = true;
        if (chosenTagSource) {
          diagnostics.corpTagSourceTaken = true;
          if (diagnostics.corpFunnelSourcePayoffPairSeenInDeck === true)
            diagnostics.corpFunnelSourceActionTakenWithPayoffInDeck = true;
          if (tagSourceOntology?.isTagSource) {
            if (
              dependencies.corpOntologyPayoffAvailableForTagSource(
                input,
                action,
              )
            ) {
              diagnostics.corpTagSourceTakenWithOntologyPayoffAvailable = true;
              diagnostics.corpFunnelSourceActionTakenWithVisiblePayoff = true;
            } else {
              diagnostics.corpTagSourceTakenWithoutOntologyPayoff = true;
              diagnostics.corpFunnelSourceActionTakenWithoutVisiblePayoff = true;
            }
          }
        }
        if (traceTagSource) {
          diagnostics.corpTraceTagOpportunity = true;
          diagnostics.corpTraceTagExpectedSuccess =
            traceTagExpectedSuccessEstimate(input);
          if (chosenTagSource?.traceTag) {
            diagnostics.corpTraceTagTaken = true;
          } else {
            diagnostics.corpTraceTagSkippedReason = corpTagPunishSkipReason(
              action,
              decision,
            );
          }
        }
      } else if (decision.reasonCode === "corp.trace.bid_visible_amount") {
        diagnostics.corpTagSourceOpportunity = true;
        diagnostics.corpTagSourceTaken = true;
        diagnostics.corpTraceTagOpportunity = true;
        diagnostics.corpTraceTagTaken = true;
        diagnostics.corpTraceTagExpectedSuccess =
          traceTagExpectedSuccessEstimate(input);
      }
    }
    if (
      stateBeforeAction.activeSide === "runner" &&
      stateAfterAction.activeSide === "corp" &&
      stateAfterAction.phase !== "game_over"
    ) {
      diagnostics.runnerTaggedAtEndOfRunnerTurn = runnerTagsAfter > 0;
    }
    if (runnerTagsAfter > runnerTagsBefore) {
      diagnostics.runnerTagAddedByAction = true;
      dependencies.applyActualTagCreationDiagnostics(
        diagnostics,
        input,
        action,
        stateBeforeAction,
        publicResult,
      );
    }
    if (runnerTagsAfter < runnerTagsBefore)
      diagnostics.runnerTagClearedByAction = true;
    return diagnostics;
  }

  return { tagPunishWindowDiagnosticsForSimulationAction };
}

function isCorpTurnStartDecision(
  action: LegalAction,
  stateBeforeAction: GameState,
): boolean {
  return (
    action.side === "corp" &&
    action.type === "mandatory_draw" &&
    stateBeforeAction.activeSide === "corp" &&
    stateBeforeAction.timingPoint === "corp_draw.mandatory_draw"
  );
}
