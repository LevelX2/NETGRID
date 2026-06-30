# AI Corp Purge/R&D Triage Process 2026-06-30

Status: completed_on_branch

Quelle: Analyse des abgeschlossenen Matches `match_531f83839a16d260` aus `data/runtime/multiplayer/netgrid.sqlite`.

## Gesamtziel

Die Corp-KI soll kritische Boardlagen kohärenter behandeln: Purge darf keine kritischen Schutz-, Funding- oder Scoreline-Aktionen verdrängen; wiederholter offener R&D-Zugriff muss eskalieren; dynamische oder positionsabhängige ICE dürfen nur als belastbarer Schutz zählen, wenn ihr Effekt real verfügbar ist.

## Nicht-Ziele

- Keine Engine-Legalitätsänderung.
- Keine Hidden-Info-Nutzung.
- Keine kartennamenspezifische Spezialregel.
- Keine große Semantikdaten- oder Proteus-Generalrevision.

## Paketfolge

1. Preflight und Prozessartefakt.
2. Runtime-Analyse und fokussierte Regressionen für Purge, R&D-Druck und dynamische ICE.
3. Generische Corp-Runtime-Anpassungen.
4. Finaler Review, Wissenspflege, Checks, lokale Integration nach `main`.

## Controller-Invarianten

- Die KI bewertet ausschließlich bestehende `LegalActions`.
- Debug-Evidence bleibt side-safe und darf keine verdeckten Runner-Informationen offenlegen.
- Maßnahmen müssen an vorhandene Corp-Triage-, Scoring-Window-, Remote-Score- und Effective-Defense-Logik andocken.

## Verifikation

Mindestens:

- fokussierte Vitest-Regressionen für die geänderten AI-Module,
- `corepack pnpm --filter @netgrid/ai typecheck`,
- `git diff --check`.

Zusätzlich, wenn zeitlich realistisch:

- `corepack pnpm --filter @netgrid/ai test`.

## Worktree

Arbeitsbranch: `codex/ai-corp-purge-rd-triage`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_CORP_PURGE_RD_TRIAGE`

Integration: nach erfolgreichem Abschluss lokal nach `main`, kein Push.
