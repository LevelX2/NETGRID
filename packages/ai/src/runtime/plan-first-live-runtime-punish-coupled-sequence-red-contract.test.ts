import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteSet,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction as chooseCorpActionRuntime } from "../index";
import type { PlanInstance } from "../plans/plan-kernel-types";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";

const CAMPAIGN_ID = "tag-and-bag";
const CHANCE_ROUTE_ID = "chance-observation-4-2";
const FOUR_DAMAGE_ROUTE_ID = "chance-observation-4";
const AUDIT_ROUTE_ID = "audit-call-records-4-2";
const CHANCE_DEFINITION_ID = "onr_v1_284_chance-observation";
const AUDIT_DEFINITION_ID = "onr_v1_283_audit-of-call-records";
const SCORCHED_DEFINITION_ID = "onr_v1_302_scorched-earth";
const PUNITIVE_DEFINITION_ID = "onr_v1_301_punitive-counterstrike";
const CLOSED_ACCOUNTS_DEFINITION_ID = "onr_v1_285_closed-accounts";
const AGENDA_DEFINITION_ID = "onr_v1_203_hostile-takeover";

const chooseCorpAction = (input: AiDecisionInput) =>
  chooseCorpActionRuntime(input, {
    corpTurnPlannerMode: "legacy_compare",
  });

