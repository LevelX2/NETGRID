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
import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleCorpInstallRezSequenceChoice,
  resolveAgendaPurgeInstallTargets,
  startHqToNewRemoteInstallRezChoice,
  startScoredAgendaFreeRezChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "./install-rez-sequence-handlers";

const DATA_FORT_RECLAMATION_DEFINITION_ID =
  "onr_v1_197_data-fort-reclamation" as CardDefinitionId;
const DATA_FORT_RECLAMATION_CAPABILITY_KEY = "hq_to_new_remote_install_rez";

const DATA_FORT_SEQUENCE = {
  capabilityKey: DATA_FORT_RECLAMATION_CAPABILITY_KEY,
  kind: "score_install_hq_cards_into_new_remote_then_rez",
  sourceZone: "hq",
  targetServer: "new_remote",
  allowedCards: "corp_installable",
  maxCards: 4,
  temporaryCredits: {
    amount: 10,
    usableFor: "install_and_rez_cards_from_sequence",
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
  subtypes: string[] = [],
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    type,
    title,
    rezCost,
    subtypes,
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
    ...(source.includes("hq_to_new_remote_install_rez") ||
    source.includes("score_install_hq_cards_into_new_remote_then_rez")
      ? {
          sourceCardInstanceId: "data_fort_agenda",
          sourceCardDefinitionId: DATA_FORT_RECLAMATION_DEFINITION_ID,
        }
      : {}),
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
  successfulCorpInstallCounter?: { count: number };
  optionalRezContinuationProjection?: () => {
    complete: boolean;
    executable: boolean;
  };
  canEffectDrivenInstallRez?: (
    cardId: CardInstanceId,
    serverId: string,
    variantId: string,
  ) => boolean;
};

function makeHost(
  input: MakeHostInput = {},
): CorpInstallRezSequenceHandlerHost {
  const definitions: Record<string, CardDefinition> = {
    data_fort_agenda: definition(
      DATA_FORT_RECLAMATION_DEFINITION_ID,
      "agenda",
      "Data Fort Reclamation",
    ),
    priority_agenda: definition(
      "scored_agenda_free_rez",
      "agenda",
      "Priority Requisition",
    ),
    agenda_purge_agenda: definition("agenda_purge", "agenda", "Security Purge"),
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
    agenda_purge_agenda: {
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
      isRegionUpgrade: (cardDefinition) =>
        cardDefinition.subtypes?.includes("region") ?? false,
      rootInstallRezzesOnInstall: (cardDefinition) =>
        (cardDefinition.subtypes?.includes("region") ?? false) ||
        cardDefinition.id === "forced_rez_root_def",
      isScoredAgendaFreeRezCandidate: (cardId) => {
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
      trashOlderRegionUpgradesInServer: (server, keepCardId) => {
        const olderRegions = server.root.filter((cardId) => {
          if (cardId === keepCardId) return false;
          const definition = definitions[cardId];
          return definition?.subtypes?.includes("region") ?? false;
        });
        server.root = server.root.filter(
          (cardId) => !olderRegions.includes(cardId),
        );
        for (const cardId of olderRegions) {
          state.corp.archives.unshift(cardId);
          state.cardInstances[cardId] = {
            ...cardInstances[cardId]!,
            faceup: true,
            rezzed: true,
            zone: { side: "corp", zone: "archives" },
          };
        }
      },
    },
    credits: {
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
    },
    callbacks: {
      payHqInstallCost: (cardId, server, temporaryCreditsAvailable) => {
        const installCost =
          definitions[cardId]?.type === "ice" ? server.ice.length : 0;
        const temporaryCreditsSpent = Math.min(
          installCost,
          temporaryCreditsAvailable,
        );
        const corpCreditsSpent = installCost - temporaryCreditsSpent;
        if (state.corp.credits < corpCreditsSpent)
          throw new Error("test install is unpayable");
        state.corp.credits -= corpCreditsSpent;
        return {
          temporaryCreditsSpent,
          temporaryCreditsRemaining:
            temporaryCreditsAvailable - temporaryCreditsSpent,
          corpCreditsSpent,
        };
      },
      recordSuccessfulCorpInstall: () => {
        if (input.successfulCorpInstallCounter)
          input.successfulCorpInstallCounter.count += 1;
      },
      finalizeCorpInstallAfterExternalPayment: (cardId, server) => {
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        const cardDefinition = definitions[cardId];
        if (cardDefinition?.type === "ice") server.ice.push(cardId);
        else server.root.push(cardId);
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: false,
          rezzed: false,
          zone:
            cardDefinition?.type === "ice"
              ? { side: "corp", zone: "serverIce", serverId: server.id }
              : { side: "corp", zone: "serverRoot", serverId: server.id },
        };
        if (cardDefinition?.subtypes?.includes("region")) {
          const olderRegions = server.root.filter(
            (candidateId) =>
              candidateId !== cardId &&
              definitions[candidateId]?.subtypes?.includes("region"),
          );
          server.root = server.root.filter(
            (candidateId) => !olderRegions.includes(candidateId),
          );
          for (const olderId of olderRegions) {
            state.corp.archives.unshift(olderId);
            state.cardInstances[olderId] = {
              ...cardInstances[olderId]!,
              faceup: true,
              rezzed: true,
              zone: { side: "corp", zone: "archives" },
            };
          }
        }
      },
      resolveCorpRootRez: (cardId) => {
        rezRootCalls.push(cardId);
      },
      preflightMandatoryHqInstallRez: (
        selectedCardIds,
        temporaryCreditsAvailable,
      ) => {
        let temporaryCreditsRemaining = temporaryCreditsAvailable;
        let corpCreditsRemaining = state.corp.credits;
        for (const cardId of selectedCardIds) {
          const cardDefinition = definitions[cardId];
          if (
            !cardDefinition ||
            (!cardDefinition.subtypes?.includes("region") &&
              cardDefinition.id !== "forced_rez_root_def")
          )
            continue;
          const finalCredits = cardDefinition.rezCost ?? 0;
          const temporaryCreditsSpent = Math.min(
            temporaryCreditsRemaining,
            finalCredits,
          );
          const corpCreditsSpent = finalCredits - temporaryCreditsSpent;
          if (corpCreditsRemaining < corpCreditsSpent)
            throw new Error("mandatory test rez is unpayable");
          temporaryCreditsRemaining -= temporaryCreditsSpent;
          corpCreditsRemaining -= corpCreditsSpent;
        }
      },
      projectHqInstallRezOptionQuote: (choice, option) => {
        const sequence = state.hqInstallRezSequence;
        const cardId = sequence?.selectedCardIds[sequence.nextCardIndex - 1];
        const cardDefinition = cardId ? definitions[cardId] : undefined;
        const cardInstance = cardId ? cardInstances[cardId] : undefined;
        if (
          !sequence ||
          !cardId ||
          !cardDefinition ||
          !cardInstance ||
          option.value !== cardId ||
          (cardInstance.zone.zone !== "serverIce" &&
            cardInstance.zone.zone !== "serverRoot")
        )
          return undefined;
        const finalCredits = cardDefinition.rezCost ?? 0;
        const temporaryCreditsApplied = Math.min(
          sequence.temporaryCreditsRemaining,
          finalCredits,
        );
        const regularCreditsRequired = finalCredits - temporaryCreditsApplied;
        const creditPayable = state.corp.credits >= regularCreditsRequired;
        return {
          schemaVersion: CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
          kind: CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
          context: "hq_to_new_remote_optional_rez",
          choiceId: choice.choiceId,
          optionId: option.id,
          sourceAgendaId: sequence.sourceAgendaId,
          cardId,
          cardDefinitionId: cardDefinition.id,
          targetServerId: sequence.serverId,
          installedZone: cardInstance.zone.zone,
          sequencePosition: sequence.nextCardIndex,
          stateVersion: choice.stateVersion,
          complete: true,
          cardType: cardDefinition.type as "ice" | "asset" | "upgrade",
          baseCredits: finalCredits,
          finalCredits,
          mandatoryAdditionalCosts: { agendaPoints: 0 },
          temporaryCreditsAvailable: sequence.temporaryCreditsRemaining,
          temporaryCreditsApplied,
          regularCreditsAvailable: state.corp.credits,
          regularCreditsRequired,
          creditPayable,
          additionalCostsPayable: true,
          affordable: creditPayable,
          mandatoryContinuationComplete:
            sequence.optionalRezContinuationProjection?.complete ?? false,
          rezAndMandatoryContinuationExecutable:
            creditPayable &&
            (sequence.optionalRezContinuationProjection?.complete ?? false) &&
            (sequence.optionalRezContinuationProjection?.executable ?? false),
        };
      },
      projectMandatoryHqInstallContinuationAfterOptionalRez: () =>
        input.optionalRezContinuationProjection?.() ?? {
          complete: true,
          executable: true,
        },
      payAndFinalizeHqInstallRezOption: (cardId, quote) => {
        state.corp.credits -= quote.regularCreditsRequired;
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: true,
          rezzed: true,
        };
        if (quote.cardType !== "ice") rezRootCalls.push(cardId);
        return {
          temporaryCreditsSpent: quote.temporaryCreditsApplied,
          temporaryCreditsRemaining:
            quote.temporaryCreditsAvailable - quote.temporaryCreditsApplied,
          corpCreditsSpent: quote.regularCreditsRequired,
        };
      },
      payAndFinalizeMandatoryHqInstallRez: (
        cardId,
        temporaryCreditsAvailable,
      ) => {
        const finalCredits = definitions[cardId]?.rezCost ?? 0;
        const temporaryCreditsSpent = Math.min(
          temporaryCreditsAvailable,
          finalCredits,
        );
        const corpCreditsSpent = finalCredits - temporaryCreditsSpent;
        if (state.corp.credits < corpCreditsSpent)
          throw new Error("mandatory test rez is unpayable");
        state.corp.credits -= corpCreditsSpent;
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: true,
          rezzed: true,
        };
        rezRootCalls.push(cardId);
        return {
          temporaryCreditsSpent,
          temporaryCreditsRemaining:
            temporaryCreditsAvailable - temporaryCreditsSpent,
          corpCreditsSpent,
        };
      },
      effectDrivenRezVariants: (cardId) => [
        {
          variantId: "fixed",
          label: definitions[cardId]?.title ?? cardId,
          additionalCreditCost: 0,
          payload: { cardId },
        },
      ],
      rezInstalledIceWaivingBaseCost: (cardId, variantId) => {
        if (variantId !== "fixed") throw new Error("unknown test variant");
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: true,
          rezzed: true,
        };
        return {
          installCreditsPaid: 0,
          rezAdditionalCreditsPaid: 0,
          rezAgendaPointsPaid: 0,
          installed: true,
          rezzed: true,
        };
      },
      installAndRezIceWaivingBaseCosts: (cardId, server, variantId) => {
        if (variantId !== "fixed") throw new Error("unknown test variant");
        state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
        server.ice.push(cardId);
        state.cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "serverIce", serverId: server.id },
        };
        if (input.successfulCorpInstallCounter)
          input.successfulCorpInstallCounter.count += 1;
        return {
          installCreditsPaid: 0,
          rezAdditionalCreditsPaid: 0,
          rezAgendaPointsPaid: 0,
          installed: true,
          rezzed: true,
        };
      },
      preflightInstallAndRezIceWaivingBaseCosts: () => undefined,
      canInstallAndRezIceWaivingBaseCosts: (cardId, serverId, variantId) =>
        variantId === "fixed" &&
        (input.canEffectDrivenInstallRez?.(cardId, serverId, variantId) ??
          true),
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

