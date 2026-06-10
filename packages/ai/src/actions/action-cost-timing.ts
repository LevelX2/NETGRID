import type { LegalAction } from "@netgrid/shared";
import type {
  ActionCostProfile,
  ActionGateResult,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionTimingProfile,
} from "../action-semantic-candidate";

export function applyCostAndTimingProfiles(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const costProfile = costProfileForAction(action);
  const timingProfile = timingProfileForAction(action);
  const projectionIssues = reconcileCostTimingIssues(
    candidate.projectionIssues,
    costProfile,
    timingProfile,
  );

  return {
    ...candidate,
    costProfile,
    timingProfile,
    projectionIssues,
    hardGates: updateCostTimingGates(
      candidate.hardGates,
      costProfile,
      timingProfile,
    ),
    evidence: [...candidate.evidence, "AI040 cost/timing profile normalized"],
  };
}

function costProfileForAction(action: LegalAction): ActionCostProfile {
  const clickCost = sumCost(action, "clicks");
  const explicitCreditCost = sumCost(action, "credits");
  const payloadCreditCost =
    numberPayload(action, "accessTrashTotalCost") ??
    numberPayload(action, "stealCost") ??
    numberPayload(action, "paymentAmount") ??
    numberPayload(action, "rezCostPaid");
  const creditCost = explicitCreditCost ?? payloadCreditCost;
  const trashCost = numberPayload(action, "accessTrashTotalCost");
  const agendaPointCost =
    numberPayload(action, "agendaPointCost") ??
    numberPayload(action, "agendaPointCostPaid");
  const xValue = xValueForAction(action);
  const variableCost = variableCostForAction(action);
  const hasKnownCost =
    clickCost !== undefined ||
    creditCost !== undefined ||
    trashCost !== undefined ||
    agendaPointCost !== undefined ||
    xValue !== undefined ||
    variableCost !== undefined;

  return {
    ...(clickCost !== undefined ? { clickCost } : {}),
    ...(creditCost !== undefined ? { creditCost } : {}),
    ...(trashCost !== undefined ? { trashCost } : {}),
    ...(agendaPointCost !== undefined ? { agendaPointCost } : {}),
    ...(xValue !== undefined ? { xValue } : {}),
    paidBy: action.side,
    beneficiary: beneficiaryForAction(action),
    costKnownStatus: hasKnownCost
      ? "known"
      : action.costs.length === 0
        ? "not_applicable"
        : "unknown",
    ...(variableCost !== undefined ? { variableCost } : {}),
    additionalCosts: additionalCostFields(action),
  };
}

