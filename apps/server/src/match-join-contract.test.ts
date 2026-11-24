import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import type { ApiServerMessage } from "@netgrid/shared";
import { createNetgridHttpServer } from "./http-server";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { loadDeploymentConfig } from "./internet-hardening";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";

async function fixture() {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: "isolated-join-contract",
    now: () => "2026-10-18T10:00:00.000Z",
  });
  const created = await service.createMatch({
    hostSide: "runner",
    mode: "human_runner_vs_corp_ai",
    seed: "authenticated-join",
    aiPacingMode: "manual",
  });
  const handle = createNetgridHttpServer(service, {
    deploymentConfig: loadDeploymentConfig({
      NETGRID_ALLOWED_ORIGINS: "http://127.0.0.1:3100",
    } as NodeJS.ProcessEnv),
    maintenanceAuth: new MaintenanceAuthService(
      new InMemoryMaintenanceCredentialStore(),
    ),
  });
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, {
    origin: "http://127.0.0.1:3100",
  });
  const frames: ApiServerMessage[] = [];
  socket.on("message", (raw) =>
    frames.push(JSON.parse(raw.toString()) as ApiServerMessage),
  );
  await once(socket, "open");
  function next(type: ApiServerMessage["type"]): Promise<ApiServerMessage> {
    return new Promise((resolve) => {
      const listener = (raw: import("ws").RawData) => {
        const message = JSON.parse(raw.toString()) as ApiServerMessage;
        if (message.type === type) {
          socket.off("message", listener);
          resolve(message);
        }
      };
      socket.on("message", listener);
    });
  }
  const join = (sessionToken = created.hostSessionToken) =>
    socket.send(
      JSON.stringify({
        type: "join_match",
        payload: { matchId: created.matchId, side: "runner", sessionToken },
      }),
    );
  return {
    service,
    storage,
    created,
    socket,
    frames,
    baseUrl: `http://127.0.0.1:${address.port}`,
    offer() {
      const frame = frames.find((frame) => frame.type === "state_update");
      if (!frame || frame.type !== "state_update")
        throw new Error("Missing numeric state update");
      return frame.payload;
    },
    next,
    join,
    async close() {
      socket.terminate();
      await handle.close();
    },
  };
}

