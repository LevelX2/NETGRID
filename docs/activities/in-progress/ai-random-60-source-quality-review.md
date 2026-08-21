# AI-Random-60-Source-Qualitätsprüfung

Status: AI-R62

## Quelle/Vorgabe

Nutzerauftrag vom 21.08.2026: In gleicher Weise wie die abgeschlossenen Zufallsprüfungen 60 weitere produktive KI-Source-Dateien prüfen und belastbare Anpassungen direkt im isolierten Worktree umsetzen.

## Zielprüfung

Der Auftrag ist für die direkte automatische Abarbeitung ausreichend präzise. Die 60 Pfade der beiden abgeschlossenen Stichproben werden ausgeschlossen, einschließlich der zwei inzwischen entfernten Dateien. Die neue Stichprobe wird einmalig ohne Zurücklegen gezogen und danach nicht verändert.

## Gesamtziel

Sechzig weitere zufällig ausgewählte produktive KI-Dateien sequenziell auf Korrektheit, Plan-first-Ownership, Hidden-Info-Sicherheit, Geradlinigkeit, Struktur, Größe, Testbarkeit und Optimierungspotenzial prüfen; nur ursachenorientierte und belastbare Verbesserungen implementieren; jedes Einzelpaket ausschließlich mit direkt änderungsnahen Tests und Checks verifizieren und committen; den fertigen Branch lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

## Annahmen

- Katalogbasis sind 648 produktive Nicht-Test-Dateien unter `packages/ai/src` plus 6 produktive Laufzeitintegrationen außerhalb des Pakets, die `@netgrid/ai` tatsächlich importieren.
- Ausgeschlossen sind `*.test.*`, `*.spec.*`, `*.test-support.*`, Verzeichnisse `test-support` und `__tests__`, Config-/Buildskripte ohne echten AI-Import sowie sämtliche 60 historischen Reviewpfade.
- Von den 60 historischen Pfaden sind 58 im aktuellen Katalog noch vorhanden; der bereinigte Auswahlraum umfasst 596 Dateien.
- Die alphabetische Katalognummer ist stabil für den Startstand `1629ff1e9916d068c6526a4199cd0e603b10da70`.
- Zufallsauswahl erfolgt kryptografisch ohne Zurücklegen; die unten fixierte Reihenfolge ist verbindlich.
- Reine Stilpräferenzen rechtfertigen keine Änderung. Refactorings müssen Verantwortung, Lesbarkeit, Testbarkeit oder Architekturgrenzen messbar verbessern.

## Nicht-Ziele

- Keine allgemeine KI-Spielstärke-Initiative und keine neuen Kartenmechaniken.
- Keine zweite Entscheidungsautorität, kein Fallback und keine Legacy-Kompatibilität.
- Keine Änderungen an Engine-Regeln, LegalAction-Erzeugung oder Hidden-Info-Verträgen ohne konkret nachgewiesenen Fehler in der Stichprobe.
- Keine vollständigen AI-Shards, Workspace-, Paket-, Build- oder E2E-Gesamtläufe. Nur direkt änderungsnahe Tests und Checks.
- Keine Server- oder Browserstarts aus dem Worktree.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität; KI reicht ausschließlich aktuelle `LegalActions` ein.
- Produktive KI bleibt Plan-first; genau ein fachlicher Owner je Entscheidung.
- Choice-Auflösung vervollständigt nur die Payload der exakt gebundenen Action.
- Nur side-sichere `PlayerView`, `PublicEvents`, `LegalActions` und freigegebene Metadaten dürfen einfließen.
- Determinismus, Replay, StateHash und Engine-RNG-Vertrag bleiben erhalten.
- Fehlerbehebung erfolgt an der erzeugenden Schicht und bleibt fail-closed.

## Automatische Fehlerbehandlung

- Zuerst den engsten reproduzierenden Test beziehungsweise die engste statische Referenzprüfung verwenden.
- Rote Tests ursachenbezogen analysieren; keine Abschwächung korrekter Invarianten.
- Unabhängige Baselinefehler separat dokumentieren und nicht in den Paketscope ziehen.
- Kein Paketwechsel vor erfülltem Done-Gate.

## Sicherheitsblocker

Gestoppt wird bei nicht auflösbarem Ownership-Konflikt, möglichem Hidden-Info-Leak ohne side-sicheren Fix, unklarer Engine-/AI-Autorität, fremden relevanten Änderungen im Zielpfad oder nicht sicher isolierbarem Testbetrieb. Ein Blockerbericht muss Ursache und Removal Condition nennen.

## State Machine

`vorbereitet -> AI-R61 -> ... -> AI-R120 -> Konsolidierung -> gezielte Final-Checks -> Main-Merge -> Cleanup -> abgeschlossen`

Genau ein Paket ist aktiv. `geprüft` bedeutet Analyse abgeschlossen; `angepasst` bedeutet Code/Test geändert; `committed` ist das Paket-Done-Gate.

## Paketfolge

