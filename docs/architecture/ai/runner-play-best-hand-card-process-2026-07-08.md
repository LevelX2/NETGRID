# Runner Play-Best-Hand-Card Prozess 2026-07-08

## Status

In Arbeit im Worktree `C:\Projekte\NETGRID_RUNNER_PLAY_BEST_HAND_CARD` auf Branch `codex/runner-play-best-hand-card`.

## Quelle/Vorgabe

Der Runner soll Karten auf der Hand nicht nur als Nebenprodukt einzelner Sonderlogiken nutzen. Handkarten sind Spielkapital: Eine legale, nicht nutzlose und aktuell hilfreiche Karte soll als eigener Plan gegen schwache Runs, blindes Ziehen oder Basiskredite konkurrieren können. Spezifische Pläne wie Breaker-Coverage, Survival, Tags, aktive Run-Fenster und dringende Remote-/Central-Pläne bleiben vorrangig.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung ausreichend präzise. Scope, Architekturpfad, Nicht-Ziele, Tests und Integrationsregeln sind ableitbar. Kleine Kalibrierungsentscheidungen werden konservativ im Paket dokumentiert.

## Gesamtziel

Die Runner-Planebene erhält eine normale TacticalPlan-Ausprägung `runner.play_best_hand_card`. Sie wählt aus bekannten eigenen Handkarten die beste aktuell legal spielbare Karte, schließt nutzlose oder riskante Karten aus, nutzt denselben LegalAction-Mapping-Pfad wie vorhandene Handkartenentwicklung und ist in Debug-/Trace-Anzeigen sichtbar.

## Annahmen

- `runner.obtain_breaker_coverage` bleibt der primäre Plan für akut blockierte Run-Ziele.
- `runner.develop_hand_card` bleibt für spezifische, bereits erkannte Entwicklungsfälle erhalten.
- `runner.play_best_hand_card` ist ein Plan-Fallback innerhalb der Planebene, kein zusätzlicher globaler Score-Hack.
- Hidden-Info-Grenzen werden nicht verändert; die Logik nutzt nur `RunnerHandDevelopmentEvaluation` und LegalActions.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung oder Kartenkosten.
- Keine neue Kartenerkennung jenseits der bestehenden Runner-Hand-Development-Evaluierung.
- Keine grundlegende Neukalibrierung aller Run-/Remote-/Economy-Prioritäten.
- Kein Serverstart und keine Multiplayer-Prozessänderung.

## Controller-Invarianten

- Plan zuerst, Score danach: Die neue Handkartenentscheidung ist eine TacticalPlan-Instanz.
- Nur LegalActions: Der Plan wird nur erstellt, wenn eine konkrete legale Aktion vorhanden ist.
- Nutzlose Karten bleiben ausgeschlossen: unbekannt, redundant, niedrigwertig, `none` und riskante persistente Duplikate werden nicht geplant.
- Spezifische Notfall- und Coverage-Pläne dürfen durch die Best-Hand-Card-Logik nicht verdrängt werden.

## Automatische Fehlerbehandlung

- Wenn Tests zeigen, dass der neue Plan spezifische Coverage- oder Survival-Pläne überholt, wird die Planpriorität gesenkt oder der Ausschluss verschärft.
- Wenn Mapping nicht eindeutig auf die Zielkarte zeigt, wird der Plan nicht durch Scores geschützt.
- Wenn Debugdaten unvollständig sind, werden Labels/Evidence ergänzt, nicht die Runtime verschoben.

## Sicherheitsblocker

- Jede Hidden-Info-Erweiterung außerhalb der bestehenden redigierten Runner-Hand-Development-Fakten.
- Auswahl einer nicht legalen Aktion.
- Verdrängung von Tag-Clear, Success-Window, Survival oder akutem Breaker-Coverage-Plan.

## State Machine

1. `prepared`: Prozessartefakt existiert und Worktree ist angelegt.
2. `implemented`: Plan-Typ, Auswahl, Priorität und Mapping sind umgesetzt.
3. `verified`: fokussierte AI-Tests und Typchecks bestehen oder Abweichungen sind dokumentiert.
4. `integrated`: Arbeitsbranch ist lokal nach `main` gemerged.

## Paketfolge

