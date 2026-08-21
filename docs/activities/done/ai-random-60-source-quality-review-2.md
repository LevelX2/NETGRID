# AI-Random-60-Source-Qualitätsprüfung – zweite Serie

Status: abgeschlossen

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
| AI-R121 | 141 | `packages/ai/src/plans/corp-defense-turn-planning.ts` | committed |
| AI-R122 | 577 | `packages/ai/src/simulation/regression/exploit-regression-fixtures.ts` | committed |
| AI-R123 | 321 | `packages/ai/src/runtime/progression-card-target.ts` | committed |
| AI-R124 | 181 | `packages/ai/src/plans/tactical-plan-visible-cards.ts` | committed |
| AI-R125 | 326 | `packages/ai/src/runtime/remote-trash-target.ts` | committed |
| AI-R126 | 396 | `packages/ai/src/runtime/runner-rig-trash-target.ts` | committed |
| AI-R127 | 442 | `packages/ai/src/runtime/semantic-runtime-corp-passive-scoreline.ts` | committed |
| AI-R128 | 617 | `packages/ai/src/simulation/selfplay-action-type-dominance.ts` | committed |
| AI-R129 | 485 | `packages/ai/src/runtime/trace-context.ts` | committed |
| AI-R130 | 243 | `packages/ai/src/runtime/corp-central-defense-facts-adapter.ts` | committed |
| AI-R131 | 357 | `packages/ai/src/runtime/runner-hand-rotation-assessment.ts` | committed |
| AI-R132 | 261 | `packages/ai/src/runtime/corp-opening-rush.ts` | committed |
| AI-R133 | 580 | `packages/ai/src/simulation/regression/v143/fixture-types.ts` | committed |
| AI-R134 | 273 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-action-families.ts` | committed |
| AI-R135 | 60 | `packages/ai/src/decision/neutral-goal-synthesis.ts` | committed |
| AI-R136 | 266 | `packages/ai/src/runtime/corp-score-rush-risk.ts` | committed |
| AI-R137 | 124 | `packages/ai/src/generated-ai-hint-artifact-validation.ts` | committed |
| AI-R138 | 573 | `packages/ai/src/simulation/progression-action-sequence.ts` | committed |
| AI-R139 | 350 | `packages/ai/src/runtime/runner-encounter-composition-context.ts` | committed |
| AI-R140 | 32 | `packages/ai/src/actions/conditional-defense-followup-quote.ts` | committed |
| AI-R141 | 470 | `packages/ai/src/runtime/setup-mulligan-choice-option.ts` | committed |
| AI-R142 | 287 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure.ts` | committed |
| AI-R143 | 285 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-contracts.ts` | committed |
| AI-R144 | 386 | `packages/ai/src/runtime/runner-no-run-economy-context.ts` | committed |
| AI-R145 | 333 | `packages/ai/src/runtime/runner-baseline-plan-guard-context.ts` | committed |
| AI-R146 | 589 | `packages/ai/src/simulation/runner-breaker-coverage-diagnostics.ts` | committed |
| AI-R147 | 455 | `packages/ai/src/runtime/semantic-runtime-corp-score.ts` | committed |
| AI-R148 | 87 | `packages/ai/src/diagnostics/debug-format.ts` | committed |
| AI-R149 | 286 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection.ts` | committed |
| AI-R150 | 102 | `packages/ai/src/evaluation/decision-snapshot-suite.ts` | committed |
| AI-R151 | 627 | `packages/ai/src/simulation/simulation-league.ts` | committed |
| AI-R152 | 592 | `packages/ai/src/simulation/runner-credit-reserve.ts` | committed |
| AI-R153 | 434 | `packages/ai/src/runtime/semantic-runtime-corp-board.ts` | committed |
| AI-R154 | 112 | `packages/ai/src/evaluation/real-engine-decision-corpus.ts` | committed |
| AI-R155 | 591 | `packages/ai/src/simulation/runner-central-pressure-diagnostics.ts` | committed |
| AI-R156 | 550 | `packages/ai/src/simulation/deck-support.ts` | committed |
| AI-R157 | 66 | `packages/ai/src/decision/pilot/pilot-scope-common.ts` | committed |
| AI-R158 | 224 | `packages/ai/src/runtime/ai-decision-input.ts` | committed |
| AI-R159 | 123 | `packages/ai/src/evaluation/target-choice-shadow-readiness.ts` | committed |
| AI-R160 | 532 | `packages/ai/src/simulation/central-run-history.ts` | committed |
| AI-R161 | 244 | `packages/ai/src/runtime/corp-defense-package-retention.ts` | committed |
| AI-R162 | 523 | `packages/ai/src/simulation/benchmark-deck-types.ts` | committed |
| AI-R163 | 176 | `packages/ai/src/plans/tactical-plan-corp-score-conversion.ts` | committed |
| AI-R164 | 602 | `packages/ai/src/simulation/runner-known-path-diagnostics-composition.ts` | committed |
| AI-R165 | 234 | `packages/ai/src/runtime/card-title.ts` | committed |
| AI-R166 | 428 | `packages/ai/src/runtime/semantic-runtime-choice-builder.ts` | committed |
| AI-R167 | 269 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-board-triage-alignment.ts` | committed |
| AI-R168 | 360 | `packages/ai/src/runtime/runner-hq-saturation-score.ts` | committed |
| AI-R169 | 311 | `packages/ai/src/runtime/economy-score-components.ts` | committed |
| AI-R170 | 547 | `packages/ai/src/simulation/corp-visible-tag-punish-opportunities.ts` | committed |
| AI-R171 | 621 | `packages/ai/src/simulation/selfplay-why-coverage.ts` | committed |
| AI-R172 | 524 | `packages/ai/src/simulation/benchmark-local-deck-data.ts` | committed |
| AI-R173 | 158 | `packages/ai/src/plans/plan-portfolio-memory.ts` | committed |
| AI-R174 | 513 | `packages/ai/src/simulation/benchmark-deck-format-profile.ts` | committed |
| AI-R175 | 180 | `packages/ai/src/plans/tactical-plan-types.ts` | committed |
| AI-R176 | 489 | `packages/ai/src/runtime/visible-card-lookup.ts` | committed |
| AI-R177 | 37 | `packages/ai/src/actions/risk-action-projection.ts` | committed |
| AI-R178 | 579 | `packages/ai/src/simulation/regression/v143/fixture-data.ts` | committed |
| AI-R179 | 362 | `packages/ai/src/runtime/runner-known-access-payoff-context.ts` | committed |
| AI-R180 | 637 | `packages/ai/src/simulation/tag-punish-card-sets.ts` | committed |

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

### Umgesetzte Befunde (13/60)

| Paket | Präziser Befund | Umsetzung und direkte Prüfung |
| --- | --- | --- |
| AI-R124 | Der Definition-ID-Fallback in `visibleCardForAction` konnte eine `known:false`-Karte als Quelle behandeln. | Definition-Match verlangt `known`; gezielter Hidden-Info-Test bestanden. |
| AI-R126 | Corp-spezifische Rig-Trash-Helfer akzeptierten Runner-Inputs beziehungsweise Runner-Actions. | Beide Seitengrenzen fail-closed ergänzt; 3 direkte Tests bestanden. |
| AI-R140 | Engine-Quote war an ID und StateVersion, aber nicht an Corp-Akteur und `expiresAtStateVersion` gebunden. | Akteur-, Action-Side- und Ablaufbindung ergänzt; bestehende Quote-Suite bestanden. |
| AI-R141 | Unbekannte Mulligan-Entscheidung fiel still auf `options[0]` zurück. | Beliebige Erstoption entfernt; exakter Match oder `undefined`; 1 Regressionstest bestanden. |
| AI-R144 | Nicht-endliche oder negative Eventbeträge konnten in die No-Run-Economy-Projektion gelangen. | Numerische Payloads auf endlich und nichtnegativ begrenzt; direkte Economy-Kontext-Suite bestanden. |
| AI-R149 | Fehlende Serverbindung erfand `remote_1`; außerdem konnten unbekannte/nicht-Agenda-Karten Agenda-Punkte liefern. | Projektion gibt ohne Server-ID `undefined`; Agenda-Risiko nur aus bekannten Agenden; 7 direkte Projektions-Tests bestanden. |
| AI-R151 | League-Ergebnisse gaben die globalen Tuning-/Holdout-Seed-Arrays veränderbar heraus. | Arrays werden kopiert; Mutation-Isolationstest bestanden. |
| AI-R160 | `publicEvents` und dessen `eventTail`-Suffix wurden zusammengefügt und doppelt gezählt. | Gemeinsame deduplizierende Public-History-Autorität verwendet; 12 direkte Central-Run-Tests bestanden. |
| AI-R161 | Das gemeinsame No-Quote-Objekt war trotz Readonly-Typ zur Laufzeit veränderbar. | Singleton mit `Object.freeze` geschützt; direkte Corp-Defense-Prüfung bestanden. |
| AI-R169 | `NaN`/`Infinity` galten als vorhandene Netto-Liquiditätsprojektion. | `Number.isFinite` als Gate; Regressionstest bestanden. |
| AI-R170 | Eine Corp-Auswertung konnte eine fremdseitige `LegalAction` an die Punish-Klassifikation reichen. | Vor Klassifikation auf `action.side === "corp"` gefiltert; Regressionstest bestanden. |
| AI-R172 | Vier importierte JSON-Benchmarkregister waren modulglobal mutierbar. | Rekursiv eingefroren; vier Registry-Freeze-Prüfungen bestanden. |
| AI-R173 | Portfolio-Memory speicherte und lieferte Snapshots per Referenz; außerdem fehlte `matchId` als primärer Speicherschlüssel. | Structured-Clone an Ein-/Ausgabe und Match-Bindung ergänzt; 22 Portfolio-Tests bestanden. |

### Prüfungen ohne Codeänderung (47/60)

- AI-R121, R130, R134, R142, R147, R163 und R167 sind groß. Sie besitzen trotz Größe eine erkennbare fachliche Klammer beziehungsweise delegieren bereits in Teilmodule. Ein Split nur nach Zeilenzahl hätte Ownership verschlechtert; R142 und R163 bleiben sinnvolle Kandidaten für ein eigenes Strukturpaket.
- AI-R122/R133/R178 bilden die bewusst versionierte Regression-Fixture-Fassade samt Typen und Daten; sie sind nicht redundant und dürfen nicht wegrationalisiert werden.
- AI-R123, R125, R148, R165, R176, R179 und R180 sind kleine, geradlinige Lookup-/Normalisierungs-/Konstantenmodule mit enger Verantwortung.
- AI-R127, R136, R145, R152, R153 und R168 wurden auf Seitengrenzen, Unknown-Semantik und konservative Rückgaben geprüft. Die produktiven Aufrufer binden sie bereits an den zuständigen Corp-/Runner-Plan; kein zweiter Entscheidungsowner entstand.
- AI-R128, R138, R146, R150, R154, R155, R157, R159, R164, R171 und R177 sind Diagnose-, Evaluation- oder Projektionscode ohne produktive Auswahlhoheit. Datenfluss und Determinismus sind geradlinig; keine Runtime-Fallback-Autorität gefunden.
- AI-R129, R131, R135, R139, R143, R156, R158, R162, R166, R174 und R175 haben klare Vertrags-/Kompositionsrollen. Imports und Aufrufer bestätigen, dass eine Entfernung entweder Typoberflächen oder Owner-Verdrahtung zerstören würde.
- AI-R132 enthält eine ältere seed-basierte Opening-Rush-Admission neben der neueren Engine-RNG-Route. Ein isoliertes Entfernen wurde probeweise geprüft, aber verworfen: Die Engine-Quote ist derzeit nur für den wertnahen Familienmix zuständig; ein lokaler Patch hätte die etablierte 50/50-Policy in Nicht-Near-Tie-Fällen verändert. Das ist Architekturablösungspotenzial, kein sicherer Random-Review-Fix; hierfür ist ein eigenes Owner-Paket mit Engine-Quote-Erweiterung nötig.
- AI-R137 ist ein absichtlich strenges Vollständigkeitsgate für genau 618 generierte Kartenzeilen; die feste Zahl ist hier ein Corpus-Vertrag und kein zu entfernender Magic Number.

### Verifikation

- 10 fokussierte Dateien / 83 Tests: bestanden.
- 4 fokussierte Dateien / 28 Tests: bestanden.
- 3 neue fokussierte Dateien / 3 Tests: bestanden.
- `git diff --check`: bestanden.
- Ein zusätzlich versuchter Paket-Typecheck wurde wegen der Worktree-Abhängigkeitsverknüpfung (`@netgrid/shared`/gebrandete Capability-Typen aus zwei physischen Checkouts) rot und nicht als fachlicher Test gewertet; die geänderten Typoberflächen wurden durch die direkt betroffenen Vitest-Dateien kompiliert und ausgeführt.

## Abschlusskriterien

- Alle 60 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
