export type CorpPunishKind =
  | "scorched_earth_like"
  | "urban_renewal_like"
  | "punitive_counterstrike_like"
  | "closed_accounts_like"
  | "power_grid_overload_like"
  | "datapool_like"
  | "resource_trash_like"
  | "scored_agenda_damage_like"
  | "scored_agenda_trace_tag_like"
  | "unknown";

export type CorpTagPunishSkipReason =
  | "economy"
  | "protection"
  | "score"
  | "advance"
  | "remote_safety"
  | "remote_protection"
  | "central_protection"
  | "draw"
  | "install"
  | "end_turn"
  | "unknown_higher_priority"
  | "unknown";

export type CorpVisibleTagPayoffCategory =
  | "damage"
  | "economic"
  | "trash"
  | "run_lock"
  | "ambush"
  | "unknown";

export type CorpTagPunishUnknownChosenFamily =
  | "score"
  | "advance"
  | "install_agenda"
  | "install_ice"
  | "install_asset_or_upgrade"
  | "rez"
  | "operation"
  | "ability"
  | "trace_tag_source"
  | "draw"
  | "basic_credit"
  | "end_turn"
  | "unknown";

export type CorpTagPunishUnknownSkipPlausibility =
  | "plausible"
  | "suspicious"
  | "unclassified";

export type CorpTagPunishUnknownSkipAttribution =
  | "unknown_skip_plausible_score_window"
  | "unknown_skip_plausible_advance_to_score"
  | "unknown_skip_plausible_remote_safety"
  | "unknown_skip_plausible_hq_or_rnd_safety"
  | "unknown_skip_plausible_payoff_unaffordable"
  | "unknown_skip_plausible_payoff_low_impact"
  | "unknown_skip_plausible_survival_countercontext"
  | "unknown_skip_suspicious_economy_or_setup"
  | "unknown_skip_suspicious_low_value_install"
  | "unknown_skip_suspicious_basic_credit"
  | "unknown_skip_suspicious_end_turn"
  | "unknown_skip_unclassified_missing_evidence";
