export type RunnerPlanKind =
  | "pressure_rnd"
  | "pressure_hq"
  | "contest_remote"
  | "build_rig"
  | "recover_economy"
  | "draw_for_answers"
  | "trash_asset"
  | "safe_probe_run";

export const RUNNER_PLAN_KINDS: readonly RunnerPlanKind[] = [
  "pressure_rnd",
  "pressure_hq",
  "contest_remote",
  "build_rig",
  "recover_economy",
  "draw_for_answers",
  "trash_asset",
  "safe_probe_run",
];

export function baseScoreForPlan(kind: RunnerPlanKind): number {
  switch (kind) {
    case "pressure_rnd":
      return 300;
    case "pressure_hq":
      return 270;
    case "contest_remote":
      return 295;
    case "build_rig":
      return 255;
    case "recover_economy":
      return 230;
    case "draw_for_answers":
      return 215;
    case "trash_asset":
      return 360;
    case "safe_probe_run":
      return 185;
  }
}

export function visibleBenefitsForPlan(kind: RunnerPlanKind): string[] {
  switch (kind) {
    case "pressure_rnd":
      return ["benefit:rd_pressure"];
    case "pressure_hq":
      return ["benefit:hq_pressure"];
    case "contest_remote":
      return ["benefit:remote_contest"];
    case "build_rig":
      return ["benefit:rig_setup"];
    case "recover_economy":
      return ["benefit:credit_reserve"];
    case "draw_for_answers":
      return ["benefit:more_options"];
    case "trash_asset":
      return ["benefit:remove_visible_threat"];
    case "safe_probe_run":
      return ["benefit:low_commitment_information"];
  }
}

export function visibleRisksForPlan(
  kind: RunnerPlanKind,
  roles: string[],
): string[] {
  const risks: string[] = [];
  if (isRunPlan(kind)) risks.push("risk:unknown_server_contents");
  if (kind === "build_rig" && roles.length === 0) risks.push("risk:no_ai_role");
  return risks;
}

export function uncertaintyForPlan(kind: RunnerPlanKind): string[] {
  return isRunPlan(kind)
    ? ["unknown_corp_cards_remain_unknown", "unrezzed_ice_identity_not_assumed"]
    : ["hidden_corp_information_not_used"];
}

export function isRunPlan(kind: RunnerPlanKind): boolean {
  return (
    kind === "pressure_rnd" ||
    kind === "pressure_hq" ||
    kind === "contest_remote" ||
    kind === "safe_probe_run"
  );
}
