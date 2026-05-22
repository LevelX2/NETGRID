"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, Copy, Database, Download, ExternalLink, Eye, KeyRound, ListFilter, LoaderCircle, RefreshCcw, ShieldCheck, Trash2, XCircle } from "lucide-react";
import {
  aiTraceMetaRows,
  buildMaintenanceAiTraceEnablePath,
  aiTraceTitle,
  buildMaintenanceAiTraceIndexPath,
  buildMaintenanceAiTraceNdjsonExport,
  buildMaintenanceCleanupRequest,
  buildMaintenanceMatchQuery,
  buildMaintenanceRecoveryLink,
  DEFAULT_MAINTENANCE_CLEANUP_FILTERS,
  EMPTY_MAINTENANCE_FILTERS,
  findForbiddenMaintenanceMarkers,
  formatAge,
  formatBytes,
  latestMaintenanceAiTraceId,
  mergeMaintenanceAiTraceIndex,
  modeLabel,
  participantsLabel,
  resolveMaintenanceServerHttp,
  safeStringList,
  statusLabel,
  type MaintenanceAiTraceDetail,
  type MaintenanceAiTraceIndexEntry,
  type MaintenanceAiTraceMatchEntry,
  type MaintenanceCleanupApplyResult,
  type MaintenanceCleanupFilters,
  type MaintenanceCleanupPolicy,
  type MaintenanceCleanupPreview,
  type MaintenanceFilters,
  type MaintenanceMatchDetail,
  type MaintenanceMatchEntry,
  type MaintenanceRecoveryAccess,
  type MaintenanceSummary
} from "../maintenance";

const CONFIGURED_SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

type MaintenanceLoadStepId = "summary" | "matches" | "policy" | "aiTraces";

type MaintenanceLoadStep = {
  id: MaintenanceLoadStepId;
  label: string;
  status: "pending" | "loading" | "done" | "error";
};

type OperationNotice = {
  tone: "working" | "success";
  message: string;
};

const INITIAL_LOAD_STEPS: MaintenanceLoadStep[] = [
  { id: "summary", label: "Backend- und DB-Status", status: "pending" },
  { id: "matches", label: "Matchliste aus der Datenbank", status: "pending" },
  { id: "policy", label: "Cleanup-Policy", status: "pending" },
  { id: "aiTraces", label: "KI-Trace-Index", status: "pending" }
];

