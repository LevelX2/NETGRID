import type { RunnerTacticalGoal } from "../runner-tactical-goals";

export type TacticalGoalLike =
  | RunnerTacticalGoal
  | {
      goalId: string;
      family: string;
      priority: number;
      urgency?: string;
      targetServerId?: string;
      source?: string;
      evidence?: readonly string[];
    };
