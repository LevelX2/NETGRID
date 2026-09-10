import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardCorpUtilityImplementation } from "../../ability-engine/definition-types";
import { describe, expect, it } from "vitest";
import {
  handleHiddenZoneNonSearchChoice,
  startCorpArchivesToHqChoice,
  startCorpHqCardToRdChoice,
  startCardImplementationTrashCardsFromGripForCreditsChoice,
  startCardImplementationTrashOwnInstalledCardsForCreditsChoice,
  startRunnerGripTrashForCreditsChoice,
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
  startCorpHqRetainPaymentChoice,
  type HiddenZoneNonSearchChoiceHandlerHost,
} from "./nonsearch-choice-handlers";

const offSiteId = "off_site_backups" as CardDefinitionId;
const socialId = "social_engineering" as CardDefinitionId;
const sourceId = "source" as CardInstanceId;

function definition(
  id: string,
  type: CardDefinition["type"] = "resource",
  title = id,
): CardDefinition {
  return { id: id as CardDefinitionId, type, title } as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId = cardId as string,
  side: "corp" | "runner" = "runner",
): CardInstance {
  return {
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: side,
    controller: side,
    faceup: true,
    rezzed: true,
    zone: { side, zone: side === "corp" ? "archives" : "grip" },
  } as unknown as CardInstance;
}

function playerAction(optionIds: string[]): PlayerAction {
  return {
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function selectCardsChoice(
  source: string,
  side: "runner" | "corp",
  ids: CardInstanceId[],
): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side,
    source,
    prompt: "Choice",
    kind: "select_cards",
    options: ids.map((cardId) => ({
      id: `card_${cardId}`,
      label: cardId,
      value: cardId,
    })),
    minSelections: 0,
    maxSelections: ids.length,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };
}

