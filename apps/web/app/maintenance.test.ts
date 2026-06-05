import { describe, expect, it } from "vitest";
import {
  buildMaintenanceCleanupRequest,
  buildMaintenanceAiTraceEnablePath,
  buildMaintenanceAiTraceIndexPath,
  buildMaintenanceAiTraceNdjsonExport,
  buildMaintenanceMatchQuery,
  buildMaintenanceRecoveryLink,
  aiTraceActionRows,
  aiTraceDebugGapNotes,
  aiTraceDoctrineRows,
  aiTraceMetaRows,
  aiTraceScoreRows,
  aiTraceTitle,
  DEFAULT_MAINTENANCE_CLEANUP_FILTERS,
  EMPTY_MAINTENANCE_FILTERS,
  findForbiddenMaintenanceMarkers,
  formatAge,
  formatBytes,
  latestMaintenanceAiTraceId,
  mergeMaintenanceAiTraceIndex,
  mergeMaintenanceAiTraceMatches,
  participantsLabel,
  resolveMaintenanceServerHttp
} from "./maintenance";

describe("Backend 0.5 maintenance UI helpers", () => {
  it("builds match-list queries for the supported filters", () => {
    expect(buildMaintenanceMatchQuery(EMPTY_MAINTENANCE_FILTERS)).toBe("?limit=50");
    expect(
      buildMaintenanceMatchQuery({
        status: "active",
        terminal: "false",
        mode: "human_vs_human",
        olderThanDays: "14",
        largerThanMiB: "3",
        limit: "50"
      })
    ).toBe("?status=active&terminal=false&mode=human_vs_human&olderThanDays=14&largerThanBytes=3145728&limit=50");
    expect(buildMaintenanceMatchQuery({ ...EMPTY_MAINTENANCE_FILTERS, limit: "" })).toBe("?limit=all");
  });

  it("formats storage metadata compactly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MiB");
    expect(formatAge(42)).toBe("gerade eben");
    expect(formatAge(3600 * 26)).toBe("26 h");
  });

  it("keeps participant labels side-safe", () => {
    expect(
      participantsLabel([
        { side: "runner", displayName: "Ludwig", connected: true, lastSeenAt: "2026-05-14T10:00:00.000Z" },
        { side: "corp", displayName: "Korp KI", connected: false, lastSeenAt: "2026-05-14T10:01:00.000Z" }
      ])
    ).toBe("Runner: Ludwig · Korp: Korp KI");
  });

  it("detects forbidden markers in maintenance payloads", () => {
    expect(findForbiddenMaintenanceMarkers({ matchId: "match_1", stateHash: "fnv1a:1234" })).toEqual([]);
    expect(findForbiddenMaintenanceMarkers({ sessionToken: "secret", privatePayload: { value: true } }).length).toBeGreaterThan(0);
  });

  it("builds bounded cleanup requests with active older-than-one-hour defaults", () => {
    expect(buildMaintenanceCleanupRequest(DEFAULT_MAINTENANCE_CLEANUP_FILTERS)).toEqual({ statuses: ["active"], olderThanMinutes: 60, limit: 100, includeProtected: false });
    expect(
      buildMaintenanceCleanupRequest({
        statuses: ["active", "active", "abandoned"],
        olderThanMinutes: "90.7",
        limit: "999",
        vacuumAfter: true,
        createBackup: false,
        includeProtected: true
      })
    ).toEqual({ statuses: ["active", "abandoned"], olderThanMinutes: 90, limit: 500, includeProtected: true });
  });

  it("builds a root reconnect link from local recovery access", () => {
    expect(
      buildMaintenanceRecoveryLink(
        {
          matchId: "match_abc",
          side: "runner",
          access: "recovery_access_secret"
        },
        "http://127.0.0.1:3000/maintenance"
      )
    ).toBe("http://127.0.0.1:3000/?matchId=match_abc&side=runner&reconnectToken=recovery_access_secret");
  });

  it("uses the loopback backend for locally opened maintenance pages", () => {
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "127.0.0.1")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "localhost")).toBe("http://127.0.0.1:8787");
    expect(resolveMaintenanceServerHttp("http://192.168.178.141:8787", "192.168.178.141")).toBe("http://192.168.178.141:8787");
  });

  it("formats AI decision trace navigation labels and meta rows", () => {
    const trace = {
      traceId: "ai_trace_1",
      matchId: "match_1",
      eventId: "evt_1",
      stateVersion: 4,
      matchVersion: 5,
      side: "corp" as const,
      turn: 4,
      decisionIndex: 2,
      selectedActionType: "install_card",
      planKind: "build_scoring_remote",
      score: 312.34,
      confidence: 0.73,
      createdAt: "2026-05-22T10:00:00.000Z",
      schemaVersion: "ai-decision-trace-v1",
      meta: {}
    };
    expect(aiTraceTitle(trace)).toBe("#2 Korp · build_scoring_remote");
    expect(aiTraceMetaRows(trace)).toContainEqual(["Vertrauen", "73%"]);
  });

  it("formats AI trace action-level rows for Broker versus basic credit", () => {
    const rows = aiTraceActionRows({
      actionAlternatives: [
        {
          rank: 1,
          actionId: "runner.gain_credit",
          actionType: "gain_credit",
          label: "1 Credit nehmen",
          source: "basic_action",
          selected: true,
          priority: 65,
          whyChosen: ["selected_action"],
          economy: {
            economyKind: "basic_credit",
            immediateGain: 1,
            netCredits: 1,
            storedCredits: 0,
            futurePoolAfter: 0,
            economyNeed: "acute"
          }
        },
        {
          rank: 2,
          actionId: "runner.broker.load",
          actionType: "activated_card_ability",
          label: "Broker: 3 Credits auf Broker legen",
          source: "visible_card",
          sourceTitle: "Broker",
          selected: false,
          priority: 42,
          whyNot: ["pool_build_deferred_for_credit_need"],
          economy: {
            economyKind: "pool_build",
            ability: "broker_load_credits",
            immediateGain: 0,
            netCredits: 0,
            storedCredits: 0,
            futurePoolAfter: 3,
            economyNeed: "acute"
          }
        }
      ]
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      label: "Credit nehmen",
      selected: true,
      source: "basic_action",
      priority: "65",
      reason: "selected_action"
    });
    expect(rows[0]?.metrics).toEqual(["jetzt +1", "Pool nachher 0", "Bedarf acute"]);
    expect(rows[1]).toMatchObject({
      label: "Broker laden",
      selected: false,
      source: "Broker",
      priority: "42",
      reason: "pool_build_deferred_for_credit_need"
    });
    expect(rows[1]?.metrics).toEqual(["jetzt 0", "Pool nachher 3", "Bedarf acute"]);
    expect(aiTraceActionRows({ rankedAlternatives: [] })).toEqual([]);
    expect(findForbiddenMaintenanceMarkers({ detail: { actionAlternatives: [{ meta: { decisionDebug: true } }] } }).length).toBeGreaterThan(0);
  });

  it("formats in-game AI trace score and doctrine rows without inventing missing values", () => {
    const detail = {
      planKind: "score_next_turn",
      doctrinePlanWeight: 0.35,
      scoreBreakdown: [
        { key: "plan", label: "Plan", value: 12.5 },
        { key: "cost", label: "Kosten", value: -2 }
      ],
      ownDeckDoctrine: {
        side: "corp",
        confidence: 0.8,
        archetypeTags: ["remote", "economy"],
        riskFlags: ["agenda_density"]
      }
    };

    expect(aiTraceScoreRows(detail)).toEqual([
      ["Plan", "12.50"],
      ["Kosten", "-2.00"]
    ]);
    expect(aiTraceDoctrineRows(detail)).toEqual([
      ["Doctrine-Gewicht", "0.35"],
      ["Doctrine-Seite", "Korp"],
      ["Doctrine-Vertrauen", "80%"],
      ["Archetypen", "remote, economy"],
      ["Risiken", "agenda_density"]
    ]);
    expect(aiTraceDebugGapNotes(detail)).toEqual(["Keine Top-Alternativen im aktuellen Trace."]);

    const sparseDetail = { selectedActionType: "gain_credit" };
    expect(aiTraceScoreRows(sparseDetail)).toEqual([]);
    expect(aiTraceDoctrineRows(sparseDetail)).toEqual([]);
    expect(aiTraceDebugGapNotes(sparseDetail)).toEqual([
      "Keine Top-Alternativen im aktuellen Trace.",
      "Keine Score-Komponenten im aktuellen Trace.",
      "Keine Plan-/Doctrine-Beiträge im aktuellen Trace."
    ]);
    expect(JSON.stringify({ detail })).not.toMatch(/AIInput|DecisionDebug|cardInstances|privatePayload|decklist|C:\\Users/i);
  });

  it("builds cursor paths and merges AI decision trace live-follow updates", () => {
    const first = {
      traceId: "trace_1",
      matchId: "match_1",
      eventId: "evt_1",
      stateVersion: 4,
      matchVersion: 4,
      side: "corp" as const,
      turn: 1,
      decisionIndex: 1,
      createdAt: "2026-05-22T10:00:00.000Z",
      schemaVersion: "ai-decision-trace-v1",
      meta: {}
    };
    const second = { ...first, traceId: "trace_2", eventId: "evt_2", decisionIndex: 2, createdAt: "2026-05-22T10:00:02.000Z" };

    expect(buildMaintenanceAiTraceIndexPath("match/1", 1)).toBe("/api/storage/maintenance/ai-decision-traces/matches/match%2F1?afterDecisionIndex=1");
    expect(buildMaintenanceAiTraceEnablePath("match/1")).toBe("/api/storage/maintenance/ai-decision-traces/matches/match%2F1/enable");
    expect(mergeMaintenanceAiTraceIndex([second], [first, second]).map((trace) => trace.traceId)).toEqual(["trace_1", "trace_2"]);
    expect(latestMaintenanceAiTraceId([first, second])).toBe("trace_2");
  });

  it("keeps just-enabled AI trace matches visible while the match index refreshes", () => {
    const stale = {
      matchId: "match_old",
      status: "active",
      mode: "human_vs_ai",
      aiTraceMode: "detailed" as const,
      traceCount: 4,
      createdAt: "2026-05-22T09:00:00.000Z",
      updatedAt: "2026-05-22T09:05:00.000Z",
      lastTraceAt: "2026-05-22T09:05:00.000Z"
    };
    const activated = {
      matchId: "match_new",
      status: "active",
      mode: "human_vs_ai",
      aiTraceMode: "detailed" as const,
      traceCount: 0,
      createdAt: "2026-05-22T10:00:00.000Z",
      updatedAt: "2026-05-22T10:02:00.000Z"
    };

    expect(mergeMaintenanceAiTraceMatches([stale], [activated]).map((match) => match.matchId)).toEqual(["match_new", "match_old"]);
    expect(mergeMaintenanceAiTraceMatches([activated], [{ ...activated, traceCount: 1, lastTraceAt: "2026-05-22T10:03:00.000Z" }])[0]?.traceCount).toBe(1);
  });

  it("exports only redacted AI trace index projections", () => {
    const trace = {
      traceId: "trace_1",
      matchId: "match_1",
      eventId: "evt_1",
      stateVersion: 4,
      matchVersion: 5,
      side: "runner" as const,
      turn: 2,
      decisionIndex: 3,
      selectedActionType: "start_run",
      createdAt: "2026-05-22T10:00:00.000Z",
      schemaVersion: "ai-decision-trace-v1",
      meta: { actor: "runner" }
    };
    const output = buildMaintenanceAiTraceNdjsonExport({ matchId: "match_1", generatedAt: "2026-05-22T10:01:00.000Z", traces: [trace] });

    expect(output).toContain("netgrid-ai-decision-trace-index-export-v1");
    expect(output).toContain("\"traceId\":\"trace_1\"");
    expect(output).not.toMatch(/AIInput|DecisionDebug|cardInstances|privatePayload|decklist|C:\\Users/i);
    expect(() =>
      buildMaintenanceAiTraceNdjsonExport({
        matchId: "match_1",
        generatedAt: "2026-05-22T10:01:00.000Z",
        traces: [{ ...trace, meta: { decisionDebug: { privatePayload: true } } }]
      })
    ).toThrow("ai_trace_export_redaction_failed");
  });
});
