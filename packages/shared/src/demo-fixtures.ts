export const CORE_DEMO_DECK_IDS = [
  "demo_runner_001",
  "demo_corp_001",
  "demo_runner_004",
  "demo_corp_004",
  "demo_runner_008",
  "demo_corp_008",
] as const;

export const DEMO_DECK_IDS = CORE_DEMO_DECK_IDS;

export type DemoDeckId = (typeof DEMO_DECK_IDS)[number];
