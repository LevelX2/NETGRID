"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "use-intl/react";
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
  const t = useTranslations("Account.statistics");
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
        setError(reason instanceof Error ? reason.message : t("loadError"));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [accountId, filters, t]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const next = await loadAccountMatchHistory(filters, { cursor: nextCursor });
      setHistory((entries) => [...entries, ...next.entries]);
      setNextCursor(next.nextCursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("loadMoreError"));
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
          <p className="eyebrow">{t("private")}</p>
          <h3 id="account-statistics-heading">{t("title")}</h3>
          <p className="muted">
            {statistics ? t("recordedSince", {date: formatDate(statistics.statisticsSince, locale)}) : t("secureLoading")}
          </p>
        </div>
        {totals && totals.selfPlay > 0 ? <span className="accountStatisticsSelfPlay">{t("selfPlayExcluded", {count: totals.selfPlay})}</span> : null}
      </div>

      <div className="accountStatisticsFilters" aria-label={t("filterAriaLabel")}>
        <label>{t("period")}<select value={period} onChange={(event) => setPeriod(event.target.value as ApiAccountStatisticsPeriod)}><option value="all">{t("allTime")}</option><option value="30d">{t("last30Days")}</option><option value="90d">{t("last90Days")}</option></select></label>
        <label>{t("side")}<select value={side} onChange={(event) => setSide(event.target.value as FilterValue<Side>)}><option value="all">{t("bothSides")}</option><option value="runner">Runner</option><option value="corp">{t("corp")}</option></select></label>
        <label>{t("opponent")}<select value={opponentKind} onChange={(event) => setOpponentKind(event.target.value as FilterValue<ApiPlayerIdentityKind>)}><option value="all">{t("allOpponents")}</option><option value="account">Account</option><option value="guest">{t("guest")}</option><option value="ai">{t("ai")}</option></select></label>
        <label>{t("mode")}<select value={matchMode} onChange={(event) => setMatchMode(event.target.value as FilterValue<ApiMatchMode>)}><option value="all">{t("allModes")}</option><option value="human_vs_human">{t("humanVsHuman")}</option><option value="human_runner_vs_corp_ai">{t("runnerVsCorpAi")}</option><option value="human_corp_vs_runner_ai">{t("corpVsRunnerAi")}</option></select></label>
      </div>

      {error ? <p className="notice" role="alert">{error}</p> : null}
      {loading ? <p className="muted" aria-live="polite">{t("loading")}</p> : null}
      {!loading && totals ? (
        <>
          <div className="accountStatisticsKpis">
            <StatCard label={t("games")} value={totals.gamesPlayed} />
            <StatCard label={t("wins")} value={totals.wins} tone="positive" />
            <StatCard label={t("losses")} value={totals.losses} tone="negative" />
            <StatCard label={t("draws")} value={totals.draws} />
            <StatCard label={t("winRate")} value={winRate === undefined ? "–" : `${winRate} %`} hint={t("ratedGames", {count: totals.gamesPlayed})} />
            <StatCard label={t("abandoned")} value={totals.abandoned} />
          </div>

          <div className="accountStatisticsBreakdowns">
            <Breakdown title={t("asRunner")} bucket={statistics.bySide.runner} />
            <Breakdown title={t("asCorp")} bucket={statistics.bySide.corp} />
            <div className="accountStatisticsBreakdown">
              <h4>{t("series")}</h4>
              <strong>{statistics.series.seriesPlayed}</strong>
              <span>{t("seriesRecord", {won: statistics.series.seriesWon, lost: statistics.series.seriesLost, drawn: statistics.series.seriesDrawn})}</span>
              {(side !== "all" || matchMode !== "all") ? <small>{t("seriesFilterHelp")}</small> : null}
            </div>
          </div>

          <div className="accountStatisticsSection">
            <h4>{t("byOpponent")}</h4>
            <div className="accountStatisticsBreakdowns">
              <Breakdown title={t("againstAccount")} bucket={statistics.byOpponentKind.account} />
              <Breakdown title={t("againstGuest")} bucket={statistics.byOpponentKind.guest} />
              <Breakdown title={t("againstAi")} bucket={statistics.byOpponentKind.ai} />
            </div>
          </div>

          <div className="accountStatisticsHistory">
            <div><h4>{t("history")}</h4><p className="muted">{t("historyPrivacy")}</p></div>
            {history.length === 0 ? <p className="muted">{t("noResults")}</p> : (
              <div className="accountStatisticsHistoryList">
                {history.map((entry) => <HistoryEntry key={entry.resultId} entry={entry} locale={locale} />)}
              </div>
            )}
            {nextCursor ? <button className="button" disabled={loadingMore} onClick={() => void loadMore()} type="button">{loadingMore ? t("loadingMore") : t("moreResults")}</button> : null}
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
  const t = useTranslations("Account.statistics");
  return <div className="accountStatisticsBreakdown"><h4>{title}</h4><strong>{bucket.gamesPlayed}</strong><span>{t("record", {wins: bucket.wins, losses: bucket.losses, draws: bucket.draws})}</span><small>{t("agendaPoints", {for: bucket.agendaPointsFor, against: bucket.agendaPointsAgainst})}</small></div>;
}

function HistoryEntry({
  entry,
  locale,
}: {
  entry: ApiAccountMatchHistoryEntry;
  locale: AppLocale;
}) {
  const t = useTranslations("Account.statistics");
  const excluded = !entry.statisticsEligible;
  return (
    <article className={`accountStatisticsHistoryEntry${excluded ? " excluded" : ""}`}>
      <div><strong>{t(`outcome.${entry.outcome}`)}</strong><span>{formatDateTime(entry.completedAt, locale)}</span></div>
      <div><span>{t("versus", {side: entry.side === "runner" ? "Runner" : t("corp"), opponent: t(`opponentKind.${entry.opponentKind}`)})}</span><span>{t("agenda", {for: entry.agendaPointsFor, against: entry.agendaPointsAgainst})}</span></div>
      <div><span>{t(`matchMode.${entry.matchMode}`)}</span>{entry.series ? <span>{t("seriesGame", {number: entry.series.gameNumber})}</span> : null}</div>
      {entry.finishKind === "forfeit" ? <small>{t("decidedByForfeit")}</small> : null}
      {entry.outcome === "abandoned" ? <small>{t("abandonedHelp")}</small> : null}
      {entry.exclusionReason === "self_play" ? <small>{t("selfPlayHelp")}</small> : null}
    </article>
  );
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
