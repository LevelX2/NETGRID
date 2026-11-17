import type { Side } from "@netgrid/shared";

export type DecisionWindowKind =
  | "automatic_resolution"
  | "mandatory_choice"
  | "optional_ability"
  | "main_action"
  | "run"
  | "access"
  | "trace"
  | "pass_decline";

export type PlanExecutionOrigin = {
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  commitmentId?: string;
  side: Side;
  windowKind: DecisionWindowKind;
  windowId: string;
  stateVersion: number;
  timingPoint: string;
};
