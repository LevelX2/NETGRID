import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../../semantic-ai-runtime-cutover.test-support";
import { runnerActionDispositions } from "../../runtime/plan-first-live-runtime";
import {
  createRunnerDefenseModule,
  runnerDefenseCurrentHeadActionIds,
  runnerDefenseDeferredHandBufferDispositions,
} from "./defense-plan-module";
import type { RunnerDefenseSignals } from "./defense-types";
import type { RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";

function fixture(tags = 1) {
  const draw = legalAction(
    "runner.draw_card",
    "runner",
    "draw_card",
    "Draw a card",
    { credits: 0, clicks: 1 },
  );
  const clear = legalAction(
    "runner.remove_tag",
    "runner",
    "remove_tag",
    "Remove a tag",
    { credits: 2, clicks: 1 },
  );
  const input = aiInput("runner", tags ? [draw, clear] : [draw]);
  Object.assign(input.playerView.own, {
    credits: 6,
    clicks: 4,
    tags,
    coreDamage: 2,
    maxHandSize: 3,
    stackOrRdCount: 16,
  });
  input.playerView.own.gripOrHq = [1, 2, 3].map((n) =>
    visibleCard(`hand-${n}`, "runner", "event"),
  );
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: 1,
  });
  const defense: RunnerDefenseSignals = {
    activeTags: tags,
    visibleTagPunish: tags > 0,
    persistentHazardCounterRemovalAvailable: false,
    pendingDamage: 0,
    damagePreventionNeeded: false,
    handSize: 3,
    minimumHandBuffer: 4,
    drawAllowed: true,
    handBufferActionIds: [draw.actionId],
    forgoUnsafeRunCapacity: false,
    handBufferPriorityClass: "P3",
    evidenceCodes: ["runner_quoted_prerun_hand_buffer:4"],
  };
  const domain: RunnerPlanDomain = {
    creditBanks: [],
    recurringEconomy: [],
    resourceLifecycle: [],
    shellTradersPipelines: [],
    runWindows: [],
    developments: [],
    coverageGaps: [],
    centralPressure: [],
    remoteContests: [],
    installedAgendaScores: [],
    installedCardLiquidationChoices: [],
    terminalWins: [],
    exposeInformation: [],
    fundingNeeds: [],
    defense,
  };
  return { input, candidates, defense, domain, draw, clear };
}

