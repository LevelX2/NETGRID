# AI-Random-20-Source-Qualitätsprüfung

Status: abgeschlossen

## Quelle/Vorgabe

Nutzerauftrag vom 20.08.2026: Aus dem vollständigen Katalog produktiver KI-Source-Dateien 20 Dateien zufällig auswählen, jede Datei präzise auf Qualität prüfen und belastbare Anpassungen direkt in einem isolierten Worktree umsetzen.

## Zielprüfung

Der Auftrag ist für die automatische Abarbeitung ausreichend präzise. Die Stichprobe wird einmalig ohne Zurücklegen gezogen und danach nicht verändert. Ein Paket darf mit dem Ergebnis „kein Änderungsbedarf“ enden, muss diesen Befund aber mit Aufrufern, Tests und Architekturvertrag belegen.

## Gesamtziel

Zwanzig zufällig ausgewählte produktive KI-Dateien sequenziell auf Korrektheit, Plan-first-Ownership, Hidden-Info-Sicherheit, Geradlinigkeit, Struktur, Größe, Testbarkeit und Optimierungspotenzial prüfen; nur ursachenorientierte und belastbare Verbesserungen implementieren; jedes Einzelpaket verifizieren und committen; den fertigen Branch lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

## Annahmen

- Katalogbasis sind 650 produktive Nicht-Test-Dateien unter `packages/ai/src` einschließlich `simulation/` plus 7 direkte produktive `@netgrid/ai`-Integrationen außerhalb des Pakets.
- Ausgeschlossen sind `*.test.*`, `*.spec.*`, Test-Fixtures und `test-support`.
- Die alphabetische Katalognummer ist stabil für den Startstand `4ff18aa46f28e43f432b7b1e520710b1ebbed04a`.
- Zufallsauswahl erfolgt kryptografisch ohne Zurücklegen; die unten fixierte Reihenfolge ist verbindlich.
- Reine Stilpräferenzen rechtfertigen keine Änderung. Refactorings müssen Verantwortung, Lesbarkeit, Testbarkeit oder Architekturgrenzen messbar verbessern.

## Nicht-Ziele

- Keine allgemeine KI-Spielstärke-Initiative und keine neuen Kartenmechaniken.
- Keine zweite Entscheidungsautorität, kein Fallback und keine Legacy-Kompatibilität.
- Keine Änderungen an Engine-Regeln, LegalAction-Erzeugung oder Hidden-Info-Verträgen ohne einen konkret nachgewiesenen Fehler in der Stichprobe.
- Keine Server- oder Browserstarts aus dem Worktree.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität; KI reicht ausschließlich aktuelle `LegalActions` ein.
- Produktive KI bleibt Plan-first; genau ein fachlicher Owner je Entscheidung.
- Choice-Auflösung vervollständigt nur die Payload der exakt gebundenen Action.
- Nur side-sichere `PlayerView`, `PublicEvents`, `LegalActions` und freigegebene Metadaten dürfen einfließen.
- Determinismus, Replay, StateHash und Engine-RNG-Vertrag bleiben erhalten.
- Fehlerbehebung erfolgt an der erzeugenden Schicht und bleibt fail-closed.

## Automatische Fehlerbehandlung

- Zuerst engsten reproduzierenden Test beziehungsweise statische Referenzprüfung verwenden.
- Rote Tests ursachenbezogen analysieren; keine Abschwächung korrekter Invarianten.
- Unabhängige Baselinefehler separat dokumentieren und nicht in den Paketscope ziehen.
- Kein Paketwechsel vor erfülltem Done-Gate.

## Sicherheitsblocker

Gestoppt wird bei nicht auflösbarem Ownership-Konflikt, möglichem Hidden-Info-Leak ohne side-sicheren Fix, unklarer Engine-/AI-Autorität, fremden relevanten Änderungen im Zielpfad oder nicht sicher isolierbarem Testbetrieb. Ein Blockerbericht muss Ursache und Removal Condition nennen.

## State Machine

`vorbereitet -> AI-R01 -> ... -> AI-R20 -> Konsolidierung -> Final-Gates -> Main-Merge -> Cleanup -> abgeschlossen`

Genau ein Paket ist aktiv. `geprüft` bedeutet Analyse abgeschlossen; `angepasst` bedeutet Code/Test geändert; `committed` ist das Paket-Done-Gate.

## Paketfolge

