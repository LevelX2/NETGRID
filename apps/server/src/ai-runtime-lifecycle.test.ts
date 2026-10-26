import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import {
  chooseAiAction,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "@netgrid/ai";
import {
  InMemoryMatchStorage,
  MultiplayerService,
  type MultiplayerStorage,
  type StoredMatch,
} from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

type DecisionInput = Parameters<typeof chooseAiAction>[0];
function fixture(storage: MultiplayerStorage = new InMemoryMatchStorage()) {
  const inputs = new Map<string, DecisionInput>();
  const service = new MultiplayerService(storage, {
    tokenSalt: "isolated-runtime-lifetime",
    now: () => "2020-01-01T00:00:00.000Z",
    chooseAiAction: (...args) => {
      inputs.set(args[0].decisionId.split(":")[0]!, args[0]);
      return chooseAiAction(...args);
    },
  });
  async function match() {
    const created = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "review-terminal-memory-main-phase",
      aiPacingMode: "manual",
    });
    const payload = await service.bootstrap(
      created.matchId,
      "runner",
      created.hostSessionToken,
    );
    if (
      "error" in payload ||
      !payload.pendingChoice ||
      !payload.legalActions[0]
    )
      throw new Error("Missing setup choice");
    const kept = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      actionId: payload.legalActions[0].actionId,
      clientKnownStateVersion: payload.playerView.stateVersion,
      idempotencyKey: "keep",
      selectedChoices: {
        choiceId: payload.pendingChoice.choiceId,
        selectedOptionIds: ["keep"],
      },
    });
    if (!kept.ok) throw new Error(kept.error.code);
    for (let index = 0; index < 2; index++) {
      const advanced = await service.advanceAi({
        matchId: created.matchId,
        side: "runner",
        sessionToken: created.hostSessionToken,
        mode: "single_step",
      });
      if (!advanced.ok) throw new Error(advanced.error.code);
    }
    const input = inputs.get(created.matchId);
    if (!input || !residentPlanPortfolioSnapshot(input))
      throw new Error("Missing resident portfolio");
    return {
      created,
      input,
      auth: {
        matchId: created.matchId,
        side: "runner" as const,
        sessionToken: created.hostSessionToken,
      },
    };
  }
  return { service, storage, inputs, match };
}

