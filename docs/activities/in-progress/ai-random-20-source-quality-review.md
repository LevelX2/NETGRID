# AI-Random-20-Source-Qualitätsprüfung

Status: aktiv (`AI-R10`)

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

| Paket | Katalog | Datei | Status |
| --- | ---: | --- | --- |
| AI-R01 | 141 | `packages/ai/src/plans/corp-defense-domain-signals.ts` | geprüft, angepasst |
| AI-R02 | 106 | `packages/ai/src/evaluation/doctrine-goal-coverage.ts` | geprüft |
| AI-R03 | 627 | `packages/ai/src/simulation/side-safe-input.ts` | geprüft, angepasst |
| AI-R04 | 185 | `packages/ai/src/plans/turn-completion-plan-module.ts` | geprüft |
| AI-R05 | 261 | `packages/ai/src/runtime/corp-installed-economy-credit.ts` | geprüft |
| AI-R06 | 629 | `packages/ai/src/simulation/simulation-action-source-definition.ts` | geprüft |
| AI-R07 | 206 | `packages/ai/src/runner-canonical-hint-semantics.ts` | geprüft |
| AI-R08 | 98 | `packages/ai/src/evaluation/decision-checkpoints/checkpoint-runner.ts` | geprüft |
| AI-R09 | 163 | `packages/ai/src/plans/plan-resolution-failure.ts` | geprüft |
| AI-R10 | 207 | `packages/ai/src/runner-damage-threat-assessment.ts` | aktiv |
| AI-R11 | 609 | `packages/ai/src/simulation/runner-pressure-metrics.ts` | ausstehend |
| AI-R12 | 76 | `packages/ai/src/decision/semantic-shadow-decision.ts` | ausstehend |
| AI-R13 | 189 | `packages/ai/src/plans/turn-remainder-search.ts` | ausstehend |
| AI-R14 | 476 | `packages/ai/src/runtime/shell-traders-plan-signals.ts` | ausstehend |
| AI-R15 | 435 | `packages/ai/src/runtime/semantic-runtime-corp-board-score-composition.ts` | ausstehend |
| AI-R16 | 73 | `packages/ai/src/decision/semantic-decision-frame.ts` | ausstehend |
| AI-R17 | 227 | `packages/ai/src/runtime/ai-facade-foundation-context.ts` | ausstehend |
| AI-R18 | 581 | `packages/ai/src/simulation/random-legal-decision.ts` | ausstehend |
| AI-R19 | 644 | `packages/ai/src/simulation/tag-punish-ontology-diagnostics.ts` | ausstehend |
| AI-R20 | 516 | `packages/ai/src/simulation/belief-simulation-world.ts` | ausstehend |

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

## Abschlusskriterien

- Alle 20 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Finale AI-Gates sind grün oder unabhängige Baselineabweichungen eindeutig getrennt.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
