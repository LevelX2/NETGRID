# AI Opening, Trace und Forced-Decision Hardening – Prozess 2026-07-12

## Status

Direkte Umsetzung im Worktree
`C:\Projekte\NETGRID_AI_OPENING_TRACE_DIAGNOSTICS` auf Branch
`codex/ai-opening-trace-diagnostics`.

Aktiver Agent: `release-implementation-agent`.

## Quelle und Freigabe

Freigegeben sind aus der Analyse von Match `match_a199d04c94d5a906`:

1. strategieabhängige Corp-Mulligan-Bewertung;
2. payoff- und budgetbewusste Corp-Trace-Gebote;
3. korrekte Kennzeichnung alternativloser Zugenden und Choices;
4. realitätsnahe Regressionen mit echten Karten-, PlayerView-, Choice- und
   LegalAction-Verträgen sowie Gegenproben.

## Gesamtziel

Die Corp-KI bewertet ihre Starthand anhand ausführbarer deckstrategischer
Opening-Linien, führt begonnene Trace-/Punish-Linien mit dem kleinsten
sinnvollen Gebot aus und trennt in Diagnose und Trace-Mining echte
Entscheidungsgelegenheiten von erzwungenen Abschlussaktionen. Alle Änderungen
bleiben side-sicher, deterministisch und LegalAction-basiert.

## In Scope

- `packages/ai/src/deck-opening-hand.ts` und fokussierte Tests;
- Corp-Bid-Choice-Assessment und dessen Choice-Resolver-Anbindung;
- Forced-Decision-Klassifikation in Trace-Mining beziehungsweise
  Baseline-Evidence;
- historische, side-sichere Decision-Fixtures und negative Gegenproben;
- Evidence-, Final- und Wissensdokumentation.

## Nicht-Ziele

- keine Credit-vs-Draw-Ressourcenlogik;
- keine BBS-/finite-Economy-Änderung;
- keine Änderung an Planportfolio, RemoteDoctrine, StrategicIntent oder
  PlanActionContributions;
- keine Engine-Regel- oder LegalAction-Erweiterung;
- kein Push und kein Pull Request.

## Controller-Invarianten

- Die Opening-Bewertung nutzt nur eigene bekannte Karten, eigenes
  Deckstrategieprofil und eigene Deckfähigkeiten.
- Deckstrategie darf eine unvollständige Linie nicht als ausführbar ausgeben.
- Corp-Trace-Gebote verwenden nur öffentliche Trace-Werte, sichtbare
  Runner-Credits/Link, eigene Credits/Klicks und eigene bekannte Payoffs.
- Der Choice Resolver entscheidet nur über die Ausführung eines bereits
  begonnenen Trace-Fensters; er startet keinen neuen Plan.
- Erzwungene Entscheidungen behalten ihre Rohdiagnose, werden aber nicht als
  vermeidbare dominierte Planwahl gezählt.
- Gleicher Input führt deterministisch zu derselben Entscheidung.

## State Machine

`prepared -> opening -> trace -> forced-decision -> verification -> integrated`

Es ist immer nur ein Paket aktiv. Kein Paket wird ohne bestandenes Done-Gate
übersprungen.

## Paketfolge

### P0 – Prozess und Preflight

- Ziel: isolierten Arbeitsstrang und Scope-Grenzen festhalten.
- Checks: Worktree/Branch, sauberes `main`, Konfliktaudit zum parallelen
  Planportfolio-Strang, `git diff --check`.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(ai): define opening trace diagnostics process`

### P1 – Strategieabhängiges Corp-Mulligan

- Ziel: eine Opening-Line nur dann positiv werten, wenn Strategieanker,
  Enabler, Liquidität und notwendige frühe Stabilität zusammenpassen.
- Tests: historische Manhunt-Hand, ausführbare Tag-Punish-Hand,
  Fast-Advance-Gegenprobe und neutrale Fallback-Hand.
- Done-Gate: historische Hand wird nicht aufgrund bloßer Rollenpunkte
  behalten; legitime No-ICE-Linien bleiben möglich.
- Commit: `fix(ai): make corp mulligans strategy executable`

### P2 – Corp-Trace-Gebote

- Ziel: kleinstes garantiertes Gebot wählen, wenn ein sichtbarer,
  finanzierbarer Follow-up-Payoff den Trace rechtfertigt; sonst konservativ
  bleiben.
- Tests: historisches 5-gegen-11-Fenster, kein Payoff, unfinanzierbarer
  Follow-up, kleines Minimalgebot und unbekannter Kontext.
- Done-Gate: `bid_7` im historischen Payoff-Fenster; keine pauschalen
  Übergebote.
- Commit: `fix(ai): preserve trace punish followthrough`

### P3 – Forced-Decision-Diagnostik

- Ziel: `competitive`, `forced_terminal` und `forced_choice` unterscheiden.
- Tests: alternativloses Zugende, Zugende mit Alternative, Single-Choice und
  echte dominierte Planwahl.
- Done-Gate: Forced-Fälle werden nicht als `clearly_dominated_plan_choice`
  gemined; Rohscore bleibt auditierbar.
- Commit: `fix(ai): exclude forced decisions from dominated mining`

### P4 – Reale Regressionen und Abschluss

- Ziel: fokussierte Unit-, Runtime-/Decision- und Gegenproben gemeinsam grün
  führen; Evidence und Final Review schreiben.
- Checks: fokussierte Vitest-Dateien, angrenzende Regressionen,
  `corepack pnpm --filter @netgrid/ai typecheck`, geeignete AI-Gates und
  `git diff --check`.
- Done-Gate: Checks grün, Grenzen dokumentiert.
- Commit: `test(ai): gate opening trace and forced decisions`

### P5 – Integration und Cleanup

- Ziel: aktuelles `main` defensiv integrieren, final verifizieren, lokal nach
  `main` mergen und Worktree/Branch entfernen.
- Done-Gate: `main` grün und sauber; Worktree weder in Git noch im Dateisystem
  vorhanden; Arbeitsbranch gelöscht.

## Sicherheitsblocker

Sofort stoppen, wenn eine Maßnahme FullState, verdeckte Runner-Hand-/Stackdaten,
eine erfundene Action oder eine inkompatible Änderung am Planportfolio
benötigen würde.

## /Goal

`/Goal Arbeite AI Opening, Trace und Forced-Decision Hardening vollständig und
sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_OPENING_TRACE_DIAGNOSTICS auf Branch
codex/ai-opening-trace-diagnostics. Nutze den Hauptworkspace nur für den finalen
Merge. Committe jedes abgeschlossene Paket. Bewahre die parallele
Planportfolio-Intention und halte Credit-vs-Draw sowie finite Economy außerhalb
des Scopes. Entferne nach erfolgreichem Merge den sauberen Worktree, verifiziere
die Entfernung und lösche den gemergten Arbeitsbranch.`
