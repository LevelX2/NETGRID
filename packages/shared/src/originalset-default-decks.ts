import type { DeckDefinition } from "./index";

export const ORIGINALSET_DEFAULT_DECKS: Readonly<{
  runner: DeckDefinition;
  corp: DeckDefinition;
}> = {
  runner: {
    id: "onr_origin_runner_ai_v1",
    name: "Runner Origins AI – Probe Pressure",
    side: "runner",
    identity: 587,
    cards: [
      { id: 226, quantity: 1 },
      { id: 227, quantity: 1 },
      { id: 233, quantity: 2 },
      { id: 251, quantity: 2 },
      { id: 278, quantity: 2 },
      { id: 286, quantity: 2 },
      { id: 293, quantity: 2 },
      { id: 297, quantity: 2 },
      { id: 307, quantity: 2 },
      { id: 313, quantity: 2 },
      { id: 341, quantity: 1 },
      { id: 357, quantity: 1 },
    ],
  },
  corp: {
    id: "onr_origin_corp_ai_v1",
    name: "Korp Origins AI – Tax & Punish",
    side: "corp",
    identity: 3,
    cards: [
      { id: 415, quantity: 3 },
      { id: 426, quantity: 1 },
      { id: 432, quantity: 1 },
      { id: 444, quantity: 2 },
      { id: 449, quantity: 2 },
      { id: 473, quantity: 2 },
      { id: 491, quantity: 2 },
      { id: 494, quantity: 2 },
      { id: 497, quantity: 1 },
      { id: 507, quantity: 2 },
      { id: 509, quantity: 2 },
      { id: 513, quantity: 1 },
      { id: 529, quantity: 1 },
      { id: 562, quantity: 1 },
    ],
  },
};
