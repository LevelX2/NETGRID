# AI-Random-60-Source-Qualitätsprüfung – zweite Serie

Status: in Arbeit

## Quelle/Vorgabe

Nutzerauftrag vom 21.08.2026: 60 weitere zufällige produktive KI-Source-Dateien prüfen, die in den drei vorherigen Zufallsserien noch nicht geprüft wurden; belastbare Anpassungen direkt im isolierten Worktree umsetzen.

## Zielprüfung

Der Auftrag ist für die direkte automatische Abarbeitung ausreichend präzise. Die 120 historischen Reviewpfade werden ausgeschlossen, einschließlich inzwischen entfernter Dateien. Die neue Stichprobe wurde einmalig kryptografisch ohne Zurücklegen gezogen und wird nicht verändert.

## Gesamtziel

Sechzig weitere produktive KI-Dateien sequenziell auf Korrektheit, Plan-first-Ownership, Hidden-Info-Sicherheit, Geradlinigkeit, Struktur, Größe, Testbarkeit und Optimierungspotenzial prüfen; nur ursachenorientierte belastbare Verbesserungen implementieren; jedes Einzelpaket ausschließlich mit direkt änderungsnahen Tests und Checks verifizieren und committen; den fertigen Branch lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

## Annahmen und Katalog

- Katalogbasis sind 646 produktive Nicht-Test-Dateien unter `packages/ai/src` plus 6 produktive Laufzeitintegrationen außerhalb des Pakets, die `@netgrid/ai` tatsächlich importieren.
- Ausgeschlossen sind `*.test.*`, `*.spec.*`, `*.test-support.*`, Verzeichnisse `test-support` und `__tests__`, Config-/Buildskripte ohne produktive Laufzeitintegration sowie sämtliche 120 historischen Reviewpfade.
- 116 historische Pfade sind im aktuellen Katalog noch vorhanden; der bereinigte Auswahlraum umfasst 536 Dateien.
- Die alphabetische Katalognummer ist stabil für den Startstand `5b5a4c80568641ec4b64a666d388b8063ff49696`.
- Reine Stilpräferenzen rechtfertigen keine Änderung. Refactorings müssen Verantwortung, Lesbarkeit, Testbarkeit oder Architekturgrenzen messbar verbessern.

## Nicht-Ziele

- Keine allgemeine KI-Spielstärke-Initiative und keine neuen Kartenmechaniken.
- Keine zweite Entscheidungsautorität, kein Fallback und keine Legacy-Kompatibilität.
- Keine vollständigen AI-Shards, Workspace-, Paket-, Build- oder E2E-Gesamtläufe; nur direkt änderungsnahe Tests und Checks.
- Keine Server- oder Browserstarts aus dem Worktree.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität; KI reicht ausschließlich aktuelle `LegalActions` ein.
- Produktive KI bleibt Plan-first; genau ein fachlicher Owner je Entscheidung.
- Choice-Auflösung vervollständigt nur die Payload der exakt gebundenen Action.
- Nur side-sichere `PlayerView`, `PublicEvents`, `LegalActions` und freigegebene Metadaten dürfen einfließen.
- Determinismus, Replay, StateHash und Engine-RNG-Vertrag bleiben erhalten.
- Fehlerbehebung erfolgt an der erzeugenden Schicht und bleibt fail-closed.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Zuerst wird der engste reproduzierende Test beziehungsweise die engste statische Referenzprüfung verwendet. Rote Tests werden ursachenbezogen analysiert; unabhängige Baselinefehler bleiben außerhalb des Pakets. Gestoppt wird nur bei nicht auflösbarem Ownership-Konflikt, möglichem Hidden-Info-Leak ohne side-sicheren Fix, unklarer Engine-/AI-Autorität, fremden relevanten Änderungen im Zielpfad oder nicht sicher isolierbarem Testbetrieb. Ein Blockerbericht nennt Ursache und Removal Condition.

## State Machine

`vorbereitet -> AI-R121 -> ... -> AI-R180 -> Konsolidierung -> gezielte Final-Checks -> Main-Merge -> Cleanup -> abgeschlossen`

Genau ein Paket ist aktiv. `geprüft` bedeutet Analyse abgeschlossen; `angepasst` bedeutet Code/Test geändert; `committed` ist das Paket-Done-Gate.