| Paket | Katalog | Datei | Status |
| --- | ---: | --- | --- |
| AI-R61 | 228 | `packages/ai/src/runtime/ai-feature-server.ts` | geprüft |
| AI-R62 | 47 | `packages/ai/src/breaker-ontology-consumer.ts` | offen |
| AI-R63 | 207 | `packages/ai/src/runner-deck-engine-doctrine.ts` | offen |
| AI-R64 | 432 | `packages/ai/src/runtime/semantic-runtime-corp-board-context.ts` | offen |
| AI-R65 | 128 | `packages/ai/src/input-dto.ts` | offen |
| AI-R66 | 467 | `packages/ai/src/runtime/semantic-runtime-score-components.ts` | offen |
| AI-R67 | 271 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-board-triage-contracts.ts` | offen |
| AI-R68 | 384 | `packages/ai/src/runtime/runner-multi-run-event-assessment.ts` | offen |
| AI-R69 | 491 | `packages/ai/src/runtime/visible-icebreaker-program.ts` | offen |
| AI-R70 | 251 | `packages/ai/src/runtime/corp-economy-asset-payback.ts` | offen |
| AI-R71 | 18 | `packages/ai/src/action-semantic-candidate-types.ts` | offen |
| AI-R72 | 100 | `packages/ai/src/evaluation/decision-checkpoints/checkpoint-warmup.ts` | offen |
| AI-R73 | 544 | `packages/ai/src/simulation/corp-tag-punish-action-context.ts` | offen |
| AI-R74 | 614 | `packages/ai/src/simulation/runner-setup-metric-counts.ts` | offen |
| AI-R75 | 114 | `packages/ai/src/evaluation/replay-acceptance-harness.ts` | offen |
| AI-R76 | 93 | `packages/ai/src/diagnostics/semantic-runtime-memory-debug.ts` | offen |
| AI-R77 | 332 | `packages/ai/src/runtime/runner-archives-score.ts` | offen |
| AI-R78 | 458 | `packages/ai/src/runtime/semantic-runtime-corp-scoring-evidence-composition.ts` | offen |
| AI-R79 | 530 | `packages/ai/src/simulation/breaker-ontology-metrics.ts` | offen |
| AI-R80 | 561 | `packages/ai/src/simulation/local-editable-benchmark-classification.ts` | offen |
| AI-R81 | 592 | `packages/ai/src/simulation/runner-central-pressure-diagnostics-composition.ts` | offen |
| AI-R82 | 378 | `packages/ai/src/runtime/runner-mu-pressure-assessment.ts` | offen |
| AI-R83 | 229 | `packages/ai/src/runtime/ai-features.ts` | offen |
| AI-R84 | 144 | `packages/ai/src/plans/corp-remote-project-assessment.ts` | offen |
| AI-R85 | 568 | `packages/ai/src/simulation/no-fresh-central.ts` | offen |
| AI-R86 | 483 | `packages/ai/src/runtime/tag-avoidance-choice-option.ts` | offen |
| AI-R87 | 556 | `packages/ai/src/simulation/doctrine-quality-types.ts` | offen |
| AI-R88 | 101 | `packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint.ts` | offen |
| AI-R89 | 625 | `packages/ai/src/simulation/simulation-action-diagnostics-context.ts` | offen |
| AI-R90 | 546 | `packages/ai/src/simulation/corp-tag-punish-window-composition.ts` | offen |
| AI-R91 | 48 | `packages/ai/src/candidate-path-binding.ts` | offen |
| AI-R92 | 439 | `packages/ai/src/runtime/semantic-runtime-corp-evidence-context.ts` | offen |
| AI-R93 | 571 | `packages/ai/src/simulation/plan-conversion-metrics.ts` | offen |
| AI-R94 | 233 | `packages/ai/src/runtime/card-definition-lookup.ts` | offen |
| AI-R95 | 143 | `packages/ai/src/plans/corp-opponent-campaign-continuity.ts` | offen |
| AI-R96 | 526 | `packages/ai/src/simulation/benchmark-local-editable-deck-resolver.ts` | offen |
| AI-R97 | 218 | `packages/ai/src/runtime/action-capacity-score-components.ts` | offen |
| AI-R98 | 618 | `packages/ai/src/simulation/selected-action-id.ts` | offen |
| AI-R99 | 239 | `packages/ai/src/runtime/corp-access-payment-choice.ts` | offen |
| AI-R100 | 355 | `packages/ai/src/runtime/runner-hand-buffer-need.ts` | offen |
| AI-R101 | 68 | `packages/ai/src/decision/pilot/remote-contest-candidate.ts` | offen |
| AI-R102 | 282 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-components.ts` | offen |
| AI-R103 | 311 | `packages/ai/src/runtime/discard-plan.ts` | offen |
| AI-R104 | 294 | `packages/ai/src/runtime/corp-tagged-payoff-window.ts` | offen |
| AI-R105 | 344 | `packages/ai/src/runtime/runner-development-support-composition.ts` | offen |
| AI-R106 | 214 | `packages/ai/src/runner/hand-development/runner-hand-development-internal-types.ts` | offen |
| AI-R107 | 580 | `packages/ai/src/simulation/regression/v143/exploit-regression-fixtures.ts` | offen |
| AI-R108 | 548 | `packages/ai/src/simulation/corp-visible-tag-payoff-category.ts` | offen |
| AI-R109 | 517 | `packages/ai/src/simulation/benchmark-deck-slot-list.ts` | offen |
| AI-R110 | 523 | `packages/ai/src/simulation/benchmark-deck-strategy-panel.ts` | offen |
| AI-R111 | 611 | `packages/ai/src/simulation/runner-setup-attribution-types.ts` | offen |
| AI-R112 | 365 | `packages/ai/src/runtime/runner-loan-context.ts` | offen |
| AI-R113 | 10 | `packages/ai/src/access/access-outcome-memory.ts` | offen |
| AI-R114 | 22 | `packages/ai/src/actions/action-card-semantic-profiles.ts` | offen |
| AI-R115 | 554 | `packages/ai/src/simulation/doctrine-quality-benchmark-types.ts` | offen |
| AI-R116 | 173 | `packages/ai/src/plans/tactical-plan-action-demands.ts` | offen |
| AI-R117 | 104 | `packages/ai/src/evaluation/doctrine-goal-action-fit.ts` | offen |
| AI-R118 | 195 | `packages/ai/src/run-analysis/runner-consumable-run-opportunity.ts` | offen |
| AI-R119 | 347 | `packages/ai/src/runtime/runner-economy-commitment-composition.ts` | offen |
| AI-R120 | 135 | `packages/ai/src/plans/corp-action-disposition-contributors.ts` | offen |

