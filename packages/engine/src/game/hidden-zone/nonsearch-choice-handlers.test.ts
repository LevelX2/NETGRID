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
import { describe, expect, it } from "vitest";
import {
  handleHiddenZoneNonSearchChoice,
  startCorpArchivesToHqChoice,
  startRunnerGripTrashForCreditsChoice,
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
  startSynchronizedAttackOnHqRetainChoice,
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

function makeHost(input: {
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
  runStartCalls?: Array<{ serverId: string; iceId: CardInstanceId }>;
} = {}): HiddenZoneNonSearchChoiceHandlerHost {
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
    constants: {
      corpArchivesToHqOperationCardId: offSiteId,
      runAccessPressureEventCardId: socialId,
    },
    cards: {
      definitionFor: (cardId) => definitions[cardId] ?? definition(cardId),
      hasCorpUtilityKind: () => false,
      mustInstance: (cardId) => {
        const found = cardInstances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
      smithsPawnshopGainCredits: () => 2,
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
        const server = state.corp.servers.find((candidate) => candidate.id === serverId);
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
      startRunWithAutoPass: (serverId, iceId) => {
        input.runStartCalls?.push({ serverId, iceId });
      },
    },
  };
}

describe("hidden-zone nonsearch choice handlers", () => {
  it("starts and resolves Corp Archives-to-HQ without public card identity payload", () => {
    const archived = "archived" as CardInstanceId;
    const host = makeHost({ corpArchives: [sourceId, archived] });

    startCorpArchivesToHqChoice(host, sourceId);
    expect(host.state.pendingChoice?.source).toContain("v1922.corp_archives_to_hq");

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

  it("retains selected HQ cards, discards the rest, and pays stable cost", () => {
    const keep = "keep" as CardInstanceId;
    const discard = "discard" as CardInstanceId;
    const host = makeHost({ corpHq: [keep, discard] });

    startSynchronizedAttackOnHqRetainChoice(host, sourceId);
    host.playerAction = playerAction([`card_${keep}`]);
    const result = handleHiddenZoneNonSearchChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.hq).toEqual([keep]);
    expect(host.state.corp.archives).toEqual([discard]);
    expect(host.state.corp.credits).toBe(4);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
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

    host.playerAction = playerAction(["guess_1"]);
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
});