## Paketfolge

| Paket | Katalog | Datei | Status |
| --- | ---: | --- | --- |
| AI-R121 | 141 | `packages/ai/src/plans/corp-defense-turn-planning.ts` | offen |
| AI-R122 | 577 | `packages/ai/src/simulation/regression/exploit-regression-fixtures.ts` | offen |
| AI-R123 | 321 | `packages/ai/src/runtime/progression-card-target.ts` | offen |
| AI-R124 | 181 | `packages/ai/src/plans/tactical-plan-visible-cards.ts` | offen |
| AI-R125 | 326 | `packages/ai/src/runtime/remote-trash-target.ts` | offen |
| AI-R126 | 396 | `packages/ai/src/runtime/runner-rig-trash-target.ts` | offen |
| AI-R127 | 442 | `packages/ai/src/runtime/semantic-runtime-corp-passive-scoreline.ts` | offen |
| AI-R128 | 617 | `packages/ai/src/simulation/selfplay-action-type-dominance.ts` | offen |
| AI-R129 | 485 | `packages/ai/src/runtime/trace-context.ts` | offen |
| AI-R130 | 243 | `packages/ai/src/runtime/corp-central-defense-facts-adapter.ts` | offen |
| AI-R131 | 357 | `packages/ai/src/runtime/runner-hand-rotation-assessment.ts` | offen |
| AI-R132 | 261 | `packages/ai/src/runtime/corp-opening-rush.ts` | offen |
| AI-R133 | 580 | `packages/ai/src/simulation/regression/v143/fixture-types.ts` | offen |
| AI-R134 | 273 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-action-families.ts` | offen |
| AI-R135 | 60 | `packages/ai/src/decision/neutral-goal-synthesis.ts` | offen |
| AI-R136 | 266 | `packages/ai/src/runtime/corp-score-rush-risk.ts` | offen |
| AI-R137 | 124 | `packages/ai/src/generated-ai-hint-artifact-validation.ts` | offen |
| AI-R138 | 573 | `packages/ai/src/simulation/progression-action-sequence.ts` | offen |
| AI-R139 | 350 | `packages/ai/src/runtime/runner-encounter-composition-context.ts` | offen |
| AI-R140 | 32 | `packages/ai/src/actions/conditional-defense-followup-quote.ts` | offen |
| AI-R141 | 470 | `packages/ai/src/runtime/setup-mulligan-choice-option.ts` | offen |
| AI-R142 | 287 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure.ts` | offen |
| AI-R143 | 285 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-contracts.ts` | offen |
| AI-R144 | 386 | `packages/ai/src/runtime/runner-no-run-economy-context.ts` | offen |
| AI-R145 | 333 | `packages/ai/src/runtime/runner-baseline-plan-guard-context.ts` | offen |
| AI-R146 | 589 | `packages/ai/src/simulation/runner-breaker-coverage-diagnostics.ts` | offen |
| AI-R147 | 455 | `packages/ai/src/runtime/semantic-runtime-corp-score.ts` | offen |
| AI-R148 | 87 | `packages/ai/src/diagnostics/debug-format.ts` | offen |
| AI-R149 | 286 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection.ts` | offen |
| AI-R150 | 102 | `packages/ai/src/evaluation/decision-snapshot-suite.ts` | offen |
| AI-R151 | 627 | `packages/ai/src/simulation/simulation-league.ts` | offen |
| AI-R152 | 592 | `packages/ai/src/simulation/runner-credit-reserve.ts` | offen |
| AI-R153 | 434 | `packages/ai/src/runtime/semantic-runtime-corp-board.ts` | offen |
| AI-R154 | 112 | `packages/ai/src/evaluation/real-engine-decision-corpus.ts` | offen |
| AI-R155 | 591 | `packages/ai/src/simulation/runner-central-pressure-diagnostics.ts` | offen |
| AI-R156 | 550 | `packages/ai/src/simulation/deck-support.ts` | offen |
| AI-R157 | 66 | `packages/ai/src/decision/pilot/pilot-scope-common.ts` | offen |
| AI-R158 | 224 | `packages/ai/src/runtime/ai-decision-input.ts` | offen |
| AI-R159 | 123 | `packages/ai/src/evaluation/target-choice-shadow-readiness.ts` | offen |
| AI-R160 | 532 | `packages/ai/src/simulation/central-run-history.ts` | offen |
| AI-R161 | 244 | `packages/ai/src/runtime/corp-defense-package-retention.ts` | offen |
| AI-R162 | 523 | `packages/ai/src/simulation/benchmark-deck-types.ts` | offen |
| AI-R163 | 176 | `packages/ai/src/plans/tactical-plan-corp-score-conversion.ts` | offen |
| AI-R164 | 602 | `packages/ai/src/simulation/runner-known-path-diagnostics-composition.ts` | offen |
| AI-R165 | 234 | `packages/ai/src/runtime/card-title.ts` | offen |
| AI-R166 | 428 | `packages/ai/src/runtime/semantic-runtime-choice-builder.ts` | offen |
| AI-R167 | 269 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-board-triage-alignment.ts` | offen |
| AI-R168 | 360 | `packages/ai/src/runtime/runner-hq-saturation-score.ts` | offen |
| AI-R169 | 311 | `packages/ai/src/runtime/economy-score-components.ts` | offen |
| AI-R170 | 547 | `packages/ai/src/simulation/corp-visible-tag-punish-opportunities.ts` | offen |
| AI-R171 | 621 | `packages/ai/src/simulation/selfplay-why-coverage.ts` | offen |
| AI-R172 | 524 | `packages/ai/src/simulation/benchmark-local-deck-data.ts` | offen |
| AI-R173 | 158 | `packages/ai/src/plans/plan-portfolio-memory.ts` | offen |
| AI-R174 | 513 | `packages/ai/src/simulation/benchmark-deck-format-profile.ts` | offen |
| AI-R175 | 180 | `packages/ai/src/plans/tactical-plan-types.ts` | offen |
| AI-R176 | 489 | `packages/ai/src/runtime/visible-card-lookup.ts` | offen |
| AI-R177 | 37 | `packages/ai/src/actions/risk-action-projection.ts` | offen |
| AI-R178 | 579 | `packages/ai/src/simulation/regression/v143/fixture-data.ts` | offen |
| AI-R179 | 362 | `packages/ai/src/runtime/runner-known-access-payoff-context.ts` | offen |
| AI-R180 | 637 | `packages/ai/src/simulation/tag-punish-card-sets.ts` | offen |

## Paketdetails und Verifikationsregeln

Für jedes Paket: Datei vollständig lesen; Import-, Aufrufer-, Testgraph und relevante Historie prüfen; Architektur-Owner bestimmen; konkrete Findings nach Schweregrad dokumentieren; bei belastbarem Befund minimal anpassen und Regressionstest ergänzen oder präzisieren; ausschließlich direkt betroffene Tests und Checks sowie `git diff --check` ausführen; nur Paketänderungen committen; Status und Ergebnis in diesem Artefakt aktualisieren.

Done-Gate je Paket: Reviewbefund mit Fundstellen, begründete Änderungsentscheidung, passende fokussierte Prüfung, sauberer Diff und eigener Commit. Typ-/Strukturgates nur bei direkt berührter Oberfläche; keine vorsorglichen Gesamtläufe.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_RANDOM_60_SOURCE_REVIEW_2`
- Branch: `codex/ai-random-60-source-review-2`
- Basis: lokaler `main` bei `5b5a4c80568641ec4b64a666d388b8063ff49696`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket einzeln committen; keine fremden Änderungen anfassen.
- Vor Final-Merge aktuelles `main` in den Arbeitsbranch integrieren und nur bei tatsächlicher Überlappung passende Checks erneut ausführen.
- Nach erfolgreichem Merge Worktree ohne Force entfernen, Entfernung doppelt prüfen und gemergten Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite die zweite AI-Random-60-Source-Qualitätsprüfung vollständig und sequenziell von AI-R121 bis AI-R180 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden AI-Architekturverträge und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Prüfe, verifiziere und committe jedes Paket. Führe nur direkt änderungsnahe Tests aus. Bei Sicherheitsblocker stoppe mit Ursachenbericht und Removal Condition. Markiere das Goal erst nach Main-Prüfung, verifiziertem Worktree-Cleanup und Branch-Löschung als complete.`

## Ergebnisse

Die paketweisen Reviewbefunde werden hier fortlaufend ergänzt.

## Abschlusskriterien

- Alle 60 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
