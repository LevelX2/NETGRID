import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createActivatedCardRuntimeHosts } from "./activated-card-runtime-hosts";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { corpRunnerActionPaidWindowActions as delegatedCorpRunnerActionPaidWindowActions } from "./action-runtime-delegates";
import { createCardLifecycleRuntimeHosts } from "./card-lifecycle-runtime-hosts";
import { triggerAbilityExecutionHost as delegatedTriggerAbilityExecutionHost } from "./card-runtime-delegates";
import { createCardRuntimeDepsHosts } from "./card-runtime-deps-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { hiddenZoneSearchHandlerHostBase as delegatedHiddenZoneSearchHandlerHostBase } from "./choice-runtime-delegates";
import { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import { createCorpZoneRuntimeHosts } from "./corp-zone-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { runMovementHostForState as delegatedRunMovementHostForState } from "./flow-runtime-delegates";
import { createHiddenZoneArrangeRuntime } from "./hidden-zone-arrange-runtime";
import { createHiddenZoneNonSearchPlayfulAiRuntime } from "./hidden-zone-nonsearch-playful-ai-runtime";
import { createHiddenZoneNonSearchRuntime } from "./hidden-zone-nonsearch-runtime";
import { createHiddenZoneSearchRuntime } from "./hidden-zone-search-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createPendingChoiceRuntimeHosts } from "./pending-choice-runtime-hosts";
import { createStateCorpRuntimeResolvers } from "./state-corp-runtime-resolvers";
import { runnerRecurringCredits as delegatedRunnerRecurringCredits } from "./state-runtime-delegates";
import { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createTriggerAbilityRuntimeHosts } from "./trigger-ability-runtime-hosts";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";
import { initializeRuntimeDelegates } from "./runtime-delegates";

describe("engine runtime internal domains", () => {
  it("do not import public facades or become dependencies of deep game modules", () => {
    const sources = [
      "./choice-hidden-zone-runtime.ts",
      "./activated-card-runtime-hosts.ts",
      "./action-runtime-hosts.ts",
      "./action-runtime-delegates.ts",
      "./card-lifecycle-runtime-hosts.ts",
      "./card-runtime-delegates.ts",
      "./card-runtime-deps-hosts.ts",
      "./card-runtime-hosts.ts",
      "./card-runtime-resolvers.ts",
      "./choice-runtime-delegates.ts",
      "./choice-hidden-zone-resolvers.ts",
      "./corp-runtime-resolvers.ts",
      "./corp-zone-runtime-hosts.ts",
      "./flow-runtime-hosts.ts",
      "./flow-runtime-delegates.ts",
      "./hidden-zone-arrange-runtime.ts",
      "./hidden-zone-nonsearch-playful-ai-runtime.ts",
      "./hidden-zone-nonsearch-runtime.ts",
      "./hidden-zone-search-runtime.ts",
      "./lifecycle-runtime.ts",
      "./pending-choice-runtime-hosts.ts",
      "./runtime-delegate-store.ts",
      "./state-runtime-delegates.ts",
      "./state-corp-runtime-resolvers.ts",
      "./state-runtime-resolvers.ts",
      "./state-runtime-services.ts",
      "./trigger-ability-runtime-hosts.ts",
      "./turn-corp-runtime.ts",
      "./turn-runtime-resolvers.ts",
      "./runtime-bootstrap.ts",
      "./runtime-delegates.ts",
      "./runtime-shared.ts",
    ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

    for (const source of sources) {
      expect(source).not.toContain('from "../index"');
      expect(source).not.toContain("from '../index'");
      expect(source).not.toContain('from "../../index"');
      expect(source).not.toContain("from '../../index'");
      expect(source).not.toContain('from "../engine-runtime"');
      expect(source).not.toContain('from "./runtime-implementation"');
    }
  });

  it("exposes the staged domain factories", () => {
    expect(
      typeof createChoiceHiddenZoneRuntime({}).pendingChoiceResolutionHost,
    ).toBe("function");
    expect(
      typeof createPendingChoiceRuntimeHosts({}, {})
        .pendingChoiceResolutionHost,
    ).toBe("function");
    expect(
      typeof createHiddenZoneSearchRuntime({}, {})
        .hiddenZoneSearchChoiceHandlerHost,
    ).toBe("function");
    expect(
      typeof createHiddenZoneArrangeRuntime({}, {})
        .hiddenZoneArrangeChoiceHandlerHost,
    ).toBe("function");
    expect(
      typeof createHiddenZoneNonSearchRuntime({}, {})
        .hiddenZoneNonSearchChoiceHandlerHost,
    ).toBe("function");
    expect(
      typeof createHiddenZoneNonSearchPlayfulAiRuntime({})
        .resolvePlayfulAiDiceLoopEvent,
    ).toBe("function");
    expect(
      typeof createCorpZoneRuntimeHosts({}, {}).corpZoneChoiceHandlerHost,
    ).toBe("function");
    expect(
      typeof createCardRuntimeDepsHosts({}, {}).subroutinesForCurrentEncounter,
    ).toBe("function");
    expect(
      typeof createTriggerAbilityRuntimeHosts({}, {})
        .triggerAbilityExecutionHost,
    ).toBe("function");
    expect(typeof createCardLifecycleRuntimeHosts({}, {}).installCardHost).toBe(
      "function",
    );
    expect(
      typeof createActivatedCardRuntimeHosts({}, {})
        .activatedCardImplementationExecutionHost,
    ).toBe("function");
    expect(
      typeof createLifecycleRuntime({}).trashRunnerInstalledCardToHeap,
    ).toBe("function");
    expect(
      typeof createTurnCorpRuntime({}).advancementDistributionOptions,
    ).toBe("function");
    expect(typeof createActionRuntimeHosts({}).scoredAgendaFlowHost).toBe(
      "function",
    );
    expect(typeof createCardRuntimeHosts({}).installCardHost).toBe("function");
    expect(
      typeof createCardRuntimeResolvers({})
        .cardImplementationRunnerEventResolver,
    ).toBe("function");
    expect(
      typeof createChoiceHiddenZoneResolvers({}).startRunnerPrivateLookChoice,
    ).toBe("function");
    expect(
      typeof createCorpRuntimeResolvers({}).resolvePowerGridOverloadOperation,
    ).toBe("function");
    expect(typeof createFlowRuntimeHosts({}).runMovementHostForState).toBe(
      "function",
    );
    expect(typeof createStateCorpRuntimeResolvers({}).spendKrumzTraceBits).toBe(
      "function",
    );
    expect(typeof createStateRuntimeResolvers({}).executeEffectCommands).toBe(
      "function",
    );
    expect(typeof createStateRuntimeServices({}).canHostProgramOnDaemon).toBe(
      "function",
    );
    expect(
      typeof createTurnRuntimeResolvers({}).applyCorpStartOfTurnEffects,
    ).toBe("function");
    expect(typeof initializeRuntimeDelegates).toBe("function");
    expect(typeof delegatedCorpRunnerActionPaidWindowActions).toBe("function");
    expect(typeof delegatedRunMovementHostForState).toBe("function");
    expect(typeof delegatedTriggerAbilityExecutionHost).toBe("function");
    expect(typeof delegatedRunnerRecurringCredits).toBe("function");
    expect(typeof delegatedHiddenZoneSearchHandlerHostBase).toBe("function");
  });
});