### RPBC-0 - Prozessartefakt und Scope

Ziel: Prozess und Gates festhalten.

Kernartefakte: dieses Dokument.

Checks: `git diff --check`.

Done-Gate: Dokument ist versioniert und beschreibt Scope, Nicht-Ziele, Pakete und Verifikationsregeln.

Commit: `docs(ai): plan runner best hand card process`

### RPBC-1 - Plan-Typ und Auswahl

Ziel: `runner.play_best_hand_card` als TacticalPlan-Typ mit Kandidatenauswahl, Evidence und Priorität implementieren.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/plans/tactical-plan-runner-hand-development.ts`
- `packages/ai/src/plans/tactical-plan-runner-plans.ts`

Checks: fokussierte `vitest`-Tests für TacticalPlans, `git diff --check`.

Done-Gate: Beste spielbare Handkarte erzeugt maximal eine eigene Planinstanz; unbrauchbare Handkarten erzeugen keinen Plan; spezifische Coverage-Pläne bleiben höher priorisiert.

Commit: `fix(ai): add runner best hand card plan`

### RPBC-2 - Mapping-, Dominanz- und Debug-Integration

Ziel: Der neue Plan wird im Runtime-Controller wie andere planführende Runner-Pläne geschützt und in Debug-/Maintenance-Anzeigen verständlich dargestellt.

Kernartefakte:

- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/diagnostics/semantic-runtime-debug.ts`
- `apps/web/app/maintenance.ts`
- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`

Checks: fokussierte Runtime-/Debug-Tests, `git diff --check`.

Done-Gate: Labels und Evidence unterscheiden `play_best_hand_card` von spezifischer Handentwicklung; planfremde Basisscores dürfen die Mapping-Entscheidung nicht ohne harten Interrupt überschreiben.

Commit: `fix(ai): surface runner best hand card debug plan`

### RPBC-3 - Regressionstests und Dokumentation

Ziel: Regressionsschutz für die Handkartenentscheidung und Logeintrag für wiederverwendbares KI-Verhalten.

Kernartefakte:

- relevante AI-Tests
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`

Checks: fokussierter Testlauf, AI-Typecheck, Web-Typecheck soweit vom Scope betroffen, `git diff --check`.

Done-Gate: Tests belegen Auswahl, Ausschluss und Vorranggrenzen.

Commit: `test(ai): cover runner best hand card planning`

### RPBC-4 - Finale Integration

Ziel: Arbeitsbranch final prüfen und lokal nach `main` mergen.

Checks:

- `git status --short`
- fokussierte Verify-Befehle aus RPBC-3
- `git diff --check`
- finaler `main`-Status nach Merge

Done-Gate: Arbeitsbranch ist sauber, lokal nach `main` gemerged, Worktree entfernt, Goal abgeschlossen.

Commit: Merge nach `main`, bevorzugt Fast-Forward.

## Verifikationsregeln

Fokussierte Befehle werden in jedem Paket enger gewählt. Der finale Mindestlauf ist:

```powershell
corepack pnpm exec vitest run packages/ai/src/tactical-plans.test.ts packages/ai/src/runtime/semantic-choice-ranking.test.ts packages/ai/src/diagnostics/semantic-runtime-debug.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/web typecheck
git diff --check
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_RUNNER_PLAY_BEST_HAND_CARD`.
- Branch: `codex/runner-play-best-hand-card`.
- Ein Commit pro Paket.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite RPBC-0 bis RPBC-4 sequenziell ab. Genau ein Paket ist aktiv. Committe jedes abgeschlossene Paket. Bei Konflikten beide Intentionen erhalten. Stoppe nur bei Sicherheitsblocker oder rotem Done-Gate, das nicht eng behebbar ist.

## Abschlusskriterien

- `runner.play_best_hand_card` ist als TacticalPlan-Typ vorhanden.
- Die beste geeignete Handkarte wird als Planinstanz erzeugt, wenn keine spezifischere Logik sie bereits ausreichend abdeckt.
- Unbekannte, nutzlose, redundante oder nicht akute defensive Karten werden nicht als Best-Hand-Card geplant.
- Debug- und Maintenance-Anzeigen zeigen den Plan verständlich.
- Fokussierte Tests und Typechecks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