describe("server-owned AI runtime lifetime", () => {
  it("serializes manual deletion with a yielding AI batch so the match cannot be resurrected", async () => {
    const directory = await mkdtemp(
      join(tmpdir(), "netgrid-runtime-delete-race-"),
    );
    const storage = new SqliteMatchStorage({
      dbPath: join(directory, "test.sqlite"),
      backupDir: join(directory, "backups"),
    });
    const f = fixture(storage);
    try {
      const game = await f.match();
      const batch = f.service.advanceAi({ ...game.auth, mode: "until_human" });
      await setImmediate();
      const preview = await f.service.storageMaintenanceCleanupPreview({
        statuses: ["active"],
        olderThanMinutes: 1,
      });
      if (!preview) throw new Error("Missing active cleanup preview");
      const deletion = f.service
        .storageMaintenanceCleanupApply({
          filters: preview.filters,
          previewId: preview.previewId,
        })
        .then(
          (result) => ({ result, error: undefined }),
          (error) => ({ result: undefined, error }),
        );
      const advanced = await batch;
      expect(advanced.ok).toBe(true);
      const outcome = await deletion;
      if (outcome.error) {
        expect(outcome.error.message).toBe("maintenance_preview_mismatch");
        const refreshed = await f.service.storageMaintenanceCleanupPreview(
          preview.filters,
        );
        if (!refreshed) throw new Error("Missing refreshed cleanup preview");
        await f.service.storageMaintenanceCleanupApply({
          filters: refreshed.filters,
          previewId: refreshed.previewId,
        });
      }
      expect(await storage.load(game.created.matchId)).toBeUndefined();
      expect(
        residentPlanPortfolioSnapshot(f.inputs.get(game.created.matchId)!),
      ).toBeUndefined();
    } finally {
      f.service.closeStorage();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("releases repeated forfeited matches while preserving another active portfolio and its commitment", async () => {
    const f = fixture();
    try {
      const survivor = await f.match();
      const before = residentPlanPortfolioSnapshot(survivor.input);
      for (let index = 0; index < 3; index++) {
        const ended = await f.match();
        const persisted = await f.storage.load(ended.created.matchId);
        expect((await f.service.forfeitMatch(ended.auth)).ok).toBe(true);
        expect(residentPlanPortfolioSnapshot(ended.input)).toBeUndefined();
        expect(residentPlanPortfolioSnapshot(survivor.input)).toEqual(before);
        expect(
          (await f.storage.load(ended.created.matchId))?.aiPlanRuntime,
        ).toEqual(persisted?.aiPlanRuntime);
      }
      f.service.closeStorage();
      expect(residentPlanPortfolioSnapshot(survivor.input)).toBeUndefined();
    } finally {
      f.service.closeStorage();
    }
  });
  it("keeps live memory when a terminal persistence attempt fails", async () => {
    class RejectTerminalStorage extends InMemoryMatchStorage {
      reject = true;
      override async save(record: StoredMatch) {
        if (this.reject && record.match.status === "forfeited")
          throw new Error("synthetic_commit_failure");
        await super.save(record);
      }
    }
    const storage = new RejectTerminalStorage();
    const f = fixture(storage);
    try {
      const game = await f.match();
      const before = residentPlanPortfolioSnapshot(game.input);
      await expect(f.service.forfeitMatch(game.auth)).rejects.toThrow(
        "synthetic_commit_failure",
      );
      expect(residentPlanPortfolioSnapshot(game.input)).toEqual(before);
      expect((await storage.load(game.created.matchId))?.match.status).toBe(
        "active",
      );
      storage.reject = false;
      expect((await f.service.forfeitMatch(game.auth)).ok).toBe(true);
      expect(residentPlanPortfolioSnapshot(game.input)).toBeUndefined();
    } finally {
      f.service.closeStorage();
    }
  });
  it("releases memory after an Engine win on the ordinary action persistence path", async () => {
    const f = fixture();
    try {
      const game = await f.match();
      const advanced = await f.service.advanceAi({
        ...game.auth,
        mode: "until_human",
      });
      if (!advanced.ok) throw new Error(advanced.error.code);
      const record = await f.storage.load(game.created.matchId);
      if (!record?.gameState) throw new Error("Missing winning fixture");
      // Terminal bad-publicity fixture; the next real LegalAction triggers Engine win validation.
      record.gameState.corp.badPublicity = 7;
      await f.storage.save(record);
      const payload = await f.service.bootstrap(
        game.created.matchId,
        "runner",
        game.created.hostSessionToken,
      );
      if ("error" in payload) throw new Error(payload.error.code);
      const action = payload.legalActions.find((a) => a.type === "gain_credit");
      if (!action) throw new Error("Missing human main action");
      const result = await f.service.submitAction({
        ...game.auth,
        actionId: action.actionId,
        clientKnownStateVersion: payload.playerView.stateVersion,
        idempotencyKey: "terminal-engine-action",
      });
      expect(result.ok).toBe(true);
      expect((await f.storage.load(game.created.matchId))?.match.status).toBe(
        "finished",
      );
      expect(
        residentPlanPortfolioSnapshot(f.inputs.get(game.created.matchId)!),
      ).toBeUndefined();
    } finally {
      f.service.closeStorage();
    }
  });
  it("also releases restored diagnostic memory when a terminal SQLite match is deleted", async () => {
    const directory = await mkdtemp(join(tmpdir(), "netgrid-runtime-delete-"));
    const storage = new SqliteMatchStorage({
      dbPath: join(directory, "test.sqlite"),
      backupDir: join(directory, "backups"),
    });
    const f = fixture(storage);
    try {
      const game = await f.match();
      const snapshot = residentPlanPortfolioSnapshot(game.input)!;
      expect((await f.service.forfeitMatch(game.auth)).ok).toBe(true);
      restoreResidentPlanPortfolioMemorySnapshot(game.input, snapshot);
      const preview = await f.service.storageMaintenanceCleanupPreview({
        statuses: ["forfeited"],
        olderThanMinutes: 0,
      });
      if (!preview) throw new Error("Missing cleanup preview");
      const result = await f.service.storageMaintenanceCleanupApply({
        filters: preview.filters,
        previewId: preview.previewId,
      });
      expect(result?.deletedMatchIds).toEqual([game.created.matchId]);
      expect(await storage.load(game.created.matchId)).toBeUndefined();
      expect(residentPlanPortfolioSnapshot(game.input)).toBeUndefined();
    } finally {
      f.service.closeStorage();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
