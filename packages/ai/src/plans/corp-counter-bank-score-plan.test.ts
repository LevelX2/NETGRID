import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  attachOwnDeckSnapshot,
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { corpCounterBankScoreProjects } from "./corp-counter-bank-score-plan";

const VAPOR_OPS = "onr_v1_347_vapor-ops";
const DATA_WALL = "onr_v1_238_data-wall-2-0";

describe("corpCounterBankScoreProjects", () => {
  it("installs one Engine-certified counter bank only into a remote the visible Runner cannot reach", () => {
    const install = current(
      legalAction(
        "install-vapor",
        "corp",
        "install_card",
        "Install Vapor Ops",
        { credits: 0, clicks: 1 },
        {
          source: "vapor",
          payload: { cardId: "vapor", serverId: "remote_1", placement: "root" },
        },
      ),
    );
    const input = withDeck(aiInput("corp", [install]));
    input.playerView.own.gripOrHq = [vapor("vapor", "corp_hq")];
    input.playerView.servers = [secureRemote("remote_1")];

    expect(
      corpCounterBankScoreProjects(input, [candidate(install, "install.card")]),
    ).toContainEqual(
      expect.objectContaining({
        phase: "install_counter_bank",
        actionIds: ["install-vapor"],
        counterBank: expect.objectContaining({
          sourceCardInstanceId: "vapor",
          serverId: "remote_1",
          counterTarget: 3,
        }),
      }),
    );
  });

  it("rejects unsafe, stale, and internally inconsistent preparation evidence", () => {
    const install = current(
      legalAction(
        "install-vapor",
        "corp",
        "install_card",
        "Install Vapor Ops",
        { credits: 0, clicks: 1 },
        {
          source: "vapor",
          payload: { cardId: "vapor", serverId: "remote_1", placement: "root" },
        },
      ),
    );
    const input = withDeck(aiInput("corp", [install]));
    input.playerView.own.gripOrHq = [vapor("vapor", "corp_hq")];
    input.playerView.servers = [server("remote_1")];

    expect(
      corpCounterBankScoreProjects(input, [candidate(install, "install.card")]),
    ).toEqual([]);

    input.playerView.servers = [secureRemote("remote_1")];
    input.playerView.own.gripOrHq[0]!.counterBankPreparationQuote = {
      ...input.playerView.own.gripOrHq[0]!.counterBankPreparationQuote!,
      expiresAtStateVersion: 0,
    };
    expect(
      corpCounterBankScoreProjects(input, [candidate(install, "install.card")]),
    ).toEqual([]);

    input.playerView.own.gripOrHq[0]!.counterBankPreparationQuote = {
      ...input.playerView.own.gripOrHq[0]!.counterBankPreparationQuote!,
      expiresAtStateVersion: 1,
      advancementCounters: 1,
    };
    expect(
      corpCounterBankScoreProjects(input, [candidate(install, "install.card")]),
    ).toEqual([]);
  });

  it("builds the bank to the deck-derived agenda threshold without requiring an agenda to be installed", () => {
    const advance = current(
      legalAction(
        "advance-vapor",
        "corp",
        "advance_card",
        "Advance Vapor Ops",
        { credits: 1, clicks: 1 },
        { source: "vapor", payload: { cardId: "vapor" } },
      ),
    );
    const input = withDeck(aiInput("corp", [advance]));
    input.playerView.servers = [
      secureRemote("remote_1", [vapor("vapor", "installed_root", 2)]),
    ];

    expect(
      corpCounterBankScoreProjects(input, [
        candidate(advance, "score.advance_card"),
      ]),
    ).toContainEqual(
      expect.objectContaining({
        phase: "advance_counter_bank",
        actionIds: ["advance-vapor"],
        counterBank: expect.objectContaining({
          advancementCounters: 2,
          counterTarget: 3,
        }),
      }),
    );
  });

  it("reserves a funded same-turn install, rez, and transfer route in a new remote when the bank covers the agenda", () => {
    const installAgenda = current(
      legalAction(
        "install-agenda",
        "corp",
        "install_card",
        "Install Simple Agenda",
        { credits: 0, clicks: 1 },
        {
          source: "agenda",
          payload: {
            cardId: "agenda",
            serverId: "new_remote",
            placement: "root",
          },
        },
      ),
    );
    const rez = current(
      legalAction(
        "rez-vapor",
        "corp",
        "rez_card",
        "Rez Vapor Ops",
        { credits: 0, clicks: 0 },
        { source: "vapor", payload: { cardId: "vapor", serverId: "remote_1" } },
      ),
    );
    const input = withDeck(aiInput("corp", [installAgenda, rez]));
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [agenda("agenda")];
    input.playerView.servers = [
      secureRemote("remote_1", [vapor("vapor", "installed_root", 3)]),
    ];

    expect(
      corpCounterBankScoreProjects(input, [
        candidate(installAgenda, "install.card"),
        candidate(rez, "corp_window.rez"),
      ]),
    ).toContainEqual(
      expect.objectContaining({
        phase: "install_agenda_from_counter_bank",
        actionIds: ["install-agenda"],
        sameTurnCloseout: true,
        agendaInstanceId: "agenda",
        serverId: "new_remote",
      }),
    );
  });

  it("rejects an agenda install that would replace its bound counter bank", () => {
    const installAgenda = current(
      legalAction(
        "replace-vapor-with-agenda",
        "corp",
        "install_card",
        "Install Simple Agenda",
        { credits: 0, clicks: 1 },
        {
          source: "agenda",
          payload: {
            cardId: "agenda",
            serverId: "remote_1",
            placement: "root",
            rootReplacement: "asset_to_agenda",
          },
        },
      ),
    );
    const rez = current(
      legalAction(
        "rez-vapor",
        "corp",
        "rez_card",
        "Rez Vapor Ops",
        { credits: 0, clicks: 0 },
        { source: "vapor", payload: { cardId: "vapor", serverId: "remote_1" } },
      ),
    );
    const input = withDeck(aiInput("corp", [installAgenda, rez]));
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [agenda("agenda")];
    input.playerView.servers = [
      secureRemote("remote_1", [vapor("vapor", "installed_root", 3)]),
    ];

    expect(
      corpCounterBankScoreProjects(input, [
        candidate(installAgenda, "install.card"),
        candidate(rez, "corp_window.rez"),
      ]).filter(
        (project) => project.phase === "install_agenda_from_counter_bank",
      ),
    ).toEqual([]);
  });

  it("rezzes the bank for a funded handoff to an agenda in another remote", () => {
    const rez = current(
      legalAction(
        "rez-vapor",
        "corp",
        "rez_card",
        "Rez Vapor Ops",
        { credits: 0, clicks: 0 },
        { source: "vapor", payload: { cardId: "vapor", serverId: "remote_1" } },
      ),
    );
    const input = withDeck(aiInput("corp", [rez]));
    input.playerView.own.clicks = 1;
    input.playerView.servers = [
      secureRemote("remote_1", [vapor("vapor", "installed_root", 3)]),
      server("remote_2", [], [agenda("agenda")]),
    ];

    expect(
      corpCounterBankScoreProjects(input, [candidate(rez, "corp_window.rez")]),
    ).toContainEqual(
      expect.objectContaining({
        phase: "rez_counter_bank_for_handoff",
        actionIds: ["rez-vapor"],
        agendaInstanceId: "agenda",
        serverId: "remote_2",
      }),
    );
  });

  it("allows cashout only after the certified remote is no longer secure and only in Corp main", () => {
    const cashout = current(
      legalAction(
        "cashout-vapor",
        "corp",
        "activated_card_ability",
        "Cash out Vapor Ops",
        { credits: 0, clicks: 0 },
        {
          source: "vapor",
          payload: {
            cardId: "vapor",
            cardImplementationAdvancementCounterCost: 1,
            gainCreditsAmount: 1,
          },
        },
      ),
    );
    const input = withDeck(aiInput("corp", [cashout]));
    input.playerView.servers = [
      server("remote_1", [], [vapor("vapor", "installed_root", 2, true)]),
    ];

    const projects = corpCounterBankScoreProjects(input, [
      candidate(cashout, "economy.gain_credit"),
    ]);
    expect(projects).toContainEqual(
      expect.objectContaining({
        phase: "liquidate_counter_bank",
        actionIds: ["cashout-vapor"],
      }),
    );

    input.playerView.activeSide = "runner";
    input.playerView.timingPoint = "runner_action.main";
    expect(
      corpCounterBankScoreProjects(input, [
        candidate(cashout, "economy.gain_credit"),
      ]),
    ).toEqual([]);
  });

  it("does not bind a non-agenda installed target to the agenda-score counter-bank handoff", () => {
    const installAsset = current(
      legalAction(
        "install-asset",
        "corp",
        "install_card",
        "Install an asset",
        { credits: 0, clicks: 1 },
        {
          source: "asset",
          payload: { cardId: "asset", serverId: "remote_1", placement: "root" },
        },
      ),
    );
    const input = withDeck(aiInput("corp", [installAsset]));
    input.playerView.own.gripOrHq = [
      visibleCard("asset", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
        title: "BBS Whispering Campaign",
      }),
    ];
    input.playerView.servers = [
      secureRemote("remote_1", [vapor("vapor", "installed_root", 3)]),
    ];

    expect(
      corpCounterBankScoreProjects(input, [
        candidate(installAsset, "install.card"),
      ]),
    ).toEqual([]);
  });
});