| Paket  | Katalog | Datei                                                                      | Status             |
| ------ | ------: | -------------------------------------------------------------------------- | ------------------ |
| AI-R01 |     141 | `packages/ai/src/plans/corp-defense-domain-signals.ts`                     | geprüft, angepasst |
| AI-R02 |     106 | `packages/ai/src/evaluation/doctrine-goal-coverage.ts`                     | geprüft            |
| AI-R03 |     627 | `packages/ai/src/simulation/side-safe-input.ts`                            | geprüft, angepasst |
| AI-R04 |     185 | `packages/ai/src/plans/turn-completion-plan-module.ts`                     | geprüft            |
| AI-R05 |     261 | `packages/ai/src/runtime/corp-installed-economy-credit.ts`                 | geprüft            |
| AI-R06 |     629 | `packages/ai/src/simulation/simulation-action-source-definition.ts`        | geprüft            |
| AI-R07 |     206 | `packages/ai/src/runner-canonical-hint-semantics.ts`                       | geprüft            |
| AI-R08 |      98 | `packages/ai/src/evaluation/decision-checkpoints/checkpoint-runner.ts`     | geprüft            |
| AI-R09 |     163 | `packages/ai/src/plans/plan-resolution-failure.ts`                         | geprüft            |
| AI-R10 |     207 | `packages/ai/src/runner-damage-threat-assessment.ts`                       | geprüft, angepasst |
| AI-R11 |     609 | `packages/ai/src/simulation/runner-pressure-metrics.ts`                    | geprüft, angepasst |
| AI-R12 |      76 | `packages/ai/src/decision/semantic-shadow-decision.ts`                     | geprüft            |
| AI-R13 |     189 | `packages/ai/src/plans/turn-remainder-search.ts`                           | geprüft, angepasst |
| AI-R14 |     476 | `packages/ai/src/runtime/shell-traders-plan-signals.ts`                    | geprüft, angepasst |
| AI-R15 |     435 | `packages/ai/src/runtime/semantic-runtime-corp-board-score-composition.ts` | geprüft, angepasst |
| AI-R16 |      73 | `packages/ai/src/decision/semantic-decision-frame.ts`                      | geprüft            |
| AI-R17 |     227 | `packages/ai/src/runtime/ai-facade-foundation-context.ts`                  | geprüft, angepasst |
| AI-R18 |     581 | `packages/ai/src/simulation/random-legal-decision.ts`                      | geprüft, angepasst |
| AI-R19 |     644 | `packages/ai/src/simulation/tag-punish-ontology-diagnostics.ts`            | geprüft            |
| AI-R20 |     516 | `packages/ai/src/simulation/belief-simulation-world.ts`                    | geprüft, entfernt  |

## Paketdetails

Für jedes Paket gelten dieselben Schritte: Datei vollständig lesen; Import-/Aufrufer-/Testgraph und Git-Historie prüfen; Architektur-Owner bestimmen; konkrete Findings nach Schweregrad dokumentieren; bei belastbarem Befund minimal anpassen und Regressionstest ergänzen oder präzisieren; fokussierten Check sowie `git diff --check` ausführen; nur Paketänderungen committen; Status und Ergebnis in diesem Artefakt aktualisieren.

Done-Gate je Paket: Reviewbefund mit Fundstellen, begründete Änderungsentscheidung, passender fokussierter Check, sauberer Diff und eigener Commit.

Commit-Schema: `review(ai): complete AI-Rnn <kurztitel>` beziehungsweise bei Codefix ein präzises `refactor(ai):` oder `fix(ai):` mit Paketkennung im Body.

## Verifikationsregeln

- Pro Paket zunächst engster relevanter Vitest-/Typecheck-/Strukturcheck.
- Bei Typoberflächen oder Paketgrenzen: `corepack pnpm --filter @netgrid/ai typecheck`.
- Bei gemeinsamen AI-Verträgen oder Struktur: einschlägige `check:ai*`-Gates.
- Finaler bewusster Integrationscheckpoint: `corepack pnpm test:ai:shards`, AI-Typecheck, einschlägige Strukturchecks und `git diff --check`.
- Äußeres Zeitfenster fokussierter AI-Tests mindestens 180 Sekunden, vollständiger Gates mindestens 600 Sekunden.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_RANDOM_20_SOURCE_REVIEW`
- Branch: `codex/ai-random-20-source-review`
- Basis: lokaler `main` bei `4ff18aa46f28e43f432b7b1e520710b1ebbed04a`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket einzeln committen; keine fremden Änderungen anfassen.
- Vor Final-Merge aktuelles `main` in den Arbeitsbranch integrieren und relevante Gates erneut ausführen.
- Nach erfolgreichem Merge Worktree ohne `--force` entfernen, Entfernung doppelt prüfen und gemergten Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Random-20-Source-Qualitätsprüfung vollständig und sequenziell von AI-R01 bis AI-R20 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden AI-Architekturverträge und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Prüfe, verifiziere und committe jedes Paket. Bei Sicherheitsblocker stoppe mit Ursachenbericht und Removal Condition. Markiere das Goal erst nach Main-Prüfung, verifiziertem Worktree-Cleanup und Branch-Löschung als complete.`

## Ergebnisse

### AI-R01 – `corp-defense-domain-signals.ts`

