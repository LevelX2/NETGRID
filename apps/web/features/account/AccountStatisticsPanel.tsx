"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "use-intl/react";
import type {
  ApiAccountMatchHistoryEntry,
  ApiAccountStatistics,
  ApiAccountStatisticsBucket,
  ApiAccountStatisticsPeriod,
  ApiMatchMode,
  ApiPlayerIdentityKind,
  Side,
} from "@netgrid/shared";
import { formatAppDateTime } from "../../i18n/format";
import type { AppLocale } from "../../i18n/locale";
import {
  loadAccountMatchHistory,
  loadAccountStatistics,
  type AccountStatisticsFilters,
} from "./account-statistics-client";

type FilterValue<T extends string> = T | "all";

export function AccountStatisticsPanel({ accountId }: { accountId: string }) {
  const locale = useLocale();
  const [period, setPeriod] = useState<ApiAccountStatisticsPeriod>("all");
  const [side, setSide] = useState<FilterValue<Side>>("all");
  const [opponentKind, setOpponentKind] = useState<FilterValue<ApiPlayerIdentityKind>>("all");
  const [matchMode, setMatchMode] = useState<FilterValue<ApiMatchMode>>("all");
  const [statistics, setStatistics] = useState<ApiAccountStatistics | null>(null);
  const [history, setHistory] = useState<ApiAccountMatchHistoryEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const filters = useMemo<AccountStatisticsFilters>(() => ({
    period,
    ...(side !== "all" ? { side } : {}),
    ...(opponentKind !== "all" ? { opponentKind } : {}),
    ...(matchMode !== "all" ? { matchMode } : {}),
  }), [period, side, opponentKind, matchMode]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    void Promise.all([loadAccountStatistics(filters), loadAccountMatchHistory(filters)])
      .then(([nextStatistics, nextHistory]) => {
        if (!current) return;
        setStatistics(nextStatistics);
        setHistory(nextHistory.entries);
        setNextCursor(nextHistory.nextCursor);
      })
      .catch((reason: unknown) => {
        if (!current) return;
        setError(reason instanceof Error ? reason.message : "Die Matchstatistik konnte nicht geladen werden.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [accountId, filters]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const next = await loadAccountMatchHistory(filters, { cursor: nextCursor });
      setHistory((entries) => [...entries, ...next.entries]);
      setNextCursor(next.nextCursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Weitere Ergebnisse konnten nicht geladen werden.");
    } finally {
      setLoadingMore(false);
    }
  };

  const totals = statistics?.totals;
  const winRate = totals && totals.gamesPlayed > 0 ? Math.round((totals.wins / totals.gamesPlayed) * 100) : undefined;

  return (
    <section className="accountStatisticsPanel" aria-labelledby="account-statistics-heading">
      <div className="accountStatisticsHeader">
        <div>
          <p className="eyebrow">Privat · nur für dich</p>
          <h3 id="account-statistics-heading">Deine Matchstatistik</h3>
          <p className="muted">
            {statistics ? `Verlässlich erfasst seit ${formatDate(statistics.statisticsSince, locale)}.` : "Accountgebundene Ergebnisse werden sicher geladen."}
          </p>
        </div>
        {totals && totals.selfPlay > 0 ? <span className="accountStatisticsSelfPlay">{totals.selfPlay} Eigenpartie{totals.selfPlay === 1 ? "" : "n"} nicht gewertet</span> : null}
      </div>

      <div className="accountStatisticsFilters" aria-label="Statistik filtern">
        <label>Zeitraum<select value={period} onChange={(event) => setPeriod(event.target.value as ApiAccountStatisticsPeriod)}><option value="all">Gesamter Zeitraum</option><option value="30d">Letzte 30 Tage</option><option value="90d">Letzte 90 Tage</option></select></label>
        <label>Seite<select value={side} onChange={(event) => setSide(event.target.value as FilterValue<Side>)}><option value="all">Beide Seiten</option><option value="runner">Runner</option><option value="corp">Korp</option></select></label>
        <label>Gegner<select value={opponentKind} onChange={(event) => setOpponentKind(event.target.value as FilterValue<ApiPlayerIdentityKind>)}><option value="all">Alle Gegner</option><option value="account">Account</option><option value="guest">Gast</option><option value="ai">KI</option></select></label>
        <label>Modus<select value={matchMode} onChange={(event) => setMatchMode(event.target.value as FilterValue<ApiMatchMode>)}><option value="all">Alle Modi</option><option value="human_vs_human">Mensch gegen Mensch</option><option value="human_runner_vs_corp_ai">Runner gegen Korp-KI</option><option value="human_corp_vs_runner_ai">Korp gegen Runner-KI</option></select></label>
      </div>

      {error ? <p className="notice" role="alert">{error}</p> : null}
      {loading ? <p className="muted" aria-live="polite">Matchstatistik wird geladen …</p> : null}
      {!loading && totals ? (
        <>
          <div className="accountStatisticsKpis">
            <StatCard label="Spiele" value={totals.gamesPlayed} />
            <StatCard label="Siege" value={totals.wins} tone="positive" />
            <StatCard label="Niederlagen" value={totals.losses} tone="negative" />
            <StatCard label="Unentschieden" value={totals.draws} />
            <StatCard label="Siegquote" value={winRate === undefined ? "–" : `${winRate} %`} hint={`${totals.gamesPlayed} gewertete Spiele`} />
            <StatCard label="Abbrüche" value={totals.abandoned} />
          </div>

          <div className="accountStatisticsBreakdowns">
            <Breakdown title="Als Runner" bucket={statistics.bySide.runner} />
            <Breakdown title="Als Korp" bucket={statistics.bySide.corp} />
            <div className="accountStatisticsBreakdown">
              <h4>Serien</h4>
              <strong>{statistics.series.seriesPlayed}</strong>
              <span>{statistics.series.seriesWon} gewonnen · {statistics.series.seriesLost} verloren · {statistics.series.seriesDrawn} unentschieden</span>
              {(side !== "all" || matchMode !== "all") ? <small>Serien werden bei Seiten- oder Modusfilter nicht gewertet.</small> : null}
            </div>
          </div>

          <div className="accountStatisticsSection">
            <h4>Nach Gegnerart</h4>
            <div className="accountStatisticsBreakdowns">
              <Breakdown title="Gegen Account" bucket={statistics.byOpponentKind.account} />
              <Breakdown title="Gegen Gast" bucket={statistics.byOpponentKind.guest} />
              <Breakdown title="Gegen KI" bucket={statistics.byOpponentKind.ai} />
            </div>
          </div>

          <div className="accountStatisticsHistory">
            <div><h4>Deine Matchhistorie</h4><p className="muted">Nur redigierte Ergebnisdaten; keine gegnerischen Account-IDs oder Decklisten.</p></div>
            {history.length === 0 ? <p className="muted">Für diese Auswahl gibt es noch keine Ergebnisse.</p> : (
              <div className="accountStatisticsHistoryList">
                {history.map((entry) => <HistoryEntry key={entry.resultId} entry={entry} locale={locale} />)}
              </div>
            )}
            {nextCursor ? <button className="button" disabled={loadingMore} onClick={() => void loadMore()} type="button">{loadingMore ? "Weitere Ergebnisse werden geladen …" : "Weitere Ergebnisse"}</button> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: "positive" | "negative" }) {
  return <div className={`accountStatisticsKpi${tone ? ` ${tone}` : ""}`}><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</div>;
}

function Breakdown({ title, bucket }: { title: string; bucket: ApiAccountStatisticsBucket }) {
  return <div className="accountStatisticsBreakdown"><h4>{title}</h4><strong>{bucket.gamesPlayed}</strong><span>{bucket.wins} Siege · {bucket.losses} Niederlagen · {bucket.draws} Unentschieden</span><small>Agenda-Punkte {bucket.agendaPointsFor}:{bucket.agendaPointsAgainst}</small></div>;
}

function HistoryEntry({
  entry,
  locale,
}: {
  entry: ApiAccountMatchHistoryEntry;
  locale: AppLocale;
}) {
  const excluded = !entry.statisticsEligible;
  return (
    <article className={`accountStatisticsHistoryEntry${excluded ? " excluded" : ""}`}>
      <div><strong>{outcomeLabel(entry)}</strong><span>{formatDateTime(entry.completedAt, locale)}</span></div>
      <div><span>{entry.side === "runner" ? "Runner" : "Korp"} gegen {opponentLabel(entry.opponentKind)}</span><span>Agenda {entry.agendaPointsFor}:{entry.agendaPointsAgainst}</span></div>
      <div><span>{modeLabel(entry.matchMode)}</span>{entry.series ? <span>Serie · Spiel {entry.series.gameNumber}</span> : null}</div>
      {entry.finishKind === "forfeit" ? <small>Durch Aufgabe entschieden</small> : null}
      {entry.outcome === "abandoned" ? <small>Abgebrochen und nicht in der Siegquote gewertet</small> : null}
      {entry.exclusionReason === "self_play" ? <small>Eigenpartie · nicht in der Siegquote gewertet</small> : null}
    </article>
  );
}

function outcomeLabel(entry: ApiAccountMatchHistoryEntry): string {
  if (entry.outcome === "win") return "Sieg";
  if (entry.outcome === "loss") return "Niederlage";
  if (entry.outcome === "draw") return "Unentschieden";
  return "Abgebrochen";
}

function opponentLabel(kind: ApiPlayerIdentityKind): string {
  return kind === "account" ? "Account" : kind === "ai" ? "KI" : "Gast";
}

function modeLabel(mode: ApiMatchMode): string {
  if (mode === "human_vs_human") return "Mensch gegen Mensch";
  if (mode === "human_runner_vs_corp_ai") return "Runner gegen Korp-KI";
  if (mode === "human_corp_vs_runner_ai") return "Korp gegen Runner-KI";
  return "KI gegen KI";
}

function formatDate(value: string, locale: AppLocale): string {
  return formatAppDateTime(value, locale, { dateStyle: "medium" });
}

function formatDateTime(value: string, locale: AppLocale): string {
  return formatAppDateTime(value, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