describe("Defense hand-buffer phase ownership", () => {
  it("publishes only the current productive Defense head for generic ownership", () => {
    const f = fixture();
    expect(
      runnerDefenseCurrentHeadActionIds({
        input: f.input,
        actionCandidates: f.candidates,
        signals: f.defense,
      }),
    ).toEqual([f.clear.actionId]);
  });

  it("releases tag-clear ownership when revalidation opens the buffer phase", () => {
    const f = fixture(0);
    expect(
      runnerDefenseCurrentHeadActionIds({
        input: f.input,
        actionCandidates: f.candidates,
        signals: f.defense,
      }),
    ).toEqual([f.draw.actionId]);
  });

  it("does not publish a confirmed damage-taxed action as a productive head", () => {
    const f = fixture();
    f.defense.confirmedDamageTaxedDrawActionIds = [f.clear.actionId];
    expect(
      runnerDefenseCurrentHeadActionIds({
        input: f.input,
        actionCandidates: f.candidates,
        signals: f.defense,
      }),
    ).not.toContain(f.clear.actionId);
  });

  it("keeps a canonical tag-clearing draw executable in the current Defense phase", () => {
    const f = fixture();
    const meatUpgrade = legalAction(
      "runner.play_event.meat-upgrade",
      "runner",
      "play_event",
      "Meat Upgrade",
      { credits: 2, clicks: 2 },
      {
        source: "meat-upgrade",
        payload: {
          cardId: "meat-upgrade",
          cardImplementationEffectKind: "remove_tags",
          drawCardsAmount: 3,
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_classic_040_meat-upgrade:on_play_remove_tags_and_draw",
          cardImplementationAbilityKey: "on_play_remove_tags_and_draw",
        },
      },
    );
    meatUpgrade.expiresAtStateVersion = f.input.playerView.stateVersion;
    f.input.legalActions.push(meatUpgrade);
    Object.assign(f.input.playerView.own, { coreDamage: 0, maxHandSize: 5 });
    f.input.playerView.own.gripOrHq[0] = visibleCard(
      "meat-upgrade",
      "runner",
      "event",
      { definitionId: "onr_classic_040_meat-upgrade" },
    );
    f.defense.handBufferActionIds = [f.draw.actionId, meatUpgrade.actionId];
    const candidates = buildActionSemanticCandidates({
      legalActions: f.input.legalActions,
      observerSide: "runner",
      stateVersion: f.input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        "meat-upgrade": "onr_classic_040_meat-upgrade",
      },
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const multiPurpose = candidates.find(
      (candidate) => candidate.actionId === meatUpgrade.actionId,
    );
    expect(multiPurpose?.semanticActionType).toBe("tag.remove");
    expect(multiPurpose?.economyProjection?.cardsDrawn).toBe(3);
    const dispositions = runnerActionDispositions(
      f.input,
      candidates,
      f.domain,
      [],
      [],
      () => undefined,
    );
    expect(dispositions.map((entry) => entry.actionId)).toContain(
      f.draw.actionId,
    );
    expect(dispositions.map((entry) => entry.actionId)).not.toContain(
      meatUpgrade.actionId,
    );
    const module = createRunnerDefenseModule();
    const context = {
      input: f.input,
      actionCandidates: candidates,
      actionDispositions: dispositions,
      turnKey: "runner:0",
      domain: f.domain,
    };
    const proposal = module.discover(context)[0]!;
    expect(proposal.phase).toBe("clear_tags");
    expect(
      module
        .materialize(
          { ...proposal, instanceId: "defense-current-phase" } as never,
          {} as never,
          context,
        )
        .candidates.map((entry) => entry.candidate.actionId),
    ).toContain(meatUpgrade.actionId);
  });

  it("classifies the pending basic draw under Defense while the same owner clears a tag", () => {
    const f = fixture();
    expect(
      createRunnerDefenseModule().discover({
        input: f.input,
        actionCandidates: f.candidates,
        turnKey: "runner:0",
        domain: f.domain,
      })[0]?.phase,
    ).toBe("clear_tags");
    const dispositions = runnerActionDispositions(
      f.input,
      f.candidates,
      f.domain,
      [],
      [],
      () => undefined,
    );
    expect(dispositions.find((x) => x.actionId === f.draw.actionId)).toEqual({
      actionId: f.draw.actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId: "runner.defense_and_recovery",
      evidenceCode:
        "runner_hand_buffer_deferred_for_current_defense_phase:clear_tags",
    });
    expect(dispositions.some((x) => x.actionId === f.clear.actionId)).toBe(
      false,
    );
    expect(f.defense.handBufferActionIds).toEqual([f.draw.actionId]);
  });

  it("opens the exact buffer action again after tag-clear revalidation", () => {
    const f = fixture(0);
    expect(
      createRunnerDefenseModule().discover({
        input: f.input,
        actionCandidates: f.candidates,
        turnKey: "runner:0",
        domain: f.domain,
      })[0]?.phase,
    ).toBe("build_hand_buffer");
    expect(
      runnerDefenseDeferredHandBufferDispositions({
        actionCandidates: f.candidates,
        stateVersion: 1,
        signals: f.defense,
        independentlyOwnedActionIds: new Set(),
      }),
    ).toEqual([]);
  });

  it("preserves the same legal draw when another productive owner binds it", () => {
    const f = fixture();
    expect(
      runnerDefenseDeferredHandBufferDispositions({
        actionCandidates: f.candidates,
        stateVersion: 1,
        signals: f.defense,
        independentlyOwnedActionIds: new Set([f.draw.actionId]),
      }),
    ).toEqual([]);
  });

  it("does not replace an existing unknown assessment with a hold verdict", () => {
    const f = fixture();
    expect(
      runnerDefenseDeferredHandBufferDispositions({
        actionCandidates: f.candidates,
        stateVersion: 1,
        signals: f.defense,
        independentlyOwnedActionIds: new Set(),
        actionDispositions: [
          {
            actionId: f.draw.actionId,
            disposition: "assessment_unknown",
            ownerModuleId: "runner.rig_and_coverage",
            evidenceCode: "missing_current_quote",
          },
        ],
      }),
    ).toEqual([]);
  });
});