function expectCanonicalDataFortPrimitiveIdentity(payload: unknown): void {
  expect(payload).toMatchObject({
    cardImplementationAbilityId:
      "onr_v1_197_data-fort-reclamation:hq_to_new_remote_install_rez",
    cardImplementationAbilityKey: DATA_FORT_RECLAMATION_CAPABILITY_KEY,
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    sourceDefinitionId: DATA_FORT_RECLAMATION_DEFINITION_ID,
  });
  expect(payload).not.toHaveProperty("cardImplementationAbilityIndex");
  expect(payload).not.toHaveProperty("cardImplementationLifecycleIndex");
  expect(JSON.stringify(payload)).not.toContain(
    "hq_to_new_remote_install_rez:0",
  );
}

describe("corp install rez sequence handlers", () => {
  it("starts Data Fort Reclamation with stable HQ install candidates", () => {
    const host = makeHost({
      hq: ["operation_1", "asset_1", "ice_1"] as CardInstanceId[],
    });

    startHqToNewRemoteInstallRezChoice(
      host,
      "data_fort_agenda" as CardInstanceId,
    );

    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
    );
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(["asset_1", "ice_1"]);
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_v1_197_data-fort-reclamation:hq_to_new_remote_install_rez",
      cardImplementationAbilityKey: DATA_FORT_RECLAMATION_CAPABILITY_KEY,
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceCardId: "data_fort_agenda",
      sourceDefinitionId: DATA_FORT_RECLAMATION_DEFINITION_ID,
      sourceAgendaId: "data_fort_agenda",
      cardImplementationSourceZone: "hq",
      cardImplementationTargetServer: "new_remote",
      cardImplementationAllowedCards: "corp_installable",
      cardImplementationMaxCards: 4,
      cardImplementationTemporaryCreditBudget: 10,
      hiddenZoneAction: "hq_to_new_remote_install_rez_hq_choice",
      hqToNewRemoteInstallRezCandidateCount: 2,
      hqToNewRemoteInstallRezMaxSelections: 2,
    });
    expectCanonicalDataFortPrimitiveIdentity(host.legalAction.payload);
  });

  it("installs and offers to rez each selected Data Fort Reclamation card in selected order", () => {
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

    const firstResult = handleCorpInstallRezSequenceChoice(host);
    expectCanonicalDataFortPrimitiveIdentity(firstResult.resolvedPayload);

    expect(firstResult.handled).toBe(true);
    expect(firstResult.selectedCardIds).toEqual(["ice_1", "asset_1"]);
    expect(firstResult.installedCardIds).toEqual(["ice_1"]);
    expect(host.state.corp.hq).toEqual(["asset_1", "upgrade_1"]);
    expect(host.state.corp.servers[0]?.ice).toEqual(["ice_1"]);
    expect(host.state.corp.servers[0]?.root).toEqual([]);
    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:ice_1:1:8",
    );
    expect(host.state.pendingChoice?.prompt).toBe(
      "Data Fort Reclamation: Karte 1 von 2 rezzen (10 temporäre Credits verfügbar).",
    );
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(["ice_1"]);
    expect(host.state.hqInstallRezSequence).toMatchObject({
      selectedCardIds: ["ice_1", "asset_1"],
      nextCardIndex: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
    });
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceAgendaId: "data_fort_agenda",
      hiddenZoneAction: "hq_to_new_remote_install_sequence",
      selectedCount: 2,
      installedIceCount: 1,
      installedRootCount: 0,
      createdServerId: "remote_1",
      cardImplementationSequenceCreatedServerId: "remote_1",
      cardImplementationTemporaryCreditBudget: 10,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
    });
    expect(JSON.stringify(host.legalAction.payload)).not.toContain("upgrade_1");

    host.playerAction = playerAction(["card_ice_1"]);
    const secondResult = handleCorpInstallRezSequenceChoice(host);
    expectCanonicalDataFortPrimitiveIdentity(secondResult.resolvedPayload);

    expect(secondResult.rezzedCardIds).toEqual(["ice_1"]);
    expect(secondResult.installedCardIds).toEqual(["asset_1"]);
    expect(host.state.corp.hq).toEqual(["upgrade_1"]);
    expect(host.state.corp.servers[0]?.root).toEqual(["asset_1"]);
    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:asset_1:2:8",
    );
  });

  it("pays increasing ICE install costs and records each successful install", () => {
    const successfulCorpInstallCounter = { count: 0 };
    const host = makeHost({
      hq: ["ice_1", "ice_2"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["ice_1", "ice_2"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction(["card_ice_1", "card_ice_2"]),
      successfulCorpInstallCounter,
    });

    handleCorpInstallRezSequenceChoice(host);
    host.playerAction = playerAction([]);
    handleCorpInstallRezSequenceChoice(host);

    expect(host.state.corp.servers[0]?.ice).toEqual(["ice_1", "ice_2"]);
    expect(host.state.hqInstallRezSequence).toMatchObject({
      nextCardIndex: 2,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 9,
    });
    expect(host.state.pendingChoice?.options[0]?.value).toBe("ice_2");
    expect(successfulCorpInstallCounter.count).toBe(2);
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
      hiddenZoneAction: "hq_to_new_remote_install_sequence",
      selectedCount: 0,
      installedCount: 0,
      installedIceCount: 0,
      installedRootCount: 0,
      cardImplementationTemporaryCreditBudget: 10,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
      temporaryCreditsReturned: 10,
      hqToNewRemoteInstallRezRezChoiceOpened: false,
      hqToNewRemoteInstallRezRezCandidateCount: 0,
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
        "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:8",
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
        "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:8",
        ["ice_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_ice_1"]),
    });
    expect(() => handleCorpInstallRezSequenceChoice(nonHqHost)).toThrow(
      "Eine gewaehlte Karte liegt nicht mehr in HQ.",
    );
  });

  it("resolves Data Fort Reclamation required root rez-on-install and region replacement in order", () => {
    const rezRootCalls: CardInstanceId[] = [];
    const host = makeHost({
      hq: ["region_1", "forced_rez_root", "region_2"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      definitions: {
        region_1: definition("region_1_def", "upgrade", "Region 1", 2, [
          "region",
        ]),
        forced_rez_root: definition(
          "forced_rez_root_def",
          "asset",
          "Forced Rez Root",
          3,
        ),
        region_2: definition("region_2_def", "upgrade", "Region 2", 4, [
          "region",
        ]),
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["region_1", "forced_rez_root", "region_2"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction([
        "card_region_1",
        "card_forced_rez_root",
        "card_region_2",
      ]),
      rezRootCalls,
    });

    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.handled).toBe(true);
    expect(result.rezzedCardIds).toEqual([
      "region_1",
      "forced_rez_root",
      "region_2",
    ]);
    expect(host.state.corp.hq).toEqual([]);
    expect(host.state.corp.credits).toBe(5);
    expect(host.state.corp.servers[0]?.root).toEqual([
      "forced_rez_root",
      "region_2",
    ]);
    expect(host.state.corp.archives).toEqual(["region_1"]);
    expect(host.state.cardInstances.region_1?.zone).toEqual({
      side: "corp",
      zone: "archives",
    });
    expect(host.state.cardInstances.region_2).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });
    expect(rezRootCalls).toEqual(["region_1", "forced_rez_root", "region_2"]);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "hq_to_new_remote_install_sequence",
      installedRootCount: 3,
      immediateRezzedCount: 3,
      hqToNewRemoteInstallRezRezChoiceOpened: false,
      hqToNewRemoteInstallRezRezCandidateCount: 0,
      temporaryCreditsSpent: 9,
      temporaryCreditsRemaining: 1,
      temporaryCreditsReturned: 1,
      corpCreditsSpent: 0,
    });
  });

  it("rejects an unaffordable cumulative mandatory root-rez selection before installation", () => {
    const host = makeHost({
      hq: ["region_1", "region_2"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      definitions: {
        region_1: definition("region_1_def", "upgrade", "Region 1", 10, [
          "region",
        ]),
        region_2: definition("region_2_def", "upgrade", "Region 2", 10, [
          "region",
        ]),
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["region_1", "region_2"] as CardInstanceId[],
        4,
      ),
      playerAction: playerAction(["card_region_1", "card_region_2"]),
    });
    const stateBefore = structuredClone(host.state);

    expect(() => handleCorpInstallRezSequenceChoice(host)).toThrow(
      "mandatory test rez is unpayable",
    );
    expect(host.state).toEqual(stateBefore);
    expect(host.state.corp.servers).toEqual([]);
    expect(host.state.corp.hq).toEqual(["region_1", "region_2"]);
  });

  it("continues through Data Fort Reclamation one card at a time after each rez decision", () => {
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
      playerAction: playerAction([
        "card_asset_1",
        "card_ice_1",
        "card_upgrade_1",
      ]),
    });

    const firstResult = handleCorpInstallRezSequenceChoice(host);

    expect(firstResult.handled).toBe(true);
    expect(firstResult.rezzedCardIds).toEqual([]);
    expect(host.state.corp.hq).toEqual(["ice_1", "upgrade_1"]);
    expect(host.state.corp.servers[0]?.root).toEqual(["asset_1"]);
    expect(host.state.corp.servers[0]?.ice).toEqual([]);
    expect(host.state.cardInstances.asset_1).toMatchObject({
      rezzed: false,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });
    expect(host.state.pendingChoice).toMatchObject({
      source:
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:asset_1:1:8",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 1,
    });
    expect(
      host.state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(["asset_1"]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "hq_to_new_remote_install_sequence",
      immediateRezzedCount: 0,
      hqToNewRemoteInstallRezRezChoiceOpened: true,
      hqToNewRemoteInstallRezRezCandidateCount: 1,
      temporaryCreditsSpent: 0,
      temporaryCreditsRemaining: 10,
    });

    host.playerAction = playerAction([]);
    const secondResult = handleCorpInstallRezSequenceChoice(host);
    expect(secondResult.rezzedCardIds).toEqual([]);
    expect(secondResult.installedCardIds).toEqual(["ice_1"]);
    expect(host.state.pendingChoice?.prompt).toBe(
      "Data Fort Reclamation: Karte 2 von 3 rezzen (10 temporäre Credits verfügbar).",
    );
    expect(host.state.corp.hq).toEqual(["upgrade_1"]);

    host.playerAction = playerAction(["card_ice_1"]);
    const thirdResult = handleCorpInstallRezSequenceChoice(host);
    expect(thirdResult.rezzedCardIds).toEqual(["ice_1"]);
    expect(thirdResult.installedCardIds).toEqual(["upgrade_1"]);
    expect(host.state.pendingChoice?.prompt).toBe(
      "Data Fort Reclamation: Karte 3 von 3 rezzen (7 temporäre Credits verfügbar).",
    );
    expect(host.state.corp.hq).toEqual([]);

    host.playerAction = playerAction([]);
    const finalResult = handleCorpInstallRezSequenceChoice(host);
    expect(finalResult.temporaryCreditsReturned).toBe(7);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.hqInstallRezSequence).toBeUndefined();
    expect(host.state.cardInstances.ice_1).toMatchObject({
      rezzed: true,
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
    });
    expect(host.state.cardInstances.upgrade_1).toMatchObject({
      rezzed: false,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });
  });

  it("rejects an optional rez that would strand the mandatory continuation and continues when declined", () => {
    const host = makeHost({
      hq: ["ice_1", "ice_2"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["ice_1", "ice_2"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_ice_1", "card_ice_2"]),
      optionalRezContinuationProjection: () => ({
        complete: true,
        executable: false,
      }),
    });

    handleCorpInstallRezSequenceChoice(host);
    const beforeRejectedRez = structuredClone(host.state);
    host.playerAction = playerAction(["card_ice_1"]);

    expect(() => handleCorpInstallRezSequenceChoice(host)).toThrow(
      "laesst die verpflichtende Restsequenz nicht ausfuehrbar",
    );
    expect(host.state).toEqual(beforeRejectedRez);

    host.playerAction = playerAction([]);
    const declineResult = handleCorpInstallRezSequenceChoice(host);

    expect(declineResult.installedCardIds).toEqual(["ice_2"]);
    expect(host.state.cardInstances.ice_1?.rezzed).toBe(false);
    expect(host.state.corp.servers[0]?.ice).toEqual(["ice_1", "ice_2"]);
  });

  it("pays each Data Fort Reclamation rez from temporary credits before corp credits", () => {
    const rezRootCalls: CardInstanceId[] = [];
    const host = makeHost({
      hq: ["ice_1", "asset_1"] as CardInstanceId[],
      scoreArea: ["data_fort_agenda"] as CardInstanceId[],
      scoredKinds: {
        data_fort_agenda: "score_install_hq_cards_into_new_remote_then_rez",
      },
      pendingChoice: selectCardsChoice(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
        ["ice_1", "asset_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_ice_1", "card_asset_1"]),
      rezRootCalls,
    });

    handleCorpInstallRezSequenceChoice(host);
    host.playerAction = playerAction(["card_ice_1"]);
    const secondResult = handleCorpInstallRezSequenceChoice(host);
    host.playerAction = playerAction(["card_asset_1"]);
    const finalResult = handleCorpInstallRezSequenceChoice(host);

    expect(secondResult.rezzedCardIds).toEqual(["ice_1"]);
    expect(finalResult.rezzedCardIds).toEqual(["asset_1"]);
    expect(host.state.corp.credits).toBe(5);
    expect(rezRootCalls).toEqual(["asset_1"]);
    expect(host.legalAction.payload).toMatchObject({
      cardImplementationPrimitiveKind:
        "score_install_hq_cards_into_new_remote_then_rez",
      cardImplementationEffectKind: "install_rez_sequence",
      sourceAgendaId: "data_fort_agenda",
      hiddenZoneAction: "hq_to_new_remote_rez_sequence",
      cardImplementationSequenceCreatedServerId: "remote_1",
      cardImplementationTemporaryCreditBudget: 10,
      selectedCount: 2,
      rezzedCount: 1,
      rezzedIceCount: 0,
      rezzedRootCount: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 9,
      temporaryCreditsRemaining: 1,
      corpCreditsSpent: 0,
      corpCreditsAfter: 5,
    });
  });

  it("opens Security Purge as a blocking Runner review before Corp target choices", () => {
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
      scoreArea: ["agenda_purge_agenda"] as CardInstanceId[],
      servers,
    });

    const result = resolveAgendaPurgeInstallTargets(
      host,
      "agenda_purge_agenda" as CardInstanceId,
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
      side: "runner",
      source:
        "card_implementation.agenda_purge_runner_review:agenda_purge_agenda:ice_1,operation_1,ice_2:8",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "public",
    });
    expect(
      host.state.pendingChoice?.options
        .filter((option) => option.selectable === false)
        .map((option) => option.value),
    ).toEqual(["ice_1", "operation_1", "ice_2"]);
    expect(
      host.state.pendingChoice?.options.find((option) => option.id === "done"),
    ).toMatchObject({ label: "Ansehen beenden", value: "done" });
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "agenda_purge_runner_review",
      revealedCount: 3,
      revealedIceCount: 2,
      pendingTrashCount: 1,
      installedIceCount: 0,
      trashedCount: 0,
      agendaPurgeInstallContract: "corp_server_choice_per_ice",
      agendaPurgeRunnerReviewOpened: true,
      agendaPurgeTargetChoiceOpened: false,
      publicRevealDefinitionIds: "ice_1_def,operation_1_def,ice_2_def",
    });

    host.playerAction = playerAction(["done"]);
    host.legalAction.side = "runner";
    host.legalAction.payload = {};
    const reviewResult = handleCorpInstallRezSequenceChoice(host);

    expect(reviewResult.handled).toBe(true);
    expect(host.state.pendingChoice).toMatchObject({
      side: "corp",
      source:
        "card_implementation.agenda_purge_install_targets:agenda_purge_agenda:ice_1,operation_1,ice_2:8",
      kind: "select_option",
      minSelections: 2,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
    });
    expect(
      host.state.pendingChoice?.options
        .filter((option) => option.selectable !== false)
        .map((option) => option.value),
    ).toEqual([
      "ice_1|hq|fixed",
      "ice_1|rd|fixed",
      "ice_1|archives|fixed",
      "ice_1|remote_1|fixed",
      "ice_1|new_remote|fixed",
      "ice_2|hq|fixed",
      "ice_2|rd|fixed",
      "ice_2|archives|fixed",
      "ice_2|remote_1|fixed",
      "ice_2|new_remote|fixed",
    ]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "agenda_purge_runner_review_completed",
      agendaPurgeRunnerReviewResolved: true,
      agendaPurgeTargetChoiceOpened: true,
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
      scoreArea: ["agenda_purge_agenda"] as CardInstanceId[],
      servers,
    });
    resolveAgendaPurgeInstallTargets(
      host,
      "agenda_purge_agenda" as CardInstanceId,
    );
    host.playerAction = playerAction(["done"]);
    host.legalAction.side = "runner";
    host.legalAction.payload = {};
    handleCorpInstallRezSequenceChoice(host);
    const rdOption = host.state.pendingChoice?.options.find(
      (option) => option.value === "ice_1|rd|fixed",
    )?.id;
    const newRemoteOption = host.state.pendingChoice?.options.find(
      (option) => option.value === "ice_2|new_remote|fixed",
    )?.id;
    expect(rdOption).toBeDefined();
    expect(newRemoteOption).toBeDefined();
    host.playerAction = playerAction([rdOption!, newRemoteOption!]);
    host.legalAction.side = "corp";
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
      hiddenZoneAction: "agenda_purge_install_targets",
      revealedCount: 3,
      revealedIceCount: 2,
      installedIceCount: 2,
      trashedCount: 1,
      agendaPurgeInstallContract: "corp_server_choice_per_ice",
      agendaPurgeRunnerReviewResolved: true,
      agendaPurgeTargetChoiceResolved: true,
      publicRevealDefinitionIds: "ice_1_def,operation_1_def,ice_2_def",
      installedIceDefinitionIds: "ice_1_def,ice_2_def",
      installedIceServerLabels: "R&D,Remote 2",
      trashedDefinitionIds: "operation_1_def",
    });
  });

  it("trashes non-ICE faceup only after the Runner ends the Security Purge review", () => {
    const host = makeHost({
      rd: ["operation_1", "asset_1", "upgrade_1"] as CardInstanceId[],
      scoreArea: ["agenda_purge_agenda"] as CardInstanceId[],
    });

    resolveAgendaPurgeInstallTargets(
      host,
      "agenda_purge_agenda" as CardInstanceId,
    );
    expect(host.state.corp.archives).toEqual([]);
    expect(host.state.pendingChoice?.side).toBe("runner");

    host.playerAction = playerAction(["done"]);
    host.legalAction.side = "runner";
    host.legalAction.payload = {};
    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.deletePendingChoice).toBe(true);
    expect(result.trashedCardIds).toEqual([
      "operation_1",
      "asset_1",
      "upgrade_1",
    ]);
    expect(host.state.pendingChoice).toBeUndefined();
    expect(host.state.corp.rd).toEqual([]);
    expect(host.state.corp.archives).toEqual([
      "upgrade_1",
      "asset_1",
      "operation_1",
    ]);
    expect(
      host.state.corp.archives.every(
        (cardId) => host.state.cardInstances[cardId]?.faceup === true,
      ),
    ).toBe(true);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "agenda_purge_runner_review_completed",
      agendaPurgeRunnerReviewResolved: true,
      agendaPurgeTargetChoiceOpened: false,
      agendaPurgeTargetChoiceResolved: true,
      revealedIceCount: 0,
      installedIceCount: 0,
      trashedCount: 3,
      trashedDefinitionIds: "operation_1_def,asset_1_def,upgrade_1_def",
    });
  });

  it("leaves revealed ICE in R&D when no legal paid install-and-rez route exists", () => {
    const host = makeHost({
      rd: ["ice_1", "operation_1"] as CardInstanceId[],
      scoreArea: ["agenda_purge_agenda"] as CardInstanceId[],
      canEffectDrivenInstallRez: () => false,
    });

    resolveAgendaPurgeInstallTargets(
      host,
      "agenda_purge_agenda" as CardInstanceId,
    );
    host.playerAction = playerAction(["done"]);
    host.legalAction.side = "runner";
    host.legalAction.payload = {};
    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.deletePendingChoice).toBe(true);
    expect(result.installedCardIds).toEqual([]);
    expect(result.trashedCardIds).toEqual(["operation_1"]);
    expect(host.state.corp.rd).toEqual(["ice_1"]);
    expect(host.state.corp.archives).toEqual(["operation_1"]);
    expect(host.legalAction.payload).toMatchObject({
      revealedIceCount: 1,
      agendaPurgeUninstallableIceCount: 1,
      installedIceCount: 0,
      trashedCount: 1,
      agendaPurgeTargetChoiceOpened: false,
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

    startScoredAgendaFreeRezChoice(host, "priority_agenda" as CardInstanceId);
    expect(host.state.pendingChoice?.source).toBe(
      "card_implementation.scored_agenda_free_rez:priority_agenda:8",
    );

    host.playerAction = playerAction(["rez_ice_1_fixed"]);
    const result = handleCorpInstallRezSequenceChoice(host);

    expect(result.rezzedCardIds).toEqual(["ice_1"]);
    expect(host.state.cardInstances.ice_1?.rezzed).toBe(true);
    expect(host.state.corp.credits).toBe(5);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "scored_agenda_free_rez",
      scoredAgendaFreeRezFreeRez: true,
      scoredAgendaFreeRezTarget: "ice_1",
      scoredAgendaFreeRezTargetDefinitionId: "ice_1_def",
      rezBaseCreditCostWaived: 3,
      rezAdditionalCreditsPaid: 0,
      rezAgendaPointsPaid: 0,
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
        "card_implementation.scored_agenda_free_rez:priority_agenda:8",
        ["asset_1"] as CardInstanceId[],
      ),
      playerAction: playerAction(["card_asset_1"]),
    });

    expect(() => handleCorpInstallRezSequenceChoice(host)).toThrow(
      "Das Priority-Requisition-Ziel ist nicht mehr gueltig.",
    );
  });
});
