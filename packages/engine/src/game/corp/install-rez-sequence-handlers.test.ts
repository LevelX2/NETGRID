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
  handleCorpInstallRezSequenceChoice,
  resolveSecurityPurgeAgendaPurge,
  startDataFortReclamationChoice,
  startPriorityRequisitionChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "./install-rez-sequence-handlers";

const DATA_FORT_SEQUENCE = {
  kind: "score_install_hq_cards_into_new_remote_then_rez",
  sourceZone: "hq",
  targetServer: "new_remote",
  allowedCards: "corp_installable",
  maxCards: 4,
  temporaryCredits: {
    amount: 10,
    usableFor: "rez_installed_cards_from_sequence",
    returnUnused: true,
  },
  optionalRez: true,
  visibility: "hidden_info_barrier",
} as const;

function definition(
  id: string,
  type: CardDefinition["type"],
  title = id,
  rezCost = 0,
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    type,
    title,
    rezCost,
  } as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId = cardId as unknown as CardDefinitionId,
  zone: CardInstance["zone"] = { side: "corp", zone: "hq" },
): CardInstance {
  return {
    id: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    faceup: false,
    rezzed: false,
    zone,
  } as unknown as CardInstance;
}

function playerAction(optionIds: string[]): PlayerAction {
  return {
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function selectCardsChoice(
  source: string,
  ids: CardInstanceId[],
  maxSelections = ids.length,
): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "corp",
    source,
    prompt: "Choice",
    kind: "select_cards",
    options: ids.map((cardId) => ({
      id: `card_${cardId}`,
      label: cardId,
      value: cardId,
    })),
    minSelections: 0,
    maxSelections,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };
}

type MakeHostInput = {
  hq?: CardInstanceId[];
  rd?: CardInstanceId[];
  archives?: CardInstanceId[];
  scoreArea?: CardInstanceId[];
  servers?: CorpServer[];
  pendingChoice?: ChoiceRequest;
  playerAction?: PlayerAction;
  definitions?: Record<string, CardDefinition>;
  scoredKinds?: Record<string, string>;
  scoredAgendas?: Record<string, unknown>;
  rezRootCalls?: CardInstanceId[];
};