- **Mittel, behoben:** `corpGlobalDefenseInstallRouteAssessment` konnte bei einer bekannten qualitativen Defense-Route `rezFundingGap: undefined` liefern, obwohl der Rückgabetyp eine Zahl verlangt. Ursache waren als null interpretierte optionale Mindestkosten und eine nachgelagerte Non-null-Assertion.
- Der Defense-Owner `corp.defend_servers`, Action-ID, Executor und Planroute bleiben unverändert. Der Fix leitet den Fallback-Gap aus dem aktuellen vollständigen Engine-Post-Install-Rez-Quote ab und scheitert bei einem unerwartet fehlenden Quote nach bereits bekannter Projektion sichtbar als `unknown`.
- **Niedrig, behoben:** Der direkte Test deckte den fehlenden numerischen Gegenfall nicht ab. Eine exakt gebundene aktuelle `install_card`-LegalAction mit side-sicherem sichtbarem ICE sichert nun `rezFundingGap: 0` für die bekannte finanzierte qualitative Route.
- **Final-Gate-Korrektur:** Der erste Fix hatte die bereits bestehende Prüfung des zusätzlichen Click-Bedarfs einer qualitativen Route versehentlich verkürzt. Dadurch wurde im bestehenden `match-3aac`-Checkpoint eine noch nicht ausführbare ICE-Route als unmittelbar produktiv eingestuft. Der Defense-Signalpfad verlangt jetzt wieder sowohl null zusätzliche Credits als auch null zusätzliche Clicks und liefert dennoch den numerischen Rez-Gap. Direkter Signaltest und `match-3aac`-Regression sind gemeinsam grün (2 Dateien, 8 Tests).
- **Mittel, nicht im Paket erweitert:** Die Datei ist mit 929 Zeilen und einer rund 495-zeiligen Hauptbewertung groß. Die Logik besitzt jedoch zusammenhängendes Defense-Ownership; eine Aufteilung ohne separate Vertragsarbeit hätte das Paket unnötig verbreitert. Empfohlen ist später eine verhaltensneutrale Extraktion der reinen Bindungs-, Kapazitäts- und Ergebnis-Klassifikatoren.
- Checks: fokussierter Vitest grün (1 Datei, 6 Tests); Prettier grün; `git diff --check` grün. AI-Typecheck erreicht keine Fehler in den Paketdateien, bleibt aber wegen bereits auf der unveränderten Basis vorhandener Fehler in `plan-first-live-runtime.test.ts`, `plan-first-live-runtime.ts`, `runner-program-install-trash-context.ts` und `selected-choices-for-decision.ts` rot.

### AI-R02 – `doctrine-goal-coverage.ts`

- **Kein Änderungsbedarf:** Die 123-zeilige Datei besitzt genau eine diagnostische Verantwortung, kennzeichnet Report und Rückgabetyp ausdrücklich als `diagnosticOnly`, `productiveUseAllowed: false` und `noRuntimeEffect: true` und prüft das Ergebnis vor Rückgabe side-safe.
- Anchor-Erkennung und Goal-Abdeckung entsprechen der konsumierten Doctrine-Synthese; die Datei wählt weder Pläne noch Actions. Schleifen, Zähler und deterministische Sortierung sind geradlinig und ohne auffällige Mehrfachautorität.
- Testabdeckung umfasst gezielte Covered-/Uncovered-Fälle, fehlende Diagnostik, Real-Engine-Corpus und Redaction. Fokussierter Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R03 – `side-safe-input.ts`

- **Mittel, behoben:** Gegenseitig referenzierende `toJSON`-Hooks wurden vor dem Eintrag in die `visiting`-Menge ausgewertet und konnten die beabsichtigte Zyklusdiagnose bis zum Stackoverflow umgehen. Die Zyklusgrenze liegt nun vor der Hook-Ausführung.
- **Mittel, behoben:** Nicht-plain Container ohne enumerable Keys, beispielsweise `Map`, wurden still als side-safe akzeptiert, obwohl ihre Einträge gar nicht geprüft wurden. Solche Werte scheitern jetzt sichtbar und fail-closed; Plain Objects, Arrays, boxed Strings und echte JSON-Projektionen bleiben unterstützt.
- Die Änderung betrifft ausschließlich den Simulationseingangs-Guard und erzeugt keine Plan-, Action- oder Choice-Autorität. Tests sichern verbotene Marker, Shared Objects, normale und zyklische `toJSON`-Hooks sowie nicht-plain Container.
- Checks: fokussierter Vitest grün (1 Datei, 8 Tests), Prettier grün, `git diff --check` grün.

### AI-R04 – `turn-completion-plan-module.ts`

- **Kein Änderungsbedarf:** Das 194-zeilige Modul besitzt eine enge, erforderliche Verantwortung: Es materialisiert ausschließlich die aktuelle Engine-Action `complete_turn`, wenn keine Klicks und keine produktive LegalAction-Route mehr vorhanden sind. Eine Entfernung würde dem Plan-first-Scheduler seinen expliziten P6-Owner für den normalen Turnabschluss nehmen.
- Die zunächst verdächtige Speicherung aktueller Action-IDs ist nicht stale: `reconcileResidentPlanPortfolio` aktualisiert `moduleState` bei jeder wiederentdeckten Proposal-Instanz aus dem aktuellen State. Die Materialisierung bindet zusätzlich nur IDs, die auch in den aktuellen LegalActions vorkommen.
- Action-Dispositionen dürfen nur bereits zentral als `explicitly_nonproductive` klassifizierte Routen ausnehmen; unbekannte Routen blockieren den Abschluss fail-closed. Es entstehen weder Strategieentscheidung noch Choice-Auflösung oder zweite Regelautorität.
- Die lokale State-Prüfung ist bewusst schmal, weil der Zustand ausschließlich vom eigenen Proposal-Builder erzeugt und beim Portfolio-Refresh strukturiert geklont wird. Zusätzliche defensive Stringprüfungen hätten hier keinen realen Fehlerpfad geschlossen.
- Checks: fokussierter Scheduler-Vitest grün (1 Datei, 42 Tests), `git diff --check` grün.

### AI-R05 – `corp-installed-economy-credit.ts`

