export type StrategicIntentFamily =
  | "neutral"
  | "runner_setup"
  | "runner_central_pressure"
  | "runner_remote_contest"
  | "runner_remote_trash"
  | "runner_survival"
  | "runner_tempo"
  | "corp_scoreline"
  | "corp_fast_advance"
  | "corp_ice_tax"
  | "corp_central_defense"
  | "corp_asset_economy"
  | "corp_tag_trace_punish"
  | "corp_damage_kill"
  | "corp_ambush"
  | "corp_economy_reserve"
  | "corp_action_tempo"
  | "corp_overadvance"
  | "corp_draw_engine"
  | "corp_recycle_engine"
  | "unknown";

export const STRATEGY_RUNTIME_FAMILY_BY_ID = {
  "runner.rig_first": "runner_setup",
  "runner.economy_first": "runner_setup",
  "runner.search.breaker": "runner_setup",
  "runner.rnd_pressure": "runner_central_pressure",
  "runner.hq_pressure": "runner_central_pressure",
  "runner.interface_closeout": "runner_central_pressure",
  "runner.remote_contest": "runner_remote_contest",
  "runner.remote_trash": "runner_remote_trash",
  "runner.survival_defense": "runner_survival",
  "runner.run_event_tempo": "runner_tempo",
  "corp.remote_scoring": "corp_scoreline",
  "corp.rush_score": "corp_scoreline",
  "corp.fast_advance": "corp_fast_advance",
  "corp.ice_tax_glacier": "corp_ice_tax",
  "corp.central_stabilize": "corp_central_defense",
  "corp.asset_economy": "corp_asset_economy",
  "corp.tag_trace_punish": "corp_tag_trace_punish",
  "corp.damage_kill": "corp_damage_kill",
  "corp.ambush_bluff": "corp_ambush",
  "corp.economy_rez_reserve": "corp_economy_reserve",
  "corp.action_tempo": "corp_action_tempo",
  "corp.overadvance_value": "corp_overadvance",
  "corp.draw_engine": "corp_draw_engine",
  "corp.deck_recycle_engine": "corp_recycle_engine",
} as const satisfies Record<string, StrategicIntentFamily>;

export type RuntimeStrategyId = keyof typeof STRATEGY_RUNTIME_FAMILY_BY_ID;

export function strategicFamilyForStrategyId(
  strategyId: string,
): StrategicIntentFamily {
  return (
    STRATEGY_RUNTIME_FAMILY_BY_ID[strategyId as RuntimeStrategyId] ?? "unknown"
  );
}
