export type AiMistakeClass =
  | "illegal_action"
  | "hidden_info_dependency"
  | "economy_starvation"
  | "unsafe_run"
  | "missed_safe_access"
  | "ignored_remote_threat"
  | "missed_score_window"
  | "bad_rez_spend"
  | "bad_install_redundancy"
  | "ignored_damage_risk"
  | "plan_step_mismatch"
  | "target_choice_unavailable";

export type AiMistakeObservation = {
  mistakeClass: AiMistakeClass;
  actionId?: string;
  evidence: string[];
};
