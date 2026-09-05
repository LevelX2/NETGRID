import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { AI_HINTS_BY_CARD } from "../packages/ai/src/ai-hints";
import { buildActionSemanticCandidates } from "../packages/ai/src/action-semantic-candidate";
import { buildCorpStrategicIntentProfile } from "../packages/ai/src/corp-strategic-intent";
import { buildCorpAmbushPlanSignals } from "../packages/ai/src/runtime/corp-ambush-plan-signals";

const source = resolve(
  process.argv[2] ?? "tmp/hidden-node/audit-baseline-034.json",
);
const audit = JSON.parse(readFileSync(source, "utf8"));
const rows = audit.decisions
  .filter(
    (decision) =>
      decision.side === "corp" &&
      decision.input.playerView.timingPoint === "corp_action.main",
  )
  .map((decision) => {
    const input = structuredClone(decision.input);
    input.ownCorpStrategicIntent = buildCorpStrategicIntentProfile({
      strategyProfile: input.ownDeckStrategyProfile,
      deckCapabilities: input.ownDeckCapabilities,
      strategicIntentState: input.ownStrategicIntentState,
    });
    const cards = [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice,
        ...server.root,
      ]),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        cards
          .filter((card) => card.known && card.definitionId)
          .map((card) => [card.instanceId, card.definitionId]),
      ),
    });
    // Fresh discovery only, not a replacement chooser or a reconstructed continuation.
    const signals = buildCorpAmbushPlanSignals({
      input,
      candidates,
      previous: undefined,
    });
    const relevant = input.playerView.own.gripOrHq.filter((card) =>
      card.subtypes?.includes("ambush"),
    );
    return {
      stateVersion: input.playerView.stateVersion,
      intent: input.ownCorpStrategicIntent,
      selectedOwner: decision.trace.planKind,
      freshSignals: signals.map((signal) => ({
        source: signal.sourceDefinitionId,
        phase: signal.phase,
        actions: signal.actionIds,
        evidence: signal.evidenceCode,
      })),
      handAmbushes: relevant.map((card) => ({
        id: card.definitionId,
        hint: AI_HINTS_BY_CARD.get(card.definitionId),
      })),
    };
  });
writeFileSync(
  resolve(source, "../ambush-discovery.json"),
  JSON.stringify(rows, null, 2),
);
process.stdout.write(
  JSON.stringify(
    {
      mainDecisions: rows.length,
      withAmbushHand: rows.filter((row) => row.handAmbushes.length).length,
      withFreshSignal: rows.filter((row) => row.freshSignals.length).length,
      admittedSources: [
        ...new Set(
          rows.flatMap((row) =>
            row.freshSignals.map((signal) => signal.source),
          ),
        ),
      ],
      examples: rows
        .filter((row) => row.freshSignals.length)
        .slice(0, 3)
        .map(({ stateVersion, freshSignals, selectedOwner }) => ({
          stateVersion,
          freshSignals,
          selectedOwner,
        })),
    },
    null,
    2,
  ) + "\n",
);