function sumCost(
  action: LegalAction,
  key: "clicks" | "credits",
): number | undefined {
  const values = action.costs
    .map((cost) => cost[key])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function stringPayload(
  action: LegalAction,
  key: string,
): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function xValueForAction(
  action: LegalAction,
): ActionCostProfile["xValue"] | undefined {
  const value = action.payload?.xValue;
  if (typeof value === "number") return value;
  if (value === "choice" || value === "unknown") return value;
  if (action.payload !== undefined && "xValue" in action.payload) return "unknown";
  return undefined;
}

function variableCostForAction(
  action: LegalAction,
): ActionCostProfile["variableCost"] | undefined {
  const variableRezKind = stringPayload(action, "variableRezKind");
  const variableRezValue = numberPayload(action, "variableRezValue");
  const variableRezAdditionalCost = numberPayload(
    action,
    "variableRezAdditionalCost",
  );
  if (
    variableRezKind === undefined &&
    variableRezValue === undefined &&
    variableRezAdditionalCost === undefined
  ) {
    return undefined;
  }
  return {
    kind: "rez_cost",
    ...(variableRezValue !== undefined ? { chosen: variableRezValue } : {}),
    ...(variableRezAdditionalCost !== undefined
      ? { min: variableRezAdditionalCost }
      : {}),
  };
}

function beneficiaryForAction(
  action: LegalAction,
): NonNullable<ActionCostProfile["beneficiary"]> {
  if (action.type === "gain_credit" || action.type === "draw_card") {
    return action.side;
  }
  if (action.type === "remove_tag") return "runner";
  return "unknown";
}

function additionalCostFields(action: LegalAction): string[] {
  const fields = [
    "accessTrashTotalCost",
    "stealCost",
    "paymentAmount",
    "rezCostPaid",
    "agendaPointCost",
    "agendaPointCostPaid",
    "variableRezKind",
    "variableRezAdditionalCost",
    "variableRezValue",
    "xValue",
  ];
  return fields.filter((field) => action.payload?.[field] !== undefined);
}

function numberPayload(
  action: LegalAction,
  key: string,
): number | undefined {
  const value = action.payload?.[key];
  if (typeof value !== "number") return undefined;
  return value;
}

function timingProfileForAction(action: LegalAction): ActionTimingProfile {
  const timingPoint = action.timingPoint;
  const turnSide = turnSideForTimingPoint(timingPoint);
  return {
    phase: phaseForTimingPoint(timingPoint),
    ...(turnSide !== undefined ? { turnSide } : {}),
    window: timingPoint,
    ...(timingPoint.startsWith("run.") ? { runPhase: timingPoint } : {}),
    ...(timingPoint === "run.encounter_ice"
      ? { encounterPhase: "encounter_ice" }
      : {}),
    ...(timingPoint.startsWith("access.") ? { accessPhase: true } : {}),
    ...(action.type === "score_agenda" ? { scoreWindow: true } : {}),
    ...(action.type === "rez_ice" || action.type === "decline_rez"
      ? { rezWindow: true }
      : {}),
    ...(action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
      ? { responseWindow: true }
      : {}),
  };
}

function phaseForTimingPoint(timingPoint: LegalAction["timingPoint"]): string {
  if (timingPoint.startsWith("corp_draw.")) return "corp_draw_phase";
  if (timingPoint.startsWith("corp_action.")) return "corp_action_phase";
  if (timingPoint.startsWith("corp_discard.")) return "corp_discard_phase";
  if (timingPoint.startsWith("runner_action.")) return "runner_action_phase";
  if (timingPoint.startsWith("runner_discard.")) return "runner_discard_phase";
  if (timingPoint.startsWith("run.")) return "run";
  if (timingPoint.startsWith("access.")) return "run";
  return "setup";
}

function turnSideForTimingPoint(
  timingPoint: LegalAction["timingPoint"],
): "runner" | "corp" | undefined {
  if (timingPoint.startsWith("corp_")) return "corp";
  if (timingPoint.startsWith("runner_")) return "runner";
  return undefined;
}

function reconcileCostTimingIssues(
  currentIssues: readonly ActionProjectionIssue[],
  costProfile: ActionCostProfile,
  timingProfile: ActionTimingProfile,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    issues.delete("cost_unknown");
  } else {
    issues.add("cost_unknown");
  }

  if (timingProfile.window !== undefined) {
    issues.delete("timing_unknown");
  } else {
    issues.add("timing_unknown");
  }
  return [...issues];
}

function updateCostTimingGates(
  hardGates: ActionGateResult[],
  costProfile: ActionCostProfile,
  timingProfile: ActionTimingProfile,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId === "cost_known") {
      const costKnown =
        costProfile.costKnownStatus === "known" ||
        costProfile.costKnownStatus === "not_applicable";
      return {
        ...gate,
        status: costKnown ? "pass" : "unknown",
        severity: costKnown ? "info" : "warning",
        reason: `Cost status is ${costProfile.costKnownStatus}.`,
      };
    }
    if (gate.gateId === "timing_known") {
      const timingKnown = timingProfile.window !== undefined;
      return {
        ...gate,
        status: timingKnown ? "pass" : "unknown",
        severity: timingKnown ? "info" : "warning",
        reason: timingKnown
          ? `Timing point ${timingProfile.window} normalized.`
          : "Timing point unavailable.",
      };
    }
    return gate;
  });
}