- **Kein Änderungsbedarf:** Der neun Zeilen kleine Helper liest ausschließlich zwei explizite numerische Engine-Payloadfelder, wählt den größeren positiven endlichen Wert und liefert andernfalls konservativ null. Der frühere fehleranfällige Label-Parser ist bereits entfernt.
- Die Auslagerung ist trotz der geringen Größe sinnvoll: Sie bildet die öffentliche Runtime-Abhängigkeit für `corpTagPunishPayoffProfiles`, hält Engine-Payload-Semantik aus dem Scoring-Modul heraus und besitzt einen direkten Regressionstest. Ein Inline-Umbau würde nur Kopplung erhöhen.
- Der Aufrufer verifiziert anschließend Action-Typ, sichtbare Quellkarte und tatsächlich gespeicherte Credits; der Helper allein trifft keine Plan- oder Action-Entscheidung. Checks: fokussierter Vitest grün (1 Datei, 1 Test), `git diff --check` grün.

### AI-R06 – `simulation-action-source-definition.ts`

- **Kein Änderungsbedarf:** Die 32-zeilige Datei ist ein geradliniger Composition-Adapter: Sie bindet die zentrale side-safe Source-ID-Auflösung an den aktuellen `AiDecisionInput` und löst anschließend ausschließlich bekannte Runtime-/Card-Spec-Definitionen auf.
- Basisaktionen und `game_rule` werden bereits im delegierten zentralen Helper ausgeschlossen; Kartenquellen werden nur über `findVisibleCard` aus der PlayerView gelesen. Damit gibt es weder einen Hidden-State-Zugriff noch eigene Bewertungs- oder Planlogik.
- Die beiden kleinen Factory-Funktionen vermeiden eine zyklische Abhängigkeit zwischen Simulation, Runtime-Kontext und Kartenregistries. Zusammenlegen oder Inlining würde diese Schichtgrenze verschlechtern.
- Checks: konsumierender `no-fresh-central`-Vitest grün (1 Datei, 4 Tests), Prettier grün, `git diff --check` grün.

### AI-R07 – `runner-canonical-hint-semantics.ts`

- **Kein Änderungsbedarf:** Die 153-zeilige Datei zentralisiert schmale, reine Prädikate für kanonische strukturierte Runner-Hints. Alle Abfragen verwenden exakte `kind`-/`scope`-/`target`-Kombinationen statt Label-, Rollen- oder Freitextheuristiken.
- Die Trennung zwischen Effect- und Hint-Wrappern ist absichtlich: Doctrine-, Hand- und Plan-Aufrufer besitzen teils bereits Effektlisten, während Kartenbewertung komplette Hints hält. Die Wrapper delegieren ohne abweichende Semantik.
- R&D wird an genau einer Stelle auf den Ontologie-Scope `rnd` normalisiert; Prevention-Arten sind über ein typisiertes Set gebündelt. Laufzeit ist linear in den kleinen Effektlisten, ohne sinnvolles Optimierungspotenzial oder Ownership-Leak.
- Checks: direkter Vitest grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R08 – `evaluation/decision-checkpoints/checkpoint-runner.ts`

- **Kein funktionaler Änderungsbedarf:** Der Runner validiert und klont Fixtures, rekonstruiert Engine- und Runtime-Zustand, verwendet den produktiven Chooser, prüft die ausgewählte Action erneut gegen aktuelle LegalActions und wertet danach ausschließlich diagnostische Erwartungen aus. Runtime-Restore-Fehler werden strukturiert von Legalitäts- und Verhaltensdrift getrennt.
- Alle Felder des aktuellen Erwartungsvertrags besitzen einen exakten Matcher; Action-Matching liest Kartenidentitäten nur aus der side-sicheren PlayerView beziehungsweise expliziten LegalAction-Payloads. Die umfangreiche Fehlermeldung bleibt auf der lokalen Test-/Evaluationsebene und ist kein produktiver Spieler-Payload.
- **Niedrig, bewusst nicht umgebaut:** Mit 540 Zeilen ist die Datei groß. Rund zwei Drittel sind jedoch unabhängige reine Matcher, während die Orchestrierung geradlinig bleibt. Eine spätere verhaltensneutrale Extraktion nach `checkpoint-expectation-matchers.ts` würde Navigation und Einzeltests verbessern, schließt aktuell aber keinen Fehler und rechtfertigt im Stichprobenpaket keinen breiten Dateiumzug.
- Checks: direkter Checkpoint-Runner-Vitest grün (1 Datei, 5 Tests), `git diff --check` grün.

### AI-R09 – `plans/plan-resolution-failure.ts`

- **Kein Änderungsbedarf:** Die 185-zeilige Datei definiert den zentralen, typisierten Fail-closed-Fehlervertrag für Planauflösung. Code, fachlicher Owner und Removal Condition sind verpflichtend; optionale Plan-/Step-/Zählkontexte bleiben getrennt.
- Normalisierung dedupliziert und sortiert deterministisch, begrenzt Mengen und Textlängen und entfernt nicht side-sichere Zeichen, bevor Nachricht oder Evidence entstehen. Action-Payloads und Karteninformationen sind strukturell gar nicht Teil des Vertrags.
- Der Fehler ersetzt keine Ursache durch einen Fallback: Die Ganzzahlnormalisierung betrifft nur robuste Diagnosemetadaten; jeder Aufrufer wirft weiterhin. Katalog, Context, Formatter und Evidence bilden eine kohärente Verantwortung und sind angemessen dimensioniert.
- Checks: direkter Vitest grün (1 Datei, 3 Tests), `git diff --check` grün.

