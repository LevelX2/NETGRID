import type { DeckDefinition } from "./index";

export const ORIGINALSET_DEFAULT_DECKS: Readonly<{
  runner: DeckDefinition;
  corp: DeckDefinition;
}> = {
  runner: {
    id: "onr_origin_runner_ai_v1",
    name: "Runner Origins AI – Probe Pressure",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "onr_v1_014_codecracker", quantity: 1 },
      { id: "onr_v1_015_codeslinger", quantity: 1 },
      { id: "onr_v1_021_dwarf", quantity: 2 },
      { id: "onr_v1_039_krash", quantity: 2 },
      { id: "onr_v1_066_snowball", quantity: 2 },
      { id: "onr_v1_074_worm", quantity: 2 },
      { id: "onr_v1_081_custodial-position", quantity: 2 },
      { id: "onr_v1_085_executive-wiretaps", quantity: 2 },
      { id: "onr_v1_095_jack-n-joe", quantity: 2 },
      { id: "onr_v1_101_mit-west-tier", quantity: 2 },
      { id: "onr_v1_129_hq-interface", quantity: 1 },
      { id: "onr_v1_145_wutech-mem-chip", quantity: 1 },
    ],
  },
  corp: {
    id: "onr_origin_corp_ai_v1",
    name: "Korp Origins AI – Tax & Punish",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "onr_v1_203_hostile-takeover", quantity: 3 },
      { id: "onr_v1_214_project-babylon", quantity: 1 },
      { id: "onr_v1_220_tycho-extension", quantity: 1 },
      { id: "onr_v1_232_crystal-wall", quantity: 2 },
      { id: "onr_v1_237_data-wall", quantity: 2 },
      { id: "onr_v1_261_quandary", quantity: 2 },
      { id: "onr_v1_279_wall-of-static", quantity: 2 },
      { id: "onr_v1_282_annual-reviews", quantity: 2 },
      { id: "onr_v1_285_closed-accounts", quantity: 1 },
      { id: "onr_v1_295_night-shift", quantity: 2 },
      { id: "onr_v1_297_overtime-incentives", quantity: 2 },
      { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
      { id: "onr_v1_317_data-masons", quantity: 1 },
      { id: "onr_v1_350_antiquated-interface-routines", quantity: 1 },
    ],
  },
};