describe("plan-first coupled Corp punish sequence contract", () => {
  afterEach(() => {
    resetResidentPlanPortfolioMemory();
  });

  it("executes one complete Tag -> 4 Meat -> 2 Meat route through one stable P1 root", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const root = punishRoots(portfolio?.instances).at(0);
    const child = exactPunishChild(portfolio?.instances, root);
    const quote = input.playerView.corpPunishRouteQuoteSet?.routes[0];

    expect(quote).toMatchObject({
      campaignId: CAMPAIGN_ID,
      campaignIdOrigin: "request_binding",
      routeId: CHANCE_ROUTE_ID,
      complete: true,
      totalClicks: 3,
      totalActionCredits: 5,
      responsePaymentEnvelope: {
        corpResponseCredits: { minimum: 0, maximum: 5 },
        totalCorpCredits: { minimum: 5, maximum: 10 },
      },
      damageEnvelope: {
        runnerHandCount: 5,
        rawDamage: { meat: 6, net: 0, core: 0, total: 6 },
        effectiveDamage: { minimum: 6, maximum: 6 },
      },
    });
    expect(punishRoots(portfolio?.instances)).toHaveLength(1);
    expect(root).toMatchObject({
      moduleId: "corp.punish_campaign",
      dedupeKey: CAMPAIGN_ID,
      persistencePolicy: "sticky_goal",
    });
    expect(child).toMatchObject({
      moduleId: "corp.execute_punish_sequence",
      parentInstanceId: root?.instanceId,
      persistencePolicy: "locked_sequence",
    });
    expect(child?.parentNeedId).toBeDefined();
    expect(root?.openNeedIds).toContain(child?.parentNeedId);
    expect(punishSignalPriority(child)).not.toBe("P1");
    expect(decision).toMatchObject({
      actionId: "play-chance-observation",
      reasonCode: "plan_first.corp.execute_punish_sequence",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${root?.instanceId}`,
        `plan_first_executor:${child?.instanceId}`,
        `plan_priority_delegated_from:${root?.instanceId}`,
        `plan_priority_need:${child?.parentNeedId}`,
        "plan_priority_class:P1",
      ]),
    );
  });

  it("funds the whole route only when the funding click and all three sequence clicks fit", () => {
    const noFundingHorizon = coupledPunishInput({
      stateVersion: 1,
      credits: 9,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
      includeCredit: true,
    });

    const noFundingDecision = chooseCorpAction(noFundingHorizon);
    const noFundingPortfolio = residentPlanPortfolioSnapshot(noFundingHorizon);
    const waitingRoot = punishRoots(noFundingPortfolio?.instances).at(0);

    expect(noFundingDecision).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(waitingRoot).toBeDefined();
    expect(
      exactPunishChild(noFundingPortfolio?.instances, waitingRoot),
    ).toBeUndefined();

    resetResidentPlanPortfolioMemory();
    const fundingFits = coupledPunishInput({
      stateVersion: 1,
      credits: 9,
      clicks: 4,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
      includeCredit: true,
    });

    const fundingDecision = chooseCorpAction(fundingFits);
    const fundingPortfolio = residentPlanPortfolioSnapshot(fundingFits);
    const fundedRoot = punishRoots(fundingPortfolio?.instances).at(0);
    const economyChild = fundingPortfolio?.instances.find(
      (instance) =>
        instance.moduleId === "corp.economy" &&
        instance.parentInstanceId === fundedRoot?.instanceId,
    );
    expect(fundedRoot).toBeDefined();
    expect(economyChild).toBeDefined();
    expect(economyChild?.parentNeedId).toBeDefined();
    expect(fundedRoot?.openNeedIds).toContain(economyChild?.parentNeedId);
    expect(fundingDecision).toMatchObject({
      actionId: "gain-credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(fundingDecision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${fundedRoot?.instanceId}`,
        `plan_first_executor:${economyChild?.instanceId}`,
        `plan_priority_delegated_from:${fundedRoot?.instanceId}`,
        `plan_priority_need:${economyChild?.parentNeedId}`,
        "plan_priority_class:P1",
      ]),
    );
  });

  it("keeps the lethal root waiting when too few clicks remain and lets a real score plan act", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 2,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const root = punishRoots(portfolio?.instances).at(0);

    expect(root).toBeDefined();
    expect(exactPunishChild(portfolio?.instances, root)).toBeUndefined();
    expect(decision).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
  });

  it("does not claim a lethal P1 route through visible meat-damage prevention", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
      prevention: "full_meat",
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const root = punishRoots(portfolio?.instances).at(0);
    const child = exactPunishChild(portfolio?.instances, root);
    const rootSignal = punishSignal(root);

    expect(
      input.playerView.corpPunishRouteQuoteSet?.routes[0]?.damageEnvelope,
    ).toMatchObject({
      effectiveDamage: { minimum: 0, maximum: 0 },
      visiblePrevention: {
        knowledge: "exact_public",
        maximumPreventableDamage: 6,
      },
    });
    expect(decision.evidence).not.toContain("plan_priority_class:P1");
    expect(punishSignalPriority(child)).not.toBe("P1");
    expect(rootSignal).toMatchObject({
      phase: "watch_window",
      feasible: false,
      value: 0,
      priorityClass: "P5",
    });
    expect(rootSignal?.actionIds).toBeUndefined();
    expect(child).toBeUndefined();
    expect(
      portfolio?.instances.some(
        (instance) =>
          (instance.moduleId === "corp.execute_punish_sequence" ||
            instance.moduleId === "corp.economy") &&
          instance.parentInstanceId === root?.instanceId,
      ),
    ).toBe(false);
    expect(decision).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
  });

  it("retains the root but exposes no damage head after the trace loses or the tag is prevented", () => {
    const initial = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
    });

    chooseCorpAction(initial);
    const initialRoot = punishRoots(
      residentPlanPortfolioSnapshot(initial)?.instances,
    ).at(0);

    advanceAfterFailedTag(initial);
    const decision = chooseCorpAction(initial);
    const portfolio = residentPlanPortfolioSnapshot(initial);
    const retainedRoot = punishRoots(portfolio?.instances).at(0);

    expect(initialRoot).toBeDefined();
    expect(retainedRoot?.instanceId).toBe(initialRoot?.instanceId);
    expect(retainedRoot?.updatedAtStateVersion).toBe(2);
    expect(retainedRoot).toMatchObject({
      phase: "watch_window",
      openNeedIds: [],
    });
    expect(
      exactPunishChild(portfolio?.instances, retainedRoot),
    ).toBeUndefined();
    expect(
      portfolio?.instances.some(
        (instance) =>
          instance.moduleId === "corp.hand_and_agenda_management" &&
          instance.parentInstanceId === retainedRoot?.instanceId,
      ),
    ).toBe(false);
    expect(decision).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
  });

  it("re-quotes Tag success into 4 Meat and then 2 Meat without admitting a foreign punish interruption", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
    });

    expect(chooseCorpAction(input).actionId).toBe("play-chance-observation");
    const initialRoot = punishRoots(
      residentPlanPortfolioSnapshot(input)?.instances,
    ).at(0);

    advanceAfterSuccessfulTag(input);
    const scorchedDecision = chooseCorpAction(input);
    const scorchedPortfolio = residentPlanPortfolioSnapshot(input);
    const scorchedRoot = punishRoots(scorchedPortfolio?.instances).at(0);
    const scorchedChild = exactPunishChild(
      scorchedPortfolio?.instances,
      scorchedRoot,
    );

    expect(scorchedRoot?.instanceId).toBe(initialRoot?.instanceId);
    expect(scorchedDecision).toMatchObject({
      actionId: "play-scorched-earth",
      reasonCode: "plan_first.corp.execute_punish_sequence",
    });
    expect(scorchedDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_punish_route_quote_state_version:2",
        `plan_priority_delegated_from:${scorchedRoot?.instanceId}`,
      ]),
    );
    expect(scorchedChild?.parentInstanceId).toBe(scorchedRoot?.instanceId);

    advanceAfterScorchedEarth(input);
    const punitiveDecision = chooseCorpAction(input);
    const punitivePortfolio = residentPlanPortfolioSnapshot(input);
    const punitiveRoot = punishRoots(punitivePortfolio?.instances).at(0);
    const punitiveChild = exactPunishChild(
      punitivePortfolio?.instances,
      punitiveRoot,
    );

    expect(punitiveRoot?.instanceId).toBe(initialRoot?.instanceId);
    expect(punitiveDecision).toMatchObject({
      actionId: "play-punitive-counterstrike",
      reasonCode: "plan_first.corp.execute_punish_sequence",
    });
    expect(punitiveDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_punish_route_quote_state_version:3",
        `plan_priority_delegated_from:${punitiveRoot?.instanceId}`,
      ]),
    );
    expect(punitiveChild?.parentInstanceId).toBe(punitiveRoot?.instanceId);
    expect(
      punitivePortfolio?.instances.filter(
        (instance) => instance.moduleId === "corp.punish_campaign",
      ),
    ).toHaveLength(1);
  });

  it.each([
    {
      label: "runner hand exceeds projected damage",
      runnerHandCount: 7,
      missingSource: false,
      incompleteReason: undefined,
    },
    {
      label: "a future damage source is missing",
      runnerHandCount: 5,
      missingSource: true,
      incompleteReason: "source_unavailable" as const,
    },
    {
      label: "a future step quote is unknown",
      runnerHandCount: 5,
      missingSource: false,
      incompleteReason: "cost_quote_incomplete" as const,
    },
  ])(
    "does not expose a terminal execution when $label",
    ({ runnerHandCount, missingSource, incompleteReason }) => {
      const input = coupledPunishInput({
        stateVersion: 1,
        credits: 10,
        clicks: 3,
        runnerHandCount,
        runnerTags: 0,
        stage: "tag",
        missingPunitiveSource: missingSource,
        ...(incompleteReason ? { incompleteReason } : {}),
      });

      const decision = chooseCorpAction(input);
      const portfolio = residentPlanPortfolioSnapshot(input);
      const root = punishRoots(portfolio?.instances).at(0);
      const child = exactPunishChild(portfolio?.instances, root);

      expect(decision.evidence).not.toContain("plan_priority_class:P1");
      expect(punishSignalPriority(child)).not.toBe("P1");
      if (incompleteReason) {
        expect(input.playerView.corpPunishRouteQuoteSet).toMatchObject({
          complete: false,
          incompleteReasons: [incompleteReason],
          routes: [],
        });
        expect(
          portfolio?.instances.some(
            (instance) => instance.moduleId === "corp.execute_punish_sequence",
          ),
        ).toBe(false);
        expect(decision.actionId).not.toBe("play-chance-observation");
      }
    },
  );

  it("selects the stronger complete route internally without creating a second campaign root", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
      includeAuditAlternative: true,
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const roots = punishRoots(portfolio?.instances);
    const root = roots.at(0);
    const child = exactPunishChild(portfolio?.instances, root);

    expect(
      input.playerView.corpPunishRouteQuoteSet?.routes.map(
        (route) => route.routeId,
      ),
    ).toEqual([CHANCE_ROUTE_ID, AUDIT_ROUTE_ID]);
    expect(roots).toHaveLength(1);
    expect(root?.dedupeKey).toBe(CAMPAIGN_ID);
    expect(child?.parentInstanceId).toBe(root?.instanceId);
    expect(decision).toMatchObject({
      actionId: "play-audit-call-records",
      reasonCode: "plan_first.corp.execute_punish_sequence",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_assessment_evidence:corp_punish_route_selected:${AUDIT_ROUTE_ID}`,
        `plan_priority_delegated_from:${root?.instanceId}`,
      ]),
    );
  });

  it.each([
    {
      runnerHandCount: 3,
      expectedRouteId: FOUR_DAMAGE_ROUTE_ID,
      label: "four damage is already lethal",
    },
    {
      runnerHandCount: 4,
      expectedRouteId: CHANCE_ROUTE_ID,
      label: "exactly four damage is not lethal",
    },
  ])(
    "selects the shortest sufficient complete route when $label",
    ({ runnerHandCount, expectedRouteId }) => {
      const input = coupledPunishInput({
        stateVersion: 1,
        credits: 10,
        clicks: 3,
        runnerHandCount,
        runnerTags: 0,
        stage: "tag",
        includeFourDamageAlternative: true,
      });

      chooseCorpAction(input);
      const portfolio = residentPlanPortfolioSnapshot(input);
      const root = punishRoots(portfolio?.instances).at(0);
      const child = exactPunishChild(portfolio?.instances, root);

      expect(punishRouteId(child)).toBe(expectedRouteId);
      expect(punishRoots(portfolio?.instances)).toHaveLength(1);
    },
  );

  it("rates six damage against seven cards as material P4 hand destruction above the same damage against twenty cards", () => {
    const materialInput = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 7,
      runnerTags: 0,
      stage: "tag",
    });

    const materialDecision = chooseCorpAction(materialInput);
    const materialPortfolio = residentPlanPortfolioSnapshot(materialInput);
    const materialRoot = punishRoots(materialPortfolio?.instances).find(
      (instance) => instance.dedupeKey === CAMPAIGN_ID,
    );
    const materialChild = exactPunishChild(
      materialPortfolio?.instances,
      materialRoot,
    );
    const materialSignal = punishSignal(materialRoot);

    expect(materialSignal).toMatchObject({
      priorityClass: "P4",
      feasible: true,
      visibleTerminalProjection: false,
    });
    const weakTwoPointScorePlanValue = 140;
    expect(materialSignal?.value).toBeGreaterThan(weakTwoPointScorePlanValue);
    expect(materialChild).toBeDefined();
    expect(materialDecision.fallbackUsed).toBe(false);

    resetResidentPlanPortfolioMemory();
    const chipInput = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 20,
      runnerTags: 0,
      stage: "tag",
    });

    chooseCorpAction(chipInput);
    const chipPortfolio = residentPlanPortfolioSnapshot(chipInput);
    const chipRoot = punishRoots(chipPortfolio?.instances).find(
      (instance) => instance.dedupeKey === CAMPAIGN_ID,
    );
    const chipSignal = punishSignal(chipRoot);

    expect(chipSignal).toMatchObject({
      priorityClass: "P5",
      feasible: true,
      visibleTerminalProjection: false,
    });
    expect(chipSignal?.value).toBeGreaterThan(0);
    expect(materialSignal?.value).toBeGreaterThan(chipSignal?.value ?? 0);
    expect(exactPunishChild(chipPortfolio?.instances, chipRoot)).toBeDefined();
  });

  it("prefers a resource-efficient material route over marginal extra damage with much higher cost", () => {
    const input = coupledPunishInput({
      stateVersion: 1,
      credits: 20,
      clicks: 3,
      runnerHandCount: 7,
      runnerTags: 0,
      stage: "tag",
      includeFourDamageAlternative: true,
    });
    const expensiveSixDamageRoute =
      input.playerView.corpPunishRouteQuoteSet?.routes.find(
        (route) => route.routeId === CHANCE_ROUTE_ID,
      );
    expect(expensiveSixDamageRoute).toBeDefined();
    setEffectiveDamage(expensiveSixDamageRoute!, 5);
    addFutureStepCreditLoad(expensiveSixDamageRoute!, 12);

    chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const root = punishRoots(portfolio?.instances).find(
      (instance) => instance.dedupeKey === CAMPAIGN_ID,
    );
    const child = exactPunishChild(portfolio?.instances, root);

    expect(punishSignal(root)).toMatchObject({
      priorityClass: "P4",
      feasible: true,
    });
    expect(punishRouteId(child)).toBe(FOUR_DAMAGE_ROUTE_ID);
  });

  it("returns the same decision for hidden twins with identical Corp PlayerViews", () => {
    const left = coupledPunishInput({
      stateVersion: 1,
      credits: 10,
      clicks: 3,
      runnerHandCount: 5,
      runnerTags: 0,
      stage: "tag",
    });
    const right = structuredClone(left);
    Object.assign(left, {
      __forbiddenHiddenRunnerGripFixture: [
        "hidden-runner-card-a",
        "hidden-runner-card-b",
      ],
    });
    Object.assign(right, {
      __forbiddenHiddenRunnerGripFixture: [
        "hidden-runner-card-x",
        "hidden-runner-card-y",
      ],
    });

    expect(left.playerView).toEqual(right.playerView);
    const leftDecision = chooseCorpAction(left);
    resetResidentPlanPortfolioMemory();
    const rightDecision = chooseCorpAction(right);

    expect(decisionIdentity(rightDecision)).toEqual(
      decisionIdentity(leftDecision),
    );
  });
});

type PunishStage = "tag" | "scorched" | "punitive";
type Prevention = "none" | "full_meat";

function coupledPunishInput(params: {
  stateVersion: number;
  credits: number;
  clicks: number;
  runnerHandCount: number;
  runnerTags: number;
  stage: PunishStage;
  includeCredit?: boolean;
  prevention?: Prevention;
  missingPunitiveSource?: boolean;
  incompleteReason?: CorpPunishRouteIncompleteReason;
  includeAuditAlternative?: boolean;
  includeFourDamageAlternative?: boolean;
}): AiDecisionInput {
  const chance = chanceObservationCard();
  const audit = auditCallRecordsCard();
  const scorched = scorchedEarthCard();
  const punitive = punitiveCounterstrikeCard();
  const closedAccounts = closedAccountsCard();
  const agenda = scoreAgendaCard();
  const currentActions = stageActions({
    stage: params.stage,
    stateVersion: params.stateVersion,
    chance,
    audit,
    scorched,
    punitive,
    closedAccounts,
    includeAuditAlternative: params.includeAuditAlternative === true,
  });
  const actions = [
    ...currentActions,
    ...(params.includeCredit ? [gainCredit(params.stateVersion)] : []),
    installAgenda(agenda, params.stateVersion),
    endTurn(params.stateVersion),
  ];
  const input = aiInput("corp", actions);
  for (const action of actions) {
    action.expiresAtStateVersion = params.stateVersion;
  }
  input.decisionId = "coupled-punish-sequence:corp";
  input.actionNumber = params.stateVersion;
  input.playerView.stateVersion = params.stateVersion;
  input.playerView.own.credits = params.credits;
  input.playerView.own.clicks = params.clicks;
  input.playerView.own.gripOrHq = [
    ...(params.stage === "tag" ? [chance] : []),
    ...(params.includeAuditAlternative ? [audit] : []),
    ...(params.stage !== "punitive" ? [scorched] : []),
    ...(!params.missingPunitiveSource ? [punitive] : []),
    ...(params.stage === "punitive" ? [closedAccounts] : []),
    agenda,
  ];
  input.playerView.opponent.tags = params.runnerTags;
  input.playerView.opponent.handCount = params.runnerHandCount;
  input.playerView.opponent.credits = 4;
  input.playerView.opponent.rig =
    params.prevention === "full_meat" ? [fullBodyConversionCard()] : [];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1"),
  ];
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  input.playerView.corpPunishRouteQuoteSet = punishQuoteSet({
    stateVersion: params.stateVersion,
    stage: params.stage,
    credits: params.credits,
    runnerHandCount: params.runnerHandCount,
    runnerTags: params.runnerTags,
    headActions: currentActions,
    prevention: params.prevention ?? "none",
    ...(params.incompleteReason
      ? { incompleteReason: params.incompleteReason }
      : {}),
    includeAuditAlternative: params.includeAuditAlternative === true,
    includeFourDamageAlternative: params.includeFourDamageAlternative === true,
  });
  return input;
}

function punishQuoteSet(params: {
  stateVersion: number;
  stage: PunishStage;
  credits: number;
  runnerHandCount: number;
  runnerTags: number;
  headActions: LegalAction[];
  prevention: Prevention;
  incompleteReason?: CorpPunishRouteIncompleteReason;
  includeAuditAlternative: boolean;
  includeFourDamageAlternative: boolean;
}): CorpPunishRouteQuoteSet {
  if (params.incompleteReason) {
    return {
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      visibility: "private_to_actor",
      side: "corp",
      stateVersion: params.stateVersion,
      timingPoint: "corp_action.main",
      complete: false,
      incompleteReasons: [params.incompleteReason],
      runnerHandCount: params.runnerHandCount,
      runnerTags: params.runnerTags,
      runnerCreditsVisible: 4,
      routes: [],
    };
  }
  const chanceAction = params.headActions.find(
    (action) => action.actionId === "play-chance-observation",
  );
  const auditAction = params.headActions.find(
    (action) => action.actionId === "play-audit-call-records",
  );
  const scorchedAction = params.headActions.find(
    (action) => action.actionId === "play-scorched-earth",
  );
  const punitiveAction = params.headActions.find(
    (action) => action.actionId === "play-punitive-counterstrike",
  );
  const routes = [
    punishRouteQuote({
      routeId: CHANCE_ROUTE_ID,
      tagCard: chanceObservationCard(),
      tagAction: chanceAction,
      scorchedAction,
      punitiveAction,
      ...params,
    }),
    ...(params.includeAuditAlternative
      ? [
          punishRouteQuote({
            routeId: AUDIT_ROUTE_ID,
            tagCard: auditCallRecordsCard(),
            tagAction: auditAction,
            scorchedAction,
            punitiveAction,
            ...params,
          }),
        ]
      : []),
    ...(params.includeFourDamageAlternative
      ? [
          punishRouteQuote({
            routeId: FOUR_DAMAGE_ROUTE_ID,
            tagCard: chanceObservationCard(),
            tagAction: chanceAction,
            scorchedAction,
            punitiveAction: undefined,
            includePunitiveDamage: false,
            ...params,
          }),
        ]
      : []),
  ];
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: params.stateVersion,
    timingPoint: "corp_action.main",
    complete: true,
    incompleteReasons: [],
    runnerHandCount: params.runnerHandCount,
    runnerTags: params.runnerTags,
    runnerCreditsVisible: 4,
    routes,
  };
}

function punishRouteQuote(params: {
  routeId: string;
  stateVersion: number;
  stage: PunishStage;
  credits: number;
  runnerHandCount: number;
  runnerTags: number;
  prevention: Prevention;
  tagCard: VisibleCard;
  tagAction: LegalAction | undefined;
  scorchedAction: LegalAction | undefined;
  punitiveAction: LegalAction | undefined;
  includePunitiveDamage?: boolean;
}): CorpPunishRouteQuote {
  const includePunitiveDamage = params.includePunitiveDamage !== false;
  const remainingDamage =
    params.stage === "tag"
      ? includePunitiveDamage
        ? 6
        : 4
      : params.stage === "scorched"
        ? includePunitiveDamage
          ? 6
          : 4
        : 2;
  const preventedDamage =
    params.prevention === "full_meat" ? remainingDamage : 0;
  const effectiveDamage = remainingDamage - preventedDamage;
  const tagCardCredits =
    params.tagCard.definitionId === AUDIT_DEFINITION_ID ? 0 : 2;
  const responseCredits = params.stage === "tag" ? 5 : 0;
  const deterministicCredits =
    params.stage === "tag"
      ? tagCardCredits + 3
      : params.stage === "scorched"
        ? 3
        : 0;
  const steps =
    params.stage === "tag"
      ? [
          punishStep({
            card: params.tagCard,
            stepId: `${params.routeId}:tag`,
            order: 1,
            kind: "trace_tag",
            credits: tagCardCredits,
            ...(params.tagAction
              ? { currentLegalAction: params.tagAction }
              : {}),
          }),
          punishStep({
            card: scorchedEarthCard(),
            stepId: `${params.routeId}:damage-4`,
            order: 2,
            kind: "meat_damage",
            credits: 3,
          }),
          punishStep({
            card: punitiveCounterstrikeCard(),
            stepId: `${params.routeId}:damage-2`,
            order: 3,
            kind: "meat_damage",
            credits: 0,
          }),
        ].filter(
          (step) =>
            includePunitiveDamage ||
            step.sourceCardDefinitionId !== PUNITIVE_DEFINITION_ID,
        )
      : params.stage === "scorched"
        ? [
            punishStep({
              card: scorchedEarthCard(),
              stepId: `${params.routeId}:damage-4`,
              order: 2,
              kind: "meat_damage",
              credits: 3,
              ...(params.scorchedAction
                ? { currentLegalAction: params.scorchedAction }
                : {}),
            }),
            punishStep({
              card: punitiveCounterstrikeCard(),
              stepId: `${params.routeId}:damage-2`,
              order: 3,
              kind: "meat_damage",
              credits: 0,
            }),
          ]
        : [
            punishStep({
              card: punitiveCounterstrikeCard(),
              stepId: `${params.routeId}:damage-2`,
              order: 3,
              kind: "meat_damage",
              credits: 0,
              ...(params.punitiveAction
                ? { currentLegalAction: params.punitiveAction }
                : {}),
            }),
          ];
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    matchId: "punish-contract-match",
    side: "corp",
    routeId: params.routeId,
    campaignId: CAMPAIGN_ID,
    campaignIdOrigin: "request_binding",
    stateVersion: params.stateVersion,
    timingPoint: "corp_action.main",
    requestFingerprint: `punish-contract:${params.routeId}:${params.stateVersion}`,
    requestEcho: {
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      matchId: "punish-contract-match",
      side: "corp",
      stateVersion: params.stateVersion,
      timingPoint: "corp_action.main",
      campaignId: CAMPAIGN_ID,
      routeId: params.routeId,
      steps: steps.map((step) => ({
        stepId: step.stepId,
        order: step.order,
        kind: step.kind,
        sourceCardInstanceId: step.sourceCardInstanceId,
        sourceCapabilityId: step.sourceCapabilityId,
      })),
    },
    complete: true,
    incompleteReasons: [],
    steps,
    totalClicks: steps.length,
    totalActionCredits: deterministicCredits,
    tagTrigger:
      params.stage === "tag"
        ? {
            kind: "trace_tag_step",
            status: "response_required",
            currentRunnerTags: params.runnerTags,
            requiredRunnerTags: 1,
            sourceStepId: `${params.routeId}:tag`,
            baseTraceStrength: 5,
          }
        : {
            kind: "existing_tag",
            status: "satisfied",
            currentRunnerTags: params.runnerTags,
            requiredRunnerTags: 1,
          },
    responsePaymentEnvelope: {
      responseKind: params.stage === "tag" ? "trace_bid" : "none",
      paymentKnowledge: "exact_public",
      corpCreditsAvailable: params.credits,
      runnerCreditsVisible: 4,
      corpResponseCredits: {
        minimum: 0,
        maximum: responseCredits,
      },
      totalCorpCredits: {
        minimum: deterministicCredits,
        maximum: deterministicCredits + responseCredits,
      },
      runnerResponseCredits: {
        minimum: 0,
        maximum: params.stage === "tag" ? 4 : 0,
      },
    },
    damageEnvelope: {
      runnerHandCount: params.runnerHandCount,
      rawDamage: {
        meat: remainingDamage,
        net: 0,
        core: 0,
        total: remainingDamage,
      },
      effectiveDamage: {
        minimum: effectiveDamage,
        maximum: effectiveDamage,
      },
      visiblePrevention: {
        knowledge:
          params.prevention === "full_meat" ? "exact_public" : "none_visible",
        maximumPreventableDamage: preventedDamage,
        creditCost: { minimum: 0, maximum: 0 },
      },
      visiblePiercing: {
        knowledge: "none_visible",
        maximumBypassedDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
    },
    guarantee:
      effectiveDamage <= params.runnerHandCount
        ? "not_guaranteed"
        : params.stage === "tag"
          ? "conditional_on_runner_response"
          : "guaranteed",
    responseKnowledge: params.stage === "tag" ? "unknown" : "public_exact",
  };
}

function punishStep(params: {
  card: VisibleCard;
  stepId: string;
  order: number;
  kind: "trace_tag" | "meat_damage";
  credits: number;
  currentLegalAction?: LegalAction;
}): CorpPunishRouteQuote["steps"][number] {
  return {
    stepId: params.stepId,
    order: params.order,
    kind: params.kind,
    sourceCardInstanceId: params.card.instanceId,
    sourceCardDefinitionId: params.card.definitionId!,
    sourceCapabilityId:
      params.kind === "trace_tag"
        ? "play_operation.trace_tag"
        : `play_operation.meat_damage_${params.credits === 3 ? 4 : 2}`,
    clicks: 1,
    credits: params.credits,
    ...(params.currentLegalAction
      ? { currentLegalAction: params.currentLegalAction }
      : {}),
  };
}

function stageActions(params: {
  stage: PunishStage;
  stateVersion: number;
  chance: VisibleCard;
  audit: VisibleCard;
  scorched: VisibleCard;
  punitive: VisibleCard;
  closedAccounts: VisibleCard;
  includeAuditAlternative: boolean;
}): LegalAction[] {
  if (params.stage === "tag") {
    return [
      playOperation(
        "play-chance-observation",
        params.chance,
        params.stateVersion,
        2,
      ),
      ...(params.includeAuditAlternative
        ? [
            playOperation(
              "play-audit-call-records",
              params.audit,
              params.stateVersion,
              0,
            ),
          ]
        : []),
    ];
  }
  if (params.stage === "scorched") {
    return [
      playOperation(
        "play-punitive-counterstrike",
        params.punitive,
        params.stateVersion,
        0,
      ),
      playOperation(
        "play-scorched-earth",
        params.scorched,
        params.stateVersion,
        3,
      ),
    ];
  }
  return [
    playOperation(
      "play-closed-accounts",
      params.closedAccounts,
      params.stateVersion,
      1,
    ),
    playOperation(
      "play-punitive-counterstrike",
      params.punitive,
      params.stateVersion,
      0,
    ),
  ];
}

function advanceAfterSuccessfulTag(input: AiDecisionInput): void {
  const replacement = coupledPunishInput({
    stateVersion: 2,
    credits: 3,
    clicks: 2,
    runnerHandCount: 5,
    runnerTags: 1,
    stage: "scorched",
  });
  replaceVisibleState(input, replacement);
}

function advanceAfterScorchedEarth(input: AiDecisionInput): void {
  const replacement = coupledPunishInput({
    stateVersion: 3,
    credits: 0,
    clicks: 1,
    runnerHandCount: 1,
    runnerTags: 1,
    stage: "punitive",
  });
  replaceVisibleState(input, replacement);
}

function advanceAfterFailedTag(input: AiDecisionInput): void {
  const replacement = coupledPunishInput({
    stateVersion: 2,
    credits: 8,
    clicks: 2,
    runnerHandCount: 5,
    runnerTags: 0,
    stage: "scorched",
    incompleteReason: "head_legal_action_unavailable",
  });
  replacement.playerView.own.gripOrHq =
    replacement.playerView.own.gripOrHq.filter(
      (card) =>
        card.definitionId !== SCORCHED_DEFINITION_ID &&
        card.definitionId !== PUNITIVE_DEFINITION_ID &&
        card.definitionId !== CLOSED_ACCOUNTS_DEFINITION_ID,
    );
  replacement.legalActions = replacement.legalActions.filter(
    (action) =>
      action.actionId === "install-agenda" ||
      action.actionId === "draw-card" ||
      action.actionId === "end-turn",
  );
  replacement.legalActions.splice(
    1,
    0,
    drawCard(replacement.playerView.stateVersion),
  );
  replacement.playerView.legalActions = replacement.legalActions;
  replaceVisibleState(input, replacement);
}

function replaceVisibleState(
  target: AiDecisionInput,
  replacement: AiDecisionInput,
): void {
  target.actionNumber = replacement.actionNumber;
  target.playerView = replacement.playerView;
  target.legalActions = replacement.legalActions;
}

function playOperation(
  actionId: string,
  card: VisibleCard,
  stateVersion: number,
  credits: number,
): LegalAction {
  return atStateVersion(
    legalAction(
      actionId,
      "corp",
      "play_operation",
      `Play ${card.title}`,
      { credits, clicks: 1 },
      {
        source: card.instanceId,
        payload: {
          cardId: card.instanceId,
          sourceDefinitionId: card.definitionId!,
        },
      },
    ),
    stateVersion,
  );
}

function installAgenda(card: VisibleCard, stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install Hostile Takeover in remote 1",
      { credits: 0, clicks: 1 },
      {
        source: card.instanceId,
        payload: {
          cardId: card.instanceId,
          sourceDefinitionId: card.definitionId!,
          serverId: "remote_1",
          placement: "root",
        },
      },
    ),
    stateVersion,
  );
}

function gainCredit(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
      credits: 0,
      clicks: 1,
    }),
    stateVersion,
  );
}

function drawCard(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction("draw-card", "corp", "draw_card", "Draw 1 Card", {
      credits: 0,
      clicks: 1,
    }),
    stateVersion,
  );
}

function endTurn(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction(
      "end-turn",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    ),
    stateVersion,
  );
}

function atStateVersion(
  action: LegalAction,
  stateVersion: number,
): LegalAction {
  return { ...action, expiresAtStateVersion: stateVersion };
}

function chanceObservationCard(): VisibleCard {
  return operationCard(
    "chance-observation",
    CHANCE_DEFINITION_ID,
    "Chance Observation",
    2,
  );
}

function auditCallRecordsCard(): VisibleCard {
  return operationCard(
    "audit-call-records",
    AUDIT_DEFINITION_ID,
    "Audit of Call Records",
    0,
  );
}

function scorchedEarthCard(): VisibleCard {
  return operationCard(
    "scorched-earth",
    SCORCHED_DEFINITION_ID,
    "Scorched Earth",
    3,
  );
}

function punitiveCounterstrikeCard(): VisibleCard {
  return operationCard(
    "punitive-counterstrike",
    PUNITIVE_DEFINITION_ID,
    "Punitive Counterstrike",
    0,
  );
}

function closedAccountsCard(): VisibleCard {
  return operationCard(
    "closed-accounts",
    CLOSED_ACCOUNTS_DEFINITION_ID,
    "Closed Accounts",
    1,
  );
}

function operationCard(
  instanceId: string,
  definitionId: string,
  title: string,
  credits: number,
): VisibleCard {
  return visibleCard(instanceId, "corp", "operation", {
    definitionId,
    title,
    cost: credits,
    playCost: { kind: "fixed", credits },
  });
}

function scoreAgendaCard(): VisibleCard {
  return visibleCard("score-agenda", "corp", "agenda", {
    definitionId: AGENDA_DEFINITION_ID,
    title: "Hostile Takeover",
    agendaPoints: 2,
    advancementRequirement: 1,
  });
}

function fullBodyConversionCard(): VisibleCard {
  return visibleCard("full-body-conversion", "runner", "hardware", {
    definitionId: "onr_v1_127_full-body-conversion",
    title: "Full Body Conversion",
  });
}

function punishRoots(
  instances: readonly PlanInstance[] | undefined,
): PlanInstance[] {
  return (
    instances?.filter(
      (instance) => instance.moduleId === "corp.punish_campaign",
    ) ?? []
  );
}

function exactPunishChild(
  instances: readonly PlanInstance[] | undefined,
  root: PlanInstance | undefined,
): PlanInstance | undefined {
  return instances?.find(
    (instance) =>
      instance.moduleId === "corp.execute_punish_sequence" &&
      instance.parentInstanceId === root?.instanceId,
  );
}

function punishSignalPriority(instance: PlanInstance | undefined): unknown {
  return (
    instance?.moduleState as
      | { signal?: { priorityClass?: unknown } }
      | undefined
  )?.signal?.priorityClass;
}

function punishSignal(instance: PlanInstance | undefined):
  | {
      phase?: unknown;
      feasible?: unknown;
      priorityClass?: unknown;
      visibleTerminalProjection?: unknown;
      value?: number;
      actionIds?: unknown;
    }
  | undefined {
  return (
    instance?.moduleState as
      | {
          signal?: {
            phase?: unknown;
            feasible?: unknown;
            priorityClass?: unknown;
            visibleTerminalProjection?: unknown;
            value?: number;
            actionIds?: unknown;
          };
        }
      | undefined
  )?.signal;
}

function addFutureStepCreditLoad(
  route: CorpPunishRouteQuote,
  additionalCredits: number,
): void {
  const futureStep = route.steps.at(-1);
  if (!futureStep || futureStep.currentLegalAction !== undefined) {
    throw new Error("Expected a future quoted punish step.");
  }
  futureStep.credits += additionalCredits;
  route.totalActionCredits += additionalCredits;
  route.responsePaymentEnvelope.totalCorpCredits.minimum += additionalCredits;
  route.responsePaymentEnvelope.totalCorpCredits.maximum += additionalCredits;
}

function setEffectiveDamage(
  route: CorpPunishRouteQuote,
  effectiveDamage: number,
): void {
  const preventedDamage =
    route.damageEnvelope.rawDamage.total - effectiveDamage;
  route.damageEnvelope.effectiveDamage = {
    minimum: effectiveDamage,
    maximum: effectiveDamage,
  };
  route.damageEnvelope.visiblePrevention = {
    knowledge: "bounded_public",
    maximumPreventableDamage: preventedDamage,
    creditCost: { minimum: 0, maximum: 0 },
  };
}

function punishRouteId(instance: PlanInstance | undefined): unknown {
  return (
    instance?.moduleState as
      | { signal?: { routeContract?: { routeId?: unknown } } }
      | undefined
  )?.signal?.routeContract?.routeId;
}

function decisionIdentity(decision: ReturnType<typeof chooseCorpAction>) {
  return {
    actionId: decision.actionId,
    reasonCode: decision.reasonCode,
    evidence: decision.evidence,
    fallbackUsed: decision.fallbackUsed,
  };
}