### AI-R10 – `runner-damage-threat-assessment.ts`

- **Hoch, behoben:** `runnerVisibleLethalIceDamageAssessment` bewertete jede garantiert ungebrochene Damage-Subroutine isoliert. Zwei einzeln nicht tödliche Subroutinen konnten deshalb zusammen flatlinen, ohne dass der Jack-out-Owner dies erkannte.
- Die Projektion führt garantierten Schaden und Core-Schaden jetzt über die sichtbare Reststrecke kumulativ. Run-weite und Net-/Core-Präventionspools werden genau einmal verbraucht; spezialisierte Prävention wird vor dem allgemeineren Run-Pool eingesetzt. Nur mit vollem aktuellem Creditpool bereits bezahlbar brechbare Subroutinen bleiben aus der garantierten Schadenssumme, sodass der Guard keine spekulative Unvermeidbarkeit erfindet.
- Ein Regressionstest sichert zwei sichtbare unbrechbare Net-Damage-Subroutinen gegen eine Dreikartenhand (`projectedDamage: 4`, Jack-out erforderlich). Planowner, aktuelle Action-ID und Choice-Payload bleiben unverändert; geändert wird ausschließlich die Risikoquote des bestehenden Runner-Run-Owners.
- **Mittel, strukturell:** Die Datei ist mit 1.100 Zeilen zu groß und vereinigt Deck-Belief, akute Run-Gefahr, Access-Ambush und Score-Komponenten. Eine Folgearbeit sollte diese vier reinen Domänenblöcke hinter dem bestehenden öffentlichen Vertrag extrahieren; ein gleichzeitiger Großumbau hätte den Sicherheitsfix unnötig verbreitert.
- Checks: zwei fokussierte Vitest-Dateien grün (22 Tests), Prettier grün, `git diff --check` grün. AI-Typecheck zeigt keine Fehler in den Paketdateien und bleibt nur wegen der bereits bei AI-R01 dokumentierten unveränderten Baselinefehler rot.

### AI-R11 – `simulation/runner-pressure-metrics.ts`

- **Niedrig, behoben:** `assessRunnerPressureReadyForMetrics` berechnete `visibleBreakCost`, verwendete den Wert aber seit der Umstellung auf die vollständige `creditsAfterPath`-Quote nirgends. Die tote Zwischenvariable ist entfernt.
- Die 307 verbleibenden Zeilen besitzen zwei klar getrennte diagnostische Ergebnisse: erreichbare wertvolle Pressure-Ziele und konkrete Breaker-Coverage-Lücken. Beide delegieren Wegkosten und Breakbarkeit an zentrale sichtbare Run-Analyse; das Modul wählt weder produktive Pläne noch Actions.
- Hidden-Info-Grenzen sind sauber: Hand, Heap und bekannte ICE werden nur aus PlayerView gelesen; unbekannte Karten werden nicht per Definition geraten. Sets deduplizieren Server, Rollen und Action-IDs deterministisch.
- Checks: zwei konsumierende Simulation-Vitest-Dateien grün (8 Tests), Prettier grün, `git diff --check` grün.

### AI-R12 – `decision/semantic-shadow-decision.ts`

- **Kein funktionaler Änderungsbedarf:** Die 591-zeilige Pipeline ist ausdrücklich Shadow-/Reportlogik (`noRuntimeEffect: true`). Sie erzeugt weder Action-Auswahl noch Choices und markiert Target-Choice-Zusammenfassungen zusätzlich als `reportOnly` und `productiveUseAllowed: false`.
- Jede LegalAction erscheint deterministisch entweder in `rankedActions` oder `rejectedActions`; fehlende semantische Kandidaten werden sichtbar ausgewiesen. Hard Gates liefern Score null und `blocked`, während die stabile Sortierung Score, Fitstatus, Goal-ID und Action-ID eindeutig auflöst.
- Zielbezogene Run-Chancen/-Bedrohungen verwenden den zentralen exakten Target-Alignment-Helper; Hidden-Info-blockierte Target-Kontexte erzeugen keine synthetische Target-Action. Kalibrierung bleibt explizit beziehungsweise rein diagnostisch per Environment-Profil.
- **Niedrig, strukturell:** Die Datei könnte später Trace-Formatting und Target-Choice-Reportbildung extrahieren; die eigentliche Rankingpipeline bleibt aber geradlinig. Ein Split ohne Verhaltensnutzen ist hier nicht erforderlich.
- Checks: zwei direkte/nahe Vitest-Dateien grün (26 Tests), `git diff --check` grün.

### AI-R13 – `plans/turn-remainder-search.ts`

