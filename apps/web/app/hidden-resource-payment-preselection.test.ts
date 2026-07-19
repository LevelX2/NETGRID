import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type {
  LegalAction,
  PlayerView,
  VisibleCard,
  VisibleRunnerPaymentSupportAbility,
} from "@netgrid/shared";
import {
  createHiddenResourcePaymentPreselection,
  hiddenResourcePaymentPreselectionIsAvailable,
  paymentSupportSubmitKey,
  pendingPaymentSupportContinuation,
  resolveHiddenResourcePaymentPreselection,
  resolvePaymentSupportContinuation,
  shouldSubmitPaymentSupportAction,
} from "./hidden-resource-payment-preselection";

const ability: VisibleRunnerPaymentSupportAbility = {
  abilityIndex: 1,
  timing: "runner_cost_penalty_support",
  label: "Swiss Bank Account: 6 Credits nehmen",
  creditCost: 3,
  gainCredits: 6,
  trashesSource: true,
};

describe("hidden resource payment preselection", () => {
  it("selects a concrete card instance and Swiss ability", () => {
    const swiss = card("swiss-a", [ability]);
    const selection = createHiddenResourcePaymentPreselection({
      matchId: "match-1",
      view: view([swiss]),
      card: swiss,
      ability,
    });

    expect(selection).toMatchObject({
      matchId: "match-1",
      side: "runner",
      sourceCardId: "swiss-a",
      abilityIndex: 1,
      selectedTurnSerial: 7,
      selectedRunId: "run-1",
    });
    expect(
      hiddenResourcePaymentPreselectionIsAvailable(
        selection!,
        "match-1",
        view([swiss]),
      ),
    ).toBe(true);
    expect(
      hiddenResourcePaymentPreselectionIsAvailable(
        selection!,
        "match-1",
        view([card("swiss-b", [ability])]),
      ),
    ).toBe(false);
  });

  it("matches only the exact current ability and window", () => {
    const selection = createHiddenResourcePaymentPreselection({
      matchId: "match-1",
      view: view([card("swiss-a", [ability])]),
      card: card("swiss-a", [ability]),
      ability,
    })!;
    const lowerAbility = supportAction("support-0", "swiss-a", 0, "window-1");
    const exactAbility = supportAction("support-1", "swiss-a", 1, "window-1");

    expect(
      resolveHiddenResourcePaymentPreselection(selection, [
        lowerAbility,
        exactAbility,
        continuation("continue", "window-1"),
      ]),
    ).toEqual({ kind: "match", windowId: "window-1", action: exactAbility });
    expect(paymentSupportSubmitKey("match-1", "window-1", exactAbility)).toBe(
      "match-1:window-1:support-1",
    );
    expect(
      shouldSubmitPaymentSupportAction(
        "match-1:window-1:support-1",
        "match-1:window-1:support-1",
      ),
    ).toBe(false);
    expect(
      shouldSubmitPaymentSupportAction(
        "match-1:window-1:support-1",
        "match-1:window-2:support-1",
      ),
    ).toBe(true);
  });

  it("waits outside a support window and falls back for stale or ambiguous actions", () => {
    const selection = createHiddenResourcePaymentPreselection({
      matchId: "match-1",
      view: view([card("swiss-a", [ability])]),
      card: card("swiss-a", [ability]),
      ability,
    })!;
    expect(resolveHiddenResourcePaymentPreselection(selection, [])).toEqual({
      kind: "waiting",
    });
    expect(
      resolveHiddenResourcePaymentPreselection(selection, [
        supportAction("wrong-source", "swiss-b", 1, "window-1"),
        continuation("continue", "window-1"),
      ]),
    ).toEqual({ kind: "invalid", windowId: "window-1" });
    expect(
      resolveHiddenResourcePaymentPreselection(selection, [
        supportAction("duplicate-a", "swiss-a", 1, "window-1"),
        supportAction("duplicate-b", "swiss-a", 1, "window-1"),
      ]),
    ).toEqual({ kind: "invalid", windowId: "window-1" });
  });

  it("continues the original action only after bank support reached a fresh state", () => {
    const support = supportAction("support-1", "swiss-a", 1, "window-1");
    support.payload = {
      ...support.payload,
      costPenaltySupportOriginalActionId: "running-interference",
    };
    const pending = pendingPaymentSupportContinuation("match-1", support, 12);
    expect(pending).toEqual({
      matchId: "match-1",
      windowId: "window-1",
      originalActionId: "running-interference",
      supportSubmittedAtStateVersion: 12,
    });

    const staleContinuation = continuation(
      "running-interference",
      "window-1",
      12,
    );
    const freshContinuation = continuation(
      "running-interference",
      "window-1",
      13,
    );
    expect(
      resolvePaymentSupportContinuation(pending!, 12, [staleContinuation]),
    ).toEqual({ kind: "waiting" });
    expect(
      resolvePaymentSupportContinuation(pending!, 13, [staleContinuation]),
    ).toEqual({ kind: "waiting" });
    expect(
      resolvePaymentSupportContinuation(pending!, 13, [freshContinuation]),
    ).toEqual({ kind: "match", action: freshContinuation });
    expect(
      resolvePaymentSupportContinuation(pending!, 13, [
        supportAction("more-support-needed", "chiba-a", 0, "window-1", 13),
      ]),
    ).toEqual({ kind: "invalid" });
  });

  it("invalidates the local intent after turn, run, or source changes", () => {
    const swiss = card("swiss-a", [ability]);
    const selection = createHiddenResourcePaymentPreselection({
      matchId: "match-1",
      view: view([swiss]),
      card: swiss,
      ability,
    })!;
    expect(
      hiddenResourcePaymentPreselectionIsAvailable(
        selection,
        "match-2",
        view([swiss]),
      ),
    ).toBe(false);
    expect(
      hiddenResourcePaymentPreselectionIsAvailable(
        selection,
        "match-1",
        view([swiss], { turnSerial: 8 }),
      ),
    ).toBe(false);
    expect(
      hiddenResourcePaymentPreselectionIsAvailable(
        selection,
        "match-1",
        viewWithoutRun([swiss]),
      ),
    ).toBe(false);
  });

  it("renders one accessible marker per engine-projected ability", () => {
    const cardSource = readFileSync(
      new URL("../features/cards/CardView.tsx", import.meta.url),
      "utf8",
    );
    const boardSource = readFileSync(
      new URL(
        "../features/game-board/ActiveRunnerZoneBoard.tsx",
        import.meta.url,
      ),
      "utf8",
    );

    expect(cardSource).toContain("paymentSupportShortcuts.map((shortcut)");
    expect(cardSource).toContain("aria-pressed={shortcut.selected}");
    expect(cardSource).toContain(
      "data-testid={`payment-support-shortcut-${shortcut.abilityIndex}`}",
    );
    expect(boardSource).toContain(
      "rigCard.runnerPaymentSupportAbilities ?? []",
    );
    expect(boardSource).toContain("gainCredits: ability.gainCredits");
  });
});