export default function MaintenancePage() {
  const [serverHttp] = useState(() => resolveMaintenanceServerHttp(CONFIGURED_SERVER_HTTP, typeof window === "undefined" ? undefined : window.location.hostname));
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);
  const [matches, setMatches] = useState<MaintenanceMatchEntry[]>([]);
  const [detail, setDetail] = useState<MaintenanceMatchDetail | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [filters, setFilters] = useState<MaintenanceFilters>(EMPTY_MAINTENANCE_FILTERS);
  const [loading, setLoading] = useState(false);
  const [loadSteps, setLoadSteps] = useState<MaintenanceLoadStep[]>(INITIAL_LOAD_STEPS);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiTraceMatches, setAiTraceMatches] = useState<MaintenanceAiTraceMatchEntry[]>([]);
  const [selectedAiTraceMatchId, setSelectedAiTraceMatchId] = useState("");
  const [aiTraceIndex, setAiTraceIndex] = useState<MaintenanceAiTraceIndexEntry[]>([]);
  const [selectedAiTraceId, setSelectedAiTraceId] = useState("");
  const [aiTraceDetail, setAiTraceDetail] = useState<MaintenanceAiTraceDetail | null>(null);
  const [aiTraceLoading, setAiTraceLoading] = useState(false);
  const [aiTraceEnableLoading, setAiTraceEnableLoading] = useState(false);
  const [aiTraceLiveFollow, setAiTraceLiveFollow] = useState(true);
  const [aiTraceFollowPaused, setAiTraceFollowPaused] = useState(false);
  const [operationNotice, setOperationNotice] = useState<OperationNotice | null>(null);
  const [error, setError] = useState("");
  const [cleanupFilters, setCleanupFilters] = useState<MaintenanceCleanupFilters>(DEFAULT_MAINTENANCE_CLEANUP_FILTERS);
  const [cleanupPreview, setCleanupPreview] = useState<MaintenanceCleanupPreview | null>(null);
  const [cleanupResult, setCleanupResult] = useState<MaintenanceCleanupApplyResult | null>(null);
  const [cleanupConfirmed, setCleanupConfirmed] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [recoverySide, setRecoverySide] = useState<"runner" | "corp">("runner");
  const [recoveryAccess, setRecoveryAccess] = useState<MaintenanceRecoveryAccess | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [cleanupPolicy, setCleanupPolicy] = useState<MaintenanceCleanupPolicy | null>(null);
  const [policyDraft, setPolicyDraft] = useState({
    enabled: false,
    statuses: cleanupStatusOptions.map(([status]) => status),
    olderThanDays: "3",
    limit: "500",
    includeProtected: false,
    vacuumAfter: false,
    createBackup: false
  });
  const [policyLoading, setPolicyLoading] = useState(false);

  const loadSummary = async () => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/summary`);
    const payload = (await response.json()) as MaintenanceSummary | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Wartungsdaten konnten nicht geladen werden." : "Wartungsdaten konnten nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Wartungsdaten wurden wegen Redaktionsprüfung blockiert.");
    setSummary(payload as MaintenanceSummary);
  };

  const loadMatches = async (nextFilters = filters) => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/matches${buildMaintenanceMatchQuery(nextFilters)}`);
    const payload = (await response.json()) as { matches?: MaintenanceMatchEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "Matchliste konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Matchliste wurde wegen Redaktionsprüfung blockiert.");
    const nextMatches = payload.matches ?? [];
    setMatches(nextMatches);
    if (!selectedMatchId && nextMatches[0]) setSelectedMatchId(nextMatches[0].matchId);
  };

  const loadAiTraceMatches = async () => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/ai-decision-traces/matches`);
    const payload = (await response.json()) as { matches?: MaintenanceAiTraceMatchEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Matches konnten nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Matches wurden wegen Redaktionsprüfung blockiert.");
    const nextMatches = payload.matches ?? [];
    setAiTraceMatches(nextMatches);
    setSelectedAiTraceMatchId((current) => (current && nextMatches.some((match) => match.matchId === current) ? current : nextMatches[0]?.matchId ?? ""));
  };

  const enableAiTracingForSelectedMatch = async () => {
    if (!selectedMatchId) return;
    setAiTraceEnableLoading(true);
    setOperationNotice({ tone: "working", message: "KI-Tracing wird für das ausgewählte Match ab jetzt aktiviert." });
    setError("");
    try {
      const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceEnablePath(selectedMatchId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "detailed" })
      });
      const payload = (await response.json()) as { match?: MaintenanceAiTraceMatchEntry; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "KI-Tracing konnte nicht aktiviert werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("KI-Trace-Aktivierung wurde wegen Redaktionsprüfung blockiert.");
      await loadAiTraceMatches();
      setSelectedAiTraceMatchId(payload.match?.matchId ?? selectedMatchId);
      await loadAiTraceIndex(payload.match?.matchId ?? selectedMatchId);
      setOperationNotice({ tone: "success", message: "KI-Tracing ist für dieses Match ab jetzt aktiv. Neue KI-Schritte werden hier aufgezeichnet." });
    } catch (traceError) {
      setError(traceError instanceof Error ? traceError.message : "KI-Tracing konnte nicht aktiviert werden.");
      setOperationNotice(null);
    } finally {
      setAiTraceEnableLoading(false);
    }
  };

  const loadAiTraceIndex = async (matchId: string) => {
    if (!matchId) {
      setAiTraceIndex([]);
      setSelectedAiTraceId("");
      setAiTraceDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceIndexPath(matchId)}`);
    const payload = (await response.json()) as { traces?: MaintenanceAiTraceIndexEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Timeline konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Timeline wurde wegen Redaktionsprüfung blockiert.");
    const traces = payload.traces ?? [];
    setAiTraceIndex(traces);
    setSelectedAiTraceId((current) => (current && traces.some((trace) => trace.traceId === current) ? current : traces[0]?.traceId ?? ""));
  };

  const pollAiTraceUpdates = async (matchId: string) => {
    if (!matchId) return;
    const afterDecisionIndex = aiTraceIndex.at(-1)?.decisionIndex;
    const response = await fetch(`${serverHttp}${buildMaintenanceAiTraceIndexPath(matchId, afterDecisionIndex)}`);
    const payload = (await response.json()) as { traces?: MaintenanceAiTraceIndexEntry[]; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Live-Follow konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Live-Follow wurde wegen Redaktionsprüfung blockiert.");
    const incoming = payload.traces ?? [];
    if (incoming.length === 0) return;
    setAiTraceIndex((current) => mergeMaintenanceAiTraceIndex(current, incoming));
    setSelectedAiTraceId(latestMaintenanceAiTraceId(incoming));
    await loadAiTraceMatches();
  };

  const loadAiTraceDetail = async (traceId: string) => {
    if (!traceId) {
      setAiTraceDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}/api/storage/maintenance/ai-decision-traces/${encodeURIComponent(traceId)}`);
    const payload = (await response.json()) as MaintenanceAiTraceDetail | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "KI-Trace-Detail konnte nicht geladen werden." : "KI-Trace-Detail konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("KI-Trace-Detail wurde wegen Redaktionsprüfung blockiert.");
    setAiTraceDetail(payload as MaintenanceAiTraceDetail);
  };

  const loadDetail = async (matchId: string) => {
    if (!matchId) {
      setDetail(null);
      return;
    }
    const response = await fetch(`${serverHttp}/api/storage/maintenance/matches/${encodeURIComponent(matchId)}`);
    const payload = (await response.json()) as MaintenanceMatchDetail | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Matchdetail konnte nicht geladen werden." : "Matchdetail konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Matchdetail wurde wegen Redaktionsprüfung blockiert.");
    const nextDetail = payload as MaintenanceMatchDetail;
    setDetail(nextDetail);
    setRecoveryAccess(null);
    setRecoverySide((current) => {
      if (nextDetail.participants.some((participant) => participant.side === current)) return current;
      const firstSide = nextDetail.participants[0]?.side;
      return firstSide === "runner" || firstSide === "corp" ? firstSide : current;
    });
  };

  const loadCleanupPolicy = async () => {
    const response = await fetch(`${serverHttp}/api/storage/maintenance/cleanup/policy`);
    const payload = (await response.json()) as MaintenanceCleanupPolicy | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Cleanup-Policy konnte nicht geladen werden." : "Cleanup-Policy konnte nicht geladen werden.");
    const markers = findForbiddenMaintenanceMarkers(payload);
    if (markers.length > 0) throw new Error("Cleanup-Policy wurde wegen Redaktionsprüfung blockiert.");
    const policy = payload as MaintenanceCleanupPolicy;
    setCleanupPolicy(policy);
    setPolicyDraft({
      enabled: policy.enabled,
      statuses: policy.statuses,
      olderThanDays: String(policy.olderThanDays),
      limit: String(policy.limit ?? 500),
      includeProtected: policy.includeProtected === true,
      vacuumAfter: policy.vacuumAfter === true,
      createBackup: policy.createBackup === true
    });
  };

  const loadCleanupPreview = async () => {
    setCleanupLoading(true);
    setOperationNotice({ tone: "working", message: "Löschvorschau wird erstellt. Die Datenbankabfrage läuft." });
    setCleanupResult(null);
    setCleanupConfirmed(false);
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/cleanup/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildMaintenanceCleanupRequest(cleanupFilters))
      });
      const payload = (await response.json()) as MaintenanceCleanupPreview | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Cleanup-Vorschau konnte nicht geladen werden." : "Cleanup-Vorschau konnte nicht geladen werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Cleanup-Vorschau wurde wegen Redaktionsprüfung blockiert.");
      const preview = payload as MaintenanceCleanupPreview;
      setCleanupPreview(preview);
      setOperationNotice({ tone: "success", message: `Vorschau geladen: ${preview.matchCount} Matches gefunden.` });
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Cleanup-Vorschau konnte nicht geladen werden.");
      setOperationNotice(null);
    } finally {
      setCleanupLoading(false);
    }
  };

  const applyCleanup = async () => {
    if (!cleanupPreview || !cleanupConfirmed) return;
    setCleanupLoading(true);
    setOperationNotice({ tone: "working", message: `Löschen läuft: ${cleanupPreview.matchCount} Matches werden verarbeitet.` });
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/cleanup/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...buildMaintenanceCleanupRequest(cleanupFilters),
          previewId: cleanupPreview.previewId,
          createBackup: cleanupFilters.createBackup,
          vacuumAfter: cleanupFilters.vacuumAfter
        })
      });
      const payload = (await response.json()) as MaintenanceCleanupApplyResult | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Cleanup konnte nicht abgeschlossen werden." : "Cleanup konnte nicht abgeschlossen werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Cleanup-Ergebnis wurde wegen Redaktionsprüfung blockiert.");
      const result = payload as MaintenanceCleanupApplyResult;
      setCleanupResult(result);
      setCleanupPreview(null);
      setCleanupConfirmed(false);
      if (cleanupPreview.matches.some((match) => match.matchId === selectedMatchId)) setSelectedMatchId("");
      setOperationNotice({ tone: "success", message: `Löschen abgeschlossen: ${result.deletedCount} Matches entfernt. Aktualisierung läuft.` });
      await refresh(undefined, "cleanup");
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Cleanup konnte nicht abgeschlossen werden.");
      setOperationNotice(null);
    } finally {
      setCleanupLoading(false);
    }
  };

  const toggleCleanupStatus = (status: string) => {
    setCleanupPreview(null);
    setCleanupResult(null);
    setCleanupConfirmed(false);
    setCleanupFilters((current) => ({
      ...current,
      statuses: current.statuses.includes(status) ? current.statuses.filter((candidate) => candidate !== status) : [...current.statuses, status]
    }));
  };

  const togglePolicyStatus = (status: string) => {
    setPolicyDraft((current) => ({
      ...current,
      statuses: current.statuses.includes(status) ? current.statuses.filter((candidate) => candidate !== status) : [...current.statuses, status]
    }));
  };

  const setDetailRetentionProtection = async (protectedValue: boolean) => {
    if (!detail) return;
    setOperationNotice({ tone: "working", message: protectedValue ? "Löschschutz wird aktiviert." : "Löschschutz wird aufgehoben." });
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/matches/${encodeURIComponent(detail.matchId)}/retention-protection`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protected: protectedValue })
      });
      const payload = (await response.json()) as MaintenanceMatchDetail | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Löschschutz konnte nicht geändert werden." : "Löschschutz konnte nicht geändert werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Matchdetail wurde wegen Redaktionsprüfung blockiert.");
      setDetail(payload as MaintenanceMatchDetail);
      await loadMatches(filters);
      setOperationNotice({ tone: "success", message: protectedValue ? "Löschschutz aktiviert." : "Löschschutz aufgehoben." });
    } catch (protectionError) {
      setError(protectionError instanceof Error ? protectionError.message : "Löschschutz konnte nicht geändert werden.");
      setOperationNotice(null);
    }
  };

  const issueRecoveryAccess = async () => {
    if (!detail) return;
    setRecoveryLoading(true);
    setOperationNotice({ tone: "working", message: "Fortsetzungszugang wird erstellt." });
    setRecoveryAccess(null);
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/matches/${encodeURIComponent(detail.matchId)}/recovery-access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ side: recoverySide })
      });
      const payload = (await response.json()) as MaintenanceRecoveryAccess | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Fortsetzungszugang konnte nicht erstellt werden." : "Fortsetzungszugang konnte nicht erstellt werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Fortsetzungszugang wurde wegen Redaktionsprüfung blockiert.");
      await loadDetail(detail.matchId);
      await loadMatches(filters);
      setRecoveryAccess(payload as MaintenanceRecoveryAccess);
      setOperationNotice({ tone: "success", message: "Fortsetzungszugang erstellt." });
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : "Fortsetzungszugang konnte nicht erstellt werden.");
      setOperationNotice(null);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const recoveryLink = recoveryAccess ? buildMaintenanceRecoveryLink(recoveryAccess, typeof window === "undefined" ? "http://127.0.0.1:3000" : window.location.origin) : "";
  const copyRecoveryLink = async () => {
    if (!recoveryLink) return;
    await navigator.clipboard?.writeText(recoveryLink);
  };

  const exportAiTraceIndex = () => {
    if (!selectedAiTraceMatchId || aiTraceIndex.length === 0) return;
    const output = buildMaintenanceAiTraceNdjsonExport({ matchId: selectedAiTraceMatchId, generatedAt: new Date().toISOString(), traces: aiTraceIndex });
    const blob = new Blob([output], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `netgrid-ai-traces-${selectedAiTraceMatchId}.ndjson`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveCleanupPolicy = async () => {
    setPolicyLoading(true);
    setOperationNotice({ tone: "working", message: "Cleanup-Policy wird gespeichert." });
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/cleanup/policy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled: policyDraft.enabled,
          statuses: policyDraft.statuses,
          olderThanDays: Number(policyDraft.olderThanDays),
          limit: Number(policyDraft.limit),
          includeProtected: policyDraft.includeProtected,
          vacuumAfter: policyDraft.vacuumAfter,
          createBackup: policyDraft.createBackup
        })
      });
      const payload = (await response.json()) as MaintenanceCleanupPolicy | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Cleanup-Policy konnte nicht gespeichert werden." : "Cleanup-Policy konnte nicht gespeichert werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Cleanup-Policy wurde wegen Redaktionsprüfung blockiert.");
      setCleanupPolicy(payload as MaintenanceCleanupPolicy);
      setOperationNotice({ tone: "success", message: "Cleanup-Policy gespeichert." });
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : "Cleanup-Policy konnte nicht gespeichert werden.");
      setOperationNotice(null);
    } finally {
      setPolicyLoading(false);
    }
  };

  const runCleanupPolicy = async () => {
    setPolicyLoading(true);
    setOperationNotice({ tone: "working", message: "Auto-Cleanup wird geprüft." });
    setError("");
    try {
      const response = await fetch(`${serverHttp}/api/storage/maintenance/cleanup/policy/run`, { method: "POST" });
      const payload = (await response.json()) as { policy?: MaintenanceCleanupPolicy; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Auto-Cleanup konnte nicht ausgeführt werden.");
      const markers = findForbiddenMaintenanceMarkers(payload);
      if (markers.length > 0) throw new Error("Auto-Cleanup-Ergebnis wurde wegen Redaktionsprüfung blockiert.");
      if (payload.policy) setCleanupPolicy(payload.policy);
      setOperationNotice({ tone: "success", message: "Auto-Cleanup geprüft. Aktualisierung läuft." });
      await refresh(undefined, "cleanup");
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : "Auto-Cleanup konnte nicht ausgeführt werden.");
      setOperationNotice(null);
    } finally {
      setPolicyLoading(false);
    }
  };

  const markLoadStep = (id: MaintenanceLoadStepId, status: MaintenanceLoadStep["status"]) => {
    setLoadSteps((current) => current.map((step) => (step.id === id ? { ...step, status } : step)));
  };

  const refresh = async (nextFilters = filters, reason: "initial" | "refresh" | "filters" | "cleanup" = "refresh") => {
    setLoading(true);
    setLoadSteps(INITIAL_LOAD_STEPS.map((step) => ({ ...step, status: "loading" })));
    setOperationNotice({
      tone: "working",
      message: reason === "filters" ? "Filter werden angewendet. Matchliste und Backendstatus werden geladen." : "Backendstatus, Datenbankstatus und Matchliste werden geladen."
    });
    setError("");
    try {
      const results = await Promise.allSettled([
        loadSummary().then(() => markLoadStep("summary", "done"), (loadError) => {
          markLoadStep("summary", "error");
          throw loadError;
        }),
        loadMatches(nextFilters).then(() => markLoadStep("matches", "done"), (loadError) => {
          markLoadStep("matches", "error");
          throw loadError;
        }),
        loadCleanupPolicy().then(() => markLoadStep("policy", "done"), (loadError) => {
          markLoadStep("policy", "error");
          throw loadError;
        }),
        loadAiTraceMatches().then(() => markLoadStep("aiTraces", "done"), (loadError) => {
          markLoadStep("aiTraces", "error");
          throw loadError;
        })
      ]);
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (rejected) throw rejected.reason;
      setOperationNotice({
        tone: "success",
        message: reason === "filters" ? "Filter angewendet. Matchliste ist geladen." : "Wartungsdaten sind geladen."
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Wartungsdaten konnten nicht geladen werden.");
      setOperationNotice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh(filters, "initial");
  }, []);

  useEffect(() => {
    let closed = false;
    if (!selectedMatchId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    loadDetail(selectedMatchId)
      .catch((detailError) => {
        if (!closed) setError(detailError instanceof Error ? detailError.message : "Matchdetail konnte nicht geladen werden.");
      })
      .finally(() => {
        if (!closed) setDetailLoading(false);
      });
    return () => {
      closed = true;
    };
  }, [selectedMatchId]);

  useEffect(() => {
    let closed = false;
    setAiTraceFollowPaused(false);
    setAiTraceLoading(true);
    setError("");
    loadAiTraceIndex(selectedAiTraceMatchId)
      .catch((traceError) => {
        if (!closed) setError(traceError instanceof Error ? traceError.message : "KI-Trace-Timeline konnte nicht geladen werden.");
      })
      .finally(() => {
        if (!closed) setAiTraceLoading(false);
      });
    return () => {
      closed = true;
    };
  }, [selectedAiTraceMatchId]);

  useEffect(() => {
    if (!selectedAiTraceMatchId || !aiTraceLiveFollow || aiTraceFollowPaused) return;
    let closed = false;
    const poll = () => {
      pollAiTraceUpdates(selectedAiTraceMatchId).catch((traceError) => {
        if (!closed) setError(traceError instanceof Error ? traceError.message : "KI-Trace-Live-Follow konnte nicht geladen werden.");
      });
    };
    const timer = window.setInterval(poll, 1500);
    return () => {
      closed = true;
      window.clearInterval(timer);
    };
  }, [selectedAiTraceMatchId, aiTraceLiveFollow, aiTraceFollowPaused, aiTraceIndex]);

  useEffect(() => {
    let closed = false;
    setAiTraceLoading(true);
    setError("");
    loadAiTraceDetail(selectedAiTraceId)
      .catch((traceError) => {
        if (!closed) setError(traceError instanceof Error ? traceError.message : "KI-Trace-Detail konnte nicht geladen werden.");
      })
      .finally(() => {
        if (!closed) setAiTraceLoading(false);
      });
    return () => {
      closed = true;
    };
  }, [selectedAiTraceId]);

  const statusRows = useMemo(() => Object.entries(summary?.matchCountsByStatus ?? {}).sort(([a], [b]) => a.localeCompare(b)), [summary]);
  const modeRows = useMemo(() => Object.entries(summary?.matchCountsByMode ?? {}).sort(([a], [b]) => a.localeCompare(b)), [summary]);
  const selectedAiTraceMatch = aiTraceMatches.find((match) => match.matchId === selectedAiTraceMatchId);
  const selectedMatchTraceEntry = aiTraceMatches.find((match) => match.matchId === selectedMatchId);
  const selectedMatchCanEnableAiTrace = Boolean(detail && selectedMatchId && !detail.terminal && detail.mode !== "human_vs_human" && !selectedMatchTraceEntry);
  const aiTraceEmptyHint = selectedMatchId
    ? selectedMatchCanEnableAiTrace
      ? "Für das ausgewählte Match werden noch keine KI-Entscheidungen aufgezeichnet. Aktiviere die Aufzeichnung hier in der Wartungsansicht; ab dem nächsten KI-Schritt entstehen Trace-Daten."
      : selectedMatchTraceEntry
        ? "Für das ausgewählte Match ist KI-Tracing aktiv. Neue KI-Schritte erscheinen hier, sobald sie aufgezeichnet wurden."
        : "Für das ausgewählte Match gibt es keine aktivierbare KI-Seite oder es ist bereits beendet."
    : "Wähle oben in der Matchliste ein KI-Match aus und aktiviere hier die Aufzeichnung. Bereits vergangene KI-Schritte können nicht vollständig nachträglich rekonstruiert werden.";

  const applyFilters = () => void refresh(filters, "filters");

  return (
    <main style={pageShell}>
      <div style={page}>
      <header style={header}>
        <div style={headerTitle}>
          <Database size={24} aria-hidden="true" />
          <div>
            <h1 style={h1}>Storage Maintenance</h1>
            <p style={subtle}>Backend 0.5 · private Storage-Wartungsansicht</p>
          </div>
        </div>
        <button type="button" style={button} onClick={() => void refresh(filters, "refresh")} disabled={loading} title="Aktualisieren">
          {loading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <RefreshCcw size={16} aria-hidden="true" />}
          {loading ? "Lädt" : "Aktualisieren"}
        </button>
      </header>

      <LoadStatus steps={loadSteps} active={loading} notice={operationNotice} />

      {error ? <p style={errorBox}>{error}</p> : null}

      {summary ? (
        <>
          <section style={grid4}>
            <Metric label="DB-Größe" value={formatBytes(summary.database.fileSizeBytes)} />
            <Metric label="Matches" value={String(summary.matchCount)} />
            <Metric label="Terminal" value={String(summary.terminalCount)} />
            <Metric label="Nicht-terminal" value={String(summary.nonTerminalCount)} />
          </section>

          <section style={twoCols}>
            <CollapsiblePanel title="Statusverteilung">
              <MiniRows rows={statusRows.map(([key, value]) => [statusLabel(key), String(value)])} />
            </CollapsiblePanel>
            <CollapsiblePanel title="Modusverteilung">
              <MiniRows rows={modeRows.map(([key, value]) => [modeLabel(key), String(value)])} />
            </CollapsiblePanel>
          </section>

          <section style={twoCols}>
            <CollapsiblePanel title="Tabellen und Payloads">
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Bereich</th>
                      <th style={th}>Zeilen</th>
                      <th style={th}>Größe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.tableSizes.map((row) => (
                      <tr key={row.key}>
                        <td style={td}>{row.label}</td>
                        <td style={td}>{row.rowCount}</td>
                        <td style={td}>{formatBytes(row.approximatePayloadBytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel title="Größte Matches">
              <MiniRows rows={summary.largestMatches.slice(0, 6).map((match) => [shortId(match.matchId), formatBytes(match.sizes.approximateTotalBytes)])} />
            </CollapsiblePanel>
          </section>
        </>
      ) : loading ? <SkeletonDashboard /> : null}

      <CollapsiblePanel title="Matchliste" icon={<ListFilter size={18} aria-hidden="true" />}>
        <div style={panelHeader}>
          <p style={subtle}>{loading ? "Matchliste wird geladen ..." : `Geladen: ${matches.length}`} · Limit leer lassen lädt alle Matches bewusst.</p>
          <button type="button" style={button} onClick={applyFilters} disabled={loading} title="Filter anwenden">
            {loading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <Eye size={16} aria-hidden="true" />}
            {loading ? "Lädt" : "Anwenden"}
          </button>
        </div>
        <div style={filtersGrid}>
          <Select label="Status" value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={statusOptions} />
          <Select label="Terminal" value={filters.terminal} onChange={(terminal) => setFilters((current) => ({ ...current, terminal: terminal as MaintenanceFilters["terminal"] }))} options={terminalOptions} />
          <Select label="Modus" value={filters.mode} onChange={(mode) => setFilters((current) => ({ ...current, mode }))} options={modeOptions} />
          <Input label="Älter als Tage" value={filters.olderThanDays} onChange={(olderThanDays) => setFilters((current) => ({ ...current, olderThanDays }))} />
          <Input label="Größer als MiB" value={filters.largerThanMiB} onChange={(largerThanMiB) => setFilters((current) => ({ ...current, largerThanMiB }))} />
          <Input label="Max. Matches" value={filters.limit} onChange={(limit) => setFilters((current) => ({ ...current, limit }))} />
        </div>
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Match</th>
                <th style={th}>Status</th>
                <th style={th}>Modus</th>
                <th style={th}>Beteiligte</th>
                <th style={th}>Alter</th>
                <th style={th}>Version</th>
                <th style={th}>Events</th>
                <th style={th}>Snapshots</th>
                <th style={th}>Größe</th>
                <th style={th}>Schutz</th>
              </tr>
            </thead>
            <tbody>
              {loading && matches.length === 0 ? (
                <tr>
                  <td style={loadingCell} colSpan={10}>
                    <LoaderCircle size={16} aria-hidden="true" style={spinIcon} />
                    Matchliste wird aus der Datenbank geladen ...
                  </td>
                </tr>
              ) : null}
              {!loading && matches.length === 0 ? (
                <tr>
                  <td style={loadingCell} colSpan={10}>Keine Matches für diese Filter gefunden.</td>
                </tr>
              ) : null}
              {matches.map((match) => (
                <tr key={match.matchId} style={selectedMatchId === match.matchId ? selectedRow : undefined} onClick={() => setSelectedMatchId(match.matchId)}>
                  <td style={td}><code>{shortId(match.matchId)}</code></td>
                  <td style={td}>{statusLabel(match.status)}</td>
                  <td style={td}>{modeLabel(match.mode)}</td>
                  <td style={td}>{participantsLabel(match.participants)}</td>
                  <td style={td}>{formatAge(match.ageSeconds)}</td>
                  <td style={td}>{match.stateVersion ?? "-"} / {match.matchVersion}</td>
                  <td style={td}>{match.eventCount}</td>
                  <td style={td}>{match.snapshotCount}</td>
                  <td style={td}>{formatBytes(match.sizes.approximateTotalBytes)}</td>
                  <td style={td}>{match.retentionProtected ? "geschützt" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsiblePanel>

      {detailLoading && selectedMatchId ? <p style={infoBox}>Matchdetail wird geladen: <code>{shortId(selectedMatchId)}</code></p> : null}

      {detail ? (
        <CollapsiblePanel title="Matchdetail" icon={<ShieldCheck size={18} aria-hidden="true" />}>
          <div style={panelHeader}>
            <p style={subtle}>{detail.retentionProtected ? "Gegen automatisches Löschen geschützt" : "Nicht gegen automatisches Löschen geschützt"}</p>
            <div style={buttonRow}>
              <button type="button" style={button} onClick={() => void setDetailRetentionProtection(!detail.retentionProtected)} disabled={detailLoading || loading}>
                {detail.retentionProtected ? "Schutz aufheben" : "Vor Löschen schützen"}
              </button>
              <code>{detail.matchId}</code>
            </div>
          </div>
          <div style={detailGrid}>
            <Metric label="Status" value={statusLabel(detail.status)} />
            <Metric label="Modus" value={modeLabel(detail.mode)} />
            <Metric label="State / Match" value={`${detail.stateVersion ?? "-"} / ${detail.matchVersion}`} />
            <Metric label="Größe" value={formatBytes(detail.sizes.approximateTotalBytes)} />
            <Metric label="Events" value={String(detail.eventCount)} />
            <Metric label="Snapshots" value={String(detail.snapshotCount)} />
          </div>
          <MiniRows
            rows={[
              ["Erstellt", new Date(detail.createdAt).toLocaleString("de-DE")],
              ["Aktualisiert", new Date(detail.updatedAt).toLocaleString("de-DE")],
              ["Beteiligte", participantsLabel(detail.participants)],
              ["Match-Record", formatBytes(detail.sizes.matchRecordBytes)],
              ["Aktueller Zustand", formatBytes(detail.sizes.gameStateBytes)],
              ["Events", formatBytes(detail.sizes.eventPayloadBytes)],
              ["Snapshots", formatBytes(detail.sizes.stateSnapshotBytes)],
              ["Deck-Snapshot-Blöcke", formatBytes(detail.sizes.deckSnapshotBytes)],
              ["Löschschutz", detail.retentionProtected ? `aktiv${detail.retentionProtectedAt ? ` seit ${new Date(detail.retentionProtectedAt).toLocaleString("de-DE")}` : ""}` : "aus"],
              ["Cleanup", detail.cleanupAssessment.reason]
            ]}
          />
          <div style={recoveryBox}>
            <div style={panelHeader}>
              <div style={headerTitle}>
                <KeyRound size={18} aria-hidden="true" />
                <div>
                  <h3 style={h3}>Fortsetzungszugang</h3>
                  <p style={subtle}>Erzeugt lokal einen neuen Zugang für eine vorhandene Spieler-Seite; der alte Zugang dieser Seite wird ungültig.</p>
                </div>
              </div>
              <div style={buttonRow}>
                <select value={recoverySide} onChange={(event) => setRecoverySide(event.target.value === "corp" ? "corp" : "runner")} style={input} disabled={recoveryLoading || detail.participants.length === 0}>
                  {detail.participants.map((participant) => (
                    <option key={participant.side} value={participant.side}>
                      {participant.side === "runner" ? "Runner" : "Korp"} · {participant.displayName}
                    </option>
                  ))}
                </select>
                <button type="button" style={button} onClick={() => void issueRecoveryAccess()} disabled={recoveryLoading || detail.terminal || detail.participants.length === 0}>
                  {recoveryLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <KeyRound size={16} aria-hidden="true" />}
                  {recoveryLoading ? "Erstellt" : "Erstellen"}
                </button>
              </div>
            </div>
            {recoveryAccess ? (
              <div style={recoveryLinkRow}>
                <input value={recoveryLink} readOnly style={wideInput} aria-label="Fortsetzungslink" />
                <button type="button" style={button} onClick={() => void copyRecoveryLink()} title="Fortsetzungslink kopieren">
                  <Copy size={16} aria-hidden="true" />
                  Kopieren
                </button>
                <a href={recoveryLink} style={linkButton} title="Fortsetzungslink öffnen">
                  <ExternalLink size={16} aria-hidden="true" />
                  Öffnen
                </a>
              </div>
            ) : null}
          </div>
        </CollapsiblePanel>
      ) : null}

      <CollapsiblePanel title="KI-Entscheidungen" icon={<Bot size={18} aria-hidden="true" />}>
        <div style={panelHeader}>
          <p style={subtle}>
            {aiTraceMatches.length === 0 ? "Keine KI-Trace-Aufzeichnungen vorhanden." : `${aiTraceMatches.length} Matches mit aktivierter KI-Trace-Aufzeichnung.`}
            {aiTraceLiveFollow && !aiTraceFollowPaused ? " · Live-Follow aktiv" : ""}
          </p>
          <div style={buttonRow}>
            <button type="button" style={button} onClick={() => void enableAiTracingForSelectedMatch()} disabled={!selectedMatchCanEnableAiTrace || aiTraceEnableLoading} title="KI-Tracing für das aktuell ausgewählte Match ab jetzt aktivieren">
              {aiTraceEnableLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <Bot size={16} aria-hidden="true" />}
              {aiTraceEnableLoading ? "Aktiviert" : "Für Match aktivieren"}
            </button>
            <button type="button" style={button} onClick={() => void loadAiTraceMatches()} disabled={aiTraceLoading} title="KI-Trace-Matches aktualisieren">
              {aiTraceLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <RefreshCcw size={16} aria-hidden="true" />}
              {aiTraceLoading ? "Lädt" : "Aktualisieren"}
            </button>
            <button type="button" style={button} onClick={() => setAiTraceLiveFollow((current) => !current)} title="Live-Follow ein- oder ausschalten">
              <Bot size={16} aria-hidden="true" />
              {aiTraceLiveFollow ? "Live an" : "Live aus"}
            </button>
            <button type="button" style={button} onClick={() => setAiTraceFollowPaused((current) => !current)} disabled={!aiTraceLiveFollow} title="Live-Follow pausieren oder fortsetzen">
              {aiTraceFollowPaused ? "Fortsetzen" : "Pausieren"}
            </button>
            <button type="button" style={button} onClick={() => { setSelectedAiTraceId(latestMaintenanceAiTraceId(aiTraceIndex)); setAiTraceFollowPaused(false); }} disabled={aiTraceIndex.length === 0} title="Zur neuesten KI-Entscheidung springen">
              Zur neuesten
            </button>
            <button type="button" style={button} onClick={exportAiTraceIndex} disabled={!selectedAiTraceMatchId || aiTraceIndex.length === 0} title="Redigierten KI-Trace-Index als NDJSON exportieren">
              <Download size={16} aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
        {aiTraceMatches.length === 0 ? <p style={infoBox}>{aiTraceEmptyHint}</p> : null}
        {aiTraceMatches.length > 0 ? (
          <div style={twoCols}>
            <div style={cleanupBox}>
              <h3 style={h3}>Matchauswahl</h3>
              <p style={subtle}>Aufzeichnung kann hier für das aktuell ausgewählte KI-Match aktiviert werden. Sie wirkt ab dem nächsten KI-Schritt.</p>
              <div style={traceList}>
                {aiTraceMatches.map((match) => (
                  <button key={match.matchId} type="button" style={selectedAiTraceMatchId === match.matchId ? traceItemSelected : traceItem} onClick={() => setSelectedAiTraceMatchId(match.matchId)}>
                    <span><code>{shortId(match.matchId)}</code> · {modeLabel(match.mode)}</span>
                    <strong>{match.traceCount}</strong>
                    <small>{match.lastTraceAt ? new Date(match.lastTraceAt).toLocaleString("de-DE") : `aktiv · ${match.aiTraceMode}`}</small>
                  </button>
                ))}
              </div>
            </div>
            <div style={cleanupBox}>
              <h3 style={h3}>Timeline</h3>
              {selectedAiTraceMatchId && aiTraceIndex.length === 0 ? <p style={subtle}>{selectedAiTraceMatch?.traceCount === 0 ? "KI-Tracing ist aktiv; die nächste KI-Entscheidung wird hier erscheinen." : "Dieses Match enthält keine KI-Entscheidungen oder der Trace-Index ist leer."}</p> : null}
              <div style={traceList}>
                {aiTraceIndex.map((trace) => (
                  <button key={trace.traceId} type="button" style={selectedAiTraceId === trace.traceId ? traceItemSelected : traceItem} onClick={() => { setSelectedAiTraceId(trace.traceId); if (trace.traceId !== latestMaintenanceAiTraceId(aiTraceIndex)) setAiTraceFollowPaused(true); }}>
                    <span>{aiTraceTitle(trace)}</span>
                    <small>State {trace.stateVersion} · {trace.confidence === undefined ? "Vertrauen -" : `${Math.round(trace.confidence * 100)}%`}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {aiTraceDetail ? <AiTraceDetailView trace={aiTraceDetail} /> : null}
      </CollapsiblePanel>

      <CollapsiblePanel title="Cleanup" icon={<Trash2 size={18} aria-hidden="true" />}>
        <div style={panelHeader}>
          <p style={subtle}>Manueller Dry-Run und automatischer stündlicher Cleanup.</p>
          <div style={buttonRow}>
            <button type="button" style={button} onClick={() => void loadCleanupPreview()} disabled={cleanupLoading} title="Löschvorschau erzeugen">
              {cleanupLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <Eye size={16} aria-hidden="true" />}
              {cleanupLoading ? "Lädt" : "Vorschau"}
            </button>
            <button
              type="button"
              style={buttonDanger}
              onClick={() => void applyCleanup()}
              disabled={cleanupLoading || !cleanupPreview || cleanupPreview.matchCount === 0 || !cleanupConfirmed}
              title="Ganze Matches löschen"
            >
              {cleanupLoading ? <LoaderCircle size={16} aria-hidden="true" style={spinIcon} /> : <Trash2 size={16} aria-hidden="true" />}
              {cleanupLoading ? "Löscht" : "Löschen"}
            </button>
          </div>
        </div>
        <div style={warningBox}>
          <AlertTriangle size={18} aria-hidden="true" />
          <p style={subtle}>Löschen ist nur nach Vorschau möglich. Backup ist optional. Es werden ausschließlich ganze Matches entfernt; Events, Snapshots, Sessions oder Tokens werden nie einzeln gelöscht. Geschützte Matches bleiben standardmäßig erhalten.</p>
        </div>
        <div style={filtersGrid}>
          <Input label="Älter als Minuten" value={cleanupFilters.olderThanMinutes} onChange={(olderThanMinutes) => setCleanupFilters((current) => ({ ...current, olderThanMinutes }))} />
          <Input label="Max. Matches" value={cleanupFilters.limit} onChange={(limit) => setCleanupFilters((current) => ({ ...current, limit }))} />
          <label style={checkField}>
            <input type="checkbox" checked={cleanupFilters.createBackup} onChange={(event) => setCleanupFilters((current) => ({ ...current, createBackup: event.target.checked }))} />
            Backup vor dem Löschen erstellen
          </label>
          <label style={checkField}>
            <input type="checkbox" checked={cleanupFilters.includeProtected} onChange={(event) => setCleanupFilters((current) => ({ ...current, includeProtected: event.target.checked }))} />
            Geschützte Matches einschließen
          </label>
          <label style={checkField}>
            <input type="checkbox" checked={cleanupFilters.vacuumAfter} onChange={(event) => setCleanupFilters((current) => ({ ...current, vacuumAfter: event.target.checked }))} />
            Nach dem Löschen Datenbank komprimieren
          </label>
        </div>
        <div style={checkboxGrid}>
          {cleanupStatusOptions.map(([status, label]) => (
            <label key={status} style={checkField}>
              <input type="checkbox" checked={cleanupFilters.statuses.includes(status)} onChange={() => toggleCleanupStatus(status)} />
              {label}
            </label>
          ))}
        </div>
        {cleanupLoading ? <p style={infoBox}>Cleanup-Anfrage läuft. Bitte warten, bis Vorschau oder Ergebnis angezeigt wird.</p> : null}
        {cleanupPreview ? (
          <div style={cleanupBox}>
            <MiniRows
              rows={[
                ["Vorschau-ID", cleanupPreview.previewId],
                ["Treffer", String(cleanupPreview.matchCount)],
                ["Geschätzte Größe", formatBytes(cleanupPreview.approximateBytes)],
                ["Ältestes Update", cleanupPreview.oldestUpdatedAt ? new Date(cleanupPreview.oldestUpdatedAt).toLocaleString("de-DE") : "-"]
              ]}
            />
            {cleanupPreview.warnings.map((warning) => (
              <p key={warning} style={warningText}>{warning}</p>
            ))}
            <label style={checkField}>
              <input type="checkbox" checked={cleanupConfirmed} onChange={(event) => setCleanupConfirmed(event.target.checked)} />
              Ich habe die Vorschau geprüft und will diese ganzen Matches löschen.
            </label>
            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Match</th>
                    <th style={th}>Status</th>
                    <th style={th}>Modus</th>
                    <th style={th}>Alter</th>
                    <th style={th}>Events</th>
                    <th style={th}>Snapshots</th>
                    <th style={th}>Größe</th>
                    <th style={th}>Schutz</th>
                  </tr>
                </thead>
                <tbody>
                  {cleanupPreview.matches.map((match) => (
                    <tr key={match.matchId}>
                      <td style={td}><code>{shortId(match.matchId)}</code></td>
                      <td style={td}>{statusLabel(match.status)}</td>
                      <td style={td}>{modeLabel(match.mode)}</td>
                      <td style={td}>{formatAge(match.ageSeconds)}</td>
                      <td style={td}>{match.eventCount}</td>
                      <td style={td}>{match.snapshotCount}</td>
                      <td style={td}>{formatBytes(match.sizes.approximateTotalBytes)}</td>
                      <td style={td}>{match.retentionProtected ? "geschützt" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {cleanupResult ? (
          <div style={cleanupBox}>
            <MiniRows
              rows={[
                ["Gelöscht", String(cleanupResult.deletedCount)],
                ["Backup", cleanupResult.backup ? cleanupResult.backup.backupId : "nicht erstellt"],
                ["Integrität", cleanupResult.integrityCheck],
                ["DB vorher", formatBytes(cleanupResult.database.beforeBytes)],
                ["DB nach Delete", formatBytes(cleanupResult.database.afterDeleteBytes)],
                ["DB nach Komprimierung", cleanupResult.database.afterVacuumBytes === undefined ? "-" : formatBytes(cleanupResult.database.afterVacuumBytes)]
              ]}
            />
            {cleanupResult.backup ? <p style={subtle}>Backup-Verzeichnis: {cleanupResult.backup.backupDir}</p> : null}
          </div>
        ) : null}
        <div style={cleanupBox}>
          <div style={panelHeader}>
            <h3 style={h3}>Automatischer Cleanup</h3>
            <div style={buttonRow}>
              <button type="button" style={button} onClick={() => void saveCleanupPolicy()} disabled={policyLoading}>{policyLoading ? "Speichert" : "Speichern"}</button>
              <button type="button" style={button} onClick={() => void runCleanupPolicy()} disabled={policyLoading}>{policyLoading ? "Prüft" : "Jetzt prüfen"}</button>
            </div>
          </div>
          <div style={filtersGrid}>
            <label style={checkField}>
              <input type="checkbox" checked={policyDraft.enabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, enabled: event.target.checked }))} />
              Stündlich automatisch prüfen
            </label>
            <Input label="Älter als Tage" value={policyDraft.olderThanDays} onChange={(olderThanDays) => setPolicyDraft((current) => ({ ...current, olderThanDays }))} />
            <Input label="Max. Matches pro Lauf" value={policyDraft.limit} onChange={(limit) => setPolicyDraft((current) => ({ ...current, limit }))} />
            <label style={checkField}>
              <input type="checkbox" checked={policyDraft.createBackup} onChange={(event) => setPolicyDraft((current) => ({ ...current, createBackup: event.target.checked }))} />
              Backup je Auto-Lauf erstellen
            </label>
            <label style={checkField}>
              <input type="checkbox" checked={policyDraft.includeProtected} onChange={(event) => setPolicyDraft((current) => ({ ...current, includeProtected: event.target.checked }))} />
              Geschützte Matches mit löschen
            </label>
            <label style={checkField}>
              <input type="checkbox" checked={policyDraft.vacuumAfter} onChange={(event) => setPolicyDraft((current) => ({ ...current, vacuumAfter: event.target.checked }))} />
              Nach Auto-Lauf komprimieren
            </label>
          </div>
          <div style={checkboxGrid}>
            {cleanupStatusOptions.map(([status, label]) => (
              <label key={`policy-${status}`} style={checkField}>
                <input type="checkbox" checked={policyDraft.statuses.includes(status)} onChange={() => togglePolicyStatus(status)} />
                {label}
              </label>
            ))}
          </div>
          {cleanupPolicy ? (
            <MiniRows
              rows={[
                ["Status", cleanupPolicy.enabled ? "aktiv" : "aus"],
                ["Intervall", `${cleanupPolicy.intervalMinutes} min`],
                ["Alter", `${cleanupPolicy.olderThanDays} d`],
                ["Schutz", cleanupPolicy.includeProtected ? "wird mit gelöscht" : "bleibt erhalten"],
                ["Backup", cleanupPolicy.createBackup ? "aktiv" : "aus"],
                ["Letzter Lauf", cleanupPolicy.lastRun ? new Date(cleanupPolicy.lastRun.finishedAt).toLocaleString("de-DE") : "-"],
                ["Letzte Löschung", cleanupPolicy.lastRun ? String(cleanupPolicy.lastRun.deletedCount) : "-"]
              ]}
            />
          ) : null}
        </div>
      </CollapsiblePanel>
      </div>
    </main>
  );
}

function LoadStatus({ steps, active, notice }: { steps: MaintenanceLoadStep[]; active: boolean; notice: OperationNotice | null }) {
  const hasProgress = active || notice || steps.some((step) => step.status !== "pending");
  if (!hasProgress) return null;
  const isWorking = active || notice?.tone === "working";
  const doneCount = steps.filter((step) => step.status === "done").length;
  const progressValue = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);
  const noticeStyle = notice?.tone === "success" ? successNotice : workingNotice;
  return (
    <section style={loadStatusBox} aria-live="polite" aria-busy={isWorking}>
      <div style={panelHeader}>
        <div>
          <h2 style={h2}>Ladestatus</h2>
          <p style={subtle}>{notice?.message ?? "Bereit."}</p>
        </div>
        <strong style={noticeStyle}>{active ? `${progressValue}%` : isWorking ? "läuft" : "fertig"}</strong>
      </div>
      <div style={progressTrack} aria-hidden="true">
        <div style={{ ...progressFill, width: `${active ? Math.max(progressValue, 8) : isWorking ? 100 : progressValue}%` }} />
      </div>
      <div style={loadStepGrid}>
        {steps.map((step) => (
          <span key={step.id} style={loadStep}>
            {step.status === "loading" ? <LoaderCircle size={15} aria-hidden="true" style={spinIcon} /> : null}
            {step.status === "done" ? <CheckCircle2 size={15} aria-hidden="true" /> : null}
            {step.status === "error" ? <XCircle size={15} aria-hidden="true" /> : null}
            {step.status === "pending" ? <span style={pendingDot} aria-hidden="true" /> : null}
            {step.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function SkeletonDashboard() {
  return (
    <section style={grid4} aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} style={skeletonMetric}>
          <span style={skeletonLineSmall} />
          <span style={skeletonLineLarge} />
        </div>
      ))}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metric}>
      <span style={metricLabel}>{label}</span>
      <strong style={metricValue}>{value}</strong>
    </div>
  );
}

function CollapsiblePanel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <details style={collapsiblePanel}>
      <summary style={summaryHeader}>
        <h2 style={h2}>{icon}{title}</h2>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div style={panelBody}>{children}</div>
    </details>
  );
}

function MiniRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div style={miniRows}>
      {rows.length === 0 ? <span style={subtle}>Keine Daten</span> : null}
      {rows.map(([label, value]) => (
        <div key={`${label}:${value}`} style={miniRow}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function AiTraceDetailView({ trace }: { trace: MaintenanceAiTraceDetail }) {
  const detail = trace.detail;
  const alternatives = recordList(detail.rankedAlternatives).slice(0, 5);
  const scoreBreakdown = recordList(detail.scoreBreakdown).slice(0, 16);
  const detailSections = recordList(detail.detailSections).slice(0, 8);
  return (
    <div style={cleanupBox}>
      <div style={panelHeader}>
        <div>
          <h3 style={h3}>{aiTraceTitle(trace)}</h3>
          <p style={subtle}>{typeof detail.summary === "string" ? detail.summary : trace.eventId}</p>
        </div>
        <code>{shortId(trace.traceId)}</code>
      </div>
      <div style={detailGrid}>
        {aiTraceMetaRows(trace).map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
      <TraceSection title="Warnmarker" items={[...safeStringList(detail.warnings), ...(detail.fallbackUsed === true ? ["fallback"] : []), ...(detail.timeoutUsed === true ? ["timeout"] : [])]} />
      <TraceSection title="Sichtbare Gründe" items={safeStringList(detail.visibleReasons)} />
      <TraceSection title="Langfristplan" items={safeStringList(detail.longTermPlan)} />
      <details style={traceDetails} open>
        <summary>Top-Alternativen</summary>
        {alternatives.length === 0 ? <p style={subtle}>Keine Alternativen im Trace.</p> : null}
        <div style={traceCardGrid}>
          {alternatives.map((alternative, index) => (
            <div key={`${String(alternative.planId ?? "alt")}-${index}`} style={traceCard}>
              <strong>#{String(alternative.rank ?? index + 1)} · {String(alternative.planKind ?? alternative.selectedActionType ?? "Alternative")}</strong>
              <span>{typeof alternative.score === "number" ? `Score ${alternative.score}` : "Score -"}</span>
              <TraceSection title="Warum nicht" items={safeStringList(alternative.whyNot, 4)} compact />
            </div>
          ))}
        </div>
      </details>
      <details style={traceDetails}>
        <summary>Score-Komponenten</summary>
        {scoreBreakdown.length === 0 ? <p style={subtle}>Keine Score-Komponenten im Trace.</p> : null}
        <MiniRows rows={scoreBreakdown.map((component) => [String(component.label ?? component.key ?? "Komponente"), typeof component.value === "number" ? component.value.toFixed(2) : String(component.value ?? "-")])} />
      </details>
      {detailSections.map((section) => (
        <TraceSection key={String(section.id ?? section.title)} title={String(section.title ?? section.id ?? "Detail")} items={safeStringList(section.items, 12)} collapsible />
      ))}
      <details style={traceDetails}>
        <summary>Technische IDs</summary>
        <MiniRows rows={[
          ["Trace", trace.traceId],
          ["Event", trace.eventId],
          ["Match", trace.matchId],
          ["Schema", trace.schemaVersion]
        ]} />
      </details>
    </div>
  );
}

function TraceSection({ title, items, compact = false, collapsible = false }: { title: string; items: string[]; compact?: boolean; collapsible?: boolean }) {
  if (items.length === 0) return null;
  const content = (
    <div style={compact ? traceChipsCompact : traceChips}>
      {items.map((item) => <span key={item} style={traceChip}>{item}</span>)}
    </div>
  );
  if (collapsible) {
    return (
      <details style={traceDetails}>
        <summary>{title}</summary>
        {content}
      </details>
    );
  }
  return (
    <div style={traceSection}>
      <strong>{title}</strong>
      {content}
    </div>
  );
}

function recordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={input}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="numeric" style={input} />
    </label>
  );
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 12)}…${value.slice(-4)}` : value;
}

const statusOptions: Array<[string, string]> = [
  ["", "Alle"],
  ["pending", "Lobby offen"],
  ["waiting_for_runner", "Wartet auf Runner"],
  ["waiting_for_corp", "Wartet auf Korp"],
  ["waiting_for_joiner_decks", "Wartet auf Deckwahl"],
  ["ready_check", "Bereitschaft"],
  ["countdown", "Countdown"],
  ["active", "Aktiv"],
  ["cancelled", "Abgebrochen"],
  ["abandoned", "Verlassen"],
  ["forfeited", "Aufgegeben"],
  ["finished", "Beendet"]
];

const cleanupStatusOptions = statusOptions.filter(([status]) => status !== "");

const terminalOptions: Array<[string, string]> = [
  ["all", "Alle"],
  ["false", "Nicht-terminal"],
  ["true", "Terminal"]
];

const modeOptions: Array<[string, string]> = [
  ["", "Alle"],
  ["human_vs_human", "Mensch gegen Mensch"],
  ["human_runner_vs_corp_ai", "Runner gegen Korp-KI"],
  ["human_corp_vs_runner_ai", "Korp gegen Runner-KI"]
];

const pageShell: CSSProperties = { minHeight: "100vh", background: "#eef3f8", color: "#102033", boxSizing: "border-box" };
const page: CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "1.25rem", display: "grid", gap: "1rem", color: "#102033" };
const header: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", color: "#0f2538" };
const headerTitle: CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem" };
const h1: CSSProperties = { margin: 0, fontSize: "1.55rem", letterSpacing: 0 };
const h2: CSSProperties = { margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", letterSpacing: 0, color: "#0f2538" };
const h3: CSSProperties = { margin: 0, fontSize: "0.95rem", letterSpacing: 0, color: "#0f2538" };
const subtle: CSSProperties = { margin: 0, color: "#42576b", fontSize: "0.92rem" };
const button: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4rem", border: "1px solid #9db0c3", background: "#fff", color: "#102033", borderRadius: 6, padding: "0.5rem 0.7rem", cursor: "pointer" };
const buttonDanger: CSSProperties = { ...button, border: "1px solid #c76363", background: "#fff7f7", color: "#8a1f1f" };
const buttonRow: CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const grid4: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" };
const twoCols: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.75rem" };
const panel: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 8, padding: "0.85rem", background: "#fff", display: "grid", gap: "0.75rem", color: "#102033" };
const collapsiblePanel: CSSProperties = { ...panel, display: "block", gap: 0, padding: 0, overflow: "hidden" };
const summaryHeader: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", padding: "0.85rem", cursor: "pointer", listStyle: "none", background: "#f8fbfe", color: "#0f2538" };
const panelBody: CSSProperties = { padding: "0 0.85rem 0.85rem" };
const panelHeader: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" };
const metric: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 8, padding: "0.75rem", background: "#fff", display: "grid", gap: "0.25rem", minWidth: 0, color: "#102033" };
const metricLabel: CSSProperties = { color: "#42576b", fontSize: "0.8rem" };
const metricValue: CSSProperties = { fontSize: "1.15rem", overflowWrap: "anywhere", color: "#0f2538" };
const miniRows: CSSProperties = { display: "grid", gap: "0.35rem" };
const miniRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid #edf1f5", padding: "0.2rem 0" };
const tableWrap: CSSProperties = { overflowX: "auto" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 820 };
const th: CSSProperties = { textAlign: "left", fontSize: "0.8rem", color: "#37506a", borderBottom: "1px solid #cbd5e1", padding: "0.45rem 0.5rem", whiteSpace: "nowrap" };
const td: CSSProperties = { borderBottom: "1px solid #edf1f5", padding: "0.45rem 0.5rem", verticalAlign: "top", fontSize: "0.86rem" };
const selectedRow: CSSProperties = { background: "#eef6ff", cursor: "pointer" };
const filtersGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" };
const field: CSSProperties = { display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: "#42576b" };
const checkField: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.45rem", fontSize: "0.86rem", color: "#102033", minHeight: 34 };
const checkboxGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.35rem 0.65rem" };
const input: CSSProperties = { minHeight: 34, border: "1px solid #9db0c3", borderRadius: 6, padding: "0.35rem 0.45rem", background: "#fff", color: "#102033" };
const wideInput: CSSProperties = { ...input, width: "100%", minWidth: 280 };
const detailGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" };
const errorBox: CSSProperties = { margin: 0, border: "1px solid #f3b5b5", background: "#fff5f5", color: "#9b1c1c", borderRadius: 8, padding: "0.7rem" };
const warningBox: CSSProperties = { display: "flex", alignItems: "flex-start", gap: "0.55rem", border: "1px solid #e2c16a", background: "#fff9e8", borderRadius: 8, padding: "0.7rem", color: "#5b4200" };
const warningText: CSSProperties = { margin: 0, color: "#7a4b00", fontSize: "0.86rem" };
const infoBox: CSSProperties = { margin: 0, border: "1px solid #9db0c3", background: "#f6fbff", color: "#153654", borderRadius: 8, padding: "0.7rem", fontSize: "0.9rem" };
const loadStatusBox: CSSProperties = { border: "1px solid #b9cbe0", borderRadius: 8, padding: "0.85rem", background: "#f9fcff", display: "grid", gap: "0.65rem", color: "#102033" };
const progressTrack: CSSProperties = { height: 8, borderRadius: 999, overflow: "hidden", background: "#d8e4ef" };
const progressFill: CSSProperties = { height: "100%", borderRadius: 999, background: "#2f74b5", transition: "width 180ms ease" };
const loadStepGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.45rem" };
const loadStep: CSSProperties = { minHeight: 30, display: "inline-flex", alignItems: "center", gap: "0.4rem", border: "1px solid #d7e1eb", borderRadius: 6, background: "#fff", padding: "0.35rem 0.5rem", color: "#24394d", fontSize: "0.86rem" };
const pendingDot: CSSProperties = { width: 9, height: 9, borderRadius: 999, border: "1px solid #9db0c3", background: "#fff" };
const workingNotice: CSSProperties = { color: "#245f95", fontSize: "0.86rem" };
const successNotice: CSSProperties = { color: "#24704c", fontSize: "0.86rem" };
const spinIcon: CSSProperties = { flex: "0 0 auto" };
const loadingCell: CSSProperties = { ...td, color: "#42576b", textAlign: "center", padding: "1rem", verticalAlign: "middle" };
const skeletonMetric: CSSProperties = { ...metric, minHeight: 82 };
const skeletonLineSmall: CSSProperties = { display: "block", width: "42%", height: 10, borderRadius: 999, background: "#d8e4ef" };
const skeletonLineLarge: CSSProperties = { display: "block", width: "68%", height: 24, borderRadius: 6, background: "#c8d8e8" };
const cleanupBox: CSSProperties = { display: "grid", gap: "0.55rem", border: "1px solid #d7e1eb", borderRadius: 8, padding: "0.75rem", background: "#fbfdff" };
const traceList: CSSProperties = { display: "grid", gap: "0.45rem", maxHeight: 340, overflowY: "auto" };
const traceItem: CSSProperties = { display: "grid", gridTemplateColumns: "1fr auto", gap: "0.2rem 0.75rem", textAlign: "left", border: "1px solid #cbd8e6", background: "#fff", color: "#102033", borderRadius: 6, padding: "0.55rem", cursor: "pointer" };
const traceItemSelected: CSSProperties = { ...traceItem, borderColor: "#2f74b5", background: "#eef6ff" };
const traceDetails: CSSProperties = { border: "1px solid #d7e1eb", borderRadius: 6, padding: "0.55rem", background: "#fff" };
const traceSection: CSSProperties = { display: "grid", gap: "0.35rem" };
const traceChips: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.35rem" };
const traceChipsCompact: CSSProperties = { ...traceChips, gap: "0.25rem" };
const traceChip: CSSProperties = { border: "1px solid #c7d4e2", borderRadius: 999, padding: "0.15rem 0.45rem", background: "#f6f9fc", fontSize: "0.78rem", color: "#24394d" };
const traceCardGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.5rem", marginTop: "0.5rem" };
const traceCard: CSSProperties = { display: "grid", gap: "0.35rem", border: "1px solid #d7e1eb", borderRadius: 6, padding: "0.55rem", background: "#fbfdff" };
const recoveryBox: CSSProperties = { ...cleanupBox, marginTop: "0.75rem" };
const recoveryLinkRow: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(280px, 1fr) auto auto", gap: "0.5rem", alignItems: "center" };
const linkButton: CSSProperties = { ...button, textDecoration: "none" };