- **Hoch, behoben:** Die als `potentialUpperBound` verwendete Pruning-Grenze addierte nur Prefix und unmittelbar nächsten Offer. Eine niedrig bewertete Abhängigkeitsbrücke konnte deshalb unter den Ein-Schritt-Partition-Floor fallen und abgeschnitten werden, obwohl ein noch innerhalb der Suchtiefe liegender dritter Schritt die beste Linie erzeugt hätte.
- Die Grenze ist jetzt tatsächlich optimistisch: Für verbleibende Tiefenslots addiert sie die größten positiven Werte aller noch nicht verwendeten Offers und ignoriert dabei bewusst Kosten, Dependencies und Konflikte. Diese Überapproximation kann nur weniger, niemals eine potenziell bessere Linie fälschlich prunen.
- Skalarer Floor-Prune wird außerdem nur bei identischer Coverage-Signatur, Priority-Class und Root-Preference angewandt; diese Felder liegen in der finalen lexikographischen Auswahl vor dem Skalarwert. Der bestehende Planowner, CurrentLegalAction-Binding und deterministische Budgetvertrag bleiben unverändert.
- Regression: Eine `opener -> bridge -> conversion`-Kette mit Werten `1 + 0 + 20` schlägt den Floor `12` und bleibt nun im Pareto-Frontier. **Strukturell:** 1.227 Zeilen sind zu groß; Search-Orchestrierung, Projektion, Pruning und Pareto-Vergleich sollten später verhaltensneutral in interne Module geteilt werden.
- Checks: direkter Remainder-Search-Vitest grün (1 Datei, 16 Tests), Prettier grün, `git diff --check` grün.

### AI-R14 – `runtime/shell-traders-plan-signals.ts`

- **Mittel, behoben:** Die Rig-Replacement-Quote sortierte Programme einzeln nach Verdrängungswert und nahm dann greedily den Prefix bis zur benötigten MU. Das minimiert die Gesamtkosten nicht: Zwei kleine Programme mit je 140 Verdrängung konnten vor einem einzelnen 2-MU-Programm mit 260 gewählt werden (280 statt 260).
- Eine deterministische dynamische Auswahl hält jetzt für jede bis zum Bedarf gekappte MU-Summe die beste Kombination. Vergleichsreihenfolge ist: keinen anderen Coverage-Gap zerstören, geringster Gesamt-Verdrängungswert, wenigste Karten, geringster MU-Überschuss, stabile Instance-ID. Die Zustandszahl bleibt durch den kleinen erforderlichen MU-Bedarf begrenzt.
- Bei insgesamt zu wenig freisetzbarer MU bleibt der bestehende fail-closed Status `unknown` mit vollständiger sichtbarer Kandidatenliste. Pipeline-Owner, exakte Shell-Traders-Action und Targetbindung ändern sich nicht.
- Regression: Für 2 MU Bedarf wird ein einzelner Decoder mit Verdrängungswert 260 statt zwei je 1-MU-Dwarfs mit zusammen 280 gewählt. Checks: direkter Signaltest plus Planmodultest grün (2 Dateien, 61 Tests), Prettier grün, `git diff --check` grün.

### AI-R15 – `runtime/semantic-runtime-corp-board-score-composition.ts`

- **Niedrig, behoben:** Der Composition Root destrukturierte `semanticRuntimeCorpVisibleServerCard`, reichte ihn aber weder an eine Subcomposition weiter noch exportierte er ihn. Die tote Bindung ist entfernt; sichtbare Serverkarten werden im übergeordneten Scoring-Root weiterhin explizit über dessen Dependency eingebunden.
- Die nur 124 Zeilen sind trotz vieler Rückgabefunktionen geradlinig: Board-Bindung, Risiko, Funding/Contestability und Remote-Score werden jeweils genau einmal erzeugt und über benannte Abhängigkeiten verdrahtet. Eigene Bewertungslogik oder ein paralleler Owner entsteht nicht.
- Der explizite `Omit`-Vertrag verhindert, dass Aufrufer zentrale Board-Funktionen überschreiben und so doppelte Autorität einschleusen. Eine weitere Aufteilung wäre für diesen reinen Composition Root kontraproduktiv.
- Checks: Board-, Remote-Score- und Modulgrenzen-Vitest grün (3 Dateien, 63 Tests), Prettier grün, `git diff --check` grün.

### AI-R16 – `decision/semantic-decision-frame.ts`

- **Kein Änderungsbedarf:** Der 203-zeilige Builder erzeugt einen deterministischen, side-sicheren Diagnoseframe aus `AiDecisionInput`. Kandidaten außerhalb der aktuellen LegalAction-ID-Menge scheitern sichtbar; gültige Kandidaten werden exakt in Engine-Reihenfolge angeordnet.
- Doctrine-Diagnostik wird nur akzeptiert, wenn alle Report-only-/No-effect-Invarianten erfüllt sind. Anschließend prüft der zentrale Redaction-Guard das gesamte Objekt einschließlich frei typisiertem `beliefSummary`, Evidence und verschachtelten Runner-Daten vor Rückgabe.
- EconomyContext verwendet ausschließlich eigene sichtbare Credits/Klicks und die bereits side-sichere Runner-Posture. Die Datei besitzt einen klaren DTO-/Boundary-Owner, keine Actionwahl und keine Engine-Regeln; Größe und Aufbau sind angemessen.
- Checks: direkter Vitest grün (1 Datei, 8 Tests), `git diff --check` grün.

### AI-R17 – `runtime/ai-facade-foundation-context.ts`

- **Niedrig, behoben:** Der Foundation-Root reichte `rolesForAction` an `createSimulationActionDiagnosticsContext`, obwohl dieser Adapter die Abhängigkeit nie verwendete. Der tote Parameter und der dadurch unnötige `LegalAction`-Typimport sind an der empfangenden Schicht entfernt.
- Der 112-zeilige Composition Root bleibt ansonsten sauber: Eine Hint-Map wird einmal erstellt und gemeinsam an Rollen-/Featurekontexte gebunden; Tag-Punish- und Simulationsdiagnostik erhalten nur ihre expliziten Dependencies. Alle Rückgaben werden vom übergeordneten Diagnostics-Root konsumiert.
- Die Änderung reduziert Kopplung, ohne Rollenlogik, Simulationsergebnis oder produktive Planownership anzufassen. Sie korrigiert zugleich den bei AI-R06 zunächst nur statisch geprüften Adaptervertrag.
- Checks: konsumierender Simulations- und Modulgrenzen-Vitest grün (2 Dateien, 38 Tests), Prettier grün, `git diff --check` grün.

