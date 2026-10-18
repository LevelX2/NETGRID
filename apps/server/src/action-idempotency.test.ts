import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { hashState } from "@netgrid/engine";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

describe.each(["memory", "sqlite"] as const)(
  "action result idempotency (%s)",
  (kind) => {
    async function fixture() {
      const directory = await mkdtemp(join(tmpdir(), "netgrid-action-result-"));
      const storage =
        kind === "memory"
          ? new InMemoryMatchStorage()
          : new SqliteMatchStorage({
              dbPath: join(directory, "test.sqlite"),
              backupDir: join(directory, "backups"),
            });
      const service = new MultiplayerService(storage, {
        tokenSalt: "isolated-action-result-test",
        now: () => "2026-10-18T10:00:00.000Z",
      });
      const created = await service.createMatch({
        hostSide: "runner",
        mode: "human_runner_vs_corp_ai",
        seed: "action-result-idempotency",
        aiPacingMode: "manual",
      });
      const payload = await service.bootstrap(
        created.matchId,
        "runner",
        created.hostSessionToken,
      );
      if ("error" in payload || !payload.legalActions[0])
        throw new Error("Missing setup fixture");
      const request = {
        matchId: created.matchId,
        side: "runner" as const,
        sessionToken: created.hostSessionToken,
        actionId: payload.legalActions[0].actionId,
        clientKnownStateVersion: payload.playerView.stateVersion,
        idempotencyKey: "same-action-result",
        selectedChoices: {
          choiceId: payload.pendingChoice!.choiceId,
          selectedOptionIds: ["keep"],
        },
      };
      return {
        storage,
        service,
        request,
        directory,
        async close() {
          service.closeStorage();
          await rm(directory, { recursive: true, force: true });
        },
      };
    }

    it.each(["stale_state", "illegal_action"] as const)(
      "preserves a rejected %s receipt on retry",
      async (failure) => {
        const f = await fixture();
        try {
          const before = await f.storage.load(f.request.matchId);
          if (!before?.gameState) throw new Error("Missing state");
          const request = {
            ...f.request,
            ...(failure === "stale_state"
              ? {
                  clientKnownStateVersion:
                    f.request.clientKnownStateVersion + 1,
                }
              : { actionId: "unoffered-action" }),
          };
          const first = await f.service.submitAction(request);
          const retry = await f.service.submitAction(request);
          expect(first.ok).toBe(false);
          expect(retry.ok).toBe(false);
          if (first.ok || retry.ok)
            throw new Error("Rejected action reported success");
          expect(retry.receipt).toEqual(first.receipt);
          expect(retry.receipt?.accepted).toBe(false);
          expect(retry.error).toEqual(first.error);
          const after = await f.storage.load(request.matchId);
          expect(after?.actionReceipts).toHaveLength(1);
          expect(after?.gameState && hashState(after.gameState)).toBe(
            hashState(before.gameState),
          );
          expect(after?.gameState?.eventLog).toEqual(before.gameState.eventLog);
        } finally {
          await f.close();
        }
      },
    );

    it("preserves an accepted receipt without executing the action twice", async () => {
      const f = await fixture();
      try {
        const first = await f.service.submitAction(f.request);
        expect(first.ok).toBe(true);
        const beforeRetry = await f.storage.load(f.request.matchId);
        const retry = await f.service.submitAction(f.request);
        expect(retry.ok).toBe(true);
        expect(retry.receipt).toEqual(first.receipt);
        const afterRetry = await f.storage.load(f.request.matchId);
        expect(afterRetry?.actionReceipts).toHaveLength(1);
        expect(afterRetry?.gameState).toEqual(beforeRetry?.gameState);
      } finally {
        await f.close();
      }
    });

    it("preserves the accepted terminal action result after the match has finished", async () => {
      const f = await fixture();
      try {
        const record = await f.storage.load(f.request.matchId);
        if (!record?.gameState) throw new Error("Missing terminal fixture");
        record.gameState.corp.badPublicity = 7;
        await f.storage.save(record);
        const first = await f.service.submitAction(f.request);
        const retry = await f.service.submitAction(f.request);
        expect(first.ok).toBe(true);
        expect(retry.ok).toBe(true);
        expect(retry.receipt).toEqual(first.receipt);
        expect((await f.storage.load(f.request.matchId))?.match.status).toBe(
          "finished",
        );
        expect(
          (await f.storage.load(f.request.matchId))?.actionReceipts,
        ).toHaveLength(1);
      } finally {
        await f.close();
      }
    });

    it("fails closed when a stored rejection has no error code", async () => {
      const f = await fixture();
      try {
        await f.service.submitAction({
          ...f.request,
          actionId: "unoffered-action",
        });
        const record = await f.storage.load(f.request.matchId);
        if (!record?.actionReceipts[0]) throw new Error("Missing rejection");
        delete record.actionReceipts[0].errorCode;
        if (kind === "memory") await f.storage.save(record);
        else {
          const database = new DatabaseSync(join(f.directory, "test.sqlite"));
          try {
            database
              .prepare(
                "UPDATE action_receipts SET error_code = NULL WHERE match_id = ?",
              )
              .run(f.request.matchId);
          } finally {
            database.close();
          }
        }
        const retry = await f.service.submitAction(f.request);
        expect(retry).toMatchObject({
          ok: false,
          error: { code: "invalid_action_receipt" },
        });
        expect(
          (await f.storage.load(f.request.matchId))?.actionReceipts,
        ).toHaveLength(1);
      } finally {
        await f.close();
      }
    });
  },
);
