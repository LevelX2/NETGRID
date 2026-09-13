import type {
  PublicGameEvent,
  ResolvedGameEffect,
  Side,
} from "@netgrid/shared";
import {
  payloadAbilityId,
  payloadRandomRoll,
  isDataFortReclamationInstallPayload,
  isDataFortReclamationRezPayload,
  isSecurityPurgePayload,
} from "./action-payload";
import {
  type PublicCardPresentationsById,
  publicCardTitle,
} from "./public-card-presentation";
import type {
  ChronicleContext,
  ChronicleItem,
  ChronicleTranslate,
} from "./chronicle";

export type ChronicleDetail = Partial<ChronicleItem>;

export function chronicleEventDetail(
  event: PublicGameEvent,
  side: Side,
  context: Omit<ChronicleContext, "side">,
  subject: string,
  server: string,
): ChronicleDetail | undefined {
  const t = context.translate!;
  const p = event.publicPayload;
  const action = string(p.actionType) ?? event.type;
  const ability = payloadAbilityId(p);
  const hidden = string(p.hiddenZoneAction);
  const n = (...keys: string[]) => firstNumber(p, keys);
  const s = (...keys: string[]) => firstString(p, keys);
  const b = (key: string) => boolean(p, key);
  const sourceId = s("sourceDefinitionId", "cardDefinitionId");
  const name = (id: string | undefined) =>
    publicCardTitle(id, context.cardPresentationsById);
  const source =
    name(sourceId) ??
    s("sourceTitle", "title") ??
    context.cardTitle ??
    t("card.unknown");
  const targetId = s(
    "targetCardDefinitionId",
    "installedProgramDefinitionId",
    "publicRevealDefinitionId",
  );
  const target =
    name(targetId) ??
    s("targetCardTitle", "trashedCardTitle") ??
    t("card.unknown");
  const known = (value: number | undefined) => value ?? t("details.unknown");
  const titles = (key: string) =>
    (s(key)?.split(",") ?? [])
      .map(name)
      .filter((v): v is string => v !== undefined);
  const say = (
    key: string,
    values: Record<string, string | number> = {},
    description?: string,
    category: ChronicleItem["category"] = "card",
  ): ChronicleDetail => ({
    title: t(`details.${key}`, { subject, source, target, server, ...values }),
    ...(description ? { description } : {}),
    category,
    visibility: "public",
    chips: sourceId || s("sourceTitle", "title") ? [source] : [],
    groupLabel:
      category === "run"
        ? t("group.run", { server })
        : t(`group.${category}`, {
            number: "",
            side:
              event.publicPayload.actor === "corp"
                ? t("side.corp")
                : t("side.runner"),
          }),
    ...(sourceId ? { cardDefinitionId: sourceId, cardTitle: source } : {}),
  });
  const detail = (key: string, values: Record<string, string | number> = {}) =>
    t(`details.${key}`, values);
  const roll = payloadRandomRoll(p);

  if (action === "break_subroutine" && b("breakerEndsRunAfterBreak") === true)
    return say(
      "breakEndsRun",
      {
        ice: s("targetIceTitle") ?? target,
        cost: known(n("breakSubroutineCreditCost", "breakSubroutineBaseCost")),
      },
      detail("iceNotPassed"),
      "run",
    );
  if (
    action === "break_subroutine" &&
    typeof p.blinkBreakSuccess === "boolean"
  ) {
    return {
      ...say(
        p.blinkBreakSuccess ? "blinkSuccess" : "blinkFailure",
        {
          roll: known(n("blinkDieRoll")),
          number: known(
            n("subroutineIndex") === undefined
              ? undefined
              : n("subroutineIndex")! + 1,
          ),
          ice: s("targetIceTitle") ?? t("card.unknown"),
        },
        p.blinkBreakSuccess
          ? undefined
          : detail("blinkDamage", { amount: known(n("blinkDamageAmount")) }),
        "run",
      ),
      importance: p.blinkBreakSuccess ? "normal" : "critical",
    };
  }
  if (
    ability === "random_dice_loop" ||
    s("v1921RunnerEventAbility") === "random_dice_loop"
  ) {
    const rolls = s("randomDiceLoopRolls") ?? "";
    const remaining = n(
      "randomDiceLoopRemainingDice",
      "randomDiceLoopQueuedAfterRolls",
    );
    const complete = b("randomDiceLoopComplete");
    return say(
      action === "resolve_choice" ? "diceChoice" : "dicePlayed",
      {
        roll: known(roll),
        amount: known(n("randomDiceSplitGainedCredits")),
        aside: known(n("randomDiceSplitSetAsideDice")),
      },
      [
        rolls ? detail("diceRolls", { rolls }) : "",
        complete === true
          ? detail("diceComplete")
          : remaining !== undefined
            ? detail("diceRemaining", { amount: remaining })
            : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  if (s("accessReplacement") === "reveal_rd_until_agenda_store_in_hq") {
    const revealed =
      s("publicRevealTitles")?.split("||").join(", ") ??
      titles("publicRevealDefinitionIds").join(", ");
    if (hidden === "gypsy_schedule_analyzer_reveal_choice_opened")
      return say("gypsyReady", {}, undefined, "run");
    if (hidden === "gypsy_schedule_analyzer_reveal_next")
      return say(
        "gypsyReveal",
        { card: revealed.split(", ").at(-1) ?? t("card.unknown") },
        detail("revealed", { cards: revealed }),
        "run",
      );
    return say(
      b("agendaStoredInHq") === true ? "gypsyAgenda" : "gypsyNoAgenda",
      {
        agenda: name(s("storedAgendaDefinitionId")) ?? t("card.unknown"),
      },
      detail("gypsyRevealed", {
        cards: revealed,
        amount: known(n("shuffledIntoRdCount")),
      }),
      "run",
    );
  }
  if (b("secretSpendRevealed") === true) {
    return say(
      "secretSpend",
      {
        corp: known(n("secretSpendCorp")),
        runner: known(n("secretSpendRunner")),
        outcome: detail(
          b("tooManyDoorsEndRun") === true ? "runEnded" : "runContinues",
        ),
      },
      n("corpCreditsAfter") !== undefined &&
        n("runnerCreditsAfter") !== undefined
        ? detail("creditsAfter", {
            corp: n("corpCreditsAfter")!,
            runner: n("runnerCreditsAfter")!,
          })
        : undefined,
      "run",
    );
  }
  if (b("strategicPlanningGroupChoiceResolved") === true) {
    return say("strategicPlanning", {
      count: known(n("strategicPlanningGroupDrawnCardCount")),
      net: known(n("strategicPlanningGroupNetDrawCount")),
    });
  }
  if (b("smithsPawnshopTriggered") !== undefined) {
    return say(
      b("smithsPawnshopTriggered") ? "pawnshopUsed" : "pawnshopDeclined",
      { amount: known(n("creditsGained", "gainedCredits")) },
      undefined,
      b("smithsPawnshopTriggered") ? "economy" : "card",
    );
  }
  if (
    hidden === "archives_faceup_to_rd" ||
    s("accessReplacement") === "archives_faceup_to_rd"
  ) {
    return say(
      "archivesToRd",
      {
        amount: known(n("movedCount")),
        shuffled: known(n("shuffledFaceUpArchivesCount")),
      },
      undefined,
      "run",
    );
  }
  if (ability === "schlaghund_tag_damage") {
    return {
      ...say(
        "schlaghund",
        { roll: known(roll), tags: known(n("runnerTags")) },
        detail(
          b("tagThresholdMet") ? "schlaghundDamage" : "schlaghundNoDamage",
          { amount: known(n("damageAmount")) },
        ),
        "danger",
      ),
      importance: b("tagThresholdMet") ? "critical" : "normal",
    };
  }
  if (ability === "deterministic_die_probe")
    return say("dieProbe", { roll: known(roll) });
  if (hidden === "classic_corporate_shuffle_hq_to_rd")
    return say(
      "corporateShuffle",
      { count: known(n("movedCount")) },
      detail("privateHq"),
    );
  if (
    hidden === "v1922_corp_archives_to_hq" &&
    n("archivesRevealCount") !== undefined
  )
    return say(
      "reclamation",
      { count: n("archivesRevealCount")! },
      detail("revealed", { cards: s("archivesRevealTitles") ?? "" }),
    );
  if (
    hidden === "corp_hq_agenda_reveal" ||
    hidden === "v1917_corporate_negotiating_center_hq_agenda_reveal"
  ) {
    return say(
      "agendaReveal",
      { count: known(n("revealedCount")), amount: known(n("gainedCredits")) },
      detail("revealed", {
        cards: publicTitles(p.publicRevealTitles).join(", "),
      }),
      "agenda",
    );
  }
  if (hidden === "scored_agenda_hq_agenda_shuffle_credits")
    return say(
      "downsizing",
      {
        count: known(n("shownCount")),
        moved: known(n("shuffledIntoRndCount")),
        amount: known(n("gainedCredits")),
        points: known(n("combinedAgendaPoints")),
      },
      detail("revealed", {
        cards:
          publicTitles(p.publicRevealTitles).join(", ") ||
          titles("publicRevealDefinitionIds").join(", "),
      }),
      "agenda",
    );
  if (
    hidden === "superior_net_barriers_reveal_walls" ||
    hidden === "encryption_breakthrough_reveal_code_gates"
  )
    return say(
      "iceRevealIncome",
      {
        count: known(n("revealedCount")),
        rezzed: known(n("rezzedMatchingIceCount")),
        counted: known(n("countedMatchingIceCount")),
        amount: known(n("gainedCredits")),
      },
      undefined,
      "agenda",
    );
  if (ability === "force_rez_or_trash_ice")
    return say(
      s("corpDecision") === "rez_ice"
        ? "forcedRez"
        : s("corpDecision") === "trash_ice"
          ? "forcedTrash"
          : "forcedRezTarget",
      {
        location: s("targetIcePositionLabel", "targetServerLabel") ?? server,
        amount: known(n("rezCostPaid")),
      },
    );
  if (
    hidden === "aardvark_rez_trash_worm" ||
    hidden === "aardvark_declined_worm_use"
  )
    return say(
      hidden === "aardvark_rez_trash_worm" ? "aardvarkRez" : "aardvarkDeclined",
      {},
      undefined,
      "run",
    );
  if (hidden === "v162_priority_requisition_free_rez")
    return say("priorityRez", {
      target: name(s("priorityRequisitionTargetDefinitionId")) ?? target,
      amount: known(n("rezCostPaid")),
    });
  if (ability === "successful_hq_run_pay_rez_cost_trash_rezzed_ice")
    return say(
      "paidIceTrash",
      {
        amount: known(n("rezCostPaid")),
        location: s("targetServerLabel") ?? server,
      },
      undefined,
      "run",
    );
  if (ability === "successful_hq_run_corp_pay_to_retain_hq")
    return say("retainHq", {
      retained: known(n("retainedCount")),
      discarded: known(n("discardedCount")),
      amount:
        n("retainedCount") === undefined
          ? known(undefined)
          : n("retainedCount")! * 2,
    });
  if (isDataFortReclamationInstallPayload(p))
    return {
      ...say("fortInstall", {
        count: known(n("installedCount")),
        ice: known(n("installedIceCount")),
        roots: known(n("installedRootCount")),
        credits: known(n("temporaryCreditsProvided")),
        candidates: known(n("dataFortReclamationRezCandidateCount")),
      }),
      category: "hidden",
      visibility: "redacted",
      cardDetailLines: [],
    };
  if (isDataFortReclamationRezPayload(p))
    return say("fortRez", {
      count: known(n("rezzedCount")),
      ice: known(n("rezzedIceCount")),
      roots: known(n("rezzedRootCount")),
      temporary: known(n("temporaryCreditsSpent")),
      normal: known(n("corpCreditsSpent")),
    });
  if (ability === "arasaka_owns_you_flatline_replacement")
    return {
      ...say(
        "flatlineReplaced",
        {
          prevented: known(n("preventedAmount", "originalAmount")),
          drawn: known(n("drawnCards")),
          tags: known(n("removedTags")),
          core: known(n("coreDamageRemoved")),
          debt: known(n("futureAgendaPointForfeitPending")),
        },
        undefined,
        "danger",
      ),
      importance: "critical",
    };
  if (s("imminentEventType") === "add_tag" && s("eventModificationDecision"))
    return say(
      "tagPrevention",
      {
        prevented: known(n("preventedTags")),
        final: known(n("finalAmount", "tagsAdded")),
        decision: detail(
          s("eventModificationDecision") === "apply" ? "used" : "declined",
        ),
      },
      b("sourceTrashed") ? detail("sourceTrashed", { source }) : undefined,
      "danger",
    );
  if (
    s("eventModificationDecision") === "apply" &&
    n("preventedAmount") !== undefined
  )
    return say(
      "damagePrevention",
      {
        prevented: n("preventedAmount")!,
        final: known(n("damageAmount", "finalAmount")),
      },
      undefined,
      "danger",
    );

  const stackInstall =
    hidden === "search_stack" && s("searchDestination") === "install_program";
  if (
    hidden === "self_modifying_code_install_program" ||
    stackInstall ||
    hidden === "sneak_preview_install_program"
  ) {
    const deferred =
      b("installDeferredForMemory") === true ||
      b("installPendingMemoryTrash") === true;
    const installed =
      b("installed") === true ||
      b("installSucceeded") === true ||
      s("searchDestination") === "runner_rig";
    return say(
      deferred
        ? "programPendingMu"
        : installed
          ? "programInstalled"
          : "programNotInstalled",
      {
        program:
          name(
            s(
              "publicRevealDefinitionId",
              "installedProgramDefinitionId",
              "cardDefinitionId",
            ),
          ) ??
          context.cardTitle ??
          target,
      },
      b("temporaryInstall") === true ||
        hidden === "sneak_preview_install_program"
        ? detail("returnsAtTurnEnd")
        : undefined,
    );
  }
  if (
    hidden === "temporary_program_install" ||
    hidden === "p3_38_stack_or_trash_program_install"
  )
    return say(
      "temporaryProgramInstall",
      { program: name(s("installedProgramDefinitionId")) ?? target },
      detail("returnsAtTurnEnd"),
    );
  if (hidden === "temporary_program_install_end_turn_return")
    return say("temporaryProgramReturn", {
      count: known(n("returnedCount")),
      cards: titles("returnedCardDefinitionIds").join(", "),
    });
  if (
    hidden === "self_modifying_code_free_mu" ||
    ability === "runner_program_trash_before_install"
  ) {
    const deferred = b("installDeferredForMemory") === true;
    return say(
      deferred ? "programPendingMu" : "programInstalled",
      {
        program:
          name(s("installedProgramDefinitionId", "publicRevealDefinitionId")) ??
          target,
      },
      deferred
        ? undefined
        : detail("muTrashed", {
            cards: titles("trashedCardDefinitionIds").join(", "),
            count: known(
              n("trashedCount", "programTrashCount", "trashedProgramCount"),
            ),
          }),
    );
  }
  if (b("runnerMemoryCheckpointResolved") === true)
    return say("memoryCheckpoint", {
      cards: titles("trashedCardDefinitionIds").join(", "),
      count: known(n("trashedCount", "trashedProgramCount")),
    });
  if (hidden === "sneak_preview_choose_source")
    return say("sneakSource", {
      zone: s("searchSource") === "runner_heap" ? "Heap" : "Stack",
    });
  if (hidden === "v1911_short_circuit_search")
    return say(
      action === "resolve_choice" ? "shortCircuitChosen" : "stackSearchOpened",
      {
        program:
          name(s("publicRevealDefinitionId", "cardDefinitionId")) ??
          context.cardTitle ??
          target,
      },
    );
  if (
    hidden === "p3_37_search_stack_to_grip" &&
    action === "activated_card_ability"
  )
    return say("stackSearchOpened");
  if (
    hidden === "p3_37_search_trash_to_grip" ||
    hidden === "p3_38_move_top_trash_to_grip" ||
    (b("returnedToGrip") === true && s("sourceZone") === "heap")
  )
    return say("heapToGrip", {
      card:
        name(
          s(
            "returnedCardDefinitionId",
            "targetDefinitionId",
            "targetCardDefinitionId",
            "publicRevealDefinitionId",
          ),
        ) ?? target,
      count: known(n("returnedCount", "movedCardCount", "selectedCount")),
    });
  if (hidden === "search_stack" && !stackInstall) {
    const publicReveal = s("searchReveal") === "public";
    return {
      ...say(publicReveal ? "stackToHand" : "privateStackToHand", {
        card:
          name(s("publicRevealDefinitionId", "cardDefinitionId")) ??
          context.cardTitle ??
          target,
        count: known(n("selectedCount")),
      }),
      visibility: publicReveal ? "public" : "redacted",
    };
  }
  if (
    hidden === "p3_37_search_stack_to_grip" &&
    !s("publicRevealDefinitionId") &&
    s("publicRevealKind") !== "reveal"
  )
    return {
      ...say("privateStackToHand", { count: known(n("selectedCount")) }),
      visibility: "redacted",
    };
  if (hidden === "schematics_search_engine_expose_installed_cards_finish")
    return say("exposeReviewFinished");
  if (hidden === "expose_installed_card_review")
    return say("exposeSingle", {
      card: name(s("publicRevealDefinitionId", "cardDefinitionId")) ?? target,
      location:
        s("exposedServerLabel", "serverLabel", "targetServerLabel") ?? server,
    });
  if (
    (hidden === "expose_installed_cards_single_fort" ||
      hidden === "multi_expose_installed_corp_cards") &&
    s("publicRevealKind") === "expose"
  )
    return say("exposeMultiple", {
      count: known(n("revealedCount")),
      cards: titles("publicRevealDefinitionIds").join(", "),
      locations: s("exposedServerLabels") ?? "",
    });
  if (hidden === "schematics_search_engine_expose_installed_cards_review")
    return say(
      "schematicsReview",
      {
        count: known(n("revealedCount")),
        cards:
          publicTitles(p.publicRevealTitles).join(", ") ||
          titles("publicRevealDefinitionIds").join(", "),
      },
      detail("exposeAwaitingReview"),
      "run",
    );
  if (s("corpPostPassIceAbility") === "return_passed_ice_to_hq")
    return say(
      s("decision") === "return_to_hq"
        ? "postPassReturned"
        : s("decision") === "pay"
          ? "postPassPaid"
          : "postPassLeft",
      { amount: known(n("paidCredits", "paymentAmount")) },
      undefined,
      "run",
    );
  if (s("postPassFutureStrengthAbility") === "cancel_future_ice_strength_bonus")
    return say(
      s("decision") === "pay"
        ? "futureStrengthPrevented"
        : "futureStrengthAllowed",
      {
        amount: known(n("paidCredits", "paymentAmount")),
        strength: known(n("strengthBonusAmount")),
      },
      undefined,
      "run",
    );
  if (
    b("temporaryEncounterTrashed") === true &&
    b("successfulRunFinalizedAfterIntervention") === true
  )
    return say(
      "temporaryEncounterFinished",
      { ice: name(s("temporaryIceDefinitionId")) ?? target },
      undefined,
      "run",
    );
  if (
    action === "continue_run" &&
    (b("socialEngineeringAutoPassedIce") === true ||
      (b("autoPassChosenIce") === true &&
        sourceId === "onr_v1_111_social-engineering"))
  )
    return say(
      "socialAutoPass",
      {
        number:
          n("chosenIcePosition") === undefined
            ? known(undefined)
            : n("chosenIcePosition")! + 1,
      },
      undefined,
      "run",
    );
  if (b("passIceTrashProgramPrompt") === true)
    return say(
      "passProgramTrashChoice",
      { count: known(n("passIceTrashProgramCandidateCount")) },
      undefined,
      "run",
    );
  if (
    hidden === "v1922_viral_15_program_trash" ||
    (sourceId === "onr_v1_276_viral-15" && n("programTrashCount") !== undefined)
  )
    return say(
      "viralProgramTrashed",
      {
        card: name(s("trashedCardDefinitionId")) ?? s("trashedTitle") ?? target,
        count: known(n("programTrashCount")),
      },
      undefined,
      "run",
    );
  if (action === "jack_out")
    return {
      description: detail(
        ability === "viral_15_jack_out_tax"
          ? "viralJackOut"
          : "jackOutNoAccess",
        { server, amount: known(n("jackOutAdditionalCost")) },
      ),
    };
  if (ability === "rio_de_janeiro_passed_ice")
    return say(
      "rio",
      {
        ice: name(s("passedIceDefinitionId")) ?? target,
        roll: known(roll),
        outcome: detail(
          b("rioRunEnded") === true ? "runEnded" : "runContinues",
        ),
      },
      undefined,
      "run",
    );
  if (n("vacuumLinkDieRoll", "rezzedIceRewindDieRoll") !== undefined)
    return say(
      b("vacuumLinkRewindApplied") === true ||
        b("rezzedIceRewindApplied") === true
        ? "vacuumRewind"
        : "vacuumNoRewind",
      {
        roll: n("vacuumLinkDieRoll", "rezzedIceRewindDieRoll")!,
        back: known(
          n("vacuumLinkRewindRezzedIceBack", "rezzedIceRewindRezzedIceBack"),
        ),
        position:
          n("vacuumLinkTargetIceIndex", "rezzedIceRewindTargetIceIndex") ===
          undefined
            ? known(undefined)
            : n("vacuumLinkTargetIceIndex", "rezzedIceRewindTargetIceIndex")! +
              1,
      },
      undefined,
      "run",
    );
  if (ability === "startup_immolator_trash_ice")
    return say(
      "startupImmolator",
      {
        ice:
          name(s("targetIceDefinitionId", "trashedCardDefinitionId")) ?? target,
        amount: known(n("rezCostPaid")),
      },
      undefined,
      "run",
    );
  if (s("runnerUtilityAbility") === "i_spy_put_spy_counter")
    return say("iSpy", {}, detail("iSpyVisibility", { server }), "run");
  if (action === "rez_ice" && b("oliviaSalazarTemporaryDerez") === true)
    return say(
      "oliviaRez",
      {
        card: context.cardTitle ?? s("title") ?? source,
        amount: known(n("rezCostPaid")),
        cost: known(n("oliviaSalazarRezCostBase")),
      },
      undefined,
      "run",
    );
  if (action === "rez_ice" && s("selectedSubtypesAfterRez"))
    return say(
      "variableRez",
      {
        card: context.cardTitle ?? s("title") ?? source,
        amount: known(n("rezCostPaid")),
        extra: known(n("variableRezAdditionalCost")),
        subtype: s("selectedSubtypesAfterRez")!
          .split(",")
          .map((v) => t(`details.subtype_${v}`))
          .join(" / "),
      },
      undefined,
      "run",
    );
  if (hidden === "v1911_aujourdoui_top5")
    return say(
      "aujourdhui",
      {
        count: known(n("selectedCount")),
        cards: titles("publicRevealDefinitionIds").join(", "),
      },
      detail("stackShuffled"),
    );
  if (hidden === "p3_38_look_top_stack_show_to_corp_then_install_matching")
    return say(
      b("installed") === true ||
        (n("installedProgramCount") ?? 0) > 0 ||
        s("installedProgramDefinitionId") !== undefined
        ? "mysteryInstalled"
        : b("programFound") === false
          ? "mysteryNoProgram"
          : "mysteryProgramChoice",
      {
        program:
          name(s("installedProgramDefinitionId", "publicRevealDefinitionId")) ??
          target,
        count: known(n("revealCount")),
      },
      detail(
        b("selfTrashed") === true || b("sourceTrashed") === true
          ? "sourceTrashed"
          : "sourceRemains",
        { source },
      ),
    );
  if (hidden === "shuffle_source_into_corp_rd")
    return say("sourceShuffledIntoRd", {}, undefined, "card");
  if (
    ability === "program_install_action_bundle" ||
    ability === "install_action_bundle"
  )
    return say(
      ability === "install_action_bundle"
        ? "installActionsOnly"
        : "installActions",
      {
        actions: known(n("gainedActions")),
        credits: known(n("temporaryProgramInstallCredits")),
        remaining: known(
          n(
            "valuPakProgramInstallActionsRemaining",
            "edgerunnerTempsInstallActionsRemaining",
          ),
        ),
      },
      undefined,
      "turn",
    );
  if (
    s("agendaAccessReplacement") === "delay_score_until_runner_next_turn_start"
  )
    return say(
      "agendaStealDelayed",
      { card: context.cardTitle ?? s("title") ?? source },
      detail("agendaStealDelayedDescription"),
      "agenda",
    );
  if (action === "resolve_choice" && s("traceStep") === "base_link")
    return say(
      b("baseLinkUsed") === true ? "baseLinkUsed" : "baseLinkDeclined",
      {
        card: name(s("traceBaseLinkSourceDefinitionId")) ?? t("card.unknown"),
        link: known(n("baseLinkValue")),
        total: known(n("runnerLink")),
        paid: known(n("traceBaseLinkCostPaid")),
      },
      undefined,
      "danger",
    );
  if (b("traceStarted") === true)
    return say(
      "traceStarted",
      { strength: known(n("traceLimit", "traceValue")) },
      undefined,
      "danger",
    );
  if (action === "purge_virus_counters")
    return say(
      "virusPurge",
      { count: known(n("purgedVirusCounters", "removedCounterAmount")) },
      undefined,
      "danger",
    );
  if (action === "purge_runner_virus_counters")
    return say(
      "virusPurgeDebt",
      {
        count: known(n("purgedRunnerVirusCounters")),
        debt: known(n("actionDebtAdded")),
      },
      undefined,
      "danger",
    );
  if (action === "forgo_action")
    return say(
      "forgoDebt",
      { remaining: known(n("corpActionDebtTotalAfter")) },
      undefined,
      "turn",
    );
  if (ability === "add_advancement_counters")
    return say(
      "advancementDistributed",
      {
        amount: known(n("addedAdvancementCounters")),
        count: known(n("targetCount")),
        cards: titles("targetCardDefinitionIds").join(", "),
        hidden:
          n("hiddenTargetCount") ??
          Math.max(
            0,
            (n("targetCount") ?? 0) - titles("targetCardDefinitionIds").length,
          ),
      },
      undefined,
      "agenda",
    );
  if (["corporate_coup", "political_coup"].includes(s("agendaAbility") ?? ""))
    return say(
      "coupTake",
      {
        amount: known(
          n("gainedCredits", "gainCreditsAmount", "removePowerCounterAmount"),
        ),
        spent: known(n("spentPowerCounters", "removePowerCounterAmount")),
        remaining: known(n("remainingPowerCounters")),
      },
      undefined,
      "economy",
    );
  if (s("shellTradersAbility") === "auto_install_after_memory_choice")
    return say(
      "shellAutoInstalled",
      { card: context.cardTitle ?? target },
      detail("freeInstalled"),
    );
  if (s("resourceAbility") === "broker_load_credits")
    return say(
      "brokerLoad",
      {
        amount: known(n("addedCounterAmount")),
        remaining: known(n("remainingCounters")),
      },
      undefined,
      "economy",
    );
  if (
    s("resourceAbility") === "broker_take_credits" ||
    s("resourceAbility") === "short_term_contract_take_credits"
  )
    return say(
      "brokerTake",
      {
        amount: known(n("gainedCredits")),
        remaining: known(n("remainingCounters")),
      },
      undefined,
      "economy",
    );
  if (s("shellTradersAbility") === "set_aside_from_grip")
    return say("shellSetAside", {
      card: context.cardTitle ?? s("title") ?? target,
      counters: known(n("shellCounterAmount")),
    });
  if (
    ["remove_shell_counter", "start_turn_remove_shell_counter"].includes(
      s("shellTradersAbility") ??
        (sourceId === "onr_v1_176_the-shell-traders" ? ability : undefined) ??
        "",
    )
  )
    return say(
      "shellRemoved",
      {
        card: context.cardTitle ?? target,
        remaining: known(n("remainingCounters")),
      },
      b("installedFromSpecialZone") === true
        ? detail("freeInstalled")
        : b("shellAutoInstallPendingMemoryTrash") === true
          ? detail("muRequired")
          : undefined,
    );
  if (ability === "remove_runner_trace_counter")
    return say("traceCounterRemoved", {
      amount: known(n("removedCounterAmount")),
      remaining: known(n("remainingCounters")),
    });
  if (ability === "broken_ice_virus_counter" || ability === "pox_counter")
    return say(
      "virusTarget",
      {
        target:
          ability === "pox_counter"
            ? (s("targetServerLabel") ?? server)
            : target,
        remaining: known(n("remainingCounters", "poxCountersAfter")),
      },
      undefined,
      "run",
    );
  if (ability === "broken_ice_virus_counter_choice")
    return say(
      "virusTargetChoice",
      { count: known(n("pattelsVirusCandidateCount")) },
      undefined,
      "run",
    );
  if (hidden === "p3_33_private_look")
    return say("privateLook", {
      count: known(n("privateLookCount")),
      zone:
        s("privateLookZone") === "rd"
          ? "R&D"
          : s("privateLookZone") === "hq"
            ? "HQ"
            : detail("privateZone"),
    });
  if (s("employeeEmpowermentStartDrawDecision"))
    return say(
      s("employeeEmpowermentStartDrawDecision") === "draw"
        ? "employeeDraw"
        : "employeeSkip",
      { amount: known(n("drawnCards")) },
    );
  if (action === "resolve_choice" && s("drawTaxDecision"))
    return say(
      "drawTaxChoice",
      {
        credits: known(n("drawTaxCreditsPaid")),
        tags: known(n("drawTaxTagsAdded")),
      },
      undefined,
      "danger",
    );
  if (isSecurityPurgePayload(p))
    return say(
      "securityPurge",
      {
        count: known(n("revealedCount")),
        ice: known(n("revealedIceCount")),
        installed: known(n("installedIceCount")),
        trashed: known(n("trashedCount")),
        cards: titles("publicRevealDefinitionIds").join(", "),
      },
      detail(
        b("securityPurgeTargetChoiceOpened") === true ||
          b("agendaPurgeTargetChoiceOpened") === true
          ? "securityPurgeTargets"
          : b("securityPurgeTargetChoiceResolved") === true ||
              b("agendaPurgeTargetChoiceResolved") === true
            ? "securityPurgeResolved"
            : "securityPurgeReview",
        {
          cards: titles("installedIceDefinitionIds").join(", "),
          trash: titles("trashedDefinitionIds").join(", "),
        },
      ),
      "agenda",
    );
  if (
    action === "resolve_choice" &&
    (s("ambushDefinitionId", "accessEffectSourceDefinitionId") ||
      n("ambushPaidCost") !== undefined)
  )
    return say(
      b("ambushPaymentDeclined") === true ? "ambushDeclined" : "ambushPaid",
      {
        source:
          name(s("ambushDefinitionId", "accessEffectSourceDefinitionId")) ??
          source,
        amount: known(n("ambushPaidCost")),
      },
      undefined,
      "run",
    );
  if (action === "play_event" && ability === "three_dice_gain_credits")
    return say(
      "findersKeepers",
      {
        rolls: s("randomDiceLoopRolls") ?? "",
        amount: known(n("gainedCredits")),
      },
      undefined,
      "economy",
    );
  if (
    s("runnerEventAbility") ===
    "do_the_drine_unpreventable_core_damage_for_credits"
  )
    return say(
      "drine",
      {
        damage: known(n("damageAmount", "xValue")),
        amount: known(n("gainedCredits")),
        trashed: known(n("cardsTrashed")),
        hand: known(n("runnerMaxHandSizeAfter")),
      },
      undefined,
      "danger",
    );
  if (
    s("accessReplacement") === "corp_lose_credits" &&
    b("runSuccessful") === true &&
    b("accessSkipped") === true
  )
    return say(
      "weatherPipe",
      { amount: known(n("creditLoss")) },
      detail("accessReplaced"),
      "run",
    );
  if (action === "play_event" && s("accessReplacement")) {
    const clauses: string[] = [];
    for (const [field, key, recipient] of [
      ["creditLoss", "mergedLose", "corp"],
      ["corpDrawnCount", "mergedDraw", "corp"],
      ["gainedCredits", "mergedGain", "runner"],
      ["tagsAdded", "mergedTags", "runner"],
    ] as const) {
      if (n(field) !== undefined)
        clauses.push(
          detail(key, {
            subject: t(`side.${recipient}`),
            source,
            amount: n(field)!,
          }),
        );
    }
    return say(
      "accessReplacementFacts",
      { facts: clauses.join(" ") },
      detail("accessReplaced"),
      "run",
    );
  }
  if (action === "play_event" && b("runnerEventRun") === true)
    return say("eventRun", {}, undefined, "run");
  const genericKey = (
    {
      decline_trash: "declineTrash",
      move_to_set_aside: "setAside",
      move_to_removed_from_game: "removedFromGame",
      return_from_set_aside: "returnedFromSetAside",
      change_card_control: "controlChanged",
    } as Record<string, string>
  )[action];
  if (genericKey && b("hiddenZoneBarrier") !== true && !s("redactedKind"))
    return say(genericKey);
  return undefined;
}

export function chronicleEventSupplement(
  event: PublicGameEvent,
  item: ChronicleItem,
  context: Omit<ChronicleContext, "side">,
  mergedEffects: ResolvedGameEffect[],
): ChronicleItem {
  const t = context.translate!;
  const p = event.publicPayload;
  const n = (...keys: string[]) => firstNumber(p, keys);
  const s = (...keys: string[]) => firstString(p, keys);
  const name = (id: string | undefined) =>
    publicCardTitle(id, context.cardPresentationsById);
  const lines: string[] = [];
  const outcomes: string[] = [];
  const add = (key: string, values: Record<string, string | number>) =>
    lines.push(t(`details.${key}`, values));
  const known = (v: number | undefined) => v ?? t("details.unknown");
  const action = s("actionType") ?? event.type;
  const source =
    item.cardTitle ?? s("sourceTitle", "title") ?? t("card.unknown");
  const subject = item.actor ? t(`side.${item.actor}`) : t("actor.game");
  for (const effect of mergedEffects) {
    if (effect.visibility !== "public") continue;
    const amount = firstNumber(effect as Record<string, unknown>, ["amount"]);
    const key = MERGED_EFFECT_KEYS[effect.kind];
    if (!key) continue;
    if (
      (effect.kind === "take_hosted_credits" &&
        n("hostedCreditsTaken") !== undefined) ||
      (effect.kind === "add_hosted_credits" &&
        n("hostedCreditsAdded") !== undefined)
    )
      continue;
    outcomes.push(
      t(`details.${key}`, {
        damage: t(`damageType.${string(effect.damageType) ?? "unknown"}`),
        amount: known(amount),
        subject: effect.side ? t(`side.${effect.side}`) : subject,
        source: string(effect.sourceTitle) ?? source,
      }),
    );
  }
  if (n("hostedCreditsAfter") !== undefined)
    add("hostedRemaining", { amount: n("hostedCreditsAfter")! });
  if (n("recurringCreditsLoaded") !== undefined)
    add("recurringLoaded", { amount: n("recurringCreditsLoaded")! });
  if (
    boolean(p, "sourceTrashed") === true &&
    !mergedEffects.some(
      (e) => e.kind === "trash_source" || e.kind === "trash_source_when_empty",
    )
  )
    add("sourceTrashed", { source });
  if (
    s("hiddenZoneAction") === "successful_run_temporary_encounter" &&
    n("rezCostPaid") !== undefined
  )
    add("rezPaid", { amount: n("rezCostPaid")! });
  if (
    n("revealedCount") !== undefined &&
    s("accessReplacement") === "reveal_rd_until_agenda_store_in_hq"
  )
    add("revealedCount", { count: n("revealedCount")! });
  if (action === "install_card") {
    if (n("installCostPaid", "iceInstallTotalCost") !== undefined)
      add("installCost", {
        total: n("installCostPaid", "iceInstallTotalCost")!,
      });
    const payments = [
      ["runnerInstallNormalCreditsPaid", "paymentPool"],
      ["runnerInstallHostedCreditsPaid", "paymentHosted"],
      ["runnerInstallTemporaryCreditsPaid", "paymentTemporary"],
      ["iceInstallAdditionalCost", "paymentExtra"],
    ] as const;
    for (const [field, key] of payments)
      if (n(field) !== undefined && n(field)! > 0)
        add(key, { amount: n(field)! });
    const replacements = s("trashedDeckDefinitionIds")
      ?.split(",")
      .map(name)
      .filter(Boolean)
      .join(", ");
    if (replacements) add("replacedDecks", { cards: replacements });
  }
  if (
    (action === "rez_card" || action === "rez_ice") &&
    n("rezCostPaid") !== undefined
  )
    add("rezPaid", { amount: n("rezCostPaid")! });
  if (action === "score_agenda" || action === "steal_agenda") {
    if (
      s("agendaAccessReplacement") !==
        "delay_score_until_runner_next_turn_start" &&
      (n("agendaPoints") !== undefined || context.agendaPoints != null)
    )
      add("agendaPoints", {
        amount: n("agendaPoints") ?? context.agendaPoints!,
      });
    if (n("onScoreGainCredits") !== undefined)
      add("mergedGain", { subject, source, amount: n("onScoreGainCredits")! });
    if (n("onScoreLoseCredits") !== undefined)
      add("mergedLose", { subject, source, amount: n("onScoreLoseCredits")! });
    if (n("overadvanceRecurringCredits") !== undefined)
      add("zurich", {
        overadvance: known(n("projectZurichOveradvance")),
        amount: n("overadvanceRecurringCredits")!,
      });
    if (n("stealAdditionalCost", "stealCost") !== undefined)
      add("stealCost", {
        amount: n("stealAdditionalCost", "stealCost")!,
        sources: s("stealCostSourceTitles") ?? "",
      });
  }
  if (action === "pump_breaker") {
    if (boolean(p, "aiPumpPresentation") === true)
      add("pumpTotal", {
        count: known(n("pumpCount")),
        strength: known(n("pumpStrengthTotal")),
        before: known(n("pumpStrengthStart")),
        after: known(n("breakerStrengthAfter")),
        paid: known(n("pumpCreditCostTotal")),
      });
    else
      add("pumpDetails", {
        strength: known(n("pumpStrengthAmount")),
        after: known(n("breakerStrengthAfter")),
        cost: known(n("pumpBreakerCreditCost")),
      });
  }
  if (
    action === "break_subroutine" &&
    n("breakSubroutineTotalCost", "breakSubroutineCreditCost") !== undefined
  ) {
    add("breakCost", {
      amount: n("breakSubroutineTotalCost", "breakSubroutineCreditCost")!,
    });
    if ((n("breakSubroutineAdditionalCost") ?? 0) > 0)
      add("breakSurcharge", { amount: n("breakSubroutineAdditionalCost")! });
  }
  if (n("runnerMemoryUsedAfter", "memoryUsedAfter") !== undefined)
    add("memoryAfter", {
      used: n("runnerMemoryUsedAfter", "memoryUsedAfter")!,
      limit: known(n("runnerMemoryLimitAfter", "memoryLimitAfter")),
    });
  if (n("memoryFreed") !== undefined)
    add("memoryFreed", { amount: n("memoryFreed")! });
  if (
    boolean(p, "shuffled") === true ||
    boolean(p, "searchShuffleAfter") === true ||
    boolean(p, "shufflePerformed") === true
  )
    add("stackShuffled", {});
  if (action === "access_card" && (n("highlighterAccessBonus") ?? 0) > 0)
    add("highlighterAccess", {
      counters: known(n("highlighterCounterCount")),
      number:
        n("accessIndex") === undefined
          ? known(undefined)
          : n("accessIndex")! + 1,
      total: known(n("effectiveAccessCount")),
    });
  if (
    action === "trash_accessed_card" &&
    boolean(p, "freeAccessTrash") === true
  )
    add("freeAccessTrash", {});
  if (
    n("citySurveillanceCreditsPaid", "drawTaxCreditsPaid") !== undefined ||
    n(
      "citySurveillanceTagsAdded",
      "citySurveillanceTags",
      "drawTaxTagsAdded",
      "drawTaxTags",
    ) !== undefined
  )
    add("citySurveillance", {
      credits: known(n("citySurveillanceCreditsPaid", "drawTaxCreditsPaid")),
      tags: known(
        n(
          "citySurveillanceTagsAdded",
          "citySurveillanceTags",
          "drawTaxTagsAdded",
          "drawTaxTags",
        ),
      ),
    });
  if (action === "advance_card" && s("serverLabel"))
    add("selectedServer", { server: s("serverLabel")! });
  if (n("passedIcePosition") !== undefined)
    add("passedIce", { number: n("passedIcePosition")! });
  if (n("selectedTargetIcePosition") !== undefined)
    add("selectedIce", {
      card: s("selectedTargetLabel") ?? t("card.unknown"),
      server: s("selectedTargetServerLabel") ?? t("server.newRemote"),
      number: n("selectedTargetIcePosition")!,
    });
  else if (s("selectedServerLabel"))
    add("selectedServer", { server: s("selectedServerLabel")! });
  if (n("exposedIndex") !== undefined)
    add("exposedPosition", {
      area: s("exposedArea") === "ice" ? "ICE" : t("details.root"),
      number: n("exposedIndex")! + 1,
    });
  if (n("temporaryProgramReturnedCount") !== undefined)
    add("returnedPrograms", { count: n("temporaryProgramReturnedCount")! });
  if (
    n("pendingTrashCount") !== undefined &&
    boolean(p, "agendaPurgeTargetChoiceOpened") === true
  )
    add("pendingTrash", { count: n("pendingTrashCount")! });
  if (boolean(p, "fangRunEnded") === true)
    add("fangLock", { cost: known(n("fangRunLockCreditCost")) });
  if (n("hackerTrackerCountersAdded") !== undefined)
    add("hackerTracker", { amount: n("hackerTrackerCountersAdded")! });
  if (s("purgedCounterSummary"))
    for (const entry of s("purgedCounterSummary")!.split(";")) {
      const match = /^(?:[^:]+:)?([a-z_]+)=(\d+)$/.exec(entry);
      if (match)
        add("purgedType", {
          counter: counterTitle(match[1], t),
          amount: Number(match[2]),
        });
    }
  if (action === "forgo_action" && n("corpActionDebtTotalBefore") !== undefined)
    add("debtPaid", {
      paid: known(n("actionDebtPaid")),
      before: n("corpActionDebtTotalBefore")!,
    });
  if (!lines.length && !outcomes.length) return item;
  return {
    ...item,
    title: [item.title, ...outcomes].join(" "),
    description: [item.description, ...lines].filter(Boolean).join(" "),
  };
}

const MERGED_EFFECT_KEYS: Record<string, string> = {
  gain_credits: "mergedGain",
  lose_credits: "mergedLose",
  draw_cards: "mergedDraw",
  gain_actions: "mergedActions",
  damage: "mergedDamage",
  add_tags: "mergedTags",
  remove_tags: "mergedRemoveTags",
  add_hosted_credits: "mergedHosted",
  take_hosted_credits: "mergedTakeHosted",
  trash_source: "sourceTrashed",
  trash_source_when_empty: "sourceTrashed",
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
function string(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function firstString(
  p: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = string(p[key]) ?? string(record(p.targets)?.[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}
function firstNumber(
  p: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys)
    for (const value of [p[key], record(p.amounts)?.[key]])
      if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}
function boolean(p: Record<string, unknown>, key: string): boolean | undefined {
  const value = p[key] ?? record(p.targets)?.[key];
  return typeof value === "boolean" ? value : undefined;
}
function publicTitles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : typeof value === "string"
      ? value.split("||").filter(Boolean)
      : [];
}

export function chronicleEffectDetail(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  base: ChronicleItem,
  side: Side,
  t: ChronicleTranslate,
  catalog?: PublicCardPresentationsById,
): Partial<ChronicleItem> | undefined {
  // Only these public access consequences cross a hidden-information barrier.
  const access = effect.reason === "access_effect";
  const ambush = firstString(event.publicPayload, [
    "ambushDefinitionId",
    "accessEffectSourceDefinitionId",
  ]);
  const publicAccess =
    effect.visibility === "hidden_info_barrier" &&
    ((access &&
      ["damage", "trash_card", "counter_change"].includes(effect.kind)) ||
      (effect.kind === "counter_change" && ambush !== undefined));
  if (base.visibility === "redacted" && !publicAccess) {
    const amount = firstNumber(effect as Record<string, unknown>, ["amount"]);
    if (effect.kind === "draw_cards" && amount !== undefined)
      return {
        title: t("details.hiddenDraw", {
          amount,
          subject: effect.side ? t(`side.${effect.side}`) : t("actor.game"),
        }),
        category: "hidden",
      };
    if (effect.kind === "damage" && amount !== undefined)
      return {
        title: t("details.hiddenDamage", {
          amount,
          subject: effect.side ? t(`side.${effect.side}`) : t("actor.game"),
        }),
        category: "danger",
      };
    if (effect.kind === "trash_card")
      return {
        title: t(
          effect.redactedKind === "region_replacement"
            ? "details.hiddenRegionReplaced"
            : "details.hiddenTrash",
        ),
        category: "hidden",
      };
    return undefined;
  }
  const p = effect as Record<string, unknown>;
  const n = (...keys: string[]) => firstNumber(p, keys);
  const s = (...keys: string[]) => firstString(p, keys);
  const known = (v: number | undefined) => v ?? t("details.unknown");
  const sourceId = s("sourceDefinitionId") ?? ambush;
  const source =
    s("sourceTitle") ??
    publicCardTitle(sourceId, catalog) ??
    base.cardTitle ??
    t("card.unknown");
  const subject = t(
    base.actor === side
      ? "actor.you"
      : base.actor === "corp"
        ? "actor.corp"
        : "actor.runner",
  );
  const amount = known(n("amount"));
  const say = (
    key: string,
    values: Record<string, string | number> = {},
    category = base.category,
  ): Partial<ChronicleItem> => ({
    title: t(`details.${key}`, { source, subject, amount, ...values }),
    category,
    groupLabel: t(
      category === "run"
        ? "group.run"
        : category === "turn"
          ? "group.turn"
          : category === "economy"
            ? "group.economy"
            : "group.card",
      {
        server: s("serverLabel") ?? t("server.newRemote"),
        number: "",
        side: base.actor ? t(`side.${base.actor}`) : "",
      },
    ),
    ...(publicAccess
      ? {
          visibility: "public",
          cardTitle: source,
          ...(sourceId ? { cardDefinitionId: sourceId } : {}),
        }
      : {}),
  });
  const ep = event.publicPayload;
  const en = (...keys: string[]) => firstNumber(ep, keys);
  if (
    publicAccess &&
    base.visibility === "redacted" &&
    effect.kind === "damage"
  )
    return {
      ...say(
        "accessDamage",
        { damage: t(`damageType.${s("damageType") ?? "unknown"}`) },
        "danger",
      ),
      importance: "critical",
      ...(n("cardsTrashed") !== undefined
        ? {
            description: t("details.damageCardsTrashed", {
              count: n("cardsTrashed")!,
            }),
          }
        : {}),
    };
  if (access && effect.kind === "trash_card")
    return say(
      "accessTrash",
      {
        count: known(en("trashedCount") ?? n("amount")),
        counters: known(en("advancementCounterCount", "targetTrashCount")),
        cards: (
          firstString(ep, ["trashedCardDefinitionIds"]) ??
          s("cardDefinitionId") ??
          ""
        )
          .split(",")
          .map((id) => publicCardTitle(id, catalog))
          .filter(Boolean)
          .join(", "),
      },
      "run",
    );
  const outcome = s("randomEffectOutcome");
  if (effect.reason === "start_of_turn" && outcome) {
    const damageType = outcome.endsWith("_damage")
      ? outcome.slice(0, -7)
      : undefined;
    if (outcome === "no_effect")
      return say("randomNoEffect", { roll: known(n("v1921DieRoll")) }, "card");
    if (outcome === "permanent_action")
      return {
        ...say(
          "randomPermanentAction",
          { roll: known(n("v1921DieRoll")) },
          "turn",
        ),
        description: t("details.permanentActionDescription", { source }),
        importance: "important",
      };
    if (damageType === "net" || damageType === "meat" || damageType === "core")
      return {
        ...say(
          "randomDamage",
          {
            roll: known(n("v1921DieRoll")),
            damage: t(`damageType.${damageType}`),
          },
          "danger",
        ),
        ...(p.damageCannotBePrevented === true
          ? { description: t("details.damageUnpreventable", { source }) }
          : {}),
        importance: "critical",
      };
  }
  if (effect.kind === "gain_actions" && s("restrictedActionFamily"))
    return say(
      "forcedAction",
      {
        roll: known(n("dieRoll")),
        action: t(`details.forced_${s("restrictedActionFamily")}`, {
          server: s("serverLabel", "serverId") ?? t("server.newRemote"),
        }),
      },
      "turn",
    );
  if (
    effect.kind === "draw_cards" &&
    s("sourceDefinitionId") === "onr_v1_064_skivviss"
  )
    return {
      ...say("skivviss"),
      description: t("details.skivvissCounters", { amount }),
    };
  if (effect.kind === "rez_card") return say("automaticRez");
  if (effect.kind === "score_agenda" || effect.kind === "steal_agenda")
    return {
      ...say(
        effect.kind === "score_agenda" ? "automaticScore" : "automaticSteal",
        { card: s("cardTitle") ?? source },
        "agenda",
      ),
      importance: "critical",
    };
  if (effect.kind === "add_hosted_credits")
    return say("hostedAdded", {}, "economy");
  if (
    effect.kind === "take_hosted_credits" &&
    n("remainingCounters") !== undefined
  )
    return {
      description: t("details.hostedRemaining", {
        amount: n("remainingCounters")!,
      }),
    };
  if (
    effect.kind === "trash_source_when_empty" ||
    effect.kind === "trash_source"
  )
    return say(
      effect.reason === "run_start" ? "sourceTrashedRunStart" : "sourceTrashed",
    );
  if (effect.kind === "pay_credits_or_lose_game")
    return {
      ...say(
        p.gameLost === true ? "leavePlayLost" : "leavePlayPaid",
        { paid: known(n("paidCredits")) },
        p.gameLost === true ? "danger" : "economy",
      ),
      importance: p.gameLost === true ? "critical" : "important",
    };
  if (effect.kind === "gain_actions") return say("actionsGained", {}, "turn");
  if (effect.kind === "bad_publicity")
    return say("badPublicityGained", {}, "danger");
  if (effect.kind === "counter_change" || effect.kind === "purge_counters") {
    const counterType = s("counterType");
    const counter = counterTitle(counterType, t);
    if (
      ["breaker_strength_penalty", "pattel_antibody"].includes(
        counterType ?? "",
      ) &&
      access
    )
      return say(
        "pattelTargets",
        {
          count: known(en("targetCount")),
          cards: (firstString(ep, ["targetCardDefinitionIds"]) ?? "")
            .split(",")
            .map((id) => publicCardTitle(id, catalog))
            .filter(Boolean)
            .join(", "),
        },
        "run",
      );
    const removed = n("removedCounterAmount");
    const added = n("addedCounterAmount");
    if (effect.counterType === "shell" && removed !== undefined && removed > 0)
      return undefined;
    return say(
      effect.kind === "purge_counters" || (removed !== undefined && removed > 0)
        ? "countersRemoved"
        : added !== undefined && added > 0
          ? "countersAdded"
          : "countersRefreshed",
      {
        counter,
        changed: known(removed && removed > 0 ? removed : added),
        remaining: known(n("remainingCounters", "amount")),
        target:
          s("cardTitle") ??
          (counterType?.startsWith("socket_") ? s("serverLabel") : undefined) ??
          subject,
      },
    );
  }
  if (effect.kind === "damage" && n("cardsTrashed") !== undefined)
    return {
      description: t("details.damageCardsTrashed", {
        count: n("cardsTrashed")!,
      }),
    };
  if (effect.kind === "resolve_subroutine") {
    const subtype = s("subroutineType");
    const number =
      n("subroutineIndex") === undefined
        ? t("details.unknown")
        : n("subroutineIndex")! + 1;
    const dieRoll = n("dieRoll");
    const damageType = s("damageType");
    if (subtype === "deflect_run") {
      const redirected = boolean(ep, "deflectedRun") === true;
      const opened = boolean(ep, "deflectorChoiceOpened") === true;
      return {
        ...say(
          redirected
            ? "redirected"
            : opened
              ? "redirectChoice"
              : "redirectDeclined",
          {
            number,
            server:
              firstString(ep, ["selectedServerLabel", "selectedServerId"]) ??
              t("server.newRemote"),
            paid: known(n("paidCredits") ?? en("paidCredits", "deflectorCost")),
          },
          "run",
        ),
        ...(redirected
          ? {
              description: t(
                boolean(ep, "redirectedToRezzedIce") === true
                  ? "details.redirectRezzed"
                  : "details.redirectPassed",
              ),
            }
          : {}),
      };
    }
    if (subtype === "rewind_run_to_rezzed_ice_by_die")
      return say(
        boolean(ep, "rezzedIceRewindApplied") === true
          ? "rewindApplied"
          : "rewindMiss",
        { roll: known(dieRoll) },
        "run",
      );
    if (
      subtype === "do_damage" &&
      en("preventedAmount") !== undefined &&
      en("finalAmount", "damageAmount") === n("amount")
    )
      return say(
        "subroutinePrevented",
        {
          number,
          original: known(en("originalAmount")),
          prevented: en("preventedAmount")!,
          prevention:
            publicCardTitle(
              firstString(ep, ["sourceDefinitionId", "cardDefinitionId"]),
              catalog,
            ) ??
            firstString(ep, ["sourceTitle", "title"]) ??
            t("card.unknown"),
          damage: t(`damageType.${damageType ?? "unknown"}`),
        },
        "danger",
      );
    if (subtype === "random_damage")
      return say(
        p.randomDamageApplied === true
          ? "subroutineRandomDamage"
          : "subroutineRandomMiss",
        {
          number,
          roll: known(dieRoll),
          damage:
            damageType === "net" ||
            damageType === "core" ||
            damageType === "meat"
              ? t(`damageType.${damageType}`)
              : t("damageType.unknown"),
        },
        "danger",
      );
    if (subtype === "do_damage")
      return say(
        "subroutineDamage",
        {
          number,
          damage:
            damageType === "net" ||
            damageType === "core" ||
            damageType === "meat"
              ? t(`damageType.${damageType}`)
              : t("damageType.unknown"),
        },
        "danger",
      );
    if (subtype && SUBROUTINE_OUTCOMES.has(subtype))
      return say(
        "subroutineOutcome",
        {
          number,
          outcome: t(`details.subroutine_${subtype}`, {
            amount,
            trace: known(n("traceBase", "traceLimit")),
          }),
        },
        "run",
      );
  }
  return undefined;
}

const COUNTER_TYPES = new Set([
  "data_raven",
  "doppelganger",
  "cerberus",
  "mastiff",
  "crying",
  "garbage",
  "tax",
  "vienna",
  "pipe",
  "spy",
  "bit",
  "virus",
  "power",
  "credit",
  "recurring",
  "shell",
  "advancement",
  "agenda",
  "pox",
  "pattel",
  "cockroach",
  "cascade",
  "skivviss",
  "socket",
  "highlighter",
  "scaldan",
]);
const SUBROUTINE_OUTCOMES = new Set([
  "corp_gain_credit",
  "runner_lose_credits",
  "give_runner_tag",
  "initiate_trace",
  "set_run_encounter_tax",
  "set_run_break_subroutine_cost_modifier",
  "set_run_future_end_the_run_subroutine",
  "set_run_active_ice_program_trash",
  "set_run_future_strength_bonus",
  "set_next_encounter_unless_fully_break_damage",
  "set_next_encounter_lock",
  "set_next_encounter_no_break_subroutines",
  "set_run_jack_out_lock",
  "set_runner_forgo_next_action",
  "set_run_jack_out_additional_cost",
  "set_run_pass_rezzed_ice_program_trash",
  "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
  "reveal_corp_rd_top",
  "reorder_corp_rd_top2",
]);

function counterTitle(type: string | undefined, t: ChronicleTranslate): string {
  const canonical = type ? (COUNTER_ALIASES[type] ?? type) : undefined;
  return canonical && COUNTER_TYPES.has(canonical)
    ? t(`details.counter_${canonical}`)
    : t("details.counterUnknown");
}
const COUNTER_ALIASES: Record<string, string> = {
  trace_tag_counter: "data_raven",
  link_reduction_counter: "doppelganger",
  doppelganger_antibody: "doppelganger",
  breaker_strength_penalty: "pattel",
  pattel_antibody: "pattel",
  socket_archives: "socket",
  socket_hq: "socket",
  socket_rd: "socket",
  recurring_credit: "recurring",
};