### AI-R18 – `simulation/random-legal-decision.ts`

- **Hoch, behoben:** Bei leerer LegalAction-Menge gab der Random-Bot eine `AiDecision` mit `actionId: ""` zurück. Das war keine LegalAction, verletzte den Engine-/AI-Vertrag und verschob die echte Ursache auf die spätere generische Meldung `simulation_selected_action_not_legal`.
- Der Pfad wirft nun unmittelbar einen strukturierten `PlanResolutionFailure(no_current_route_head)` mit Owner `rules_contract` und konkreter Removal Condition. Ein vertragswidriger RNG-Index scheitert ebenfalls sichtbar als `executor_invariant_broken`, statt still auf die erste Action zurückzufallen.
- Der normale Pfad sortiert weiterhin eine Kopie der aktuellen LegalActions deterministisch, zieht genau einen Seed-/Counter-basierten Index und vervollständigt nur dessen Choices. Der Eingabearray wird nicht mutiert.
- Neue direkte Tests sichern den fail-closed Leerfall und die Auswahl ausschließlich aus der stabil sortierten LegalAction-Menge. Checks: Random-Decision- und Runtime-Failure-Vitest grün (2 Dateien, 6 Tests), Prettier grün, `git diff --check` grün.

### AI-R19 – `simulation/tag-punish-ontology-diagnostics.ts`

- **Kein Änderungsbedarf:** Der 37-zeilige diagnostische Akkumulator bildet exakt die strukturierte Ontology-Assessment auf boolesche Simulationsflags sowie deduplizierte, sortierte Effect-/Condition-Kinds ab. Ohne Assessment verändert er nichts.
- Er trifft keine Tag-, Trace-, Payoff-, Plan- oder Actionentscheidung; die produktive Klassifikation bleibt vollständig im `tag-punish-ontology-consumer`. Legacy-Konflikte werden nur sichtbar markiert und nicht per Fallback aufgelöst.
- Die kontrollierte In-place-Aktualisierung entspricht dem mutablen Action-Sequence-Diagnostikvertrag und vermeidet unnötige Objektkopien pro Simulationsaktion. Zusammenlegen mit dem großen Metrikaggregator würde die klare Event-/Aggregate-Grenze verschlechtern.
- Checks: Ontology-Consumer- und Window-Diagnostics-Vitest grün (2 Dateien, 6 Tests), Prettier grün, `git diff --check` grün.

### AI-R20 – `simulation/belief-simulation-world.ts`

- **Mittel, behoben durch Entfernung:** Die 20-zeilige Factory hatte im gesamten Repository keinen Aufrufer; sie war nur aus dem öffentlichen Simulation-Barrel exportiert. Das zugehörige `SimulationWorld`-Objekt konnte zwar als `beliefWorld` durch Selfplay-Mining-Konfiguration weitergereicht werden, wurde aber vom Simulator oder irgendeinem Auswerter nirgends gelesen.
- Damit war nicht nur die Datei, sondern der komplette Vertrag tote Oberfläche. In der privaten Version-0-Umgebung ohne Kompatibilitätszwang wurden Factory-Datei, Barrel-Export, `SimulationWorld`-Typ, Configfeld und wirkungslose Weiterleitung vollständig entfernt.
- `reconstructBeliefState` selbst bleibt unangetastet und wird weiterhin von seinen produktiven/diagnostischen Eigentümern genutzt. Es gibt keinen Ersatzwert, Adapter oder Legacy-Alias.
- Checks: Selfplay-Trace-Mining-, Simulation-Harness- und Modulgrenzen-Vitest grün (3 Dateien, 92 Tests), Prettier grün, globale Referenzsuche findet außer diesem Reviewbericht keinen verbliebenen Symbol-/Pfadverweis, `git diff --check` grün.

## Konsolidiertes Qualitätsurteil

