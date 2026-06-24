import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type SemanticRuntimeCorpSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpRezFloorAssessment = {
  blockedByFloor: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpAdvancementPlacementAssessment = {
  dominatedByBasicAdvance: boolean;
  scoreValue: number;
  evidence: string[];
};

export type SemanticRuntimeCorpScoreDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowDoctrineWeight: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpSafetyGate;
  corpDoctrineWeight: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: TConsumer,
  ) => AiDecisionScoreComponent | undefined;
  corpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
  ) => number;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpAdvancementPlacementAssessment | undefined;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpPassiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function semanticRuntimeCorpScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  if (action.type === "score_agenda") {
    components.push({
      key: "corp_score_available_agenda",
      label: "Agenda punkten",
      value: 1200,
      reason: "score_agenda",
    });
    const doctrineWeight = dependencies.corpScoreNowDoctrineWeight(
      input,
      action,
    );
    if (doctrineWeight) components.push(doctrineWeight);
    const safetyGate = dependencies.corpScoreNowSafetyGate(input, action);
    if (!safetyGate.allowed) {
      components.push({
        key: "corp_scoreline_safety_gate_blocks_doctrine",
        label: "Scoreline-Safety",
        value: -900,
        reason: safetyGate.evidence.join("|"),
      });
    }
  }
  if (action.type === "advance_card") {
    components.push({
      key: "corp_advance_score_line",
      label: "Advance-Linie",
      value: 600,
      reason: "advance_card",
    });
    const doctrineWeight = dependencies.corpDoctrineWeight(
      input,
      action,
      "score_next_turn",
      "corp_score_next_turn" as TConsumer,
    );
    if (doctrineWeight) components.push(doctrineWeight);
    const remoteScore = dependencies.corpAdvanceRemoteScore(input, action);
    if (remoteScore !== 0) {
      components.push({
        key: "corp_advance_remote_context",
        label: "Remote-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push({
        key: "corp_remote_rez_floor_penalty",
        label: "Remote-Rez-Floor",
        value: -2400,
        reason: rezFloor.evidence.join("|"),
      });
    }
  }
  if (action.type === "rez_ice") {
    components.push({
      key: "corp_rez_affordability",
      label: "Rez-Kosten zahlbar",
      value: credits >= dependencies.actionCreditCost(action) ? 750 : -1200,
      reason: `credits:${credits};cost:${dependencies.actionCreditCost(action)}`,
    });
  }
  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    if (dependencies.corpActionIsScoreLine(input, action, roles)) {
      components.push({
        key: "corp_install_score_line",
        label: "Scoring-Aufbau",
        value: 550,
        reason: "score_line",
      });
      const doctrineWeight = dependencies.corpDoctrineWeight(
        input,
        action,
        "build_scoring_remote",
        "corp_build_scoring_remote" as TConsumer,
      );
      if (doctrineWeight) components.push(doctrineWeight);
    }
    if (
      action.payload?.placement === "ice" ||
      roles.some((role) => role.includes("ice") || role.includes("protect"))
    ) {
      components.push({
        key: "corp_install_protection",
        label: "Schutz-Aufbau",
        value: 650,
        reason: "protect_role",
      });
    }
    if (roles.some((role) => role.includes("economy"))) {
      components.push({
        key: "corp_install_economy",
        label: "Economy-Aufbau",
        value: 500,
        reason: "economy_role",
      });
    }
    const remoteScore = dependencies.corpInstallRemoteScore(
      input,
      action,
      roles,
    );
    if (remoteScore !== 0) {
      components.push({
        key: "corp_install_remote_context",
        label: "Installations-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push({
        key: "corp_remote_rez_floor_penalty",
        label: "Remote-Rez-Floor",
        value: -2400,
        reason: rezFloor.evidence.join("|"),
      });
    }
  }
  const advancementPlacement =
    dependencies.corpAdvancementCounterPlacementAssessment(input, action);
  if (advancementPlacement) {
    components.push({
      key: advancementPlacement.dominatedByBasicAdvance
        ? "corp_advancement_counter_placement_dominated_by_basic_advance"
        : "corp_advancement_counter_placement_incremental_value",
      label: advancementPlacement.dominatedByBasicAdvance
        ? "Basic-Advance-Dominanz"
        : "Advancement-Mehrwert",
      value: advancementPlacement.scoreValue,
      reason: advancementPlacement.evidence.join("|"),
    });
  }
  if (action.type === "gain_credit" && credits < 6) {
    components.push({
      key: "corp_low_credits",
      label: "Credit-Bedarf",
      value: 700,
      reason: `credits:${credits}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_credit_reserve",
        label: "Remote-Reserve",
        value: 250,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_remote_rez_floor_credit_reserve",
        label: "Remote-Rez-Floor",
        value: 900,
        reason: "low_rez_reserve",
      });
    }
  }
  if (action.type === "draw_card" && input.playerView.own.gripOrHq.length < 4) {
    components.push({
      key: "corp_low_hand",
      label: "Handkarten-Bedarf",
      value: 450,
      reason: `hand:${input.playerView.own.gripOrHq.length}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_draw",
        label: "Remote-Nachschub",
        value: 200,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_remote_rez_floor_draw_fallback",
        label: "Remote-Rez-Floor",
        value: 450,
        reason: "low_rez_reserve",
      });
    }
  }
  const passiveScoreLinePenalty = dependencies.corpPassiveScoreLinePenalty(
    input,
    action,
  );
  if (passiveScoreLinePenalty) components.push(passiveScoreLinePenalty);
  if (action.type === "decline_rez" && scopeId === "simple_rez") {
    components.push({
      key: "corp_decline_rez_pressure",
      label: "Rez ablehnen",
      value: -700,
      reason: scopeId,
    });
  }
  if (action.type === "end_turn" && input.playerView.own.clicks > 0) {
    components.push({
      key: "corp_unused_actions",
      label: "Ungenutzte Aktionen",
      value: -1400,
      reason: `actions:${input.playerView.own.clicks}`,
    });
  }
  return components;
}
