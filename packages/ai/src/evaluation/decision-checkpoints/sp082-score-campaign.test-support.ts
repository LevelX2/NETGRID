import { createGameAfterSetup, hashGameState } from "@netgrid/engine";
import { apply } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { metaTenStandardDecks } from "../meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointV1,
} from "./checkpoint-types";
import { AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION } from "./runtime-checkpoint";

const MARKED_ACCOUNTS = 63;
const CREDIT_BLOCKS = 75;
const DOG_PILE = 79;
const HUNTING_PACK = 84;
const MOBILE_BARRICADE = 91;
const RIDDLER = 92;
const STEREOGRAM_ANTIBODY = 133;

/** A paid fort with no public breaker leaves the four-credit score floor
 * as the only missing prerequisite. */
export function sp082KnownProtectionFundingCompanion(): AiDecisionCheckpointV1 {
  const deck = metaTenStandardDecks.decks.find(
    (entry) =>
      entry.standardDeckId ===
      "standard_proteus_corp_hidden_node_control_2026_05_25",
  );
  if (!deck) throw new Error("Missing SP-082 test deck");
  const state = apply(
    createGameAfterSetup({
      seed: "sp082-known-score-protection",
      corpDeck: {
        id: deck.standardDeckId,
        name: deck.name,
        side: deck.side,
        identity: deck.identityCardId,
        cards: deck.cards.map(({ cardId, quantity }) => ({
          id: cardId,
          quantity,
        })),
      },
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.turnSerial = 0;
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(0)
    .withRunnerCredits(13)
    .withRunnerGripSize(2)
    .withCorpIceOnServer("hq", CREDIT_BLOCKS)
    .withCorpIceOnServer("rd", DOG_PILE)
    .withCorpIceOnServer("rd", RIDDLER)
    .withRezzedCorpIceOnServer("remote_1", MOBILE_BARRICADE);

  for (const definitionId of [
    HUNTING_PACK,
    HUNTING_PACK,
    STEREOGRAM_ANTIBODY,
    MARKED_ACCOUNTS,
  ]) {
    const index = state.corp.rd.findIndex(
      (id) => state.cardInstances[id]?.definitionId === definitionId,
    );
    if (index === -1) throw new Error("Missing SP-082 card " + definitionId);
    const [instanceId] = state.corp.rd.splice(index, 1);
    state.corp.hq.push(instanceId!);
    state.cardInstances[instanceId!]!.zone = { side: "corp", zone: "hq" };
  }
  return {
    schemaVersion: AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
    checkpointId: "sp082-current-known-protection-funding",
    source: {
      kind: "synthetic_companion",
      findingId: "SP-082",
      capturedAt: "2026-11-17T00:00:00.000Z",
      matchId: state.matchId,
      decisionScopeId: "sp082-current-known-protection",
      stateVersion: state.stateVersion,
    },
    compatibility: {
      engineSchemaVersion: state.baseline.engineSchemaVersion,
      aiRuntimeCheckpointVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    },
    actor: "corp",
    difficulty: "hard",
    profileId: "corp-ai-v0.9-hard",
    deckSnapshot: {
      deckSnapshotId: deck.standardDeckId + ":known-protection-funding",
      side: "corp",
      cards: deck.cards,
    },
    engine: {
      stateVersion: state.stateVersion,
      stateHash: hashGameState(state),
      testOnlyGameState: state,
      eventPrefix: [],
    },
    runtime: { schemaVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION },
    expectation: { acceptableActions: [{ type: "gain_credit" }] },
  };
}