function makeHost(
  input: MakeHostInput = {},
): CorpInstallRezSequenceHandlerHost {
  const definitions: Record<string, CardDefinition> = {
    data_fort_agenda: definition(
      "score_install_hq_cards_into_new_remote_then_rez",
      "agenda",
      "Data Fort Reclamation",
    ),
    priority_agenda: definition(
      "priority_requisition",
      "agenda",
      "Priority Requisition",
    ),
    security_purge_agenda: definition(
      "security_purge",
      "agenda",
      "Security Purge",
    ),
    ice_1: definition("ice_1_def", "ice", "ICE 1", 3),
    ice_2: definition("ice_2_def", "ice", "ICE 2", 4),
    asset_1: definition("asset_1_def", "asset", "Asset 1", 6),
    asset_2: definition("asset_2_def", "asset", "Asset 2", 1),
    upgrade_1: definition("upgrade_1_def", "upgrade", "Upgrade 1", 2),
    operation_1: definition("operation_1_def", "operation", "Operation 1"),
    ...input.definitions,
  };
  const servers = input.servers ?? [];
  const allIds = [
    ...(input.hq ?? []),
    ...(input.rd ?? []),
    ...(input.archives ?? []),
    ...(input.scoreArea ?? []),
    ...servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
  const cardInstances: Record<string, CardInstance> = Object.fromEntries(
    allIds.map((cardId) => [
      cardId,
      instance(
        cardId,
        definitions[cardId]?.id ?? (cardId as unknown as CardDefinitionId),
        zoneFor(cardId, input, servers),
      ),
    ]),
  );
  const legalAction = { side: "corp", payload: {} } as LegalAction;
  const scoredAgendas: Record<string, unknown> = {
    data_fort_agenda: DATA_FORT_SEQUENCE,
    priority_agenda: {
      kind: "score_rez_installed_ice_at_no_cost",
      visibility: "hidden_info_barrier",
    },
    security_purge_agenda: {
      kind: "reveal_top_rd_install_and_rez_ice_trash_rest",
      visibility: "hidden_info_barrier",
    },
    ...input.scoredAgendas,
  };
  const state = {
    stateVersion: 7,
    pendingChoice: input.pendingChoice,
    cardInstances,
    corp: {
      credits: 5,
      hq: input.hq ?? [],
      rd: input.rd ?? [],
      archives: input.archives ?? [],
      scoreArea: input.scoreArea ?? [],
      servers,
    },
  } as unknown as CorpInstallRezSequenceHandlerHost["state"];
  const rezRootCalls = input.rezRootCalls ?? [];
  return {
    state,
    legalAction,
    ...(input.playerAction ? { playerAction: input.playerAction } : {}),
    cards: {
      definitionFor: (cardId) =>
        definitions[cardId] ?? definition(cardId, "operation"),
      mustInstance: (cardId) => {
        const found = cardInstances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
      scoredAgendaKind: (cardId) =>
        input.scoredKinds?.[cardId] ??
        (scoredAgendas[cardId] as { kind?: string } | undefined)?.kind,
      scoredAgendaForCard: (cardId) =>
        scoredAgendas[cardId] as ReturnType<
          CorpInstallRezSequenceHandlerHost["cards"]["scoredAgendaForCard"]
        >,
      isCorpInstallableCardType: (cardDefinition) =>
        cardDefinition.type === "ice" ||
        cardDefinition.type === "asset" ||
        cardDefinition.type === "agenda" ||
        cardDefinition.type === "upgrade",
      canInstallCorpRootCardInServer: (cardDefinition, server) => {
        if (cardDefinition.type === "upgrade")
          return server.kind !== "archives";
        if (
          server.kind !== "remote" ||
          (cardDefinition.type !== "asset" && cardDefinition.type !== "agenda")
        )
          return false;
        const rootMainCount = server.root.filter((cardId) => {
          const definition = definitions[cardId];
          return definition?.type === "asset" || definition?.type === "agenda";
        }).length;
        if (rootMainCount === 0) return true;
        return (
          cardDefinition.type === "agenda" &&
          !server.root.some((cardId) => definitions[cardId]?.type === "agenda")
        );
      },
      rezCostForCard: (cardId) => definitions[cardId]?.rezCost ?? 0,
      isPriorityRequisitionCandidate: (cardId) => {
        const cardInstance = cardInstances[cardId];
        return (
          cardInstance?.zone.side === "corp" &&
          cardInstance.zone.zone === "serverIce" &&
          !cardInstance.rezzed
        );
      },
    },
    zones: {
      removeFromAllZones: (cardId) => {
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
        state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
        for (const server of state.corp.servers) {
          server.ice = server.ice.filter((id) => id !== cardId);
          server.root = server.root.filter((id) => id !== cardId);
        }
      },
      moveCardToArchivesFaceup: (cardId) => {
        state.corp.archives.unshift(cardId);
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "archives" },
        };
      },
    },
    servers: {
      createRemote: () => {
        const nextRemoteNumber =
          state.corp.servers.filter((server) => server.kind === "remote")
            .length + 1;
        const server = {
          id: `remote_${nextRemoteNumber}` as Exclude<ServerId, "new_remote">,
          label: `Remote ${nextRemoteNumber}`,
          kind: "remote",
          ice: [],
          root: [],
        } as CorpServer;
        state.corp.servers.push(server);
        return server;
      },
      mustServer: (serverId) => {
        const found = state.corp.servers.find(
          (server) => server.id === serverId,
        );
        if (!found) throw new Error(`missing server ${serverId}`);
        return found;
      },
    },
    credits: {
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
    },
    callbacks: {
      resolveCorpRootRez: (cardId) => {
        rezRootCalls.push(cardId);
      },
    },
  };
}

function zoneFor(
  cardId: CardInstanceId,
  input: MakeHostInput,
  servers: CorpServer[],
): CardInstance["zone"] {
  if ((input.rd ?? []).includes(cardId)) return { side: "corp", zone: "rd" };
  if ((input.archives ?? []).includes(cardId))
    return { side: "corp", zone: "archives" };
  if ((input.scoreArea ?? []).includes(cardId))
    return { side: "corp", zone: "scoreArea" };
  for (const server of servers) {
    if (server.ice.includes(cardId))
      return { side: "corp", zone: "serverIce", serverId: server.id };
    if (server.root.includes(cardId))
      return { side: "corp", zone: "serverRoot", serverId: server.id };
  }
  return { side: "corp", zone: "hq" };
}

