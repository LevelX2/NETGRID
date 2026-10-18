import { setImmediate } from "node:timers/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "@netgrid/ai";
import { hashState, replayEvents } from "@netgrid/engine";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";
import { createNetgridHttpServer } from "./http-server";
import { loadDeploymentConfig } from "./internet-hardening";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";

describe("cooperative AI batches", () => {
  it("preserves action projections and replay as real SQLite history grows", async () => {
    const directory = await mkdtemp(
      join(tmpdir(), "netgrid-ai-history-volume-"),
    );
    const storage = new SqliteMatchStorage({
      dbPath: join(directory, "test.sqlite"),
      backupDir: join(directory, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "isolated-history-volume",
      now: () => "2026-10-18T10:00:00.000Z",
    });
    try {
      const game = await service.createMatch({
        hostSide: "runner",
        mode: "ai_vs_ai",
        seed: "fachreview-event-loop",
        aiPacingMode: "manual",
      });
      const initial = await storage.load(game.matchId);
      if (!initial?.gameState) throw new Error("Missing initial history");
      const samples: Record<string, number>[] = [];
      for (let index = 0; index < 4; index++) {
        const start = performance.now();
        const actionRecord = await storage.loadForAction(game.matchId, {
          side: "runner",
        });
        const loadMs = performance.now() - start;
        if (!actionRecord?.gameState)
          throw new Error("Missing action projection");
        expect(actionRecord.stateSnapshots).toEqual([]);
        const full = await storage.load(game.matchId, {
          includeStateSnapshots: false,
        });
        expect(actionRecord.gameState.eventLog).toEqual(
          full?.gameState.eventLog,
        );
        samples.push({
          actions: actionRecord.gameState.stateVersion,
          loadMs: Math.round(loadMs * 100) / 100,
          engineEvents: actionRecord.gameState.eventLog.length,
          engineHistoryBytes: Buffer.byteLength(
            JSON.stringify(actionRecord.gameState.eventLog),
          ),
          publicContextAndTailBytes: Buffer.byteLength(
            JSON.stringify(actionRecord.eventLog),
          ),
          currentStateWithoutHistoryBytes: Buffer.byteLength(
            JSON.stringify({ ...actionRecord.gameState, eventLog: [] }),
          ),
        });
        if (index === 3 || actionRecord.match.status !== "active") break;
        const advanced = await service.advanceAi({
          matchId: game.matchId,
          side: "runner",
          sessionToken: game.hostSessionToken,
          mode: "batch",
        });
        if (!advanced.ok) throw new Error(advanced.error.code);
      }
      const final = await storage.load(game.matchId, {
        includeStateSnapshots: false,
      });
      if (!final?.gameState) throw new Error("Missing final history");
      const replay = replayEvents(initial.gameState, final.gameState.eventLog);
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(final.gameState));
      process.stdout.write(
        "[ai-action-load-volume] " + JSON.stringify(samples) + "\n",
      );
    } finally {
      service.closeStorage();
      await rm(directory, { recursive: true, force: true });
    }
  }, 60_000);
  it("serves HTTP and another match between AI steps while keeping the same match locked", async () => {
    let batchMatchId = "";
    let decisions = 0;
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "isolated-cooperative-ai",
      now: () => "2026-10-18T10:00:00.000Z",
      chooseAiAction: (...args) => {
        if (args[0].decisionId.startsWith(batchMatchId + ":")) decisions++;
        return chooseAiAction(...args);
      },
    });
    const ai = await service.createMatch({
      hostSide: "runner",
      mode: "ai_vs_ai",
      seed: "fachreview-event-loop",
      aiPacingMode: "manual",
    });
    batchMatchId = ai.matchId;
    const initial = await storage.load(ai.matchId);
    if (!initial?.gameState) throw new Error("Missing AI state");
    const human = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "cooperative-independent-human",
      aiPacingMode: "manual",
    });
    const humanPayload = await service.bootstrap(
      human.matchId,
      "runner",
      human.hostSessionToken,
    );
    if (
      "error" in humanPayload ||
      !humanPayload.pendingChoice ||
      !humanPayload.legalActions[0]
    )
      throw new Error("Missing human choice");
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv),
      maintenanceAuth: new MaintenanceAuthService(
        new InMemoryMaintenanceCredentialStore(),
      ),
    });
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing address");
    const healthUrl = `http://127.0.0.1:${address.port}/health`;
    let batchSettled = false;
    try {
      await (await fetch(healthUrl)).json();
      const batchStarted = performance.now();
      const batch = service
        .advanceAi({
          matchId: ai.matchId,
          side: "runner",
          sessionToken: ai.hostSessionToken,
          mode: "batch",
        })
        .finally(() => {
          batchSettled = true;
        });
      const sameMatch = service.advanceAi({
        matchId: ai.matchId,
        side: "runner",
        sessionToken: ai.hostSessionToken,
        knownStateVersion: initial.gameState.stateVersion,
        mode: "single_step",
      });
      const independent = (async () => {
        await setImmediate();
        const decisionsAtStart = decisions;
        const result = await service.submitAction({
          matchId: human.matchId,
          side: "runner",
          sessionToken: human.hostSessionToken,
          actionId: humanPayload.legalActions[0]!.actionId,
          clientKnownStateVersion: humanPayload.playerView.stateVersion,
          idempotencyKey: "human-during-ai",
          selectedChoices: {
            choiceId: humanPayload.pendingChoice!.choiceId,
            selectedOptionIds: ["keep"],
          },
        });
        return {
          result,
          decisionsAtStart,
          completedBeforeBatch: !batchSettled,
        };
      })();
      const healthSamples: number[] = [];
      let healthCompletedBeforeBatch = false;
      for (let index = 0; index < 5; index++) {
        const started = performance.now();
        const response = await fetch(healthUrl);
        expect(response.ok).toBe(true);
        await response.json();
        healthSamples.push(performance.now() - started);
        healthCompletedBeforeBatch ||= !batchSettled;
      }
      const [result, humanResult, queued] = await Promise.all([
        batch,
        independent,
        sameMatch,
      ]);
      expect(result.ok).toBe(true);
      expect(humanResult.result.ok).toBe(true);
      expect(humanResult.decisionsAtStart).toBeGreaterThan(0);
      expect(humanResult.decisionsAtStart).toBeLessThan(40);
      expect(humanResult.completedBeforeBatch).toBe(true);
      expect(healthCompletedBeforeBatch).toBe(true);
      expect(queued).toMatchObject({
        ok: false,
        error: { code: "stale_state" },
      });
      expect(decisions).toBe(40);
      const final = await storage.load(ai.matchId);
      if (!final?.gameState) throw new Error("Missing final state");
      const replay = replayEvents(initial.gameState, final.gameState.eventLog);
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(final.gameState));
      expect(final.gameState.stateVersion).toBe(
        initial.gameState.stateVersion + 40,
      );
      process.stdout.write(
        "[ai-batch-responsiveness] " +
          JSON.stringify({
            decisions,
            batchDurationMs: Math.round(performance.now() - batchStarted),
            humanDecisionIndex: humanResult.decisionsAtStart,
            healthSamplesMs: healthSamples.map((value) => Math.round(value)),
            healthP95Ms: Math.round(
              [...healthSamples].sort((a, b) => a - b)[
                Math.ceil(healthSamples.length * 0.95) - 1
              ]!,
            ),
          }) +
          "\n",
      );
    } finally {
      await handle.close();
    }
  }, 30_000);
});
