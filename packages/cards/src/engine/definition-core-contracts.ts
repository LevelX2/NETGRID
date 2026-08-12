/**
 * Defines shared leaf contracts used across CardSpec ability families.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  CounterType,
  PurgeableRunnerVirusCounterType,
  EventVisibilityClass,
  ServerId,
} from "@netgrid/shared";

export type CardAccessZone = "installed" | "hq" | "rd" | "archives";

export type OnPlayCardAbilityCostImplementation =
  | "printed"
  | {
      kind: "printed";
      additionalClicks: 1;
    };

export type CardConditionImplementation =
  | { kind: "runner_is_tagged" }
  | { kind: "runner_tags_at_least"; amount: number }
  | { kind: "source_has_hosted_credits" }
  | { kind: "source_has_advancement_counters"; minimum: number }
  | { kind: "runner_attempted_run_last_turn"; minimumRuns: number }
  | { kind: "runner_attempted_run_this_game"; minimumRuns: number }
  | { kind: "runner_trashed_node_last_turn" }
  | { kind: "runner_trashed_advertisement_this_turn" }
  | { kind: "runner_trashed_transactions_this_turn" }
  | { kind: "runner_installed_resource_last_turn" }
  | { kind: "runner_damaged_during_last_three_actions" }
  | {
      kind: "runner_liberated_agenda_subtype_this_turn";
      subtype: "research" | "gray_ops" | "black_ops";
    }
  | {
      kind: "corp_scored_agenda_subtype_last_turn";
      subtype: "black_ops";
    }
  | {
      kind: "runner_made_successful_run_on_server_this_turn";
      server: Extract<ServerId, "hq" | "rd"> | "any_data_fort";
    }
  | { kind: "runner_made_successful_hq_and_rd_runs_this_turn" }
  | { kind: "corp_rezzed_black_ice_this_turn" }
  | { kind: "current_encounter_ice" }
  | {
      kind: "current_encounter_ice_subtype";
      subtype: "ap";
    }
  | {
      kind: "current_run_server";
      server: Extract<ServerId, "hq" | "rd">;
    };

export type CardAbilityLimitImplementation =
  | {
      kind: "once_per_turn_per_source";
      scope: "any_ability_on_source";
    }
  | {
      kind: "one_base_link_card_per_trace_attempt";
      scope: "trace_attempt";
    }
  | {
      kind: "once_per_trace_per_source";
      scope: "source";
    }
  | {
      kind: "once_per_run_per_source";
      scope: "source";
    };

export type CardAbilityCostImplementation =
  | {
      kind: "action";
      amount: number;
    }
  | {
      kind: "credit";
      amount: number;
    }
  | {
      kind: "advancement_counter";
      amount: number;
      source: "source";
    }
  | {
      kind: "source_counter";
      counterType: Extract<CounterType, "boon" | "remap">;
      amount: number;
      source: "source";
    }
  | {
      kind: "trash_source";
      amount: 1;
    }
  | {
      kind: "tap_source";
      amount: 1;
    }
  | {
      kind: "corp_random_discard_hq";
      amount: number;
    }
  | {
      kind: "trash_corp_rd_top";
      amount: 2;
    }
  | {
      kind: "corp_purgeable_runner_virus_counter";
      counterType: Extract<
        PurgeableRunnerVirusCounterType,
        "socket_archives" | "socket_hq" | "socket_rd"
      >;
      server: "archives" | "hq" | "rd";
      amount: 1;
    };

export type CardSubroutineImplementation =
  | {
      kind: "end_the_run";
      text: "*End the run.";
      visibility: EventVisibilityClass;
    }
  | {
      kind: "end_the_run_unless_runner_pays";
      amount: number;
      text: `*End the run unless Runner pays [${number}].`;
      visibility: EventVisibilityClass;
    };
