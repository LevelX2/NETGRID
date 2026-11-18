import { describe, expect, it } from "vitest";
import {
  agendaCampaignIdentity,
  compactCampaignId,
  compactPlanInstanceId,
  comparePlanIdentities,
} from "./compact-plan-identity";
import { reconcileResidentPlanPortfolio } from "./resident-plan-portfolio";
import type { PlanProposal } from "./plan-kernel-types";

describe("compact resident identities", () => {
  it("is canonical across calls, discovery order and restored plain data", () => {
    const identity = {
      moduleId: "runner.pressure_central",
      dedupeKey: "central:rd",
    } as const;
    const id = compactPlanInstanceId(identity);
    compactPlanInstanceId({ moduleId: "corp.economy", dedupeKey: "other" });
    expect(compactPlanInstanceId(structuredClone(identity))).toBe(id);
    expect(id).toMatch(/^p[0-9a-z]{1,25}$/);
    expect(
      compactPlanInstanceId({ ...identity, dedupeKey: " central:rd " }),
    ).toBe(id);
  });

  it("keeps owner, objective and identity domains separate", () => {
    const plan = compactPlanInstanceId({
      moduleId: "corp.score_agenda",
      dedupeKey: "agenda:c1",
    });
    const campaign = compactCampaignId(agendaCampaignIdentity("agenda:c1"));
    expect(campaign).toMatch(/^k[0-9a-z]{1,25}$/);
    expect(campaign).not.toBe(plan);
    expect(plan).not.toBe(
      compactPlanInstanceId({
        moduleId: "runner.score_agenda",
        dedupeKey: "agenda:c1",
      }),
    );
    expect(plan).not.toBe(
      compactPlanInstanceId({
        moduleId: "corp.score_agenda",
        dedupeKey: "agenda:c2",
      }),
    );
  });

  it("preserves the authored module and normalized target order independently of hashes", () => {
    const identities = [
      { moduleId: "runner.pressure_central", dedupeKey: "central:rd" },
      { moduleId: "corp.score_agenda", dedupeKey: "agenda:c2" },
      { moduleId: "runner.economy", dedupeKey: "bank:a" },
      { moduleId: "corp.score_agenda", dedupeKey: "agenda:c1" },
    ] as const;
    const previousOrder = [...identities].sort((a, b) =>
      `plan:${a.moduleId}:${encodeURIComponent(a.dedupeKey)}`.localeCompare(
        `plan:${b.moduleId}:${encodeURIComponent(b.dedupeKey)}`,
      ),
    );
    expect([...identities].sort(comparePlanIdentities)).toEqual(previousOrder);
  });

  it("rediscovers the same identity after retention expiry and a process-independent reopen", () => {
    const proposal: PlanProposal = {
      moduleId: "runner.economy",
      moduleVersion: "1",
      side: "runner",
      dedupeKey: "credit-floor",
      strategyLineIds: [],
      executionClass: "bounded_sequence",
      initialViability: "ready",
      persistencePolicy: "flexible_support",
      phase: "fund",
      milestone: "funded",
      moduleState: {},
      blockers: [],
      resumeConditions: [],
      completionConditions: [],
      abandonmentConditions: [],
      evidenceRefs: [],
      retentionPolicy: {
        blockedStateVersionTtl: 1,
        dormantStateVersionTtl: 1,
        completedHistoryStateVersionTtl: 1,
        abandonWhenTargetMissing: false,
        protectedWhileNeedOpen: false,
        protectedWhileCommitted: false,
      },
    };
    const first = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      proposals: [proposal],
    });
    const expired = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 10,
      timingPoint: "runner_action.main",
      proposals: [],
      previous: JSON.parse(JSON.stringify(first)),
    });
    expect(expired.instances).toEqual([]);
    const reopened = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 11,
      timingPoint: "runner_action.main",
      proposals: [proposal],
      previous: JSON.parse(JSON.stringify(expired)),
    });
    expect(reopened.instances[0]!.instanceId).toBe(
      first.instances[0]!.instanceId,
    );
    expect(reopened.instances[0]!.createdAtStateVersion).toBe(11);
  });
});