describe("authenticated WebSocket match contract", () => {
  it("diagnoses an incomplete stored rejection without sending an invalid receipt", async () => {
    const f = await fixture();
    try {
      const acknowledgement = f.next("match_joined");
      f.join();
      await acknowledgement;
      const request = {
        type: "submit_action",
        payload: {
          matchId: f.created.matchId,
          side: "runner",
          actionId: f.offer().playerView.legalActions[0]!.actionId,
          clientKnownMatchVersion: f.created.matchVersion,
          clientKnownStateVersion: f.created.playerView.stateVersion + 1,
          idempotencyKey: "malformed-ws-rejection",
        },
      };
      const first = f.next("error");
      f.socket.send(JSON.stringify(request));
      await first;
      const record = await f.storage.load(f.created.matchId);
      if (!record?.actionReceipts[0])
        throw new Error("Missing rejection fixture");
      delete record.actionReceipts[0].errorCode;
      await f.storage.save(record);
      const retry = f.next("error");
      f.socket.send(JSON.stringify(request));
      expect(await retry).toMatchObject({
        type: "error",
        payload: { code: "invalid_action_receipt" },
      });
      expect(
        f.frames.filter((frame) => frame.type === "action_receipt"),
      ).toHaveLength(1);
    } finally {
      await f.close();
    }
  });
  it("acknowledges the exact match and side only after its bootstrap", async () => {
    const f = await fixture();
    try {
      const acknowledgement = f.next("match_joined");
      f.join();
      expect(await acknowledgement).toEqual({
        type: "match_joined",
        payload: { matchId: f.created.matchId, side: "runner" },
      });
      expect(
        f.frames.findIndex((frame) => frame.type === "state_update"),
      ).toBeLessThan(
        f.frames.findIndex((frame) => frame.type === "match_joined"),
      );
      expect(f.frames.map((frame) => frame.type)).toEqual([
        "state_update",
        "match_joined",
      ]);
      expect(f.frames[0]).toMatchObject({
        type: "state_update",
        payload: {
          playerView: {
            legalActions: expect.arrayContaining([
              expect.objectContaining({ type: "resolve_choice" }),
            ]),
            pendingChoice: expect.objectContaining({ side: "runner" }),
          },
        },
      });
    } finally {
      await f.close();
    }
  });
  it("never acknowledges a rejected session", async () => {
    const f = await fixture();
    try {
      const rejection = f.next("error");
      f.join("invalid-synthetic-session");
      expect(await rejection).toMatchObject({
        type: "error",
        payload: { code: "unauthorized" },
      });
      expect(f.frames.map((frame) => frame.type)).toEqual(["error"]);
    } finally {
      await f.close();
    }
  });
  it("binds the same numeric choice in HTTP and WebSocket and rejects string IDs", async () => {
    const f = await fixture();
    try {
      const acknowledgement = f.next("match_joined");
      f.join();
      await acknowledgement;
      const state = f.offer();
      const response = await fetch(
        `${f.baseUrl}/api/matches/${f.created.matchId}/bootstrap?side=runner`,
        { headers: { authorization: `Bearer ${f.created.hostSessionToken}` } },
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        playerView: {
          legalActions: state.playerView.legalActions,
          pendingChoice: state.playerView.pendingChoice,
        },
      });
      const choice = state.playerView.pendingChoice!;
      const action = state.playerView.legalActions.find((action) => action.type === "resolve_choice")!;
      const keep = choice.options.find((option) => option.presentation === "keep")!;
      expect(action.actionId).toBe(1);
      expect(typeof choice.choiceId).toBe("number");
      expect(typeof keep.id).toBe("number");
      const payload = {
        matchId: f.created.matchId,
        side: "runner",
        actionId: action.actionId,
        clientKnownStateVersion: state.playerView.stateVersion,
        clientKnownMatchVersion: state.matchVersion,
        idempotencyKey: "numeric-ws-choice",
        selectedChoices: {
          choiceId: choice.choiceId,
          selectedOptionIds: [keep.id],
        },
      };
      const stringAction = f.next("error");
      f.socket.send(JSON.stringify({
        type: "submit_action",
        payload: { ...payload, actionId: String(action.actionId) },
      }));
      expect(await stringAction).toMatchObject({ type: "error" });
      expect((await f.service.loadForTest(f.created.matchId))?.actionReceipts).toEqual([]);
      const unexpectedAmounts = f.next("action_receipt");
      f.socket.send(JSON.stringify({
        type: "submit_action",
        payload: {
          ...payload,
          idempotencyKey: "unexpected-ws-choice-amounts",
          selectedChoices: { ...payload.selectedChoices, selectedOptionAmounts: [1] },
        },
      }));
      expect(await unexpectedAmounts).toMatchObject({
        type: "action_receipt",
        payload: { accepted: false, errorCode: "ERR_INVALID_CHOICE" },
      });
      const accepted = f.next("action_receipt");
      f.socket.send(JSON.stringify({ type: "submit_action", payload }));
      expect(await accepted).toMatchObject({
        type: "action_receipt",
        payload: {
          accepted: true,
          stateVersionAfter: state.playerView.stateVersion + 1,
        },
      });
    } finally {
      await f.close();
    }
  });
  it("sends the same rejected receipt and error for a repeated stale action", async () => {
    const f = await fixture();
    try {
      const acknowledgement = f.next("match_joined");
      f.join();
      await acknowledgement;
      const request = {
        type: "submit_action",
        payload: {
          matchId: f.created.matchId,
          side: "runner",
          actionId: f.offer().playerView.legalActions[0]!.actionId,
          clientKnownMatchVersion: f.created.matchVersion,
          clientKnownStateVersion: f.created.playerView.stateVersion + 1,
          idempotencyKey: "repeated-ws-rejection",
        },
      };
      for (let index = 0; index < 2; index++) {
        const rejection = f.next("error");
        f.socket.send(JSON.stringify(request));
        expect(await rejection).toMatchObject({
          type: "error",
          payload: { code: "stale_state" },
        });
      }
      const receipts = f.frames.filter(
        (
          frame,
        ): frame is Extract<ApiServerMessage, { type: "action_receipt" }> =>
          frame.type === "action_receipt",
      );
      expect(receipts).toHaveLength(2);
      expect(receipts[0]).toEqual(receipts[1]);
      expect(receipts[0]?.payload.accepted).toBe(false);
      expect(
        (await f.service.loadForTest(f.created.matchId))?.actionReceipts,
      ).toHaveLength(1);
    } finally {
      await f.close();
    }
  });
});
