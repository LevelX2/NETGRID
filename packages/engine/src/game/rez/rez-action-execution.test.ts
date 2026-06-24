import type { CardInstanceId, LegalAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  handleRezActionExecution,
  type RezActionExecutionHost,
} from "./rez-action-execution";

function rezAction(
  payload: NonNullable<LegalAction["payload"]> = { cardId: "ice_1" },
): LegalAction {
  return {
    actionId: "corp.rez.ice_1",
    type: "rez_ice",
    label: "Rez ICE",
    side: "corp",
    source: "game_rule",
    stateVersion: 10,
    timingPoint: "corp_rez_window",
    costs: [],
    payload,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 11,
  } as unknown as LegalAction;
}

function declineAction(
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    ...rezAction(payload),
    actionId: "corp.decline_rez",
    type: "decline_rez",
    label: "Decline rez",
  } as LegalAction;
}

function hostFor(calls: string[]): RezActionExecutionHost {
  return {
    rez: {
      executeRezCard: (cardId, rootRez, legalAction) => {
        calls.push(`rez:${cardId}:${rootRez}:${legalAction.type}`);
      },
      expireScoredAgendaInstallRezCreditAbilities: () => {
        calls.push("expire_scored_agenda_install_rez_credit");
      },
    },
    run: {
      passCorpRunRootRezWindow: (legalAction) => {
        calls.push(`pass_root:${legalAction.type}`);
      },
      passApproachedIce: () => {
        calls.push("pass_ice");
      },
    },
  };
}

describe("rez-action-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./rez-action-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("returns unhandled for unrelated actions", () => {
    const calls: string[] = [];

    const result = handleRezActionExecution(hostFor(calls), {
      ...rezAction(),
      type: "gain_credit",
    } as LegalAction);

    expect(result).toEqual({ handled: false });
    expect(calls).toEqual([]);
  });

  it("delegates rez_ice and expires scored Agenda install/rez credits", () => {
    const calls: string[] = [];
    const legalAction = rezAction({
      cardId: "root_asset_1" as CardInstanceId,
      assetRez: true,
    });

    const result = handleRezActionExecution(hostFor(calls), legalAction);

    expect(result).toEqual({ handled: true });
    expect(calls).toEqual([
      "rez:root_asset_1:true:rez_ice",
      "expire_scored_agenda_install_rez_credit",
    ]);
  });

  it("preserves root rez-window decline continuation", () => {
    const calls: string[] = [];

    const result = handleRezActionExecution(
      hostFor(calls),
      declineAction({ runRootRezPass: true }),
    );

    expect(result).toEqual({ handled: true });
    expect(calls).toEqual(["pass_root:decline_rez"]);
  });

  it("preserves approached ICE decline continuation", () => {
    const calls: string[] = [];

    const result = handleRezActionExecution(hostFor(calls), declineAction());

    expect(result).toEqual({ handled: true });
    expect(calls).toEqual(["pass_ice"]);
  });
});