function withDeck(input: AiDecisionInput): AiDecisionInput {
  attachOwnDeckSnapshot(input, {
    deckSnapshotId: "vapor-ops-score-bank-test",
    side: "corp",
    cards: [{ cardId: "simple_agenda", quantity: 3 }],
  });
  return input;
}

function current(action: LegalAction): LegalAction {
  return { ...action, expiresAtStateVersion: 1 };
}

function candidate(
  action: LegalAction,
  semanticActionType: string,
): ActionSemanticCandidate {
  return {
    actionId: action.actionId,
    actionType: action.type,
    semanticActionType,
    sourceCardInstanceId:
      typeof action.source === "string" && action.source !== "basic_action"
        ? action.source
        : undefined,
    sourceDefinitionId:
      action.source === "vapor"
        ? VAPOR_OPS
        : action.source === "agenda"
          ? "simple_agenda"
          : undefined,
  } as ActionSemanticCandidate;
}

function vapor(
  instanceId: string,
  location: "corp_hq" | "installed_root",
  advancementCounters = 0,
  rezzed = false,
): VisibleCard {
  return visibleCard(instanceId, "corp", "asset", {
    definitionId: VAPOR_OPS,
    title: "Vapor Ops",
    rezzed,
    advancementCounters,
    counterBankPreparationQuote: {
      schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
      context: "corp_counter_bank_preparation",
      sourceCardId: instanceId,
      expiresAtStateVersion: 1,
      location:
        location === "corp_hq"
          ? { kind: "corp_hq" }
          : { kind: "installed_root", serverId: "remote_1" },
      advancementCounters,
      advanceableBeforeRez: true,
      activatedAbilitiesRequireRez: true,
      cashout: { advancementCounterCost: 1, creditGain: 1, actionCost: 0 },
      transfer: {
        actionCost: 1,
        minimumSourceCounters: 1,
        source: "source_card",
        target: "chosen_installed_advanceable_card",
        maximum: "all",
      },
    },
  });
}

function agenda(instanceId: string): VisibleCard {
  return visibleCard(instanceId, "corp", "agenda", {
    definitionId: "simple_agenda",
    title: "Simple Agenda",
    advancementRequirement: 3,
    agendaPoints: 2,
  });
}

function secureRemote(id: `remote_${number}`, root: VisibleCard[] = []) {
  const definition = CARD_DEFINITIONS_BY_ID[DATA_WALL];
  if (!definition || definition.type !== "ice") {
    throw new Error("Missing Data Wall test definition.");
  }
  const strength = definition.strength ?? 0;
  return server(
    id,
    [
      visibleCard("data-wall", "corp", "ice", {
        definitionId: DATA_WALL,
        title: definition.title,
        subtypes: definition.subtypes,
        strength,
        rezzed: true,
        effectiveRunQuote: {
          iceInstanceId: "data-wall",
          iceDefinitionId: DATA_WALL,
          effectiveStrength: strength,
          subroutines: definition.subroutines ?? [],
        },
      }),
    ],
    root,
  );
}