- **Stichprobe:** 20 von 657 produktiven KI-Source-Dateien des fixierten Startkatalogs, kryptografisch zufällig und ohne Zurücklegen gezogen.
- **Ergebnis:** 10 Dateien ohne belastbaren Änderungsbedarf; 9 ausgewählte Dateien mit ursachenorientierter Anpassung; 1 ausgewählte Datei samt vollständig ungenutztem Vertragsstrang entfernt. Zugehörige Tests und direkte Adapterdateien wurden nur dort mitgeändert, wo der Befund dies erforderte.
- **Korrektheit:** Drei hoch priorisierte Fehler wurden geschlossen: kumulative sichtbare Flatline-Gefahr, unsicheres Remainder-Search-Pruning und eine ungültige Random-Bot-Sentinelentscheidung. Weitere mittlere Befunde betrafen numerische Defense-Quotes, Side-safe-Container/Zyklen, Shell-Traders-MU-Optimierung und tote Belief-World-API.
- **Architektur:** In keinem Fix entstand ein neuer Plan-, Resolver-, Choice- oder Engine-Owner. Änderungen blieben bei `corp.defend_servers`, Runner-Run-Risiko, Turn-Remainder-Search, `runner.shell_traders_pipeline`, Simulation-Boundaries beziehungsweise reinen Composition-/Diagnostikadaptern.
- **Größe/Struktur:** Die meisten zufällig getroffenen Dateien sind klein und bewusst spezialisiert. Konkreter späterer Split-Bedarf besteht vor allem bei `runner-damage-threat-assessment.ts` (1.100 Zeilen) und `turn-remainder-search.ts` (1.227 Zeilen); `checkpoint-runner.ts` und `semantic-shadow-decision.ts` sind groß, aber intern bereits als reine Matcher-/Reportpipeline gegliedert.
- **Wegrationalisierung:** Kleine Dateien wurden nicht nach Zeilenzahl bewertet. `turn-completion-plan-module.ts`, der Economy-Credit-Helper und mehrere Composition-Adapter sind klein, aber besitzen nachweisbare Owner-/Schichtfunktion. Nur `belief-simulation-world.ts` war wirklich wirkungslos und wurde deshalb inklusive des gesamten ungenutzten Vertrags entfernt.

### Priorisierte Folgeempfehlungen außerhalb der Stichprobe

1. `runner-damage-threat-assessment.ts` verhaltensneutral in Deck-Belief, akute Encounter-Gefahr, Access-Ambush und Score-Komponenten teilen.
2. `turn-remainder-search.ts` entlang Search-Orchestrierung, Projection Application, Pruning und Pareto-Vergleich in interne Module zerlegen; dabei die neuen optimistischen Bound-Invarianten als Strukturtest sichern.
3. `checkpoint-runner.ts`-Matcher bei der nächsten Vertragserweiterung extrahieren, nicht als isoliertes Stilrefactoring.

## Finale Verifikation

- Der aktuelle lokale `main` (`1184b50d4`) wurde einschließlich des während der Final-Gates hinzugekommenen Engine-Fixes zweimal konfliktfrei in den Arbeitsbranch integriert. Nach dem letzten Abgleich bestanden die fokussierten Regressionen für alle geänderten Risikopfade und Strukturgrenzen erneut: 11 Testdateien, 151 Tests grün. Der zusätzliche Vergleichslauf der bekannten roten Checkpoints bestätigte zuvor 15 bestehende Fehlschläge bei 77 grünen Tests; `match-3aac` und der aktualisierte Deck-Vollständigkeitstest sind grün.
- Der vollständige AI-Gate-Lauf `corepack pnpm test:ai:shards` führte alle drei Shards mit je einem Worker aus. Ergebnis nach Main-Abgleich: Shard 1 mit 170 grünen/3 roten Dateien und 1.797 grünen/6 roten Tests; Shard 2 mit 172 grünen/1 roter Datei und 1.563 grünen/2 roten Tests; Shard 3 mit 167 grünen/6 roten Dateien und 1.126 grünen/7 roten Tests. Insgesamt sind 4.486 Shard-Tests grün; die 15 roten Shard-Tests verteilen sich auf die bereits bekannten Checkpoints `e6aca`, `f450-10311`, `latest-two-corp`, `match-424a`, `match-5f7924`, `match-9d15`, `match-fd7671`, `random-selfplay-loop-round-one`, `selfplay-cycle-015` und `last-call-at-rd`.
- Ein vollständiger Kontrolllauf im temporären, unveränderten Startstand `4ff18aa46` reproduzierte alle diese Fehlerbilder bereits vor den Stichprobenänderungen (damals zusätzlich der inzwischen auf `main` korrigierte Deck-Vollständigkeitstest). Er zeigte 6/3/7 rote Tests in den drei Shards. Nach der zwischenzeitlich entdeckten R01-Regression war `match-3aac` dort grün, auf dem Arbeitsbranch rot; nach der Ursachenbehebung ist der Checkpoint auch auf dem finalen Arbeitsbranch wieder grün. Der temporäre Baseline-Worktree wurde danach vollständig aus Git und vom Dateisystem entfernt.
- AI-Hint-Metadaten, Source-Structure (`production=649`, keine Runtime-/Typzyklen), Source-Reachability und `git diff --check` sind grün. Der kombinierte `check:ai` bleibt ausschließlich wegen sechs bereits außerhalb der Stichprobe liegenden, unklassifizierten Card-ID-Vorkommen in `resident-plan-portfolio.ts`, `plan-first-live-runtime.ts` und `selected-choices-for-decision.ts` rot.
- Der AI-Typecheck bleibt mit zwölf bereits vor der Stichprobe vorhandenen Fehlern in `plan-first-live-runtime.test.ts`, `plan-first-live-runtime.ts`, `runner-program-install-trash-context.ts` und `selected-choices-for-decision.ts` rot. Keine geänderte oder entfernte Stichprobendatei erzeugt einen TypeScript-Fehler.
- Abschlussbewertung: Die roten globalen Gates sind unabhängig und bereits im fixierten Ausgangsstand nachgewiesen. Die Stichprobe führt nach dem Main-Abgleich keine neue Test-, Struktur-, Reachability-, Ownership- oder Typregression ein.

## Abschlusskriterien

- Alle 20 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Finale AI-Gates sind grün oder unabhängige Baselineabweichungen eindeutig getrennt.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
