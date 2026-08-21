# AI-Random-60-Source-Qualitätsprüfung

Status: AI-R86

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

## Abschlusskriterien

- Alle 60 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
