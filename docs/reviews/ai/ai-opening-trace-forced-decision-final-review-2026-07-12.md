# AI Opening, Trace und Forced-Decision Final Review 2026-07-12

## Status

`complete`

## Ergebnis

Die drei freigegebenen, von der parallelen Planebene unabhängigen Fehlerklassen
sind geschlossen:

1. Corp-Mulligans bewerten nicht mehr nur vorhandene Rollen, sondern
   deckstrategisch ausführbare Opening-Linien.
2. Corp-Trace-Gebote reservieren bei sichtbarem Tag-Punish-Payoff Budget und
   wählen das kleinste garantiert erfolgreiche Gebot; ohne tragfähigen
   Follow-up bleiben sie konservativ.
3. Forced-Terminal- und Forced-Choice-Fälle bleiben diagnostisch sichtbar,
   werden aber nicht mehr als vermeidbare dominierte Planwahl gemined.

Die Umsetzung ergänzt keine neue langfristige oder iterative Planlogik. Sie
liefert lokale Opening-, laufende Choice- und Diagnoseverträge, die eine
Planebene später konsumieren kann, ohne deren Zielauswahl vorwegzunehmen.

## Geänderte Bereiche

- `packages/ai/src/deck-opening-hand.ts`
- `packages/ai/src/runtime/corp-trace-bid-assessment.ts`
- `packages/ai/src/runtime/bid-choice-option.ts`
- `packages/ai/src/runtime/decision-opportunity.ts`
- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/simulation/ai-simulation-action-sequence-entry.ts`
- `packages/ai/src/simulation/ai-game-simulator.ts`
- `packages/ai/src/simulation/selfplay-trace-mining.ts`
- zugehörige Unit-, Runtime-, Mining- und Real-Engine-Vertragstests

## Verifikation vor Integration

- Paketübergreifender Fokuslauf: 8 Testdateien, 158 Tests bestanden.
- Öffentliche Real-Engine-/Runtime-Verträge: 2 Testdateien, 80 Tests bestanden.
- Vollständige `@netgrid/ai`-Suite: 298 Testdateien, 1.970 Tests bestanden.
- `@netgrid/ai`-Typecheck bestanden.
- `check:ai` bestanden; bestehende Warninventare bleiben unverändert sichtbar.
- `git diff --check` bestanden.

## Architektur- und Sicherheitsprüfung

- Engine und `applyAction` bleiben Regelautorität.
- Entscheidungen referenzieren ausschließlich vorhandene `LegalActions`.
- Mulligan-Auswertung verwendet nur eigene bekannte Hand-, Deckstrategie- und
  Deckfähigkeitsdaten.
- Trace-Auswertung verwendet nur öffentlichen Trace-Kontext, sichtbare
  Runner-Ressourcen und eigene bekannte Karten.
- Replay, StateHash, Zufall, Kartenpool und UI sind unverändert.
- Die Rohdiagnose erzwungener Entscheidungen bleibt vollständig erhalten.

## Bewusste Nicht-Ziele

Credit-vs-Draw, dreifache BBS-Nutzung, finite Economy sowie langfristige und
iterative Planportfolio-Ziele wurden nicht verändert. Diese Punkte können auf
dem parallelen Planportfolio-Strang weiterentwickelt werden, ohne dass dieses
Paket ihnen eine Ressourcen- oder Zielhierarchie aufzwingt.

## Lokale Integration

- Branch `codex/ai-opening-trace-diagnostics` wurde per Fast-Forward bis
  `7be350dab` nach lokalem `main` übernommen.
- Auf `main` bestanden anschließend erneut 8 Fokusdateien mit 158 Tests,
  `@netgrid/ai`-Typecheck und Diff-Hygiene.
- Der saubere Arbeits-Worktree wurde nach einem Windows-Long-Path-Fallback aus
  Git und Dateisystem entfernt; der vollständig gemergte Arbeitsbranch wurde
  gelöscht.
- Der parallele Worktree `NETGRID_AI_PLANPORTFOLIO_REMOTE_DOCTRINE` wurde weder
  verändert noch integriert.
- Es erfolgte kein Push und keine Remote-Integration.
