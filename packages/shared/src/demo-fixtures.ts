export const CORE_DEMO_DECK_IDS = [
  "demo_runner_001",
  "demo_corp_001",
  "demo_runner_004",
  "demo_corp_004",
  "demo_runner_008",
  "demo_corp_008",
] as const;

export const LEGACY_FIXTURE_DECK_IDS = [
  "demo_runner_096",
  "demo_corp_096",
  "demo_runner_097",
  "demo_corp_097",
  "demo_runner_098",
  "demo_corp_098",
  "demo_runner_099",
  "demo_corp_099",
] as const;

export const DEMO_DECK_IDS = [
  ...CORE_DEMO_DECK_IDS,
  ...LEGACY_FIXTURE_DECK_IDS,
] as const;

export type DemoDeckId = (typeof DEMO_DECK_IDS)[number];
