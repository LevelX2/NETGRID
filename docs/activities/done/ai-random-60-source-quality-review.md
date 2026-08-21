# AI-Random-60-Source-Qualitätsprüfung

Status: abgeschlossen

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
| AI-R62 | 47 | `packages/ai/src/breaker-ontology-consumer.ts` | angepasst |
| AI-R63 | 207 | `packages/ai/src/runner-deck-engine-doctrine.ts` | angepasst |
| AI-R64 | 432 | `packages/ai/src/runtime/semantic-runtime-corp-board-context.ts` | geprüft |
| AI-R65 | 128 | `packages/ai/src/input-dto.ts` | angepasst |
| AI-R66 | 467 | `packages/ai/src/runtime/semantic-runtime-score-components.ts` | angepasst |
| AI-R67 | 271 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-board-triage-contracts.ts` | geprüft |
| AI-R68 | 384 | `packages/ai/src/runtime/runner-multi-run-event-assessment.ts` | geprüft |
| AI-R69 | 491 | `packages/ai/src/runtime/visible-icebreaker-program.ts` | geprüft |
| AI-R70 | 251 | `packages/ai/src/runtime/corp-economy-asset-payback.ts` | angepasst |
| AI-R71 | 18 | `packages/ai/src/action-semantic-candidate-types.ts` | geprüft |
| AI-R72 | 100 | `packages/ai/src/evaluation/decision-checkpoints/checkpoint-warmup.ts` | angepasst |
| AI-R73 | 544 | `packages/ai/src/simulation/corp-tag-punish-action-context.ts` | angepasst |
| AI-R74 | 614 | `packages/ai/src/simulation/runner-setup-metric-counts.ts` | geprüft |
| AI-R75 | 114 | `packages/ai/src/evaluation/replay-acceptance-harness.ts` | angepasst |
| AI-R76 | 93 | `packages/ai/src/diagnostics/semantic-runtime-memory-debug.ts` | geprüft |
| AI-R77 | 332 | `packages/ai/src/runtime/runner-archives-score.ts` | angepasst |
| AI-R78 | 458 | `packages/ai/src/runtime/semantic-runtime-corp-scoring-evidence-composition.ts` | geprüft |
| AI-R79 | 530 | `packages/ai/src/simulation/breaker-ontology-metrics.ts` | angepasst |
| AI-R80 | 561 | `packages/ai/src/simulation/local-editable-benchmark-classification.ts` | angepasst |
| AI-R81 | 592 | `packages/ai/src/simulation/runner-central-pressure-diagnostics-composition.ts` | angepasst |
| AI-R82 | 378 | `packages/ai/src/runtime/runner-mu-pressure-assessment.ts` | angepasst |
| AI-R83 | 229 | `packages/ai/src/runtime/ai-features.ts` | angepasst |
| AI-R84 | 144 | `packages/ai/src/plans/corp-remote-project-assessment.ts` | angepasst |
| AI-R85 | 568 | `packages/ai/src/simulation/no-fresh-central.ts` | angepasst |
| AI-R86 | 483 | `packages/ai/src/runtime/tag-avoidance-choice-option.ts` | geprüft |
| AI-R87 | 556 | `packages/ai/src/simulation/doctrine-quality-types.ts` | geprüft |
| AI-R88 | 101 | `packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint.ts` | geprüft |
| AI-R89 | 625 | `packages/ai/src/simulation/simulation-action-diagnostics-context.ts` | angepasst |
| AI-R90 | 546 | `packages/ai/src/simulation/corp-tag-punish-window-composition.ts` | geprüft |
| AI-R91 | 48 | `packages/ai/src/candidate-path-binding.ts` | angepasst |
| AI-R92 | 439 | `packages/ai/src/runtime/semantic-runtime-corp-evidence-context.ts` | geprüft |
| AI-R93 | 571 | `packages/ai/src/simulation/plan-conversion-metrics.ts` | angepasst |
| AI-R94 | 233 | `packages/ai/src/runtime/card-definition-lookup.ts` | angepasst |
| AI-R95 | 143 | `packages/ai/src/plans/corp-opponent-campaign-continuity.ts` | angepasst |
| AI-R96 | 526 | `packages/ai/src/simulation/benchmark-local-editable-deck-resolver.ts` | angepasst |
| AI-R97 | 218 | `packages/ai/src/runtime/action-capacity-score-components.ts` | angepasst |
| AI-R98 | 618 | `packages/ai/src/simulation/selected-action-id.ts` | geprüft |
| AI-R99 | 239 | `packages/ai/src/runtime/corp-access-payment-choice.ts` | angepasst |
| AI-R100 | 355 | `packages/ai/src/runtime/runner-hand-buffer-need.ts` | geprüft |
| AI-R101 | 68 | `packages/ai/src/decision/pilot/remote-contest-candidate.ts` | angepasst |
| AI-R102 | 282 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-components.ts` | angepasst |
| AI-R103 | 311 | `packages/ai/src/runtime/discard-plan.ts` | geprüft |
| AI-R104 | 294 | `packages/ai/src/runtime/corp-tagged-payoff-window.ts` | angepasst |
| AI-R105 | 344 | `packages/ai/src/runtime/runner-development-support-composition.ts` | geprüft |
| AI-R106 | 214 | `packages/ai/src/runner/hand-development/runner-hand-development-internal-types.ts` | geprüft |
| AI-R107 | 580 | `packages/ai/src/simulation/regression/v143/exploit-regression-fixtures.ts` | angepasst |
| AI-R108 | 548 | `packages/ai/src/simulation/corp-visible-tag-payoff-category.ts` | angepasst |
| AI-R109 | 517 | `packages/ai/src/simulation/benchmark-deck-slot-list.ts` | angepasst |
| AI-R110 | 523 | `packages/ai/src/simulation/benchmark-deck-strategy-panel.ts` | angepasst |
| AI-R111 | 611 | `packages/ai/src/simulation/runner-setup-attribution-types.ts` | angepasst |
| AI-R112 | 365 | `packages/ai/src/runtime/runner-loan-context.ts` | geprüft |
| AI-R113 | 10 | `packages/ai/src/access/access-outcome-memory.ts` | angepasst |
| AI-R114 | 22 | `packages/ai/src/actions/action-card-semantic-profiles.ts` | angepasst |
| AI-R115 | 554 | `packages/ai/src/simulation/doctrine-quality-benchmark-types.ts` | geprüft |
| AI-R116 | 173 | `packages/ai/src/plans/tactical-plan-action-demands.ts` | angepasst |
| AI-R117 | 104 | `packages/ai/src/evaluation/doctrine-goal-action-fit.ts` | angepasst |
| AI-R118 | 195 | `packages/ai/src/run-analysis/runner-consumable-run-opportunity.ts` | angepasst |
| AI-R119 | 347 | `packages/ai/src/runtime/runner-economy-commitment-composition.ts` | geprüft |
| AI-R120 | 135 | `packages/ai/src/plans/corp-action-disposition-contributors.ts` | angepasst |

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

### AI-R62 – `breaker-ontology-consumer.ts`

- **Behobener mittlerer Rationalisierungsbefund:** 211 Zeilen bildeten einen alten parallelen Breakkosten-/Coverage-Pfad, der nach der Umstellung auf Engine-nahe Run-Quotes keinen einzigen Aufrufer mehr besaß. Drei Funktionen waren nur noch über `index.ts` re-exportiert; vier korrespondierende Imports in `visible-run-analysis.ts` waren ebenfalls unbenutzt.
- Der verwaiste API- und Implementierungspfad ist vollständig entfernt. Die weiterhin produktive Ontologie für Breaker-Coverage, Installationskosten, Nebenwirkungen und Access-Reachability bleibt unverändert; die Datei schrumpft von 351 auf 142 Zeilen.
- Dadurch verschwindet zugleich eine potenziell gefährliche zweite Kostenschätzung mit eigener Strength-/Subroutine-Arithmetik. Kosten- und Runpfadwahrheit bleibt beim aktuellen Engine-Quote-Pfad statt in einer ungenutzten Alternative zu divergieren. Checks: direkte Deck-Capability- und Visible-Run-Tests grün (2 Dateien, 96 Tests), AI-Paket-Typecheck grün, Referenzsuche und `git diff --check` grün.

### AI-R63 – `runner-deck-engine-doctrine.ts`

- **Behobener hoher Datenqualitätsbefund:** Der exportierte Doctrine-Builder filterte Mengen nur mit `quantity > 0`. Negative Werte und `NaN` verschwanden still, während Unendlichkeit und Bruchteile Provider-, Dependency- und Evidence-Zähler verfälschen konnten.
- Runner-Deckmengen müssen nun vor jeder Ableitung nichtnegative Safe Integer sein; ungültige Snapshots scheitern mit Karten-ID und Wert sichtbar per `RangeError`. Die Doctrine bleibt rein beratend und behält ihre bestehenden Ownerzuordnungen zu Coverage, Development und Shell-Traders bei.
- Die 502-zeilige Datei ist groß, aber kohärent nach Provider-, Dependency-, Engine-Line- und Contribution-Ableitung gegliedert. Ein Split wäre ohne weiteren Fehler derzeit überwiegend Navigation. Check: direkter Vitest einschließlich `NaN`, Unendlichkeit, negativer und gebrochener Menge grün (1 Datei, 11 Tests), `git diff --check` grün.

### AI-R64 – `runtime/semantic-runtime-corp-board-context.ts`

