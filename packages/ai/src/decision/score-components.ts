export type ScoreComponent =
  | "goal_fit"
  | "cost_fit"
  | "timing_fit"
  | "risk_adjustment"
  | "plan_alignment"
  | "target_fit"
  | "opportunity"
  | "threat_response"
  | "fallback_safety";

export type ScoreComponentDelta = {
  component: ScoreComponent;
  delta: number;
  evidence: string[];
};
