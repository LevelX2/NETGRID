import type { Side } from "@netgrid/shared";

const CORP_DOCTRINE_PLAN_WEIGHTS: Record<string, Record<string, number>> = {
  rush: {
    score_now: 18,
    score_next_turn: 22,
    build_scoring_remote: 10,
    protect_hq: 4,
    protect_rnd: 4,
    recover_economy: 6,
    bait_runner: -4,
  },
  glacier: {
    score_now: 4,
    score_next_turn: 12,
    build_scoring_remote: 24,
    protect_hq: 10,
    protect_rnd: 10,
    recover_economy: 12,
    bait_runner: 2,
  },
  tag_pressure: {
    score_now: 6,
    score_next_turn: 8,
    build_scoring_remote: 8,
    protect_hq: 8,
    protect_rnd: 6,
    recover_economy: 8,
    bait_runner: 10,
  },
  asset_remote: {
    score_now: -2,
    score_next_turn: 2,
    build_scoring_remote: 10,
    protect_hq: 4,
    protect_rnd: 4,
    recover_economy: 10,
    bait_runner: 22,
  },
  operation_economy: {
    score_now: 2,
    score_next_turn: 4,
    build_scoring_remote: 4,
    protect_hq: 4,
    protect_rnd: 4,
    recover_economy: 22,
    bait_runner: 2,
  },
  central_defense: {
    score_now: 0,
    score_next_turn: 4,
    build_scoring_remote: 4,
    protect_hq: 18,
    protect_rnd: 18,
    recover_economy: 8,
    bait_runner: 0,
  },
};

const RUNNER_DOCTRINE_PLAN_WEIGHTS: Record<string, Record<string, number>> = {
  rig_builder: {
    pressure_rnd: -4,
    pressure_hq: -4,
    contest_remote: -2,
    build_rig: 24,
    recover_economy: 10,
    draw_for_answers: 14,
    trash_asset: 0,
    safe_probe_run: 8,
  },
  rnd_pressure: {
    pressure_rnd: 24,
    pressure_hq: 4,
    contest_remote: 4,
    build_rig: 6,
    recover_economy: 6,
    draw_for_answers: 8,
    trash_asset: 0,
    safe_probe_run: 8,
  },
  hq_pressure: {
    pressure_rnd: 4,
    pressure_hq: 24,
    contest_remote: 4,
    build_rig: 6,
    recover_economy: 6,
    draw_for_answers: 8,
    trash_asset: 0,
    safe_probe_run: 8,
  },
  remote_contest: {
    pressure_rnd: 4,
    pressure_hq: 4,
    contest_remote: 24,
    build_rig: 8,
    recover_economy: 10,
    draw_for_answers: 4,
    trash_asset: 8,
    safe_probe_run: 4,
  },
  tag_resilient: {
    pressure_rnd: 6,
    pressure_hq: 6,
    contest_remote: 8,
    build_rig: 8,
    recover_economy: 8,
    draw_for_answers: 6,
    trash_asset: 4,
    safe_probe_run: 4,
  },
  economy_dense: {
    pressure_rnd: 4,
    pressure_hq: 4,
    contest_remote: 6,
    build_rig: 8,
    recover_economy: 22,
    draw_for_answers: 10,
    trash_asset: 4,
    safe_probe_run: 4,
  },
};

const CORP_MULLIGAN_WEIGHTS: Record<string, number> = {
  iceStart: 25,
  economy: 20,
  agendaLoad: 20,
  remotePlan: 15,
  operationTempo: 10,
  doctrineFit: 10,
};

const RUNNER_MULLIGAN_WEIGHTS: Record<string, number> = {
  breakerAccess: 24,
  economy: 22,
  setup: 16,
  pressure: 12,
  handBalance: 14,
  doctrineFit: 12,
};

export function legacyDeckDoctrinePlanWeightsFor(
  side: Side,
  archetypeTags: readonly string[],
): Record<string, number> {
  const weights: Record<string, number> = {};
  const source =
    side === "corp" ? CORP_DOCTRINE_PLAN_WEIGHTS : RUNNER_DOCTRINE_PLAN_WEIGHTS;
  for (const tag of archetypeTags) {
    const contribution = source[tag];
    if (!contribution) continue;
    for (const [plan, value] of Object.entries(contribution)) {
      weights[plan] = (weights[plan] ?? 0) + value;
    }
  }
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [
      key,
      Math.round(value / Math.max(1, archetypeTags.length)),
    ]),
  );
}

export function legacyDeckDoctrineMulliganWeightsFor(
  side: Side,
): Record<string, number> {
  return side === "corp"
    ? { ...CORP_MULLIGAN_WEIGHTS }
    : { ...RUNNER_MULLIGAN_WEIGHTS };
}