- **Kein Änderungsbedarf:** Die 72-zeilige Datei ist ein expliziter Composition-Adapter. Sie bindet die fachlichen Corp-Board-Helfer einmalig an `SemanticRuntimeCorpBoardDependencies` und stellt dem Score-Owner eine kleine, vollständig typisierte Oberfläche bereit.
- Der Adapter trifft weder Server-, Agenda-, Schutz- noch Scoreentscheidung selbst. Funktionen ohne Abhängigkeiten werden direkt durchgereicht; abhängige Funktionen erhalten exakt denselben Dependency-Vertrag. Dadurch entsteht keine zweite Board- oder Scoring-Autorität.
- Der scheinbar repetitive Code ist hier nützlich: Der konkrete Rückgabetyp macht fehlendes oder versehentlich zusätzliches Wiring compile-time-sichtbar. Checks: Module-Boundary- und Public-Export-Vertrag grün (2 Dateien, 38 Tests), `git diff --check` grün.

### AI-R65 – `input-dto.ts`

- **Behobener kritischer Boundary-Befund:** Der exportierte DTO-Builder prüfte nicht, ob angeforderte Akteursseite, `PlayerView.side` und beide LegalAction-Mengen dieselbe Seite besitzen. Ein falsch verdrahteter Caller hätte dadurch beispielsweise eine Corp-private Sicht unter einem Runner-Input weiterreichen können.
- Die Eingangsgrenze validiert nun vor jeder Sanitization die View-Seite sowie die Seiten sämtlicher Top-Level- und PlayerView-LegalActions und scheitert bei Abweichung mit Action-ID sichtbar fail-closed. Sechs bestehende Sanitizer-Gegenfälle wurden auf actor-korrekte Testfixtures umgestellt; ihre eigentliche Redaction-Evidence bleibt erhalten.
- **Kritische Strukturverschuldung:** Mit 3.567 Zeilen vereint die Datei allgemeine Allowlist-Primitive, PlayerView-/Event-/Action-Sanitization und mehrere große Quote-Validatoren. Empfohlen ist ein eigenes Architekturpaket, das Quote-Familien und Card-/Choice-/Event-Sanitizer in interne Module trennt, während `buildAiDecisionInputDto` alleinige öffentliche Boundary bleibt. Checks: fünf direkte DTO-Suites grün (5 Dateien, 149 Tests), `git diff --check` grün.

### AI-R66 – `runtime/semantic-runtime-score-components.ts`

- **Behobener hoher Zahlenbefund:** Rundung, Confidence und Komponentensumme akzeptierten `NaN` beziehungsweise Unendlichkeit. `NaN` fiel beispielsweise still in die niedrigste Confidence-Klasse, während nichtendliche Komponenten den gesamten Actionscore kontaminieren konnten.
- Alle drei öffentlichen Zahlenpfade prüfen nun Eingangswerte fail-closed; auch ein erst durch Addition überlaufender Komponentengesamtwert wird abgewiesen. Der Helper verändert weiterhin weder Plan- noch Actionwahl, sondern sichert nur die gemeinsame Scoreprojektion.
- Die 176-zeilige Datei bleibt geradlinig: Evidence-Scrubbing, Scoreprovenienz, Confidence und der ausdrücklich nur kleine Actiontype-Tiebreaker sind klar getrennt. Check: direkter Vitest mit `NaN`-/Unendlichkeitsgegenfällen grün (1 Datei, 8 Tests), `git diff --check` grün.

### AI-R67 – `runtime/corp-scoreline/semantic-runtime-corp-board-triage-contracts.ts`

- **Kein Änderungsbedarf:** Die 103-zeilige Datei enthält ausschließlich die eng zusammengehörigen Typverträge für Corp-Board-Triage, Rez-Floors, Safety-Gates, bewertete LegalActions und den injizierten Abhängigkeitsvertrag.
- Die Datei erzeugt weder Triage noch Score und trifft keine Actionentscheidung. Ihre Typen werden zentral von den getrennten Policy-, Action- und Alignment-Modulen genutzt; optionale Dependencies kennzeichnen bewusst nur Fähigkeiten, die nicht jeder Consumer bereitstellt.
- Ein weiterer Split würde Navigation erhöhen, ohne Verantwortungen zu trennen. Die starke Nutzung verhindert zugleich eine Wegrationalisierung. Check: direkter Corp-Board-Triage-Vitest grün (1 Datei, 27 Tests), Referenz- und Historienprüfung sowie `git diff --check` grün.

### AI-R68 – `runtime/runner-multi-run-event-assessment.ts`

- **Kein Änderungsbedarf:** Der 98-zeilige Assessor erkennt ausschließlich exakt action-gebundene Multi-Run-Fakten und bleibt eine Projektion innerhalb des Runner-Multi-Run-Owners. Normale Run-Events ohne optionalen Folgerun werden konservativ ignoriert.
- Fehlende Ziele liefern keine erfundene Evaluation: Der produktive `canTakeRun`-Vertrag bewertet `undefined` als nicht plausibel und der Scorepfad sperrt diese Route mit negativem Wert. `bonus_run` ist nur die dokumentierte Quellenbezeichnung für den action-gebundenen Folgerun, kein strategischer Fallback.
- Evaluation, Payoff, Zulässigkeitsdiagnose und begrenzte Evidence sind geradlinig aufgebaut; ein Split wäre unverhältnismäßig. Check: direkter Vitest grün (1 Datei, 2 Tests), Aufrufer-/Dependency- und Historienprüfung sowie `git diff --check` grün.

### AI-R69 – `runtime/visible-icebreaker-program.ts`