function makeHost(
  input: {
    runnerGrip?: CardInstanceId[];
    runnerHeap?: CardInstanceId[];
    runnerInstalled?: {
      programs?: CardInstanceId[];
      hardware?: CardInstanceId[];
      resources?: CardInstanceId[];
    };
    corpHq?: CardInstanceId[];
    corpArchives?: CardInstanceId[];
    servers?: CorpServer[];
    pendingChoice?: ChoiceRequest;
    playerAction?: PlayerAction;
    definitions?: Record<string, CardDefinition>;
    instances?: Record<string, CardInstance>;
    corpUtilities?: Record<string, CardCorpUtilityImplementation>;
    runStartCalls?: Array<{ serverId: string; iceId: CardInstanceId }>;
  } = {},
): HiddenZoneNonSearchChoiceHandlerHost {
  const definitions = {
    [sourceId]: definition(offSiteId, "operation", "Off-Site Backups"),
    ...input.definitions,
  };
  const allIds = [
    sourceId,
    ...(input.runnerGrip ?? []),
    ...(input.runnerHeap ?? []),
    ...(input.runnerInstalled?.programs ?? []),
    ...(input.runnerInstalled?.hardware ?? []),
    ...(input.runnerInstalled?.resources ?? []),
    ...(input.corpHq ?? []),
    ...(input.corpArchives ?? []),
    ...(input.servers ?? []).flatMap((server) => server.ice),
  ];
  const cardInstances: Record<string, CardInstance> = Object.fromEntries(
    allIds.map((cardId) => [
      cardId,
      input.instances?.[cardId] ??
        instance(
          cardId,
          definitions[cardId]?.id ?? cardId,
          (input.corpHq ?? []).includes(cardId) ||
            (input.corpArchives ?? []).includes(cardId) ||
            (input.servers ?? []).some((server) => server.ice.includes(cardId))
            ? "corp"
            : "runner",
        ),
    ]),
  );
  const legalAction = { side: "runner", payload: {} } as LegalAction;
  const state = {
    stateVersion: 7,
    activeSide: "runner",
    pendingChoice: input.pendingChoice,
    secretSpendGuessRunSecret: undefined,
    cardInstances,
    runner: {
      credits: 6,
      grip: input.runnerGrip ?? [],
      heap: input.runnerHeap ?? [],
      stack: [],
      rig: {
        programs: input.runnerInstalled?.programs ?? [],
        hardware: input.runnerInstalled?.hardware ?? [],
        resources: input.runnerInstalled?.resources ?? [],
      },
    },
    corp: {
      credits: 6,
      hq: input.corpHq ?? [],
      rd: [],
      archives: input.corpArchives ?? [],
      servers: input.servers ?? [],
    },
  } as unknown as HiddenZoneNonSearchChoiceHandlerHost["state"];
  return {
    state,
    legalAction,
    ...(input.playerAction ? { playerAction: input.playerAction } : {}),
    cards: {
      definitionFor: (cardId) => definitions[cardId] ?? definition(cardId),
      corpUtilityForCard: (cardId) => input.corpUtilities?.[cardId],
      hasCorpUtilityKind: (cardId, kind) =>
        input.corpUtilities?.[cardId]?.kind === kind,
      mustInstance: (cardId) => {
        const found = cardInstances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
      installedResourceTrashCreditGain: () => 2,
    },
    zones: {
      removeFromAllZones: (cardId) => {
        state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
        state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (id) => id !== cardId,
        );
        state.runner.rig.hardware = state.runner.rig.hardware.filter(
          (id) => id !== cardId,
        );
        state.runner.rig.resources = state.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
      },
      trashRunnerInstalledCardToHeap: (cardId) => {
        state.runner.rig.resources = state.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        state.runner.heap.push(cardId);
      },
    },
    servers: {
      mustServer: (serverId) => {
        const server = state.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
      publicServerLabel: (serverId) => `Server ${serverId}`,
      iceChoiceLabelForSide: (_cardId, _side, fallback) => ({
        label: fallback,
        publicLabel: fallback,
      }),
    },
    callbacks: {
      hasSuccessfulHqRunThisTurn: () => true,
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
      gainRunnerCredits: (amount) => {
        state.runner.credits += amount;
      },
      shuffleCorpCardIntoRd: (cardId, sourceDefinitionId) => {
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
        state.corp.rd.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId],
          faceup: false,
          rezzed: false,
          zone: { side: "corp", zone: "rd" },
        } as CardInstance;
        return {
          publicPayload: {
            hiddenZoneBarrier: true,
            hiddenZoneAction: "shuffle_source_into_corp_rd",
            movedCardCount: 1,
            sourceDefinitionId,
          },
        };
      },
      startRunWithAutoPass: (serverId, iceId) => {
        input.runStartCalls?.push({ serverId, iceId });
      },
    },
  };
}

