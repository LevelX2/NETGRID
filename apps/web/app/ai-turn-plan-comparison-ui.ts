import type {
  AiPlanFirstDecisionDebug,
  AiTurnPlanningDebug,
} from "@netgrid/shared";

export type AiTurnPlanComparisonCard = {
  lineId: string;
  selected: boolean;
  actionId: string;
  actionLabel: string;
  rootPlanInstanceId: string;
  moduleId?: string;
  scalarValue?: number;
  stepCount: number;
  violatedObligationCount?: number;
  stopReason: AiTurnPlanningDebug["selectedLine"]["stopReason"];
  head?: AiTurnPlanningDebug["heads"][number];
  plan?: AiPlanFirstDecisionDebug["portfolio"][number];
  agendaLine?: NonNullable<
    AiTurnPlanningDebug["agendaComparison"]
  >["lines"][number];
  defenseLine?: NonNullable<
    AiTurnPlanningDebug["defenseComparison"]
  >["lines"][number];
  steps: NonNullable<AiTurnPlanningDebug["consideredLines"]>[number]["steps"];
  evaluationValues: Record<string, number>;
  evidenceCodes: string[];
  selectedPhases: AiTurnPlanningDebug["selectedLine"]["phases"];
};

export type AiTurnPlanComparison = {
  turnKey: string;
  selectedLineId: string;
  selectionReason: string;
  cards: AiTurnPlanComparisonCard[];
};

type ComparableTurnPlanLine = {
  lineId: string;
  firstActionId: string;
  rootPlanInstanceId: string;
  stepCount: number;
  scalarValue?: number;
  stopReason: AiTurnPlanningDebug["selectedLine"]["stopReason"];
  violatedObligationCount?: number;
  steps?: NonNullable<AiTurnPlanningDebug["consideredLines"]>[number]["steps"];
  evaluationValues?: Record<string, number>;
  evidenceCodes?: string[];
};

/**
 * Builds the compact, comparable turn-start view from the existing planner
 * diagnostics. The selected line is synthesized when an older diagnostic
 * omitted it from consideredLines so the inspector never hides the winner.
 */
export function aiTurnPlanComparison(
  decision: AiPlanFirstDecisionDebug,
  actionLabels: ReadonlyMap<string, string>,
): AiTurnPlanComparison | undefined {
  const planning = decision.turnPlanning;
  if (!planning) return undefined;

  const considered: ComparableTurnPlanLine[] = (
    planning.consideredLines ?? []
  ).map((line) => ({ ...line }));
  const selectedLineId = planning.selectedLine.lineId;
  if (!considered.some((line) => line.lineId === selectedLineId)) {
    const selectedPhase = planning.selectedLine.phases[0];
    const selectedHead =
      planning.heads.find(
        (head) =>
          head.actionId === decision.route?.actionId &&
          head.rootPlanInstanceId === selectedPhase?.rootPlanInstanceId,
      ) ??
      planning.heads.find(
        (head) => head.rootPlanInstanceId === selectedPhase?.rootPlanInstanceId,
      ) ??
      planning.heads.find((head) => head.actionId === decision.route?.actionId);
    considered.push({
      lineId: selectedLineId,
      firstActionId:
        selectedHead?.actionId ??
        decision.route?.actionId ??
        decision.engineWindowAction?.actionId ??
        "nicht ausgewiesen",
      rootPlanInstanceId:
        selectedPhase?.rootPlanInstanceId ?? decision.rootPlanInstanceId,
      stepCount:
        planning.search?.selectedLineStepCount ??
        planning.selectedLine.phases.reduce(
          (sum, phase) => sum + phase.nodes.length,
          0,
        ),
      ...(planning.search
        ? { scalarValue: planning.search.selectedLineScalarValue }
        : {}),
      stopReason: planning.selectedLine.stopReason,
    });
  }

  const cards = considered
    .map((line): AiTurnPlanComparisonCard => {
      const selected = line.lineId === selectedLineId;
      const head =
        planning.heads.find(
          (candidate) =>
            candidate.actionId === line.firstActionId &&
            candidate.rootPlanInstanceId === line.rootPlanInstanceId,
        ) ??
        planning.heads.find(
          (candidate) => candidate.actionId === line.firstActionId,
        );
      const plan =
        decision.portfolio.find(
          (candidate) => candidate.instanceId === line.rootPlanInstanceId,
        ) ??
        (decision.selectedPlan?.instanceId === line.rootPlanInstanceId
          ? decision.selectedPlan
          : undefined);
      const moduleId =
        head?.moduleId ??
        plan?.moduleId ??
        (selected ? planning.selectedLine.phases[0]?.rootModuleId : undefined);
      const agendaLine = planning.agendaComparison?.lines.find(
        (candidate) => candidate.lineId === line.lineId,
      );
      const defenseLine = planning.defenseComparison?.lines.find(
        (candidate) => candidate.lineId === line.lineId,
      );
      return {
        lineId: line.lineId,
        selected,
        actionId: line.firstActionId,
        actionLabel: actionLabels.get(line.firstActionId) ?? line.firstActionId,
        rootPlanInstanceId: line.rootPlanInstanceId,
        ...(moduleId ? { moduleId } : {}),
        ...(line.scalarValue !== undefined
          ? { scalarValue: line.scalarValue }
          : {}),
        stepCount: line.stepCount,
        ...(line.violatedObligationCount !== undefined
          ? { violatedObligationCount: line.violatedObligationCount }
          : {}),
        stopReason: line.stopReason,
        ...(head ? { head } : {}),
        ...(plan ? { plan } : {}),
        ...(agendaLine ? { agendaLine } : {}),
        ...(defenseLine ? { defenseLine } : {}),
        steps: line.steps ? [...line.steps] : [],
        evaluationValues: { ...(line.evaluationValues ?? {}) },
        evidenceCodes: [...(line.evidenceCodes ?? [])],
        selectedPhases: selected ? planning.selectedLine.phases : [],
      };
    })
    .sort(
      (left, right) =>
        Number(right.selected) - Number(left.selected) ||
        (right.scalarValue ?? Number.NEGATIVE_INFINITY) -
          (left.scalarValue ?? Number.NEGATIVE_INFINITY) ||
        left.lineId.localeCompare(right.lineId),
    );

  return {
    turnKey: planning.turnKey,
    selectedLineId,
    selectionReason:
      planning.agendaComparison?.selectionReason ??
      decision.priority?.reasonCode ??
      "Zuglinienwert und erfüllte Planpflichten",
    cards,
  };
}