function card(
  instanceId: string,
  abilities: VisibleRunnerPaymentSupportAbility[],
): VisibleCard {
  return {
    instanceId,
    known: true,
    title: "Swiss Bank Account",
    owner: "runner",
    controller: "runner",
    runnerPaymentSupportAbilities: abilities,
  };
}

function view(
  rig: VisibleCard[],
  overrides: Partial<PlayerView> = {},
): PlayerView {
  return {
    side: "runner",
    stateVersion: 12,
    turnSerial: 7,
    timingPoint: "run.encounter_ice",
    activeSide: "runner",
    phase: "run",
    own: {
      identity: { instanceId: "runner-id", known: true },
      credits: 8,
      clicks: 2,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      rig,
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: { instanceId: "corp-id", known: true },
      credits: 5,
      clicks: 2,
      agendaPoints: 0,
      tags: 0,
      handCount: 0,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    run: {
      runId: "run-1",
      attackedServerId: "hq",
      phase: "encounter_ice",
      successful: false,
    },
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides,
  };
}

function viewWithoutRun(rig: VisibleCard[]): PlayerView {
  const result = view(rig);
  delete result.run;
  return result;
}

function supportAction(
  actionId: string,
  source: string,
  abilityIndex: number,
  windowId: string,
  stateVersion = 12,
): LegalAction {
  return action(
    actionId,
    "activated_card_ability",
    source,
    {
      cardId: source,
      cardImplementationAbilityIndex: abilityIndex,
      cardImplementationAbilityTiming: "runner_cost_penalty_support",
      costPenaltySupportWindowId: windowId,
    },
    stateVersion,
  );
}

function continuation(
  actionId: string,
  windowId: string,
  stateVersion = 12,
): LegalAction {
  return action(
    actionId,
    "play_event",
    "event-a",
    {
      runnerCostPenaltySupportContinuation: true,
      runnerCostPenaltySupportWindowId: windowId,
    },
    stateVersion,
  );
}

function action(
  actionId: string,
  type: LegalAction["type"],
  source: string,
  payload: NonNullable<LegalAction["payload"]>,
  stateVersion = 12,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source,
    timingPoint: "run.encounter_ice",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
    payload,
  };
}