describe("hidden-zone nonsearch choice handlers", () => {
  it("starts and resolves Corp Archives-to-HQ without public card identity payload", () => {
    const archived = "archived" as CardInstanceId;
    const host = makeHost({
      corpArchives: [sourceId, archived],
      corpUtilities: {
        [sourceId]: {
          kind: "corp_archives_to_hq",
          visibility: "hidden_info_barrier",
        },
      },
    });

    startCorpArchivesToHqChoice(host, sourceId);
    expect(host.state.pendingChoice?.source).toContain(
      "v1922.corp_archives_to_hq",
    );

    host.playerAction = playerAction([`card_${archived}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.archives).toEqual([sourceId]);
    expect(host.state.corp.hq).toEqual([archived]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_corp_archives_to_hq",
      movedCount: 1,
    });
    expect(host.legalAction.payload).not.toHaveProperty("movedCardId");
  });

  it("filters Reclamation Project to Archives ICE and reveals selected definitions", () => {
    const ice1 = "ice_1" as CardInstanceId;
    const ice2 = "ice_2" as CardInstanceId;
    const asset = "asset_1" as CardInstanceId;
    const host = makeHost({
      corpArchives: [sourceId, ice1, asset, ice2],
      definitions: {
        [sourceId]: definition(
          "onr_classic_018_reclamation-project",
          "operation",
          "Reclamation Project",
        ),
        [ice1]: definition("classic_ice_1", "ice", "Classic ICE 1"),
        [ice2]: definition("classic_ice_2", "ice", "Classic ICE 2"),
        [asset]: definition("classic_asset_1", "asset", "Classic Asset"),
      },
      corpUtilities: {
        [sourceId]: {
          kind: "corp_archives_to_hq",
          filter: { cardType: "ice" },
          maxSelections: "all",
          revealToRunner: true,
          playCost: { kind: "printed", additionalClicks: 1 },
          visibility: "hidden_info_barrier",
        },
      },
    });

    startCorpArchivesToHqChoice(host, sourceId);
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual([ice1, ice2]);
    expect(host.state.pendingChoice?.minSelections).toBe(0);
    expect(host.state.pendingChoice?.maxSelections).toBe(2);

    host.playerAction = playerAction([`card_${ice1}`, `card_${ice2}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.archives).toEqual([sourceId, asset]);
    expect(host.state.corp.hq).toEqual([ice1, ice2]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_corp_archives_to_hq",
      sourceDefinitionId: "onr_classic_018_reclamation-project",
      movedCount: 2,
      archivesRevealCount: 2,
      archivesRevealDefinitionIds: "classic_ice_1,classic_ice_2",
    });
  });

  it("allows Reclamation Project to choose zero ICE or resolve with no eligible ICE", () => {
    const ice = "ice_1" as CardInstanceId;
    const host = makeHost({
      corpArchives: [sourceId, ice],
      definitions: {
        [sourceId]: definition(
          "onr_classic_018_reclamation-project",
          "operation",
          "Reclamation Project",
        ),
        [ice]: definition("classic_ice_1", "ice", "Classic ICE 1"),
      },
      corpUtilities: {
        [sourceId]: {
          kind: "corp_archives_to_hq",
          filter: { cardType: "ice" },
          maxSelections: "all",
          revealToRunner: true,
          playCost: { kind: "printed", additionalClicks: 1 },
          visibility: "hidden_info_barrier",
        },
      },
    });

    startCorpArchivesToHqChoice(host, sourceId);
    host.playerAction = playerAction([]);
    expect(handleHiddenZoneNonSearchChoice(host)).toMatchObject({
      handled: true,
      stateChanged: true,
      movedCardIds: [],
    });
    expect(host.state.corp.archives).toEqual([sourceId, ice]);
    expect(host.legalAction.payload).toMatchObject({
      sourceDefinitionId: "onr_classic_018_reclamation-project",
      movedCount: 0,
      archivesRevealCount: 0,
    });

    const emptyHost = makeHost({
      corpArchives: [sourceId],
      definitions: {
        [sourceId]: definition(
          "onr_classic_018_reclamation-project",
          "operation",
          "Reclamation Project",
        ),
      },
      corpUtilities: {
        [sourceId]: {
          kind: "corp_archives_to_hq",
          filter: { cardType: "ice" },
          maxSelections: "all",
          revealToRunner: true,
          playCost: { kind: "printed", additionalClicks: 1 },
          visibility: "hidden_info_barrier",
        },
      },
    });
    startCorpArchivesToHqChoice(emptyHost, sourceId);
    expect(emptyHost.state.pendingChoice).toBeUndefined();
    expect(emptyHost.legalAction.payload).toMatchObject({
      sourceDefinitionId: "onr_classic_018_reclamation-project",
      eligibleCount: 0,
      movedCount: 0,
      archivesRevealCount: 0,
    });
  });

  it("moves the selected Corporate Shuffle HQ card into R&D behind a hidden barrier", () => {
    const hqCard = "hq_card_1" as CardInstanceId;
    const host = makeHost({
      corpHq: [hqCard],
      definitions: {
        [sourceId]: definition(
          "onr_classic_017_corporate-shuffle",
          "operation",
          "Corporate Shuffle",
        ),
        [hqCard]: definition("classic_hq_card", "operation", "HQ Card"),
      },
      corpUtilities: {
        [sourceId]: {
          kind: "draw_corp_cards_then_shuffle_hq_card_into_rd",
          drawCount: 5,
          playCost: { kind: "printed", additionalClicks: 1 },
          visibility: "hidden_info_barrier",
        },
      },
    });

    startCorpHqCardToRdChoice(host, sourceId);
    host.playerAction = playerAction([`card_${hqCard}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.hq).toEqual([]);
    expect(host.state.corp.rd).toEqual([hqCard]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "classic_corporate_shuffle_hq_to_rd",
      sourceDefinitionId: "onr_classic_017_corporate-shuffle",
      movedCount: 1,
    });
    expect(host.legalAction.payload).not.toHaveProperty("movedCardId");
  });

  it("trashes selected Runner grip cards for credits and rejects non-grip cards", () => {
    const grip = "grip" as CardInstanceId;
    const notGrip = "not_grip" as CardInstanceId;
    const host = makeHost({ runnerGrip: [grip], runnerHeap: [notGrip] });

    startRunnerGripTrashForCreditsChoice(host, sourceId);
    host.playerAction = playerAction([`card_${grip}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.runner.heap).toEqual([notGrip, grip]);
    expect(host.state.runner.credits).toBe(8);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
      trashedCount: 1,
      gainedCredits: 2,
    });

    const invalid = makeHost({
      runnerGrip: [grip],
      runnerHeap: [notGrip],
      pendingChoice: selectCardsChoice(
        "v1922.runner_grip_trash_gain_credits:source:8",
        "runner",
        [notGrip],
      ),
      playerAction: playerAction([`card_${notGrip}`]),
    });
    expect(() => handleHiddenZoneNonSearchChoice(invalid)).toThrow(
      "Grip-Auswahl",
    );
  });

  it("trashes selected installed Runner cards for credits", () => {
    const installed = "installed" as CardInstanceId;
    const host = makeHost({
      runnerInstalled: { resources: [installed] },
      pendingChoice: selectCardsChoice(
        "v1922.runner_installed_trash_gain_credits:source:8",
        "runner",
        [installed],
      ),
      playerAction: playerAction([`card_${installed}`]),
    });

    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.runner.rig.resources).toEqual([]);
    expect(host.state.runner.heap).toEqual([installed]);
    expect(host.state.runner.credits).toBe(9);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
      trashedCount: 1,
      gainedCredits: 3,
    });
  });

  it("starts and resolves strict P3.47 Runner trash-for-credit choices", () => {
    const grip = "grip" as CardInstanceId;
    const installed = "installed" as CardInstanceId;
    const gripHost = makeHost({ runnerGrip: [grip] });

    startCardImplementationTrashCardsFromGripForCreditsChoice(gripHost, {
      sourceCardId: sourceId,
      sourceDefinitionId: offSiteId,
      max: 5,
      gainPerTrashed: 2,
    });
    gripHost.playerAction = playerAction([`card_${grip}`]);
    expect(handleHiddenZoneNonSearchChoice(gripHost)).toMatchObject({
      handled: true,
      gainedCredits: 2,
    });
    expect(gripHost.state.runner.grip).toEqual([]);
    expect(gripHost.state.runner.heap).toEqual([grip]);

    const installedHost = makeHost({
      runnerInstalled: { resources: [installed] },
    });
    startCardImplementationTrashOwnInstalledCardsForCreditsChoice(
      installedHost,
      {
        sourceCardId: sourceId,
        sourceDefinitionId: offSiteId,
        min: 1,
        max: "any",
        gainPerTrashed: 3,
      },
    );
    installedHost.playerAction = playerAction([`card_${installed}`]);
    expect(handleHiddenZoneNonSearchChoice(installedHost)).toMatchObject({
      handled: true,
      gainedCredits: 3,
    });
    expect(installedHost.state.runner.rig.resources).toEqual([]);
    expect(installedHost.state.runner.heap).toEqual([installed]);
  });

  it.each([
    { max: 0, gainPerTrashed: 2 },
    { max: -1, gainPerTrashed: 2 },
    { max: 1.5, gainPerTrashed: 2 },
    { max: Number.NaN, gainPerTrashed: 2 },
    { max: Number.POSITIVE_INFINITY, gainPerTrashed: 2 },
    { max: 5, gainPerTrashed: 0 },
    { max: 5, gainPerTrashed: 1.5 },
  ])(
    "rejects invalid P3.47 grip choice start input $max/$gainPerTrashed",
    ({ max, gainPerTrashed }) => {
      const grip = "grip" as CardInstanceId;
      const host = makeHost({ runnerGrip: [grip] });

      expect(() =>
        startCardImplementationTrashCardsFromGripForCreditsChoice(host, {
          sourceCardId: sourceId,
          sourceDefinitionId: offSiteId,
          max,
          gainPerTrashed,
        }),
      ).toThrow("runtime_invalid_runner_grip_trash_choice_source");

      expect(host.state.pendingChoice).toBeUndefined();
      expect(host.state.runner.grip).toEqual([grip]);
      expect(host.state.runner.credits).toBe(6);
      expect(host.legalAction.payload).toEqual({});
    },
  );

  it.each([
    { min: -1, gainPerTrashed: 3 },
    { min: 1.5, gainPerTrashed: 3 },
    { min: 2, gainPerTrashed: 3 },
    { min: Number.NaN, gainPerTrashed: 3 },
    { min: Number.POSITIVE_INFINITY, gainPerTrashed: 3 },
    { min: 1, gainPerTrashed: 0 },
    { min: 1, gainPerTrashed: 1.5 },
  ])(
    "rejects invalid P3.47 installed choice start input $min/$gainPerTrashed",
    ({ min, gainPerTrashed }) => {
      const installed = "installed" as CardInstanceId;
      const host = makeHost({
        runnerInstalled: { resources: [installed] },
      });

      expect(() =>
        startCardImplementationTrashOwnInstalledCardsForCreditsChoice(host, {
          sourceCardId: sourceId,
          sourceDefinitionId: offSiteId,
          min: min as 0 | 1,
          max: "any",
          gainPerTrashed,
        }),
      ).toThrow("runtime_invalid_runner_installed_trash_choice_source");

      expect(host.state.pendingChoice).toBeUndefined();
      expect(host.state.runner.rig.resources).toEqual([installed]);
      expect(host.state.runner.credits).toBe(6);
      expect(host.legalAction.payload).toEqual({});
    },
  );

  it.each([
    "p3_47.runner_grip_trash_for_credits:source:def:1.5:2:8",
    "p3_47.runner_grip_trash_for_credits:source:def:-1:2:8",
    "p3_47.runner_grip_trash_for_credits:source:def:5:NaN:8",
    "p3_47.runner_grip_trash_for_credits:source:def:5:Infinity:8",
    "p3_47.runner_grip_trash_for_credits:source:def::2:8",
    "p3_47.runner_grip_trash_for_credits:source:def:5:2",
  ])("rejects corrupt P3.47 grip source %s before mutation", (source) => {
    const grip = "grip" as CardInstanceId;
    const choice = selectCardsChoice(source, "runner", [grip]);
    const host = makeHost({
      runnerGrip: [grip],
      pendingChoice: choice,
      playerAction: playerAction([`card_${grip}`]),
    });

    expect(() => handleHiddenZoneNonSearchChoice(host)).toThrow(
      "runtime_invalid_runner_grip_trash_choice_source",
    );
    expect(host.state.pendingChoice).toBe(choice);
    expect(host.state.runner.grip).toEqual([grip]);
    expect(host.state.runner.heap).toEqual([]);
    expect(host.state.runner.credits).toBe(6);
    expect(host.legalAction.payload).toEqual({});
  });

  it.each([
    "p3_47.runner_installed_trash_for_credits:source:def:2:3:8",
    "p3_47.runner_installed_trash_for_credits:source:def:1.5:3:8",
    "p3_47.runner_installed_trash_for_credits:source:def:-1:3:8",
    "p3_47.runner_installed_trash_for_credits:source:def:1:NaN:8",
    "p3_47.runner_installed_trash_for_credits:source:def:1:0:8",
    "p3_47.runner_installed_trash_for_credits:source:def::3:8",
  ])("rejects corrupt P3.47 installed source %s before mutation", (source) => {
    const installed = "installed" as CardInstanceId;
    const choice = selectCardsChoice(source, "runner", [installed]);
    const host = makeHost({
      runnerInstalled: { resources: [installed] },
      pendingChoice: choice,
      playerAction: playerAction([`card_${installed}`]),
    });

    expect(() => handleHiddenZoneNonSearchChoice(host)).toThrow(
      "runtime_invalid_runner_installed_trash_choice_source",
    );
    expect(host.state.pendingChoice).toBe(choice);
    expect(host.state.runner.rig.resources).toEqual([installed]);
    expect(host.state.runner.heap).toEqual([]);
    expect(host.state.runner.credits).toBe(6);
    expect(host.legalAction.payload).toEqual({});
  });

  it("retains selected HQ cards, discards the rest, and pays stable cost", () => {
    const keep = "keep" as CardInstanceId;
    const discard = "discard" as CardInstanceId;
    const host = makeHost({ corpHq: [keep, discard] });

    startCorpHqRetainPaymentChoice(host, sourceId);
    host.playerAction = playerAction([`card_${keep}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.hq).toEqual([keep]);
    expect(host.state.corp.archives).toEqual([discard]);
    expect(host.state.corp.credits).toBe(4);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
      retainedCount: 1,
      discardedCount: 1,
      paidCredits: 2,
    });
  });

  it("handles Social Engineering hide, wrong guess, and target callback without running itself", () => {
    const ice = "ice_1" as CardInstanceId;
    const calls: Array<{ serverId: string; iceId: CardInstanceId }> = [];
    const server = {
      id: "remote_1" as Exclude<ServerId, "new_remote">,
      kind: "remote",
      label: "Remote 1",
      ice: [ice],
      root: [],
    } as CorpServer;
    const host = makeHost({
      servers: [server],
      runStartCalls: calls,
      definitions: { [sourceId]: definition(socialId, "event", "Social") },
    });

    startSecretSpendGuessThenTargetedBypassRunHideChoice(host, sourceId);
    host.playerAction = playerAction(["hide_3"]);
    handleHiddenZoneNonSearchChoice(host);
    expect(host.state.activeSide).toBe("corp");
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual([2, 3, 4, 5, 6]);

    host.playerAction = playerAction(["guess_2"]);
    handleHiddenZoneNonSearchChoice(host);
    expect(host.state.pendingChoice?.source).toContain(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target",
    );

    host.playerAction = playerAction([`ice_${ice}`]);
    const result = handleHiddenZoneNonSearchChoice(host);
    expect(result.handled).toBe(true);
    expect(calls).toEqual([{ serverId: "remote_1", iceId: ice }]);
    expect(host.legalAction.payload).toMatchObject({
      autoPassChosenIce: true,
      serverId: "remote_1",
      chosenIcePosition: 0,
    });
  });

  it("keeps fort and position in visible Social Engineering ICE labels without revealing hidden ICE", () => {
    const hiddenIce = "hidden_ice" as CardInstanceId;
    const firstQuandary = "quandary_1" as CardInstanceId;
    const secondQuandary = "quandary_2" as CardInstanceId;
    const server = {
      id: "hq",
      kind: "hq",
      label: "HQ",
      ice: [hiddenIce, firstQuandary, secondQuandary],
      root: [],
    } as CorpServer;
    const host = makeHost({
      servers: [server],
      definitions: { [sourceId]: definition(socialId, "event", "Social") },
    });
    host.servers.publicServerLabel = () => "HQ";
    host.servers.iceChoiceLabelForSide = (cardId, _side, fallback) =>
      cardId === hiddenIce
        ? { label: fallback, publicLabel: fallback }
        : { label: "Quandary", publicLabel: "Quandary" };

    startSecretSpendGuessThenTargetedBypassRunHideChoice(host, sourceId);
    host.playerAction = playerAction(["hide_3"]);
    handleHiddenZoneNonSearchChoice(host);
    host.playerAction = playerAction(["guess_2"]);
    handleHiddenZoneNonSearchChoice(host);

    expect(host.state.pendingChoice?.options).toEqual([
      {
        id: `ice_${hiddenIce}`,
        label: "HQ ICE 1",
        publicLabel: "HQ ICE 1",
        value: `hq|${hiddenIce}`,
      },
      {
        id: `ice_${firstQuandary}`,
        label: "Quandary (HQ ICE 2)",
        publicLabel: "HQ ICE 2",
        value: `hq|${firstQuandary}`,
      },
      {
        id: `ice_${secondQuandary}`,
        label: "Quandary (HQ ICE 3)",
        publicLabel: "HQ ICE 3",
        value: `hq|${secondQuandary}`,
      },
    ]);
  });
});
