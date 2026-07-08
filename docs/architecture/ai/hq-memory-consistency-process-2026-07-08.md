# HQ-Memory-Konsistenz Prozess 2026-07-08

Status: in Arbeit

Quelle/Vorgabe: Analyse des beendeten Matches `match_427831dbf32a303c` nach Playtest-Beobachtung zu falschem HQ-Inhalt, wiederholten HQ-Runs und bereits behobenem Post-ICE-Access-Verhalten.

## Gesamtziel

Die Runner-KI soll HQ-Kartenwissen nach eigenen Access-/Trash-Ereignissen konsistent und konservativ pflegen. Trashed HQ-Karten dürfen nicht im HQ-Gedächtnis bleiben. Ein behauptetes `allCardsKnown` darf bei widersprechendem späterem Access nicht still weiterlaufen, sondern muss invalidiert und als Diagnose sichtbar werden. Run-Payoff und Wiederholungsruns müssen dieses korrigierte Memory nutzen.

## Annahmen

- Das Match ist ein Mischstand, weil während des langen Spiels bereits andere Runner-Plan-Fixes umgesetzt wurden.
- Der alte Post-ICE-Jack-out-Fall ist nicht Teil dieses Prozesses, weil er bereits separat behoben wurde.
- Der frühe Credit-vor-R&D-Fall aus `sv7` wird nicht als neuer Fehler umgesetzt, da Credit inzwischen nur noch Support-/Sub-Aktion sein soll; er bleibt nur Regressionserwartung.
- Es werden keine verdeckten Informationen genutzt. Alle Anpassungen beruhen auf PublicEvents, PlayerViews und side-safe KI-Memory.

## Nicht-Ziele

- Keine Änderung an LegalActions oder Rules-Engine-Regeln, solange die Analyse keinen Engine-Blocker zeigt.
- Keine neue globale Plan-Kalibrierung für Credit, Draw oder R&D.
- Keine Datenbankreparatur historischer Matches.

## Controller-Invarianten

- Rules Engine bleibt die einzige Regelautorität.
- KI wählt nur LegalActions.
- Keine Hidden-Info-Leaks in Debug, Trace, PlayerView oder Replay.
- Belief-Memory darf bei Unsicherheit nur konservativer werden, nicht sicherer.

## Paketfolge

### Paket 1: Prozess und Evidence

Ziel: Match-Evidence und Umsetzungsscope dokumentieren.

Arbeit:

- Prozessartefakt anlegen.
- Evidence-Report mit Fehlergruppen, StateVersions und Akzeptanzkriterien anlegen.

Checks:

- `git diff --check`

Commit: `Document HQ memory consistency process`

### Paket 2: HQ-Memory-Korrektur und Diagnose

Ziel: HQ-Trash per `serverLabel` erkennen und Widersprüche zu `allCardsKnown` sichtbar invalidieren.

Arbeit:

- Server-Kanonisierung für side-safe Serverlabels bei HQ-Memory-relevanten Events verwenden.
- Trashed/removed HQ-Karten aus `safeKnownCards` entfernen.
- Bei Access-Widerspruch gegen ein vollständiges HQ-Ledger eine Diagnose wie `belief_warning:hq_all_known_contradiction` erzeugen und HQ-Memory konservativ als teilweise unbekannt markieren.
- Fokussierte Tests in `packages/ai`.

Checks:

- fokussierte Vitest-Dateien für Belief-State
- `git diff --check`

Commit: `Fix HQ memory trash and contradiction handling`

### Paket 3: Payoff-Regressionen und Abschluss

Ziel: HQ-Payoff und Repeat-Run-Entscheidung dürfen nicht mehr auf stale trashbaren HQ-Karten beruhen.

Arbeit:

- Regression für bekannten HQ-Inhalt ohne aktuellen Payoff absichern.
- Prüfen, dass Multiaccess/Access-Bonus einen bestätigten No-Payoff-Fall nicht wieder hochstuft.
- Final-Report und Wissenslog aktualisieren.

Checks:

- fokussierte AI-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `Guard HQ payoff against stale memory`

## Worktree- und Git-Regeln

Worktree: `C:\Projekte\NETGRID_AI_HQ_MEMORY_CONSISTENCY`

Branch: `codex/hq-memory-consistency`

Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge nach `main` verwendet. Jeder Paketabschluss bekommt einen eigenen Commit. Push oder PR erfolgen nicht.

## Abschlusskriterien

- Alle drei Pakete sind committed.
- Fokussierte Tests und AI-Typecheck laufen grün.
- Arbeitsbranch ist lokal nach `main` gemerged.
- Worktree ist nach erfolgreichem Merge entfernt.
