import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRuntimeCardsById } from "../packages/catalog/src/index";
import {
  buildEngineDeck,
  createDeckSnapshot,
  type DeckFormatProfile,
  type EditableDeck,
} from "../packages/decks/src/index";
import { simulateAiGame } from "../packages/ai/src/simulation";
import { exportAiRuntimeCheckpoint } from "../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint";

// Local experiment only. No result or opponent-private state feeds the chooser.
const root = resolve(import.meta.dirname, "..");
const value = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(name);
  const result = i < 0 ? fallback : process.argv[i + 1];
  if (!result) throw new Error(`missing_argument:${name}`);
  return result;
};
const config = JSON.parse(readFileSync(resolve(value("--config")), "utf8")) as {
  label: string;
  games: { runnerId: string; seed: string }[];
  changes?: { cardId: string; delta: number }[];
  captureActionIndices?: number[];
};
const out = resolve(value("--out"));
mkdirSync(out, { recursive: true });
const catalog = JSON.parse(
  readFileSync(
    resolve(root, "data/decks/standard-deck-catalog-1.0.0.json"),
    "utf8",
  ),
);
const profiles: DeckFormatProfile[] = ["0.8", "1.3.0"].flatMap(
  (version) =>
    JSON.parse(
      readFileSync(
        resolve(root, `data/decks/deck-format-profiles-${version}.json`),
        "utf8",
      ),
    ).profiles,
);
const cardsById = createRuntimeCardsById();
function snapshot(
  id: string,
  changes: { cardId: string; delta: number }[] = [],
) {
  const original = catalog.decks.find(
    (deck: { standardDeckId: string }) => deck.standardDeckId === id,
  );
  if (!original) throw new Error(`deck_not_found:${id}`);
  const deck = structuredClone(original);
  for (const change of changes) {
    const card = deck.cards.find(
      (entry: { cardId: string }) => entry.cardId === change.cardId,
    );
    if (card) card.quantity += change.delta;
    else deck.cards.push({ cardId: change.cardId, quantity: change.delta });
  }
  if (deck.cards.some((card: { quantity: number }) => card.quantity < 0))
    throw new Error("negative_card_quantity");
  deck.cards = deck.cards.filter(
    (card: { quantity: number }) => card.quantity > 0,
  );
  const profile = profiles.find(
    (candidate) =>
      candidate.profileId === deck.formatProfileId &&
      candidate.version === deck.formatProfileVersion,
  );
  if (!profile) throw new Error(`profile_not_found:${id}`);
  const editable: EditableDeck = {
    deckId: id,
    deckVersion: "1",
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    cards: deck.cards,
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  };
  return createDeckSnapshot(
    editable,
    { cardsById, profile },
    {
      snapshotId: `standard_${id}_${deck.version}`,
      rulesBaselineId: profile.rulesBaselineIds[0],
    },
  );
}
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const corp = snapshot(
  "standard_proteus_corp_hidden_node_control_2026_05_25",
  config.changes,
);
const manifest = {
  schemaVersion: "hidden-node-evaluation-v1",
  sourceCommit,
  config,
  corpSnapshot: corp,
};
const manifestPath = resolve(out, "manifest.json");
if (existsSync(manifestPath)) {
  const previous = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (JSON.stringify(previous) !== JSON.stringify(manifest))
    throw new Error("evaluation_manifest_changed");
} else writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
for (const [index, game] of config.games.entries()) {
  const path = resolve(out, `${String(index + 1).padStart(3, "0")}.json`);
  if (existsSync(path)) continue;
  const runner = snapshot(game.runnerId);
  const captures: unknown[] = [];
  const summary = simulateAiGame({
    seed: game.seed,
    maxActions: 1000,
    runnerDeck: buildEngineDeck(runner),
    corpDeck: buildEngineDeck(corp),
    runnerDeckMetadata: runner.publicMetadata,
    corpDeckMetadata: corp.publicMetadata,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    ...(config.captureActionIndices
      ? {
          testOnlyDecisionCheckpointCapture: {
            actionIndices: config.captureActionIndices,
            capture: (capture) =>
              captures.push({
                actionIndex: capture.actionIndex,
                input: capture.input,
                runtime: exportAiRuntimeCheckpoint(
                  capture.input,
                  capture.deckSnapshot.deckSnapshotId,
                ),
                deckSnapshot: capture.deckSnapshot,
                stateHash: capture.input.stateHash,
              }),
          },
        }
      : {}),
  });
  const sequence = summary.actionSequence;
  const byAction: Record<string, number> = {};
  const byOwner: Record<string, number> = {};
  for (const entry of sequence.filter((entry) => entry.side === "corp")) {
    byAction[entry.actionType] = (byAction[entry.actionType] ?? 0) + 1;
    byOwner[entry.planKind ?? "none"] =
      (byOwner[entry.planKind ?? "none"] ?? 0) + 1;
  }
  const first = (type: string, owner?: string) =>
    sequence.find(
      (entry) =>
        entry.side === "corp" &&
        entry.actionType === type &&
        (!owner || entry.planKind === owner),
    )?.turnNumber ?? null;
  const result = {
    sourceCommit,
    label: config.label,
    ...game,
    runnerSnapshot: runner.publicMetadata,
    corpSnapshot: corp.publicMetadata,
    terminationKind: summary.terminationKind,
    winner: summary.winner,
    reason: summary.gameEndReason,
    actions: summary.actions,
    turns: summary.turns,
    points: summary.finalAgendaPoints,
    hash: summary.finalStateHash,
    replayOk: summary.replayOk,
    replayErrors: summary.replayErrors,
    errors: summary.errors,
    runtimeFailures: summary.runtimeFailures,
    fallbacks: sequence.filter((entry) => entry.fallbackUsed).length,
    timeouts: sequence.filter((entry) => entry.timeoutUsed).length,
    byAction,
    byOwner,
    firstScoreTurn: first("score_agenda"),
    firstAgendaInstallTurn: first("install_card", "corp.score_agenda"),
    firstEconomyInstallTurn: first("install_card", "corp.economy"),
    // These are observed actions; they do not claim realized bluff value.
    milestones: sequence
      .filter(
        (entry) =>
          entry.side === "corp" &&
          [
            "corp.economy",
            "corp.ambush_and_bluff",
            "corp.execute_punish_sequence",
            "corp.score_agenda",
          ].includes(entry.planKind ?? ""),
      )
      .map((entry) => ({
        stateVersion: entry.stateVersionBefore,
        turn: entry.turnNumber,
        action: entry.actionType,
        owner: entry.planKind,
        evidence: entry.debugFacts?.filter(
          (fact) =>
            fact.startsWith("plan_execution:") ||
            fact.startsWith("plan_first_root:") ||
            fact.startsWith("plan_assessment_evidence:"),
        ),
      })),
  };
  writeFileSync(path, JSON.stringify(result, null, 2));
  if (config.captureActionIndices) {
    writeFileSync(
      resolve(out, `${String(index + 1).padStart(3, "0")}.captures.json`),
      JSON.stringify(captures, null, 2),
    );
  }
  process.stdout.write(
    JSON.stringify({
      game: index + 1,
      total: config.games.length,
      seed: game.seed,
      winner: result.winner,
      points: result.points,
      actions: result.actions,
      replay: result.replayOk,
      errors: result.errors,
    }) + "\n",
  );
  if (
    summary.terminationKind !== "game_result" ||
    !summary.replayOk ||
    summary.errors.length ||
    result.fallbacks ||
    result.timeouts
  ) {
    throw new Error(`nonclean_game:${game.seed}`);
  }
}