- **Kein Änderungsbedarf und nicht sinnvoll wegrationalisierbar:** Die 18-zeilige Datei zentralisiert eine sicherheitsrelevante Sichtbarkeitsgrenze: Nur bekannte Programme mit mindestens einer aus der sichtbaren Ontologie abgeleiteten Breaker-Rolle gelten als Icebreaker.
- Der kleine Predicate-Factory-Adapter bindet genau diesen Klassifikator einmal an die Runtime-Composition und verhindert, dass mehrere Consumer eigene, möglicherweise hidden-info-unsichere Varianten bauen. Er erzeugt weder Kartenwissen noch eine Entscheidung.
- Größe, Name und Abhängigkeit sind optimal; Inlining würde Duplikation und Grenzverwässerung riskieren. Check: direkt angrenzender Visible-Breaker-Coverage-Vitest grün (1 Datei, 4 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R70 – `runtime/corp-economy-asset-payback.ts`

- **Behobener mittlerer Modellbefund:** Die Projektion zog `payoutActionCost` zwar als Opportunity Cost ab, behandelte die aktuell verfügbaren Klicks bei der Ausführungskapazität aber immer als Zahl von Auszahlungen. Eine Auszahlung mit zwei Aktionskosten wurde dadurch aktuell doppelt gezählt und konnte ein unrentables Economy-Asset fälschlich als lohnend einstufen.
- Die aktuelle Kapazität wird nun durch die tatsächlichen Aktionskosten je Auszahlung geteilt; künftige Horizonte behalten die bewusst konservative Begrenzung auf eine Auszahlung je Zug. Aktionslose Auszahlungen bleiben ohne Division durch null bis zum endlichen Pool ausführbar. Eine eigene Evidence-Zeile macht beide Kapazitäten unterscheidbar.
- Der 126-zeilige Assessor bleibt beim Corp-Economy-Campaign-Owner und erzeugt nur risikoadjustierte Payback-Fakten, keine parallele Actionwahl. Check: direkter Vitest einschließlich Zwei-Aktionen-Gegenfall grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R71 – `action-semantic-candidate-types.ts`

- **Kein funktionaler Änderungsbedarf, aber mittlere Strukturverschuldung:** Die 632-zeilige Datei ist eine reine Typoberfläche ohne Laufzeitlogik. Sie kodiert die side-sicheren Candidate-, Gate-, Cost-, Economy-, Capacity-, Target-, Run-, Random-, Hidden-Resource- und Card-Profile-Verträge präzise und trägt explizite Authority-/Visibility-Kommentare.
- Eine Wegrationalisierung ist ausgeschlossen: `ActionSemanticCandidate` ist die zentrale Projektion vieler Runtime-Owner. Mittelfristig sollten die klaren Domänengruppen in interne `action-semantic-types/*`-Module getrennt und von dieser stabilen öffentlichen Fassade re-exportiert werden; ein Großumbau ohne Verhaltensbefund wäre in diesem Einzelpaket unverhältnismäßig.
- Die Verträge erzeugen keine LegalActions und markieren unbekannte beziehungsweise blockierte Projektionen ausdrücklich. Check: direkter Candidate-Builder-Vitest grün (1 Datei, 40 Tests), breite Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R72 – `evaluation/decision-checkpoints/checkpoint-warmup.ts`

- **Behobener hoher Replay-Boundary-Befund:** Der Warmup vertraute darauf, dass `inputForStateVersion` wirklich die in der historischen Zeile gespeicherte Seite und StateVersion liefert. Ein falsch indizierter Input konnte dadurch Tactical Memory aus einem anderen Zustand oder sogar für die andere Akteursseite persistieren.
- Vor Preview und Persistenz werden nun `input.side` gegen die Zeilenseite und `playerView.stateVersion` gegen die angeforderte Version geprüft. Abweichungen scheitern mit Entscheidung, Soll- und Istwert sichtbar fail-closed; Drift-Rebase und Determinismusprüfung bleiben unverändert.
- Die 87-zeilige Funktion besitzt weiterhin genau eine Verantwortung: kompatible historische Entscheidungen in Reihenfolge aufwärmen. Check: direkter Vitest mit Side- und StateVersion-Gegenfällen grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R73 – `simulation/corp-tag-punish-action-context.ts`

- **Behobener hoher Akteursgrenzen-Befund:** Drei öffentliche Corp-Klassifikatoren verließen sich bei Legacy-Rollen beziehungsweise `trash_resource` auf corp-korrekte Aufrufer. Eine Runner-Action konnte dadurch als Corp-Tagquelle, Trace-Quelle oder Punish-Payoff klassifiziert werden, obwohl der Ontologiepfad selbst sie korrekt abwies.
- `corpPunishKindForAction`, `isCorpTagSourceAction` und `isCorpTraceTagSourceAction` prüfen nun sowohl Input- als auch Action-Seite vor jeder Ontologie-/Legacy-Auswertung. Damit kann die Simulationsdiagnostik keine fremdseitige Action in den Corp-Funnel aufnehmen.
- Mit 117 Zeilen bleibt der Context klar auf action-gebundene Tag/Punish-Klassifikation und deren Diagnostikprojektion begrenzt. Check: direkter Vitest mit cross-side `trash_resource` und Rollen grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R74 – `simulation/runner-setup-metric-counts.ts`

- **Kein Änderungsbedarf:** Die 79-zeilige Datei enthält vier reine, deterministische Zähler für Setup-zu-Pressure-Konversion, Economy-Flags und fehlende Search-/Recovery-Followups. Sie wertet ausschließlich bereits side-sicher erzeugte Simulationseinträge aus und beeinflusst keine Live-Entscheidung.
- Runner-eigene Action-Fenster überspringen gegnerische Einträge bewusst; die allgemeine Coverage-Konversion verwendet dagegen das ausdrücklich festgelegte Sequenzfenster von sechs Einträgen. Die Aufrufer übergeben nur positive feste Fenster von eins bis drei.
- Die Schleifen brechen bei Install beziehungsweise Run früh ab und sind für die kleinen Matchsequenzen angemessen; ein Index oder Vorberechnungsumbau hätte keinen messbaren Nutzen. Check: direkt angrenzender Match-Progression-Summary-Vitest grün (1 Datei, 1 Test), Aufrufer-/Historienprüfung und `git diff --check` grün.

### AI-R75 – `evaluation/replay-acceptance-harness.ts`

- **Behobener mittlerer Datenqualitätsbefund:** `portableReproFixtures` gelangte ungeprüft in Aggregate und Acceptance-Gate. Negative, gebrochene oder nichtendliche Werte konnten damit einen semantisch ungültigen Report erzeugen; positive Unendlichkeit hätte das Repro-Gate sogar erfüllt.
- Der Options-Boundary akzeptiert nun nur nichtnegative Safe Integer und scheitert andernfalls sichtbar per `RangeError`. Redaction-, Holdout-, No-Runtime-Effect- und Full-Test-Evidence bleiben strikt getrennte Gates; historische Recurrence wird weiterhin nicht als aktuelle Abnahme ausgegeben.
- Die 249-zeilige Datei ist als kompletter Report-Builder inklusive Markdown-Renderer noch kohärent; Redaction und side-safe Assertion liegen am finalen Report. Check: direkter Vitest mit vier ungültigen Zahlenklassen grün (1 Datei, 6 Tests), `git diff --check` grün.

### AI-R76 – `diagnostics/semantic-runtime-memory-debug.ts`

- **Kein funktionaler Änderungsbedarf, geringe Strukturverschuldung:** Die 347-zeilige Datei projiziert rekonstruiertes Belief-Memory in begrenzte Debuglisten und strukturierte Gegnerzusammenfassungen. Eigene Handinhalte werden bewusst nicht ausgegeben; bekannte Gegnerkarten stammen nur aus bereits side-sicherem Reveal-/Access-Memory.
- Hidden-Remote-Candidates bleiben Hypothesen mit Count/Exhaustive-Kennzeichnung, Runner- und Corp-Gegnerbilder werden strikt nach Akteursseite getrennt. Titelauflösung geschieht ausschließlich für der Seite bekannte Definition-IDs; rohe eigene Instanz-IDs gelangen nicht in Facts.
- Bei weiterem Wachstum sollten Runner-Opponent-, Corp-Opponent- und Card-Summary-Serializer getrennt werden. Aktuell ist die Datei als reine Debugprojektion noch nachvollziehbar und ohne Entscheidungsautorität. Check: direkter Memory-Debug-Vitest grün (1 Datei, 4 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R77 – `runtime/runner-archives-score.ts`

- **Behobener hoher Akteursgrenzen-Befund:** Sowohl der action-bezogene Archives-Score als auch der allgemeine Hidden-Payoff-Prädikat prüften die Runner-Seite nicht selbst. Ein falsch verdrahteter Corp-Input oder eine Corp-Action konnte dadurch Runner-Archives-Payoff erzeugen.
- Beide produktiven Einstiege lehnen fremdseitige Inputs beziehungsweise Actions nun vor Evaluation, Hidden-Count und deterministischem Probe-Bucket ab. Die Payoff-Qualifikation bleibt evidenzgebunden: sichtbare Agenda, ungesehener Random-Discard, Matchpoint, Deckdruck, große Akkumulation oder replay-stabiler 1-aus-8-Probe.
- Die 212-zeilige Datei ist als zusammengehörige Archives-Scorepolicy noch geradlinig; sie nutzt ausschließlich Public History und sichtbare Counts. Check: direkter Vitest mit Input- und Action-Cross-Side-Gegenfällen grün (1 Datei, 9 Tests), `git diff --check` grün.

### AI-R78 – `runtime/semantic-runtime-corp-scoring-evidence-composition.ts`

- **Kein Änderungsbedarf:** Die 175-zeilige Datei ist ein reiner Composition-Owner. Sie verdrahtet Advancement-Counter, Passive-Scoreline, Score-Safety, Corp-Evidence und Score-Components mit exakt denselben injizierten Domänenfunktionen.
- Risky-Scoreline wird nur aus Rez-Floor, Contestability und dem vorhandenen Scoring-Window-Assessment abgeleitet; die Composition wählt weder Server noch Action. `scoringWindowIsSafe` erkennt ausschließlich die beiden explizit sicheren Window-Klassen und bleibt damit fail-closed.
- Die ausführliche Dependency-Omit-Oberfläche verhindert doppelte Owner und macht interne Ableitungen compile-time-sichtbar. Weitere Abstraktion würde die Ownership eher verschleiern. Check: direktes Module-Boundary-Gate grün (1 Datei, 34 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R79 – `simulation/breaker-ontology-metrics.ts`

- **Behobener hoher Rationalisierungsbefund:** Das 271-zeilige Metrikmodul suchte ausschließlich nach historischen `structured_breaker_*`- und Ontology-Fallback-Evidence-Tokens. Eine vollständige produktive Erzeugersuche ergab für sämtliche entscheidenden Tokens null Erzeuger; alle 29 Reportmetriken waren damit dauerhaft null und täuschten vorhandene Beobachtbarkeit vor.
- Der verwaiste Summarizer ist vollständig entfernt, ebenso seine exklusiven Coverage-Key-Typen, Progression-Felder, Delta-Keys und die leere Benchmark-Reportsektion. Die weiterhin produktive Breaker-Doctrine, Deck-Capability-Ableitung und Engine-Quote-basierte Runbewertung bleiben unangetastet.
- Damit sinken Source-, Typ- und Reportoberfläche, statt tote Legacy-Telemetrie weiterzuführen. Checks: exakte Restreferenzsuche ohne Treffer, AI-Paket-Typecheck grün, direkt betroffene Match-Progression- und Benchmark-Report-Vitests grün (2 Dateien, 22 Tests), `git diff --check` grün.

### AI-R80 – `simulation/local-editable-benchmark-classification.ts`

- **Kein Produktionsfehler, behobene direkte Testlücke:** Der 23-zeilige Klassifikator besitzt eine klare Priorität: leeres Deck vor Kartenblockern, fehlende Karten vor unsupported/illegal, danach sonstige Validierungsfehler und zuletzt runnable.
- Diese Reihenfolge ist sinnvoll, weil ein leeres Deck keine belastbare Kartenklassifikation zulässt und konkrete Availability-/Supportblocker aussagekräftiger als das allgemeine `unclear` sind. Die Funktion verändert weder Deck noch Benchmarkstatus außerhalb ihrer Rückgabe.
- Da zuvor kein direkter Test existierte, sichern sechs fokussierte Fälle nun jede Statusklasse und die Blockerpriorität. Check: neuer direkter Vitest grün (1 Datei, 6 Tests), einzige produktive Referenz und Historie geprüft, `git diff --check` grün.

### AI-R81 – `simulation/runner-central-pressure-diagnostics-composition.ts`

- **Behobener niedriger Sauberkeitsbefund:** Die 89-zeilige Composition importierte den Funktionstyp `assessKnownRezzedIcePath`, verwendete ihn aber nirgends. Der verwaiste Import ist entfernt.
- Inhaltlich bleibt die Datei eine saubere dreistufige Verdrahtung: Remote-Threat/Closeout, No-Fresh-Central-Kontext und finale Simulationsdiagnostik. Sie erzeugt keine Live-Action und gibt nur die drei tatsächlich benötigten Diagnostikfunktionen zurück.
- Dependency-Weitergabe bleibt explizit und vermeidet eine zweite Pressure-Entscheidungsautorität. Check: direkt angrenzender Central-Pressure-Diagnostics-Vitest grün (1 Datei, 1 Test), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R82 – `runtime/runner-mu-pressure-assessment.ts`

- **Behobener hoher Akteursgrenzen-Befund:** Der MU-Assessor ist eine öffentliche Runner-Scoregrundlage, prüfte seine Inputseite aber nicht. Ein Corp-Input hätte Corp-Hand, -Klicks und -LegalActions teilweise als Runner-Memory-Situation ausgewertet und daraus Score-Evidence erzeugen können.
- Der Assessor verlangt nun vor jedem Zugriff explizit einen Runner-Input und scheitert bei falscher Verdrahtung sichtbar fail-closed. Die vorhandenen actionbezogenen Filter bleiben ergänzend erhalten; der Test stellt sicher, dass bei falscher Seite noch keine Runner-Dependency gelesen wird.
- Die 185-zeilige Datei bleibt kohärent: sichtbare MU-Fakten, Install-/Sacrifice-Risiko, Support-Verfügbarkeit, Severity und Evidence werden einmalig zusammengeführt. Checks: neuer direkter Boundary- und angrenzender Memory-Support-Vitest grün (2 Dateien, 4 Tests), `git diff --check` grün.

### AI-R83 – `runtime/ai-features.ts`

- **Behobener mittlerer Rationalisierungsbefund:** Zehn Felder (`side`, Clicks/Tags, Gegnerwerte, Draw-Tax, Hand-/Event-/Pressure-/Blocked-Server-Fakten) wurden aufwendig berechnet, hatten aber im gesamten produktiven Repository keinen Leser. Dadurch zog jeder Extract unnötig Event-History-, Draw-Tax- und Known-Path-Abhängigkeiten ein.
- Die Featureoberfläche enthält nun ausschließlich die sieben real konsumierten Werte für Search-Choice und Doctrine-Quality: Credits, MU-Rest, Non-Noisy-Breaker, Rig-Rollen/-Definitionen, Grip-Counts und Server-Features. Spezialisierte Draw-Tax- und Run-Path-Owner bleiben unverändert separat aktiv.
- Die Datei schrumpft von 156 auf 72 Zeilen; auch die Foundation-Composition verliert die vier exklusiv toten Dependencies. Checks: produktive Feldreferenzsuche ohne Treffer, AI-Paket-Typecheck grün, direkte Search-Choice- und Doctrine-Quality-Vitests grün (2 Dateien, 18 Tests), `git diff --check` grün.

### AI-R84 – `plans/corp-remote-project-assessment.ts`

- **Behobener hoher Rationalisierungsbefund:** Die 154-zeilige Remote-Project-/Central-Floor-Policy besaß im gesamten Repository keinen einzigen Aufrufer. Nur `index.ts` exportierte Funktionen und Typen; Live-Runtime, Planner, Simulation und Tests verwendeten sie nicht.
- Die verwaiste zweite Schutzband-/Recovery-Turns-Modellierung ist vollständig samt Public Exports entfernt. Das reduziert nicht nur tote Fläche, sondern verhindert eine mögliche Parallelpolicy neben den aktiven Scoreline-, Contestability-, Rez-Floor- und Remote-Doctrine-Ownern.
- Wegen der Version-0-Umgebung besteht keine Legacy-API-Pflicht ohne aktuellen Nutzen. Checks: vollständige Restreferenzsuche nur mit Prozessartefakt-Treffer, Public-Export-Vertrag grün (1 Datei, 4 Tests), AI-Paket-Typecheck und `git diff --check` grün.

### AI-R85 – `simulation/no-fresh-central.ts`

- **Behobener hoher Akteursgrenzen-Befund:** Closeout-, No-Fresh-Context-, Run-Event- und Substitution-Einstiege prüften ihre Runner-Seite nicht durchgehend. Corp-Inputs beziehungsweise Corp-Actions konnten dadurch Runner-Diagnostiktypen erzeugen, insbesondere wenn injizierte Rollen-/Economy-Helfer positiv antworteten.
- Alle vier Boundarys lehnen fremdseitige Daten nun konservativ ab, bevor Runner-Dependencies ausgewertet werden. Zusätzlich ist der dauerhaft `false` gesetzte, funktionslose `rndFreshness`-Zweig entfernt.
- **Mittlere Strukturverschuldung:** Mit 436 Zeilen bündelt die Datei True-Central-Closeout, No-Fresh-Kontext und Substitution-Klassifikation. Diese drei bereits klar getrennten Blöcke sollten bei weiterem Wachstum in interne Module zerlegt werden; ihre gemeinsame Diagnostik-Composition bleibt der Owner. Check: direkter Vitest mit Corp-Input/-Action grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R86 – `runtime/tag-avoidance-choice-option.ts`

- **Kein Änderungsbedarf:** Die 28-zeilige Funktion ist ein zulässiger Choice-Payload-Resolver. Sie greift nur bei exakt passender Engine-Choice-Quelle, `select_option` und genau einer Auswahl; danach wählt sie ausschließlich aus den bereits als selectable übergebenen Optionen.
- Fehlt eine action-gebundene Avoid-Option, liefert sie bewusst `pass`. Sie ändert weder Choice-ID noch Action-ID, bestimmt keine Karte außerhalb der LegalChoice und trifft keine vorgelagerte Strategieentscheidung.
- Konstante Source- und Option-Prefix-Bindungen machen die kleine Spezialregel explizit; weitere Abstraktion wäre schlechter lesbar. Check: zwei fokussierte Selected-Choice-Vitests für Avoid und Pass grün (1 Datei, 2 Tests; 81 nicht betroffene übersprungen), Aufrufer-/Historienprüfung und `git diff --check` grün.

### AI-R87 – `simulation/doctrine-quality-types.ts`

- **Kein Änderungsbedarf:** Die 13-zeilige Datei definiert exakt die acht Doctrine-Qualitätsmetriken, ihren `keyof`-Namenraum und den strukturgleichen Delta-Vertrag. Sie enthält keinerlei Laufzeitlogik.
- Der eigene Typowner wird von Tags, Aggregation, Benchmark, Reports und öffentlicher Simulationsoberfläche breit verwendet. Ein Inlining oder Wegfall würde zyklische beziehungsweise duplizierte Metrikdefinitionen erzeugen.
- Alle Felder werden in der Aggregation tatsächlich initialisiert und ausgewertet; tote Typfelder wurden nicht gefunden. Check: direkter Doctrine-Quality-Tag-Vitest grün (1 Datei, 6 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R88 – `evaluation/decision-checkpoints/runtime-checkpoint.ts`

- **Kein Änderungsbedarf:** Die 87-zeilige Datei exportiert und restauriert genau vier residente Runtime-Memory-Bereiche unter einer versionierten Schemaoberfläche. Alle Snapshots werden beim Grenzübertritt geklont, sodass Fixture und Live-Memory keine geteilten Mutationen besitzen.
- Beim Restore wird ein bestehendes Turn-Commitment ausdrücklich als Restart invalidiert und eine alte Execution Lease entfernt; damit wird kein vor dem Checkpoint erworbener Ausführungsbesitz wiederbelebt. Eine falsche Schemaversion scheitert sichtbar mit Migrationserfordernis.
- DeckSnapshot-/Engine-/Actor-Kompatibilität wird bewusst vom umgebenden Decision-Checkpoint-Validator gebunden; dieses Modul bleibt der Runtime-Memory-Serializer. Check: direkter Checkpoint-Runner-Vitest grün (1 Datei, 5 Tests), Public-Export-/Aufrufer-/Historienprüfung und `git diff --check` grün.

### AI-R89 – `simulation/simulation-action-diagnostics-context.ts`

- **Behobener mittlerer Rationalisierungsbefund:** Der 39-zeilige Context erzeugte zusätzlich einen gebundenen `centralRunEventGoodForTarget`-Helper und gab ihn zurück, aber kein Consumer destrukturierte oder verwendete diesen Wert. Auch die dafür existierende Factory hatte sonst keinen Aufrufer.
- Das tote Wiring und die exklusive Factory sind entfernt. Der Context liefert jetzt nur noch seine drei tatsächlich konsumierten Ableitungen: Source-Definition, Corp-Future-Run-Ice-Diagnostik und Definition-Lookup.
- Die eigentliche `centralRunEventGoodForTarget`-Policy bleibt im aktiven No-Fresh-Central-Owner direkt in Gebrauch; nur der nie konsumierte Adapter entfällt. Checks: Restreferenzsuche ohne Factorytreffer, AI-Paket-Typecheck grün, direkte No-Fresh- und Central-Pressure-Vitests grün (2 Dateien, 6 Tests), `git diff --check` grün.

### AI-R90 – `simulation/corp-tag-punish-window-composition.ts`

- **Kein Änderungsbedarf:** Die 121-zeilige Composition verdrahtet vier bestehende Owner in klarer Reihenfolge: Payoff-Profile, Tag-Source-Payoff, Window-Diagnostik und Tagged-Runner-Pressure. Sie trifft selbst keine Tag-, Payoff- oder Actionentscheidung.
- Die per `Omit` ausgeschlossenen Dependencies werden intern genau einmal aus den vorgelagerten Contexts geliefert. So verwenden Diagnostik und Score denselben Ontology-/Payoff-Fakt statt parallele Ableitungen aufzubauen.
- Die vier Rückgaben werden vom Corp-Scoring-Owner tatsächlich konsumiert; tote Compositionpfade wurden nicht gefunden. Checks: direkte Tag-Source-Payoff- und Window-Diagnostics-Vitests grün (2 Dateien, 8 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R91 – `candidate-path-binding.ts`

- **Behobener hoher Identitätsbefund:** `stateVersion` floss ungeprüft in Binding und `bindingKey`. `NaN`, Unendlichkeit, negative oder gebrochene Versionen konnten damit eine formal gebundene Action außerhalb eines gültigen Engine-Snapshots repräsentieren.
- Der Builder verlangt nun vor jeder Key-/Evidence-Erzeugung eine nichtnegative Safe-Integer-StateVersion und scheitert andernfalls sichtbar per `RangeError`. Signature-, Action-/Redacted-Ref-, Target-, Hard-Gate- und Hidden-Info-Blocker bleiben unverändert.
- Die 179-zeilige Datei bleibt eine klare Proof-/Redaction-Boundary und erzeugt keine LegalAction. Checks: direkter Binding- und angrenzender Dry-Run-Builder-Vitest einschließlich vier ungültiger Zahlenklassen grün (2 Dateien, 18 Tests), `git diff --check` grün.

### AI-R92 – `runtime/semantic-runtime-corp-evidence-context.ts`

- **Kein Änderungsbedarf:** Der 23-zeilige Context bindet den generischen Corp-Evidence-Builder an den konkreten sichtbaren Servertyp und stellt der Scoring-Composition genau eine typisierte Funktion bereit.
- Obwohl klein, ist er nicht funktionslos: Die explizite Dependency-Grenze verhindert, dass die große Scoring-Composition die Evidence-Implementierung oder deren Server-Generics dupliziert. Er trifft selbst keine Score- oder Actionentscheidung.
- Eine Wegnahme würde lediglich dieselbe Closure unbenannt in den Caller verschieben und die bestehende Context-Struktur inkonsistent machen. Check: Public-Export-Vertrag grün (1 Datei, 4 Tests), einzige produktive Compositionreferenz und Historie geprüft, `git diff --check` grün.

### AI-R93 – `simulation/plan-conversion-metrics.ts`

- **Behobener mittlerer Metrikbefund:** Bei jedem Meaningful-Progress-Eintrag wurden die zuletzt gemerkten Pläne beider Seiten als fortgeschritten markiert. Ein Corp-Score konnte dadurch einen unveränderten Runner-Plan vom Zähler `samePlanRepeatedWithoutProgress` ausnehmen und umgekehrt.
- Progress wird nun ausschließlich dem Plan der handelnden Seite gutgeschrieben. Die bestehende side-getrennte `lastPlanBySide`-Struktur erhält damit endlich auch bei ihrer Fortschrittsaktualisierung dieselbe Semantik.
- Die 247-zeilige Aggregation ist ansonsten geradlinig; komplexere strategische und Outcome-Followup-Metriken sind bereits ausgelagert. Checks: neuer direkter Side-Scoping- und angrenzender Strategic-Conversion-Vitest grün (2 Dateien, 2 Tests), `git diff --check` grün.

### AI-R94 – `runtime/card-definition-lookup.ts`

- **Behobener kritischer Hidden-Info-Boundary-Befund:** `visibleCardDefinition` löste jede vorhandene `definitionId` auf, ohne `card.known` zu prüfen. Ein fehlerhaft projizierter unbekannter `VisibleCard` mit verbliebener ID hätte dadurch seine vollständige Kartendefinition in zahlreiche Corp-/Runner-Heuristiken eingebracht.
- Die Lookup-Boundary verlangt nun ausdrücklich `known === true`; andernfalls liefert sie trotz vorhandener ID keine Definition. Direkte Definition-ID-Lookups für bereits action-/actor-gebundene interne Pfade bleiben separat und unverändert.
- Die 39-zeilige Datei bleibt eine kleine zentrale Sichtbarkeits- und Registry-Fassade. Checks: neuer direkter Known/Unknown-Vitest sowie angrenzende Corp-Score-State- und Upgrade-Placement-Verträge grün (3 Dateien, 18 Tests), `git diff --check` grün.

### AI-R95 – `plans/corp-opponent-campaign-continuity.ts`

- **Behobener kritischer Plan-first-Bindungsbefund:** `rootInstance` suchte für ein konkretes Score-Projekt zunächst dessen `dedupeKey`, fiel bei Fehlen aber still auf irgendeine Instanz desselben Moduls zurück. Eine Campaign für Projekt A konnte so den Root-Plan von Projekt B als Origin erhalten.
- Bei vorhandenem Dedupe-Key wird nun ausschließlich die exakt passende Planinstanz akzeptiert; ohne Treffer entsteht kein Descriptor. Der modulweite erste Treffer bleibt nur für Defense-Campaigns zulässig, die bewusst keinen projektspezifischen Key übergeben.
- **Hohe Strukturverschuldung:** Mit 762 Zeilen bündelt die Datei Descriptorbau, Reconciliation, Reaction-State, Public-Event-Projektion und Terminalstatus. Diese fünf Blöcke sollten als eigenes Folgepaket intern getrennt werden, ohne Campaign-Owner oder Schema aufzuteilen. Check: direkter Continuity-Vitest einschließlich Fremdprojekt-Gegenfall grün (1 Datei, 8 Tests), `git diff --check` grün.

### AI-R96 – `simulation/benchmark-local-editable-deck-resolver.ts`

- **Behobener hoher Dateigrenzen-Befund:** `reference.fileName` wurde direkt mit dem konfigurierten Deckverzeichnis verbunden. Relative `..`-Segmente oder Unterpfade konnten den Resolver veranlassen, eine JSON-Datei außerhalb dieses Verzeichnisses zu lesen.
- Basis- und Zieldatei werden nun absolut aufgelöst; akzeptiert wird nur ein einfacher Dateiname, dessen Parent exakt das konfigurierte Deckverzeichnis ist. Pfadverletzungen liefern vor jedem `existsSync`/Read einen strukturierten, nicht-runnable Fehler.
- Die 221-zeilige Datei bleibt ein klarer lokaler Import-/Validate-/Snapshot-Adapter; sie verändert keine Deckdatei. Checks: neuer direkter Traversal-Test für Slash-, Backslash- und Parent-Pfade sowie direkter Classification-Test grün (2 Dateien, 9 Tests), `git diff --check` grün.

### AI-R97 – `runtime/action-capacity-score-components.ts`

- **Behobener hoher Zahlenbefund:** Action-Debt, Projektion, Planbeitrag oder Dominance-Kapazität konnten `NaN`/Unendlichkeit bis in Scorekomponenten beziehungsweise einen Dominance-Record tragen. Besonders `Math.max(0, NaN)` blieb `NaN` und erzeugte trotzdem ein Ergebnisobjekt.
- Debt-Penalty, Benefit, Reliability, Risk-/Resource-Cost, finaler Value und beide Dominance-Kapazitäten werden nun vor Ausgabe explizit auf Endlichkeit geprüft. Ungültige Werte scheitern mit Action-ID und Zahlenrolle sichtbar per `RangeError`.
- Die 410-zeilige Datei ist groß, aber nach Score, Demand, Vergleichbarkeit, Kosten/Risiko und Helpers klar gegliedert; ein Split ohne zusätzlichen Ownergewinn ist derzeit nicht zwingend. Check: direkter Vitest mit Score- und Dominance-`NaN`-Gegenfall grün (1 Datei, 12 Tests), `git diff --check` grün.

### AI-R98 – `simulation/selected-action-id.ts`

- **Kein Änderungsbedarf:** Die achtzeilige Funktion erzeugt für side-sichere Simulationsberichte bewusst keine echte `actionId`, sondern nur die grobe, nicht rückführbare Klasse `side.type.targetServerId`. Damit gelangen weder Choice-Payload noch Karteninstanz, Handinformation oder Engine-Identität in diese Diagnose-ID.
- Der optionale Serverbezug stammt ausschließlich aus der unmittelbar vorgelagerten Simulation-Target-Projektion; sie liest explizite Serverfelder aus LegalAction/PublicEvent oder den sichtbaren Installationsort einer Corp-Karte. Die Funktion selbst trifft keine Action- oder Targetentscheidung.
- Die nicht eindeutige ID ist beabsichtigt: Consumer gruppieren Sequenzen nach Actionfamilie und Seite, nicht nach Engine-Aktionsinstanz. Eine echte `actionId` oder ein künstlicher Eindeutigkeitszähler würde die Redaktionsgrenze beziehungsweise die Aggregierbarkeit verschlechtern. Check: einziger produktiver Caller, Target-Projektion, Consumer und Historie geprüft; `git diff --check` grün.

### AI-R99 – `runtime/corp-access-payment-choice.ts`

- **Behobener mittlerer Choice-Vertragsbefund:** Der Resolver prüfte zwar Source-Form, StateVersion, Optionen und Engine-Kostenquote, band aber weder die kanonische `choiceId` noch die `hidden_info_barrier`-Sichtbarkeit. Außerdem akzeptierte der Source-Parser Integer außerhalb des exakt darstellbaren Zahlenbereichs als Effect- beziehungsweise Versionsindex.
- Die Choice muss nun die Engine-ID für den aktuellen Zustand und die private Sichtbarkeitsklasse besitzen; numerische Source-Segmente sind nur noch nichtnegative Safe Integer. Der eigentliche Payload bleibt unverändert auf die bereits aktuelle, action-gebundene LegalChoice und deren exakt zwei Engine-Optionen beschränkt.
- Mit 76 Zeilen ist die Boundary kompakt und geradlinig. Eine eigenständige Strategieentscheidung entsteht nicht: Bei vollständig zertifiziertem, bezahlbarem Ambush-Payment wird ausschließlich `pay` ergänzt, sonst scheitert der umgebende Window-Owner sichtbar. Check: drei fokussierte Access-Payment-Vitests einschließlich echter Engine-Choice und Unsafe-Integer-Gegenfall grün (1 Datei; 81 nicht betroffene Tests übersprungen), `git diff --check` grün.

### AI-R100 – `runtime/runner-hand-buffer-need.ts`

- **Kein Änderungsbedarf:** Die 78-zeilige Scorekomponente greift ausschließlich für Runner-`draw_card`-Actions und bezieht ihren Damage Floor aus dem zentralen Runner-Damage-Threat-Owner. Corp-Input und fremdseitige Actions werden vor jeder Bewertung abgewiesen.
- Der hohe Drawwert bei leerer beziehungsweise kleiner Hand ist nachvollziehbar abgestuft. Eine eng begrenzte Ausnahme erlaubt bei ausgeschöpfter dauerhafter Handkapazität genau vor einem sichtbar riskanten Run einen temporären Puffer; ein unmittelbar verfügbares Agenda-Scoring-Fenster verhindert diese Umleitung.
- Die Funktion wählt keine Action, sondern liefert eine einzelne Evidence-Komponente samt vollständiger Herleitung. Die doppelte Zahl `350` für zwei und drei Handkarten ist lesbar als bewusste gemeinsame Stufe und rechtfertigt kein Refactoring. Check: fokussierter Temporary-Hand-Buffer-Vitest grün (1 Datei, 1 Test; 7 nicht betroffene übersprungen), Aufrufer-/Historienprüfung und `git diff --check` grün.

### AI-R101 – `decision/pilot/remote-contest-candidate.ts`

- **Behobener hoher Zahlen-/Diagnostikkonsistenzbefund:** `NaN` als Score-Gap fiel durch sämtliche kleiner-als-Prüfungen und konnte einen Remote-Contest als `eligible` markieren, während das Readiness-Objekt gleichzeitig `score_gap_below_threshold` meldete. Nichtendliche Thresholds erzeugten ähnlich widersprüchliche Zustände und nichtportable Evidence.
- Für einen tatsächlich passenden report-only Remote-Contest-Candidate müssen übergebener Gap und Threshold nun endlich sein; `null` bleibt der ausdrücklich modellierte Zustand „kein Gap“ und wird weiterhin konservativ blockiert. Ungültige Zahlen scheitern sichtbar per `RangeError`, statt einen falschen Candidate zu erzeugen.
- Die 201-zeilige Datei bleibt strikt nichtproduktiv (`productiveUseAllowed: false`, kein Runtime-Consumer) und bewertet nur Shadow-League-Evidence. Check: direkter Vitest mit vier nichtendlichen Gegenfällen grün (1 Datei, 9 Tests), `git diff --check` grün.

### AI-R102 – `runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-components.ts`

- **Behobener hoher Zahlenbefund:** Die exportierte Reserve-Normalisierung begrenzte endliche Extremwerte korrekt, ließ bei `NaN` aber selbst `NaN` als Scorewert entstehen; Unendlichkeit wurde still auf ±100 gekappt und verbarg damit ebenfalls einen ungültigen Upstream-Wert.
- Der zentrale Normalisierungseinstieg verlangt nun Endlichkeit und scheitert bei ungültigen Rohwerten per `RangeError`. Zulässige Reservewerte werden weiterhin deterministisch durch den gemeinsamen Divisor skaliert, gerundet und auf den Consumerbereich von −100 bis 100 begrenzt.
- **Mittlere Strukturverschuldung:** Die rund 410 Zeilen bündeln acht Scoreline-/Install-Komponenten. Die Funktionen besitzen klare Einzelgrenzen und gemeinsame lokale Helfer; ein späterer Split nach Protection, Exposure und Funding wäre bei weiterem Wachstum sinnvoll, ist ohne weitere Verhaltensänderung aber kein Rationalisierungsgewinn. Check: fokussierter Normalisierungs-Vitest einschließlich `NaN` und Unendlichkeit grün (1 Datei, 1 Test; 23 nicht betroffene übersprungen), `git diff --check` grün.

### AI-R103 – `runtime/discard-plan.ts`

- **Kein Änderungsbedarf:** Die 116-zeilige Datei projiziert einen groben Keep-Plan für die bereits offene Discard-Entscheidung. Runner- und Corp-Pfade sind getrennt; Kartenrollen und -typen werden nur aus der eigenen Hand beziehungsweise dem eigenen Rig sowie aus dem side-sicheren Strategic-Intent-State gelesen.
- Economy-Untergrenzen, fehlende Breaker-/Setup-Rollen und Corp-Agenda-plus-Remote-Support haben nachvollziehbare lokale Priorität. Erst wenn keine dieser akuten Bedingungen greift, wird die bestehende strategische Familie deterministisch in einen Discard-Kontext übersetzt.
- Das Modul erzeugt weder eine LegalAction noch einen neuen Resident Plan; es liefert nur Planfit-Evidence für den Discard-Owner. Tokenmatching ist begrenzt und Evidence wird sortiert/dedupliziert. Check: direkter Discard-Plan-Vitest grün (1 Datei, 5 Tests), Aufrufer-/Historienprüfung und `git diff --check` grün.

### AI-R104 – `runtime/corp-tagged-payoff-window.ts`

- **Behobener niedriger Rationalisierungsbefund:** Die Context-Factory gab neben der tatsächlich konsumierten Passive-Penalty-Funktion auch `corpBestTaggedRunnerPayoffProfile` öffentlich zurück. Kein produktiver oder Test-Consumer verwendete diesen Rückgabewert; der Helper ist ausschließlich ein Implementierungsdetail der Penalty.
- Der tote Return-Vertrag ist entfernt, während die interne Best-Payoff-Suche unverändert genau dort bleibt, wo sie für den Window-Score gebraucht wird. Das reduziert die exportierte Context-Oberfläche, ohne einen Owner oder eine Funktion zu duplizieren.
- Die verbleibenden 178 Zeilen bewerten klar begrenzte Corp-Tag-Punish-Fenster, prüfen Input- und Action-Seite und priorisieren echte vorhandene Payoff-LegalActions vor passiven Zügen. Check: direkte Restreferenzsuche nur mit zwei internen Treffern und direkter Vitest grün (1 Datei, 3 Tests), `git diff --check` grün.

### AI-R105 – `runtime/runner-development-support-composition.ts`

- **Kein Änderungsbedarf:** Die 178-zeilige Composition verdrahtet fünf klar vorhandene Owner: Loan Liability, Viral-15-Jack-out, Hand-Funding, Persistent Install und Economy Commitment. Sie berechnet selbst weder Score noch Action, sondern liefert deren gebundene Funktionen an die Runner-Semantic-Composition.
- Gemeinsame DeckCapability-/StrategicIntent- und Kartenadapter werden genau einmal injiziert. Runtime- und Compatibility-Definitionen sind der etablierte zweigeteilte Kartenkatalog; die Definition- beziehungsweise RulesText-Adapter vereinheitlichen ihn am Consumer, statt eine dritte Kartenautorität aufzubauen.
- Alle Rückgaben werden über die direkt folgende Composition in Runtime oder Simulation weitergereicht. Die `Omit`-Verträge machen intern ersetzte Dependencies compile-time-sichtbar; weiteres Factory-Wrapping würde nur Indirektion erzeugen. Check: fokussiertes Plan-Continuity-/Memory-Ownership-Strukturgate grün (1 Datei, 1 Test; 33 nicht betroffene übersprungen), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R106 – `runner/hand-development/runner-hand-development-internal-types.ts`

- **Kein Änderungsbedarf:** Die 69-zeilige Datei enthält vier ausschließlich typseitige Verträge für Card Signals, Card Context, persistente Funktionsprofile und Breaker-Varianten. Sie besitzt keinerlei Laufzeit- oder Entscheidungslogik.
- Jeder Typ hat aktive Consumer im Hand-Development-Owner beziehungsweise dessen ausgelagerter Persistent-Install-Evaluation. Die umfangreichste Struktur, `PersistentFunctionalProfile`, hält die einmalig abgeleitete semantische Karte eines dauerhaften Runner-Tools zusammen; ihre Felder werden in den spezialisierten Vergleichs- und Blockerfunktionen verwendet.
- Das interne Modul verhindert, dass der bereits große Hand-Development-Owner seine gemeinsamen Typen dupliziert oder aus dem Evaluationsmodul importiert. Eine weitere Aufteilung von vier eng zusammengehörigen Verträgen wäre ohne Lesbarkeitsgewinn. Check: exakte Typreferenzen und Historie geprüft; als reiner Typowner kein eigener Laufzeittest erforderlich, `git diff --check` grün.

### AI-R107 – `simulation/regression/v143/exploit-regression-fixtures.ts`

- **Behobener kritischer Regressionsevidence-Befund:** Das Fixture `v143-visible-etr-blocker-no-repeat-run` prüfte ausschließlich, ob eine allgemeine 90-Aktionen-Simulation fehlerfrei und replaybar war. Es konnte daher grün werden, ohne je sichtbares ETR-ICE zu beobachten, und sogar dann, wenn der Runner den konkret verbotenen Known-Unbreakable-Run auswählte.
- Die Auswertung verlangt nun zuerst tatsächlich beobachtete `runnerKnownPathBlockedByKnownEtr`-Evidence. Fehlt die Fixture-Vorbedingung, ist das Ergebnis fail-closed rot; bei beobachtetem ETR schlagen sowohl ein Run gegen den bekannten unbreakable Path als auch ein Repeat trotz Suppression fehl. Unbekannte Fixture-IDs werden nicht mehr still als generischer Replaytest behandelt.
- Der 236-zeilige Runner enthält weiterhin zwei historische, voneinander getrennte Evaluatoren. Die synthetische R&D-Freshness-Projektion bleibt isolierte Regressionsevidence und gelangt nicht in Produktivinputs. Check: direkter Visible-ETR-Auswertungs-Vitest für fehlende Vorbedingung, korrektes Unterlassen und verbotenen Run grün (1 Datei, 1 Test; 2 nicht betroffene übersprungen), `git diff --check` grün.

### AI-R108 – `simulation/corp-visible-tag-payoff-category.ts`

- **Behobener hoher Akteursgrenzen-Befund:** Der öffentliche Corp-Payoff-Klassifikator prüfte weder die Input- noch die Action-Seite. Ein falsch verdrahteter Runner-Input beziehungsweise eine Runner-Action konnte über Ontologie, Legacy-Kind oder Rollen als Corp-Tag-Payoff kategorisiert werden.
- Fremdseitige Daten liefern nun sofort die konservative Kategorie `unknown`, bevor Ontologie- oder Rollen-Dependencies aufgerufen werden. Der vorgelagerte Opportunity-Owner filtert Corp-Inputs weiterhin zusätzlich; die lokale Boundary bleibt damit auch isoliert side-safe.
- Die 58-zeilige Factory ist ansonsten klar begrenzt: strukturierte Ontologie hat Vorrang, explizite historische Punish-Kinds folgen, begrenztes Rollenmatching ist die letzte bekannte Evidence. Check: direkter Vitest einschließlich Dependency-freiem Cross-Side-Gegenfall grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R109 – `simulation/benchmark-deck-slot-list.ts`

- **Behobener mittlerer Kapselungsbefund:** Der Listener kopierte zwar jedes Slot-Objekt, gab dessen verschachtelte `runner`- und `corp`-Referenzen aber direkt aus dem globalen Registry-Array zurück. Ein Script oder Test konnte diese Objekte mutieren und damit spätere Baseline-/Benchmarkläufe im selben Prozess unbemerkt verändern.
- Beide Deckreferenzen werden nun pro Aufruf mitkopiert. Der fünfzeilige Read-Adapter bleibt bewusst klein, liefert aber tatsächlich voneinander unabhängige Slot-Snapshots; tiefere mutable Ebenen existieren im Deckreference-Vertrag nicht.
- Das Modul ist trotz seiner Größe nicht wegrationalisierbar: Es bildet die Schutzgrenze zwischen statischem Registry-Owner und mehreren Scripts/Tests, die eine veränderbare Ergebnisliste benötigen. Check: neuer direkter Mutation-Isolation-Vitest grün (1 Datei, 1 Test), breite Aufruferprüfung und `git diff --check` grün.

### AI-R110 – `simulation/benchmark-deck-strategy-panel.ts`

- **Behobener mittlerer Klassifikationsbefund:** Corp-Archetypen wurden über ungebundene Substring-Suchen erkannt. Rollen wie `punishment_noise` oder `rescoring_noise` konnten dadurch fälschlich als Tag-Punish beziehungsweise Remote-Scoring in das Benchmark-Strategiepanel gelangen.
- Rollen werden nun einmal an technischen Separatoren tokenisiert; zusammengesetzte Archetypen verlangen die jeweiligen vollständigen Tokens. Die sechs etablierten Manifestrollen behalten exakt ihre Zuordnung, während zufällige Wortbestandteile konservativ `unknown` bleiben.
- Die 67-zeilige Datei hält Zielmatrix, Gap-Erzeugung und die unmittelbar zugehörige Rollenklassifikation kohärent zusammen. Missing-Gaps werden weiterhin deterministisch in Zielreihenfolge erzeugt. Check: direkter Strategiepanel-Vitest mit zwei False-Positive-Gegenfällen grün (1 Datei, 3 Tests), `git diff --check` grün.

### AI-R111 – `simulation/runner-setup-attribution-types.ts`

- **Hohe Strukturverschuldung und behobene direkte Testlücke:** Entgegen dem Dateinamen enthält das 1.081-zeilige Modul nicht nur rund 180 Metrikschlüssel und Typen, sondern auch Family-Klassifikation, Economy-, Search/Recovery-, Memory-, Hand-Size- und Normalized-Attribution sowie die Gesamtaggregation. Für diese Laufzeitlogik existierte kein eigener Test.
- Ein neuer fokussierter Test sichert nun die explizite Chosen-Family-Priorität und eine vollständige Legal-Hand-Size-Skip-Aggregation bis zu den Gesamtmetriken. Die geprüfte Zähllogik ist deterministisch und arbeitet ausschließlich auf side-sicheren Simulationssequenzen; Live-Entscheidungen werden nicht beeinflusst.
- **Empfohlene Umstrukturierung:** In einem eigenen Strukturpaket sollten Metrikvertrag, gemeinsame Classification-Helper und die vier Attribution-Familien in interne Module getrennt werden, während diese Datei nur die Aggregationsfassade behält. Ein mechanischer 1.000-Zeilen-Split in dieser Zufallsprüfung wäre wegen der großen Metrikoberfläche unverhältnismäßig riskant. Check: neuer direkter Vitest grün (1 Datei, 2 Tests), Referenz-/Historienprüfung und `git diff --check` grün.

### AI-R112 – `runtime/runner-loan-context.ts`

- **Kein Änderungsbedarf:** Die 211-zeilige Composition bindet den zentralen Loan-Liability-Assessor an die spezialisierten Owner für Runtime-Kontext, Run-Funding, Projected Spend, Funding Need, State Risk und Liability Policy. Sie enthält keine eigene Kredit- oder Actionentscheidung.
- Input- und Action-Seite werden im unmittelbar aufgerufenen Assessor vor jeder Dependency-Auswertung auf Runner begrenzt. Karten-, Rollen-, Kosten- und Strategieinformationen stammen aus bereits vorhandenen side-sicheren Runtime-Adaptern; die Composition führt keine zweite Definition- oder Planquelle ein.
- Die vier kleinen lokalen Adapter benennen die injizierten Loan-Abhängigkeiten und halten die große Dependency-Map lesbar. Alle nachgelagerten Policyfunktionen besitzen eigene fokussierte Tests; zusätzliche Composition-Abstraktion oder Inlining würde die Ownership eher verschleiern. Check: vollständige Dependency-/Aufrufer-/Historienprüfung und `git diff --check` grün; kein verhaltensändernder Pfad und daher kein zusätzlicher Laufzeittest erforderlich.

### AI-R113 – `access/access-outcome-memory.ts`

- **Behobener kritischer Identitäts-/Akteursgrenzen-Befund:** Die Ableitung beobachteter Remote-No-Progress-Memory prüfte die Runner-Seite nicht und schrieb `decisionId` in das als Matchbindung deklarierte Feld. Dadurch konnte ein Corp-Input Runner-Memory erzeugen, und Evidence war nur an eine einzelne Entscheidung statt an das aktuelle Match gebunden.
- Die Ableitung verlangt nun Runner-Seite und eine nichtleere actor-private `matchId`; fehlt eine der Bindungen, entsteht konservativ kein Memory. Der Record verwendet die tatsächliche Match-ID. Public-Event-, Known-Remote- und Fingerprint-Auswertung bleibt ausschließlich side-safe und unverändert.
- **Mittlere Strukturverschuldung:** Die 380 Zeilen vereinen immutable Memory-CRUD, Statuspolicy und historische Eventprojektion. Bei weiterem Wachstum sollten State-Store und Observed-History-Derivation getrennt werden; aktuell sind die Blöcke klar abgegrenzt und gemeinsam getestet. Check: zwei fokussierte Vitests für echte beobachtete Ableitung, Match-Evidence, fehlende Matchbindung und Corp-Seite grün (1 Datei; 11 nicht betroffene übersprungen), `git diff --check` grün.

### AI-R114 – `actions/action-card-semantic-profiles.ts`

- **Behobener hoher Cache-Kapselungsbefund:** Der Builder deklarierte seinen gecachten Registry-Record nur typseitig als `Readonly`, gab zur Laufzeit aber dasselbe vollständig mutable Objekt zurück. Ein Consumer konnte Profile, Arrays oder verschachtelte Ability-Semantik verändern und damit alle späteren KI-Entscheidungen im Prozess beeinflussen; Action-Capacity-Profile teilten zusätzlich direkt die Hint-Arrays.
- Der einmal gebaute kanonische Registrygraph wird nun rekursiv eingefroren. Action-Capacity-Profile und ihre `actionTypes` werden vorab eigens kopiert, sodass auch die Source-Hints nicht über die Projektionsoberfläche mutierbar sind. Die Cachewirkung und sämtliche semantischen Inhalte bleiben unverändert.
- Die 265-zeilige Datei ist als zentraler Hint-zu-Action-Semantic-Compiler mit kleinen Konvertern noch kohärent; Cache, Ability-, Target-, Risk-, Constraint- und Strategy-Projektionen sind klar getrennt. Check: direkter Profil-Vitest einschließlich Runtime-Immutability grün (1 Datei, 11 Tests), `git diff --check` grün.

### AI-R115 – `simulation/doctrine-quality-benchmark-types.ts`

- **Kein Änderungsbedarf:** Die 34-zeilige Datei definiert exakt den versionierten Doctrine-Benchmark-Resultvertrag und dessen Konfiguration. Sie enthält keinerlei Laufzeitlogik oder Defaulting.
- Baseline-/Candidate-Profil, Seeds, Quality-Snapshots, Delta, vier Safety-Deltas und beide vollständigen Runs sind gemeinsam notwendig, damit Runner und Report-Renderer dieselbe Evidence-Oberfläche verwenden. Die Config erweitert bewusst den zentralen League-Vertrag nur um Vergleichsprofile und Slotfilter.
- Beide Typen sind über die Simulationsfassade öffentlich und werden von Slot-, Benchmark- und Match-Progression-Runnern aktiv konsumiert. Ein Inlining würde Typduplikation oder zyklische Imports erzeugen. Check: vollständige Referenz-/Export-/Historienprüfung; als reiner Typowner kein Laufzeittest erforderlich, `git diff --check` grün.

### AI-R116 – `plans/tactical-plan-action-demands.ts`

- **Behobener hoher Plan-Zahlenbefund:** Die öffentlichen Derive-/Publish-Einstiege akzeptierten negative, gebrochene oder nichtendliche aktuelle Aktionszahlen. Der nachgelagerte generische Demand-Builder wandelte ungültige Werte still in null um; `NaN` im Follow-up-Target konnte ebenso einen formal vorhandenen Zero-Demand erzeugen.
- Aktuelle und berechnete Target-Aktionen müssen nun nichtnegative Safe Integer sein. Ungültige Plan-/Engine-Zahlen scheitern sichtbar per `RangeError`; gültige Targets werden weiterhin auf die bewusst gesetzte Obergrenze acht begrenzt.
- Die 219-zeilige Datei bleibt der einzige Übersetzer von Tactical-Plan-Zweck, Step, Hardness und Horizon in ActionDemand. Sie erzeugt keine Alternativplanung und erhält Plan-/Step-Ownership im Evidence-Vertrag. Check: direkter Vitest mit negativen, gebrochenen und `NaN`-Aktionszahlen grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R117 – `evaluation/doctrine-goal-action-fit.ts`

- **Behobener niedriger Effizienz-/Determinismusbefund:** Für jedes Goal und nochmals für jeden Candidate wurde dieselbe Liste legaler Action-IDs neu aufgebaut. Außerdem ließ der Fit-Sort bei gleichem Score die eingehende Candidate-Reihenfolge über den Top-Fit entscheiden.
- Die Legal-ID-Liste wird nun genau einmal je Fall erzeugt und für alle Goal-/Candidate-Scores wiederverwendet. Scoregleichstände werden stabil über `actionId` aufgelöst; Reportmetriken und Worklist bleiben unabhängig von zufälliger Candidate-Reihenfolge reproduzierbar.
- Die 190-zeilige Datei ist ausdrücklich report-only, side-safe-redacted und besitzt keine Runtime-Wirkung. Goal-Synthese, Fit-Scoring und Worklist-Zuordnung bleiben bei ihren bestehenden Ownern. Check: direkter Doctrine-Goal-Action-Fit-Vitest grün (1 Datei, 1 Test), `git diff --check` grün.

### AI-R118 – `run-analysis/runner-consumable-run-opportunity.ts`

- **Behobener hoher Akteurs-/Zahlenbefund:** Der öffentliche Runner-Quote-Einstieg prüfte die Inputseite nicht und ließ `NaN` beziehungsweise Unendlichkeit im Raw-Route-Score bis zum Effective Score und in die Evidence laufen. Ein Corp-Handzustand konnte so als Runner-Verbrauchskostenbasis dienen.
- Nur ein Runner-Input mit card-backed Eventprojektion erhält nun einen Quote; fremdseitige Inputs bleiben ohne Projektion. Für einen anwendbaren Quote muss der Raw-Score endlich sein, andernfalls scheitert die erzeugende Route sichtbar per `RangeError`.
- Die 114-zeilige Policy bleibt planlokal: Sie bewertet nur Opportunity Cost für bereits projizierte Event-Runs anhand eigener sichtbarer Handkopien, Handkapazität und konkretem Payoff. Sie erzeugt weder Target noch LegalAction. Check: direkter Vitest mit Corp- und `NaN`-Gegenfall grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R119 – `runtime/runner-economy-commitment-composition.ts`

- **Kein Änderungsbedarf:** Die 76-zeilige Composition verbindet exakt drei Owner: Bank-Investment, No-Run-Economy und Plan-Memory-Exclusion. Der Bank-Context liefert dabei den einzigen Run-Override und die Cash-out-Fakten an die beiden nachgelagerten Consumer.
- Die Typoberfläche schließt den intern erzeugten `runnerBankCommitmentRunOverride` per `Omit` aus und erlaubt für Plan Memory nur `previousPlan`. Damit kann der Caller weder eine zweite Override-Policy einschleusen noch fremde Memory-Dependencies an diese Ebene binden.
- Alle sechs Rückgabefunktionen werden in der übergeordneten Runner-Development-Composition tatsächlich weitergereicht. Die Datei enthält keine Score- oder Actionlogik und ist weder zu groß noch sinnvoll inlinebar. Check: bereits direkt betroffenes Plan-Continuity-/Memory-Ownership-Strukturgate grün (1 Datei, 1 Test), vollständige Rückgabe-/Historienprüfung und `git diff --check` grün.

### AI-R120 – `plans/corp-action-disposition-contributors.ts`

- **Behobener kritischer Akteursgrenzen-Befund:** Der zentrale Corp-Disposition-Pass war öffentlich aufrufbar, prüfte seine Inputseite aber nicht. Ein Runner-Input hätte die vollständige Corp-Domain-/Defense-/Score-/Economy-Auswertung betreten und im schlimmsten Fall fremdseitige Candidates als explizit unproduktiv markieren können.
- Der Einstieg verlangt nun vor dem ersten Fact- oder Domainzugriff einen Corp-Input und scheitert bei falscher Verdrahtung sichtbar. Die bestehende First-Match-Reihenfolge, exakten Planbindungen und `assessment_unknown`-Pfade bleiben unverändert.
- **Hohe Strukturverschuldung:** Mit 1.207 Zeilen ist die Datei klar zu groß. Sie sollte in einem eigenen Strukturpaket entlang der bereits vorhandenen Abschnitte Deckout/Draw, Economy/Rez, Defense, Scoreline, Ambush/Punish und Hand Management in interne Contributor zerlegt werden; eine zentrale Fassade muss die aktuelle Reihenfolge und genau eine Disposition je Candidate sichern. Ein ad-hoc Split wäre wegen der order-sensitiven Semantik in diesem Einzelpaket zu riskant. Check: direkter Vitest einschließlich frühem Cross-Side-Fail-Closed grün (1 Datei, 16 Tests), `git diff --check` grün.

## Konsolidierung

- Alle 60 fixierten Zufallspfade wurden vollständig geprüft und in je einem Paketcommit abgeschlossen: 38 Dateien beziehungsweise angrenzende Verträge wurden belastbar angepasst, 22 ohne funktionalen Änderungsbedarf bestätigt.
- Zwei obsolete produktive Module wurden samt toter Export-/Metrikoberfläche entfernt; sieben neue fokussierte Testdateien schließen direkte Regressionstestlücken. Insgesamt betrifft der Arbeitsstand 77 Dateien mit 1.609 Ergänzungen und 983 Entfernungen gegenüber dem Startstand.
- Die wichtigsten behobenen Fehlerklassen sind Akteurs-/Match-/Action-Bindungen, Hidden-Info-Lookup, Plan-first-Rootbindung, ungültige nichtendliche Zahlen, pfadunsicherer lokaler Deckzugriff, cross-side Simulationsmetriken, mutable Cache-/Registry-Referenzen und ein nur scheinbar verhaltensprüfendes Exploit-Fixture.
- Bewusst dokumentierte Strukturfolgen betreffen insbesondere `input-dto.ts`, `corp-opponent-campaign-continuity.ts`, `runner-setup-attribution-types.ts` und `corp-action-disposition-contributors.ts`; ihre Aufteilung benötigt eigene order- und ownership-sichernde Strukturpakete.
- Gezielte Final-Checks: `git diff --check` grün; AI-Paket-Typecheck grün; die vier beim Typecheck präzisierten direkt betroffenen Testdateien gemeinsam grün (4 Dateien, 101 Tests). Die je Paket ausgeführten fokussierten Checks stehen beim jeweiligen Review. Gemäß Auftrag wurde kein vollständiger AI-Shard-, Paket-, Workspace-, Build- oder E2E-Lauf ausgeführt.
- Der zwischenzeitlich um vier fremde Commits fortgeschrittene lokale `main` wurde konfliktfrei in den Arbeitsbranch übernommen. Der AI-Paket-Typecheck blieb auch auf diesem integrierten Stand grün; mangels überlappender Main-Änderungen waren keine zusätzlichen Laufzeittests erforderlich.
- Der Arbeitsbranch wurde per Fast-forward in den lokalen `main` integriert. Der Review-Worktree wurde ohne Force aus Git entfernt; sein ausschließlich aus leeren Installationsverzeichnissen bestehender Restbaum wurde nach verifizierter Dateizahl null gelöscht. Worktree-Pfad und gemergter Branch sind nachweislich nicht mehr vorhanden.

## Abschlusskriterien

- Alle 60 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