## Paketdetails

Für jedes Paket gelten dieselben Schritte: Datei vollständig lesen; Import-, Aufrufer-, Testgraph und relevante Historie prüfen; Architektur-Owner bestimmen; konkrete Findings nach Schweregrad dokumentieren; bei belastbarem Befund minimal anpassen und Regressionstest ergänzen oder präzisieren; ausschließlich direkt betroffene Tests und Checks sowie `git diff --check` ausführen; nur Paketänderungen committen; Status und Ergebnis in diesem Artefakt aktualisieren.

Done-Gate je Paket: Reviewbefund mit Fundstellen, begründete Änderungsentscheidung, passende fokussierte Prüfung, sauberer Diff und eigener Commit.

## Verifikationsregeln

- Pro Paket nur direkte Tests der ausgewählten Datei, unmittelbar betroffene Aufrufer, berührte Verträge und eng angrenzende Regressionen.
- Typecheck, Struktur-, Hint- oder Buildcheck nur, wenn das Paket die jeweilige Oberfläche direkt berührt.
- Nach Main-Abgleich nur die gezielten Checks wiederholen, deren Code- oder Vertragsbereich durch neue Main-Änderungen tatsächlich betroffen ist.
- Kein automatischer Volltestlauf aufgrund von Paketabschluss, Konsolidierung oder finalem Merge.
- `git diff --check` je Paket und vor Integration.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_RANDOM_60_SOURCE_REVIEW`
- Branch: `codex/ai-random-60-source-review`
- Basis: lokaler `main` bei `1629ff1e9916d068c6526a4199cd0e603b10da70`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket einzeln committen; keine fremden Änderungen anfassen.
- Vor Final-Merge aktuelles `main` in den Arbeitsbranch integrieren und ausschließlich tatsächlich betroffene Checks erneut ausführen.
- Nach erfolgreichem Merge Worktree ohne `--force` entfernen, Entfernung doppelt prüfen und gemergten Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Random-60-Source-Qualitätsprüfung vollständig und sequenziell von AI-R61 bis AI-R120 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden AI-Architekturverträge und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Prüfe, verifiziere und committe jedes Paket. Verwende ausschließlich direkt änderungsnahe Tests und Checks; starte keine vollständigen Paket-, Workspace-, Shard-, Build- oder E2E-Läufe. Bei Sicherheitsblocker stoppe mit Ursachenbericht und Removal Condition. Markiere das Goal erst nach Main-Prüfung, verifiziertem Worktree-Cleanup und Branch-Löschung als complete.`

## Ergebnisse

### AI-R61 – `runtime/ai-feature-server.ts`

- **Kein belastbarer Änderungsbedarf:** Die 53-zeilige Datei besitzt zwei klar getrennte, kleine Projektionen. `buildServerFeatures` zählt ausschließlich öffentlich sichtbare Serverbelegung; `visibleRunnerDrawTaxSourceCount` akzeptiert nur bekannte und gerezzte Roots, deren strukturierte Ontologie beide erforderlichen Draw-Tax-Bedingungen ausweist.
- Es werden weder verdeckte Kartendefinitionen noch Aktionsautorität erzeugt. Unbekannte, unrezzte oder nur allgemein taggebende Karten werden konservativ nicht als Draw-Tax-Quelle gewertet. Die Features werden als Fakten an Runtime und Simulationsdiagnostik gereicht.
- Die Datei ist geradlinig und angemessen klein. `buildServerFeatures` besitzt keinen eigenen direkten Test, besteht aber nur aus mechanischen Zählungen; daraus folgt ohne Fehlerevidence kein zusätzlicher Produktionsumbau. Check: direkter Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

## Abschlusskriterien

- Alle 60 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