describe("corp install rez sequence handlers", () => {
  it("starts Data Fort Reclamation with stable HQ install candidates", () => {
    const host = makeHost({
      hq: ["operation_1", "asset_1", "ice_1"] as CardInstanceId[],
    });

    startDataFortReclamationChoice(host, "data_fort_agenda" as CardInstanceId);

    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
    );
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(["asset_1", "ice_1"]);
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationAbilityId:
        "score_install_hq_cards_into_new_remote_then_rez:hq_to_new_remote_install_rez:0",
      cardImplementationAbilityKey: "hq_to_new_remote_install_rez:0",
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceCardId: "data_fort_agenda",
      sourceDefinitionId: "score_install_hq_cards_into_new_remote_then_rez",
      sourceAgendaId: "data_fort_agenda",
      cardImplementationSourceZone: "hq",
      cardImplementationTargetServer: "new_remote",
      cardImplementationAllowedCards: "corp_installable",
      cardImplementationMaxCards: 4,
      cardImplementationTemporaryCreditBudget: 10,
      hiddenZoneAction: "v1922_data_fort_reclamation_hq_choice",
      dataFortReclamationCandidateCount: 2,
      dataFortReclamationMaxSelections: 2,
    });
  });

  it("installs selected Data Fort Reclamation HQ cards in selected order", () => {
    const host = makeHost({
      hq: ["asset_1", "ice_1", "upgrade_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["asset_1", "ice_1", "upgrade_1"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction(["card_ice_1", "card_asset_1"]),
    });

    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.handled).toBe(true);
    expect(result.selectedCardIds).toEqual(["ice_1", "asset_1"]);
    expect(result.installedCardIds).toEqual(["ice_1", "asset_1"]);
    expect(host.state.corp.hq).toEqual(["upgrade_1"]);
    expect(host.state.corp.servers[0]?.ice).toEqual(["ice_1"]);
    expect(host.state.corp.servers[0]?.root).toEqual(["asset_1"]);
    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:8",
    );
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceAgendaId: "data_fort_agenda",
      hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
      selectedCount: 2,
      installedIceCount: 1,
      installedRootCount: 1,
      createdServerId: "remote_1",
      cardImplementationSequenceCreatedServerId: "remote_1",
      cardImplementationTemporaryCreditBudget: 10,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("upgrade_1");
  });

  it("resolves empty Data Fort Reclamation selection without creating a remote", () => {
    const host = makeHost({
      hq: ["asset_1", "ice_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["asset_1", "ice_1"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction([]),
    });

    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.handled).toBe(true);
    expect(result.deletePendingChoice).toBe(true);
    expect(result.createdServerId).toBeUndefined();
    expect(result.selectedCardIds).toEqual([]);
    expect(result.installedCardIds).toEqual([]);
    expect(result.temporaryCreditsReturned).toBe(10);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.corp.hq).toEqual(["asset_1", "ice_1"]);
    expect(host.state.corp.servers).toEqual([]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
      selectedCount: 0,
      installedCount: 0,
      installedIceCount: 0,
      installedRootCount: 0,
      cardImplementationTemporaryCreditBudget: 10,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
      temporaryCreditsReturned: 10,
      dataFortReclamationRezChoiceOpened: false,
      dataFortReclamationRezCandidateCount: 0,
    });
    expect(host.legalAction.payload).not.toHaveProperty("createdServerId");
    expect(host.legalAction.payload).not.toHaveProperty(
      "cardImplementationSequenceCreatedServerId",
    );
  });

  it("rejects invalid Data Fort Reclamation root selections without partial mutation", () => {
    const host = makeHost({
      hq: ["asset_1", "asset_2", "ice_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["asset_1", "asset_2", "ice_1"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction(["card_asset_1", "card_asset_2"]),
    });
    const hqBefore = [...host.state.corp.hq];
    const serversBefore = structuredClone(host.state.corp.servers);
    const cardInstancesBefore = structuredClone(host.state.cardInstances);
    const pendingChoiceBefore = structuredClone(host.state.pendingChoice);

    expect(() => handleCorpInstallRezSequenceChoice(host)).toThrow(
      "Diese Root-Karte kann nicht in das neue Remote.",
    );

    expect(host.state.corp.hq).toEqual(hqBefore);
    expect(host.state.corp.servers).toEqual(serversBefore);
    expect(host.state.cardInstances).toEqual(cardInstancesBefore);
    expect(host.state.pendingChoice).toEqual(pendingChoiceBefore);
    expect(host.legalAction.payload).toEqual({});
  });

  it("rejects Data Fort Reclamation non-HQ and over-limit selections", () => {
    const overLimitHost = makeHost({
      hq: ["asset_1", "ice_1", "upgrade_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "v1922.data_fort_reclamation:data_fort_agenda:8",
        [
          "asset_1",
          "ice_1",
          "upgrade_1",
          "extra_1",
          "extra_2",
        ] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction([
        "card_asset_1",
        "card_ice_1",
        "card_upgrade_1",
        "card_extra_1",
        "card_extra_2",
      ]),
    });
    expect(() => handleCorpInstallRezSequenceChoice(overLimitHost)).toThrow(
      "Das HQ-to-new-remote-Install-Primitive darf hoechstens vier HQ-Karten waehlen.",
    );

    const nonHqHost = makeHost({
      hq: ["asset_1"] as CardInstanceId[],
      rd: ["ice_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "v1922.data_fort_reclamation:data_fort_agenda:8",
        ["ice_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_ice_1"]),
    });
    expect(() => handleCorpInstallRezSequenceChoice(nonHqHost)).toThrow(
      "Eine gewaehlte Karte liegt nicht mehr in HQ.",
    );
  });

  it("resolves Data Fort Reclamation rez with temporary credits before corp credits", () => {
    const rezRootCalls: CardInstanceId[] = [];
    const server = {
      id: "remote_1" as Exclude<ServerId, "new_remote">,
      label: "Remote 1",
      kind: "remote",
      ice: ["ice_1" as CardInstanceId],
      root: ["asset_1" as CardInstanceId],
    } as CorpServer;
    const host = makeHost({
      hq: [],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      servers: [server],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:8",
        ["ice_1", "asset_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_ice_1", "card_asset_1"]),
      rezRootCalls,
    });

    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.handled).toBe(true);
    expect(result.rezzedCardIds).toEqual(["ice_1", "asset_1"]);
    expect(host.state.corp.credits).toBe(5);
    expect(rezRootCalls).toEqual(["asset_1"]);
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceAgendaId: "data_fort_agenda",
      hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
      cardImplementationSequenceCreatedServerId: "remote_1",
      cardImplementationTemporaryCreditBudget: 10,
      selectedCount: 2,
      rezzedCount: 2,
      rezzedIceCount: 1,
      rezzedRootCount: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 9,
      temporaryCreditsRemaining: 1,
      corpCreditsSpent: 0,
      corpCreditsAfter: 5,
    });
  });

  it("opens Security Purge target choices for each revealed ICE", () => {
    const servers = [
      { id: "hq", label: "HQ", kind: "hq", ice: [], root: [] },
      { id: "rd", label: "R&D", kind: "rd", ice: [], root: [] },
      {
        id: "archives",
        label: "Archives",
        kind: "archives",
        ice: [],
        root: [],
      },
      {
        id: "remote_1",
        label: "Remote 1",
        kind: "remote",
        ice: [],
        root: [],
      },
    ] as CorpServer[];
    const host = makeHost({
      rd: ["ice_1", "operation_1", "ice_2", "asset_1"] as CardInstanceId[],
      scoreArea: ["security_purge_agenda"] as CardInstanceId[],
      servers,
    });

    const result = resolveSecurityPurgeAgendaPurge(
      host,
      "security_purge_agenda" as CardInstanceId,
    );

    expect(result.installedCardIds).toBeUndefined();
    expect(host.state.corp.rd).toEqual([
      "ice_1",
      "operation_1",
      "ice_2",
      "asset_1",
    ]);
    expect(host.state.corp.archives).toEqual([]);
    expect(host.state.pendingChoice).toMatchObject({
      side: "corp",
      source:
        "v1922.security_purge_install_targets:security_purge_agenda:ice_1,operation_1,ice_2:8",
      kind: "select_option",
      minSelections: 2,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
    });
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual([
      "ice_1|hq",
      "ice_1|rd",
      "ice_1|archives",
      "ice_1|remote_1",
      "ice_1|new_remote",
      "ice_2|hq",
      "ice_2|rd",
      "ice_2|archives",
      "ice_2|remote_1",
      "ice_2|new_remote",
    ]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_security_purge_rd_top3_target_choice",
      revealedCount: 3,
      revealedIceCount: 2,
      pendingTrashCount: 1,
      installedIceCount: 0,
      trashedCount: 0,
      securityPurgeInstallContract: "corp_server_choice_per_ice",
      securityPurgeTargetChoiceOpened: true,
      publicRevealDefinitionIds: "ice_1_def,operation_1_def,ice_2_def",
    });
  });

  it("resolves Security Purge target choices into chosen servers and archives rest", () => {
    const servers = [
      { id: "hq", label: "HQ", kind: "hq", ice: [], root: [] },
      { id: "rd", label: "R&D", kind: "rd", ice: [], root: [] },
      {
        id: "archives",
        label: "Archives",
        kind: "archives",
        ice: [],
        root: [],
      },
      {
        id: "remote_1",
        label: "Remote 1",
        kind: "remote",
        ice: [],
        root: [],
      },
    ] as CorpServer[];
    const host = makeHost({
      rd: ["ice_1", "operation_1", "ice_2", "asset_1"] as CardInstanceId[],
      scoreArea: ["security_purge_agenda"] as CardInstanceId[],
      servers,
    });
    resolveSecurityPurgeAgendaPurge(
      host,
      "security_purge_agenda" as CardInstanceId,
    );
    const rdOption = host.state.pendingChoice?.options.find(
      (option) => option.value === "ice_1|rd",
    )?.id;
    const newRemoteOption = host.state.pendingChoice?.options.find(
      (option) => option.value === "ice_2|new_remote",
    )?.id;
    expect(rdOption).toBeDefined();
    expect(newRemoteOption).toBeDefined();
    host.playerAction = playerAction([rdOption!, newRemoteOption!]);
    host.legalAction.payload = {};

    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.installedCardIds).toEqual(["ice_1", "ice_2"]);
    expect(result.rezzedCardIds).toEqual(["ice_1", "ice_2"]);
    expect(result.trashedCardIds).toEqual(["operation_1"]);
    expect(result.deletePendingChoice).toBe(true);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.corp.rd).toEqual(["asset_1"]);
    expect(host.state.corp.archives).toEqual(["operation_1"]);
    expect(
      host.state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toEqual(["ice_1"]);
    expect(
      host.state.corp.servers.find((server) => server.id === "remote_2")?.ice,
    ).toEqual(["ice_2"]);
    expect(host.state.cardInstances.ice_1?.rezzed).toBe(true);
    expect(host.state.cardInstances.ice_1?.zone).toEqual({
      side: "corp",
      zone: "serverIce",
      serverId: "rd",
    });
    expect(host.state.cardInstances.ice_2?.rezzed).toBe(true);
    expect(host.state.cardInstances.ice_2?.zone).toEqual({
      side: "corp",
      zone: "serverIce",
      serverId: "remote_2",
    });
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_security_purge_install_targets",
      revealedCount: 3,
      revealedIceCount: 2,
      installedIceCount: 2,
      trashedCount: 1,
      securityPurgeInstallContract: "corp_server_choice_per_ice",
      securityPurgeTargetChoiceResolved: true,
      publicRevealDefinitionIds: "ice_1_def,operation_1_def,ice_2_def",
      installedIceDefinitionIds: "ice_1_def,ice_2_def",
      installedIceServerLabels: "R&D,Remote 2",
      trashedDefinitionIds: "operation_1_def",
    });
  });

  it("starts and resolves Priority Requisition free rez without normal rez cost", () => {
    const server = {
      id: "remote_1" as Exclude<ServerId, "new_remote">,
      label: "Remote 1",
      kind: "remote",
      ice: ["ice_1" as CardInstanceId],
      root: [],
    } as CorpServer;
    const host = makeHost({
      scoreArea: ["priority_agenda"] as CardInstanceId[],
      servers: [server],
      scoredKinds: {
        priority_agenda: "score_rez_installed_ice_at_no_cost",
      },
    });

    startPriorityRequisitionChoice(host, "priority_agenda" as CardInstanceId);
    expect(host.state.pendingChoice?.source).toBe(
      "v162.priority_requisition:priority_agenda:8",
    );

    host.playerAction = playerAction(["card_ice_1"]);
    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.rezzedCardIds).toEqual(["ice_1"]);
    expect(host.state.cardInstances.ice_1?.rezzed).toBe(true);
    expect(host.state.corp.credits).toBe(5);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v162_priority_requisition_free_rez",
      priorityRequisitionFreeRez: true,
      priorityRequisitionTarget: "ice_1",
      priorityRequisitionTargetDefinitionId: "ice_1_def",
      rezCostPaid: 0,
    });
  });

  it("rejects Priority Requisition non-rezzable targets", () => {
    const server = {
      id: "remote_1" as Exclude<ServerId, "new_remote">,
      label: "Remote 1",
      kind: "remote",
      ice: [],
      root: ["asset_1" as CardInstanceId],
    } as CorpServer;
    const host = makeHost({
      scoreArea: ["priority_agenda"] as CardInstanceId[],
      servers: [server],
      scoredKinds: {
        priority_agenda: "score_rez_installed_ice_at_no_cost",
      },
      pendingChoice: selectCardsChoice(
        "v162.priority_requisition:priority_agenda:8",
        ["asset_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_asset_1"]),
    });

    expect(() => handleCorpInstallRezSequenceChoice(host)).toThrow(
      "Das Priority-Requisition-Ziel ist nicht mehr gueltig.",
    );
  });
});
