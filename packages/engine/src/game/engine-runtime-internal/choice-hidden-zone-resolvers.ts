import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { type CardDefinitionId, type CardInstanceId, type CorpServer, type GameState, type LegalAction, type ServerId } from "@netgrid/shared";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type { ActiveRun, RuntimeDeps } from "./runtime-shared";

export function createChoiceHiddenZoneResolvers(
  deps: RuntimeDeps,
): import("./choice-resolver-runtime-port").ChoiceResolverRuntimePort {
  function startRunnerPrivateLookChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    zone: Extract<ServerId, "rd" | "hq">,
    count: number | "all",
    reason: "ability" | "successful_run" | "post_access",
    legalAction?: LegalAction,
  ): boolean {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const cardIds = deps.privateLookCardIds(state, zone, count);
    if (cardIds.length === 0) return false;
    const sourceDefinition = CARD_DEFINITIONS_BY_ID[sourceDefinitionId];
    state.pendingChoice = {
      choiceId: `p3_33_private_look_${zone}_${state.stateVersion + 1}`,
      side: "runner",
      source: `p3_33.private_look:${reason}:${sourceCardId}:${zone}:${state.stateVersion + 1}`,
      prompt:
        zone === "rd"
          ? `R&D ansehen (${cardIds.length})`
          : `HQ ansehen (${cardIds.length})`,
      kind: "select_cards",
      options: [
        ...cardIds.map((cardId, index) => ({
          id: `card_${cardId}`,
          label: definitionFor(state, cardId).title,
          publicLabel: "Verdeckte Korp-Karte",
          value: cardId,
          selectable: false,
        })),
        { id: "done", label: "Fertig", publicLabel: "Fertig", value: "done" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "p3_33_private_look",
        privateLookZone: zone,
        privateLookCount: cardIds.length,
        sourceDefinitionId,
        ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
      };
    }
    return true;
  }

  function resolveRunnerPrivateLookChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("p3_33.private_look"))
      throw new Error("Es ist keine private Look-Choice offen.");
    const [, reason, sourceCardId, zone] = choice.source.split(":");
    if (zone !== "rd" && zone !== "hq")
      throw new Error("Die private Look-Zone ist ungueltig.");
    const privateLookCount = choice.options.filter((option) =>
      option.id.startsWith("card_"),
    ).length;
    const knownPrivateLookDefinitionIds = choice.options
      .filter((option) => option.id.startsWith("card_"))
      .map((option) =>
        typeof option.value === "string" && state.cardInstances[option.value]
          ? definitionFor(state, option.value).id
          : undefined,
      )
      .filter((definitionId): definitionId is CardDefinitionId =>
        Boolean(definitionId),
      );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: zone,
      privateLookCount,
      ...(knownPrivateLookDefinitionIds.length > 0
        ? {
            knownPrivateLookDefinitionIdsCsv:
              knownPrivateLookDefinitionIds.join("|"),
          }
        : {}),
      ...(sourceCardId ? { cardId: sourceCardId } : {}),
      ...(sourceCardId && state.cardInstances[sourceCardId]
        ? {
            sourceDefinitionId: definitionFor(state, sourceCardId).id,
            sourceTitle: definitionFor(state, sourceCardId).title,
          }
        : {}),
    };
    if (reason === "successful_run" || reason === "post_access")
      deps.finishRun(state, true, legalAction);
  }

  function startPostAccessInstalledProgramChoice(
    state: GameState,
    run: ActiveRun,
    legalAction?: LegalAction,
  ): boolean {
    const breach = run.breach;
    if (!breach || breach.serverId !== "hq" || !breach.completed) return false;
    if (breach.accessedSummaries.length === 0) return false;
    const sourceCardId = state.runner.rig.programs
      .slice()
      .sort()
      .find((cardId) =>
        cardImplementationForDefinitionId(
          definitionFor(state, cardId).id,
        )?.accessHooks?.some(
          (hook) =>
            hook.kind === "post_access_private_look" &&
            hook.afterAccessServer === "hq" &&
            hook.lookZone === "hq",
        ),
      );
    if (!sourceCardId) return false;
    return startRunnerPrivateLookChoice(
      state,
      sourceCardId,
      definitionFor(state, sourceCardId).id,
      "hq",
      "all",
      "post_access",
      legalAction,
    );
  }

  function v1915InstalledRevealHelperIds(state: GameState): CardDefinitionId[] {
    return [
      ...new Set(
        [...state.runner.rig.programs, ...state.runner.rig.hardware]
          .map((cardId) => definitionFor(state, cardId).id)
          .filter((definitionId) =>
            isInstalledRevealHelper(
              cardImplementationForDefinitionId(definitionId),
            ),
          ),
      ),
    ].sort();
  }

  function isInstalledRevealHelper(
    implementation: ReturnType<typeof cardImplementationForDefinitionId>,
  ): boolean {
    return Boolean(
      implementation?.abilities?.some((ability) =>
        ability.effects.some(
          (effect) =>
            effect.kind === "look_top_stack_show_to_corp_then_install_matching",
        ),
      ) ||
      implementation?.runEncounterInterventions?.some(
        (intervention) =>
          intervention.kind === "approach_ice_expose_then_jack_out_before_rez",
      ),
    );
  }

  function runnerHasInstalledDefinition(
    state: GameState,
    definitionId: CardDefinitionId,
  ): boolean {
    return [
      ...state.runner.rig.programs,
      ...state.runner.rig.hardware,
      ...state.runner.rig.resources,
    ].some((cardId) => definitionFor(state, cardId).id === definitionId);
  }

  function trashOlderRegionUpgradesInServer(
    state: GameState,
    server: CorpServer,
    keepCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const olderRegions = server.root
      .filter((cardId) => cardId !== keepCardId)
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        return (
          definition.type === "upgrade" &&
          deps.cardHasSubtype(definition, "region")
        );
      })
      .sort();
    for (const cardId of olderRegions) {
      appendRegionReplacementTrashEffect(
        state,
        server,
        keepCardId,
        cardId,
        legalAction,
      );
      deps.trashCorpInstalledCardToArchives(state, cardId);
    }
  }

  function appendRegionReplacementTrashEffect(
    state: GameState,
    server: CorpServer,
    sourceCardId: CardInstanceId,
    trashedCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    if (!legalAction) return;
    const sourceDefinition = definitionFor(state, sourceCardId);
    const trashedInstance = mustInstance(state.cardInstances, trashedCardId);
    const trashedDefinition = definitionFor(state, trashedCardId);
    const trashedRegionWasPublic =
      trashedInstance.faceup === true || trashedInstance.rezzed === true;
    const effectIndex = legalAction.resolvedEffects?.length ?? 0;
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      {
        effectId: `corp.region_replacement.${server.id}.${effectIndex}`,
        kind: "trash_card",
        visibility: "public",
        side: "corp",
        reason: "region_limit",
        serverId: server.id,
        serverLabel: server.label,
        sourceDefinitionId: sourceDefinition.id,
        sourceTitle: sourceDefinition.title,
        ...(trashedRegionWasPublic ? {} : { redactedKind: "installed_card" }),
        ...(trashedRegionWasPublic
          ? {
              cardDefinitionId: trashedDefinition.id,
              cardTitle: trashedDefinition.title,
            }
          : {}),
      },
    ];
  }

  return {
    startRunnerPrivateLookChoice,
    resolveRunnerPrivateLookChoice,
    startPostAccessInstalledProgramChoice,
    v1915InstalledRevealHelperIds,
    runnerHasInstalledDefinition,
    trashOlderRegionUpgradesInServer,
    appendRegionReplacementTrashEffect,
  };
}
