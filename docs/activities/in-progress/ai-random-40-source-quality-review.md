# AI-Random-40-Source-Qualitätsprüfung

Status: AI-R57

## Quelle/Vorgabe

Nutzerauftrag vom 20.08.2026: Nach der abgeschlossenen ersten Zufallsprüfung 40 weitere produktive KI-Source-Dateien zufällig auswählen, jede Datei präzise auf Qualität prüfen und belastbare Anpassungen direkt in einem isolierten Worktree umsetzen.

## Zielprüfung

Der Auftrag ist für die direkte automatische Abarbeitung ausreichend präzise. Die bereits geprüften 20 Pfade werden ausgeschlossen; die nicht mehr vorhandene Datei `belief-simulation-world.ts` zählt ebenfalls zur Ausschlussliste. Die neue Stichprobe wird einmalig ohne Zurücklegen gezogen und danach nicht verändert.

## Gesamtziel

Vierzig weitere zufällig ausgewählte produktive KI-Dateien sequenziell auf Korrektheit, Plan-first-Ownership, Hidden-Info-Sicherheit, Geradlinigkeit, Struktur, Größe, Testbarkeit und Optimierungspotenzial prüfen; nur ursachenorientierte und belastbare Verbesserungen implementieren; jedes Einzelpaket ausschließlich mit direkt änderungsnahen Tests und Checks verifizieren und committen; den fertigen Branch lokal nach `main` integrieren und Worktree sowie Branch verifiziert entfernen.

## Annahmen

- Katalogbasis sind 656 produktive Nicht-Test-Dateien unter `packages/ai/src` einschließlich `simulation/` plus 5 direkte produktive `@netgrid/ai`-Integrationen außerhalb des Pakets.
- Ausgeschlossen sind `*.test.*`, `*.spec.*`, `test-support`, `__tests__` und sämtliche Pfade der ersten 20er-Stichprobe.
- Die alphabetische Katalognummer ist stabil für den Startstand `c7fa6120bedbdea0b09693f7d2f66bb56d4040e6`.
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

`vorbereitet -> AI-R21 -> ... -> AI-R60 -> Konsolidierung -> gezielte Final-Checks -> Main-Merge -> Cleanup -> abgeschlossen`

Genau ein Paket ist aktiv. `geprüft` bedeutet Analyse abgeschlossen; `angepasst` bedeutet Code/Test geändert; `committed` ist das Paket-Done-Gate.

## Paketfolge

| Paket | Katalog | Datei | Status |
| --- | ---: | --- | --- |
| AI-R21 | 28 | `packages/ai/src/actions/action-target-context.ts` | geprüft |
| AI-R22 | 424 | `packages/ai/src/runtime/runner-viral15-jack-out-context.ts` | geprüft |
| AI-R23 | 107 | `packages/ai/src/evaluation/mistake-taxonomy.ts` | geprüft |
| AI-R24 | 596 | `packages/ai/src/simulation/runner-ai-diagnostics-composition.ts` | geprüft |
| AI-R25 | 372 | `packages/ai/src/runtime/runner-loan-projected-spend.ts` | angepasst |
| AI-R26 | 539 | `packages/ai/src/simulation/central-closeout-repeat-metrics.ts` | angepasst |
| AI-R27 | 483 | `packages/ai/src/runtime/simulation-card-target.ts` | geprüft |
| AI-R28 | 544 | `packages/ai/src/simulation/corp-effective-remote-safety-metrics.ts` | geprüft |
| AI-R29 | 151 | `packages/ai/src/plans/credit-demand.ts` | angepasst |
| AI-R30 | 277 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-active-remote.ts` | geprüft |
| AI-R31 | 647 | `packages/ai/src/simulation/tag-punish-funnel-predicates.ts` | geprüft |
| AI-R32 | 53 | `packages/ai/src/decision/access-decision-projection.ts` | geprüft |
| AI-R33 | 413 | `packages/ai/src/runtime/runner-semantic-card-ids.ts` | entfernt |
| AI-R34 | 109 | `packages/ai/src/evaluation/practical-tactic-benchmark.ts` | geprüft |
| AI-R35 | 34 | `packages/ai/src/actions/persistent-development-action.ts` | geprüft |
| AI-R36 | 80 | `packages/ai/src/deck-doctrine-card-roles.ts` | geprüft |
| AI-R37 | 165 | `packages/ai/src/plans/plan-scheduler.ts` | geprüft |
| AI-R38 | 219 | `packages/ai/src/runner/hand-development/runner-persistent-install-evaluation.ts` | geprüft |
| AI-R39 | 433 | `packages/ai/src/runtime/semantic-runtime-corp-advancement-counter-context.ts` | geprüft |
| AI-R40 | 139 | `packages/ai/src/plans/corp-counter-bank-preparation-quote.ts` | geprüft |
| AI-R41 | 488 | `packages/ai/src/runtime/subroutine-indexes.ts` | geprüft |
| AI-R42 | 520 | `packages/ai/src/simulation/ai-soak-runner.ts` | angepasst |
| AI-R43 | 49 | `packages/ai/src/card-spec-ai-hint-compiler.ts` | geprüft |
| AI-R44 | 3 | `apps/server/src/index.ts` | geprüft |
| AI-R45 | 617 | `packages/ai/src/simulation/runner-run-target-context.ts` | geprüft |
| AI-R46 | 256 | `packages/ai/src/runtime/corp-exact-ice-rez-route.ts` | angepasst |
| AI-R47 | 325 | `packages/ai/src/runtime/protection-definition.ts` | geprüft |
| AI-R48 | 456 | `packages/ai/src/runtime/semantic-runtime-corp-score-composition.ts` | geprüft |
| AI-R49 | 118 | `packages/ai/src/evaluation/replay-portable-fixtures.ts` | geprüft |
| AI-R50 | 605 | `packages/ai/src/simulation/runner-hand-use-diagnostics.ts` | geprüft |
| AI-R51 | 377 | `packages/ai/src/runtime/runner-loan-state-context.ts` | geprüft |
| AI-R52 | 315 | `packages/ai/src/runtime/encounter-action.ts` | angepasst |
| AI-R53 | 628 | `packages/ai/src/simulation/selfplay-trace-facts.ts` | angepasst |
| AI-R54 | 285 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-state.ts` | angepasst |
| AI-R55 | 395 | `packages/ai/src/runtime/runner-program-sacrifice-exclusion.ts` | geprüft |
| AI-R56 | 205 | `packages/ai/src/runner-breaker-development.ts` | geprüft |
| AI-R57 | 514 | `packages/ai/src/simulation/ai-simulation-action-sequence-entry.ts` | aktiv |
| AI-R58 | 126 | `packages/ai/src/hint-ontology-doctrine.ts` | offen |
| AI-R59 | 362 | `packages/ai/src/runtime/runner-hq-repeat-run-score.ts` | offen |
| AI-R60 | 419 | `packages/ai/src/runtime/runner-targeted-bypass-choice.ts` | offen |

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

- Worktree: `C:\Projekte\NETGRID_AI_RANDOM_40_SOURCE_REVIEW`
- Branch: `codex/ai-random-40-source-review`
- Basis: lokaler `main` bei `c7fa6120bedbdea0b09693f7d2f66bb56d4040e6`
- Hauptworkspace nur für finalen lokalen Merge verwenden.
- Jedes Paket einzeln committen; keine fremden Änderungen anfassen.
- Vor Final-Merge aktuelles `main` in den Arbeitsbranch integrieren und ausschließlich tatsächlich betroffene Checks erneut ausführen.
- Nach erfolgreichem Merge Worktree ohne `--force` entfernen, Entfernung doppelt prüfen und gemergten Branch mit `git branch -d` löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Random-40-Source-Qualitätsprüfung vollständig und sequenziell von AI-R21 bis AI-R60 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden AI-Architekturverträge und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Prüfe, verifiziere und committe jedes Paket. Verwende ausschließlich direkt änderungsnahe Tests und Checks; starte keine vollständigen Paket-, Workspace-, Shard-, Build- oder E2E-Läufe. Bei Sicherheitsblocker stoppe mit Ursachenbericht und Removal Condition. Markiere das Goal erst nach Main-Prüfung, verifiziertem Worktree-Cleanup und Branch-Löschung als complete.`

## Ergebnisse

### AI-R21 – `actions/action-target-context.ts`

- **Kein belastbarer Änderungsbedarf:** Die 761-zeilige Datei ist groß, besitzt aber eine kohärente Boundary-Verantwortung: Sie projiziert ausschließlich side-sichere Zielinformationen aus aktuellen `LegalActions`, bereits ausgewählten Targets und explizit bereitgestellten Zielmengen in den semantischen Kandidaten.
- Engine-only-Anforderungen sperren die gesamte Zielprojektion konservativ und erzeugen `hidden_info_blocked`; sie werden weder mit Payload-Targets noch Choice-Optionen vermischt. Run-Server, Karten-, ICE-, Subroutine- und Delayed-Install-Ziele bleiben typisiert und instanzgebunden.
- Deduplizierung vereinigt nur identische Zielidentitäten und erhält Evidence; die Datei wählt weder Plan, Executor noch Action. Die Actiontyp-Liste für das Schließen einer partiellen Projektion ist bewusst eng und durch einen direkten Gegenfall abgesichert.
- **Strukturell beobachtet:** Eine spätere verhaltensneutrale Trennung von Payload-Extraktion, Ziel-Deduplizierung und Constraint-Auswertung könnte die Navigation verbessern. Ohne konkreten Fehler würde ein Split hier jedoch nur Dateien verschieben.
- Check: direkter Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R22 – `runtime/runner-viral15-jack-out-context.ts`

- **Kein belastbarer Änderungsbedarf:** Der 30-zeilige Context ist ein bewusst schmaler Composition-Adapter. Er reicht ausschließlich die zwei expliziten, typisierten Abhängigkeiten an den fachlichen Viral-15-Score weiter und exportiert genau diese eine Bewertungsfunktion an die Runner-Development-Composition.
- Die eigentliche Entscheidung bleibt in `runner-viral15-jack-out-score.ts`; der Context enthält weder einen zweiten Scorepfad noch Fallback-, Choice-, LegalAction- oder Planlogik. Die zusätzliche Datei ist damit nicht fachlich leer, sondern hält Dependency-Wiring von der Bewertung getrennt und entspricht dem Muster der benachbarten Runtime-Contexts.
- Eine Wegrationalisierung würde die Composition direkt an die Score-Implementierung koppeln, ohne Laufzeit- oder Verständlichkeitsgewinn. Größe, Geradlinigkeit und Testbarkeit sind angemessen.
- Check: Public-Export-Vertrag als direkter Oberflächencheck grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R23 – `evaluation/mistake-taxonomy.ts`

- **Kein Änderungsbedarf:** Die Datei ist eine reine, 18-zeilige geschlossene Typ-Taxonomie. Alle Klassen werden von Evaluation, Snapshot-Mining, Replay-Clustering, Benchmarks und Shadow-Reports als gemeinsamer Vertrag genutzt; die Beobachtung bindet optionale Action-ID und konkrete Evidence.
- Die Taxonomie enthält keine Heuristik oder Entscheidungsautorität. Eine Aufteilung oder Ersetzung durch freie Strings würde den Exhaustiveness- und Vertragsnutzen verschlechtern; aktuell sind Benennung und Granularität konsistent mit den Klassifizierern.
- Check: direkt konsumierende Decision-Snapshot-Suite grün (1 Datei, 6 Tests), `git diff --check` grün.

### AI-R24 – `simulation/runner-ai-diagnostics-composition.ts`

- **Kein Änderungsbedarf:** Die 110 Zeilen bilden einen geradlinigen Composition Root für vier klar getrennte Diagnosebereiche. Abgeleitete Funktionen werden explizit von ihren jeweiligen Ownern in die nachgelagerte Simulationsdiagnostik injiziert; die langen `Omit`-Listen verhindern dabei doppelte externe Zuständigkeiten.
- Es gibt keine eigene Bewertung, keine Actionwahl und keinen Fallback. Der breite Rückgabe-Spread aggregiert nur disjunkte Diagnoseoberflächen; eine weitere Abstraktion würde die tatsächlichen Abhängigkeiten eher verbergen.
- Check: direkt angrenzende Known-Path-Diagnostik grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R25 – `runtime/runner-loan-projected-spend.ts`

- **Behobener mittlerer Befund:** Die Projektion filterte jeden Folgekauf nur einzeln gegen `creditsAfterLoan` und summierte danach bis zur Click-Grenze. Zwei jeweils bezahlbare Karten konnten dadurch zusammen mehr geplanten Spend erzeugen als nach dem Darlehen vorhanden ist; `creditsAfterPlannedSpend` wurde fälschlich negativ und verschärfte die Darlehensbewertung.
- Die priorisierte Kandidatenliste wird nun in Rangfolge gegen ein fortlaufend reduziertes Restbudget ausgewählt. Click-Grenze, Owner-Rangfolge und vorhandene Klassifikation bleiben unverändert; es entsteht keine neue Plan- oder Actionautorität.
- Regressionstest belegt für zwei 4-Credit-Karten bei 6 Credits, dass nur 4 Credits und ein Setup-Kauf projiziert werden. Check: direkter Vitest grün (1 Datei, 1 Test), `git diff --check` grün.

### AI-R26 – `simulation/central-closeout-repeat-metrics.ts`

- **Behobener mittlerer Befund:** `substitutionLedToProgression` suchte anhand der Turnnummer in der gesamten Sequenz. Damit konnte eine Aktion, die im selben Zug bereits *vor* der No-Fresh-Central-Substitution lag, fälschlich als deren späterer Fortschritt gezählt werden.
- Die Suche beginnt nun am tatsächlichen Sequenzindex der Substitution und betrachtet nur diese sowie nachfolgende Einträge. Alle Dedup-Schlüssel, erlaubten Gründe und übrigen Metriken bleiben unverändert.
- Regressionstest bildet einen früheren Rig-Install und einen späteren End-Turn-Ersatz im selben Zug ab; die Substitution wird gezählt, aber nicht als progressionserzeugend. Check: direkter Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R27 – `runtime/simulation-card-target.ts`

- **Kein belastbarer Änderungsbedarf:** Die Datei zentralisiert fünf eng zusammengehörige, deterministische Karten-/Zielprojektionen für Simulationsdiagnosen. Instanz- und Zonenbindung der Advanced-Agenda-Quelle ist explizit; unbekannte Karten werden als `unknown` beziehungsweise nicht als Near-Final-Agenda behandelt.
- Die Null bei unbekannten Rez-Kosten ist hier kein fachlicher Ersatzwert: Der einzige Konsument filtert nichtpositive Werte aus der Liste bezahlbarer unrezzter ICE. Damit wird unbekannte Bezahlbarkeit konservativ nicht behauptet. Actionquellen werden nur über sichtbare Karten aufgelöst.
- Check: direkt konsumierende Remote-Protection-Prüfung grün (1 Datei, 1 Test), `git diff --check` grün.

### AI-R28 – `simulation/corp-effective-remote-safety-metrics.ts`

- **Kein Änderungsbedarf:** Der Aggregator zählt ausschließlich explizite, namensgebundene Evidence-Flags aus Corp-Einträgen und mittelt nur endliche numerische Werte. Die abgeleitete Sammelmetrik ist nachvollziehbar exakt die Summe aus unsicherem Agenda-Install und unsicherem Advance.
- Keine KI-Entscheidung und kein Hidden-Info-Zugriff; leere Datensätze werden über den gemeinsamen `averageNumber`-Vertrag behandelt. Die repetitive Form ist für die prüfbare 1:1-Zuordnung der 14 Kennzahlen angemessener als dynamische String-Magie.
- Check: Import-/Konsumgraph und Evidence-Präfixe statisch vollständig geprüft, `git diff --check` grün.

### AI-R29 – `plans/credit-demand.ts`

- **Behobener hoher Robustheitsbefund:** Nichtendliche Creditwerte wurden still auf null normalisiert. Ein `NaN`-Ziel konnte so als vollständig finanzierter Planbedarf erscheinen und die Funding-Route fail-open freigeben.
- `wholeNonNegative` akzeptiert weiterhin endliche Dezimal- und Negativwerte nach dem bestehenden Ganzzahl-/Nullvertrag, wirft bei `NaN` oder Unendlichkeit nun aber eine präzise `RangeError`-Diagnose. Ranking, Plan-Ownership und Restriktionsmodell bleiben unverändert.
- Regressionstest sichert das fail-closed-Verhalten. Check: direkter Vitest grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R30 – `runtime/corp-scoreline/semantic-runtime-corp-score-active-remote.ts`

- **Kein belastbarer Änderungsbedarf:** Trotz 430 Zeilen besitzt die Datei einen klaren fachlichen Schnitt: aktives Agenda-Advance, Off-Path-Spend und vorbereitete Remote-Pipeline. Alle Komponenten bewerten nur die aktuelle LegalAction und beziehen Scorefenster, Reserve und Board-Triage von ihren bestehenden Ownern.
- Kritische Abzweige sind fail-closed: fremde Karte, unsicheres Fenster, Funding-Empfehlung, Zentralenschutz und Server-Mismatch erzeugen keine positive Freigabe. Same-Turn-Closeout ist der einzige explizite Override für contestable Tempo und bleibt an den Scoreline-Owner gebunden.
- Ein Split wäre perspektivisch möglich, aktuell aber ohne Qualitätsgewinn gegenüber den gemeinsam genutzten Scoreline-Fakten. Check: direkte Active-Remote-Suite grün (1 Datei, 20 Tests), `git diff --check` grün.

### AI-R31 – `simulation/tag-punish-funnel-predicates.ts`

- **Kein Änderungsbedarf:** Die 100-zeilige Datei bündelt ausschließlich kleine zeitlich gerichtete Funnel-Prädikate. Vorwärtsfenster beginnen strikt nach der Quellaktion, Rückwärtsfenster enden strikt vor dem aktuellen Index; damit gibt es keine Selbsttreffer.
- Die begrenzten 7-/11-Aktionshorizonte sind explizite Diagnosefenster, keine Spielentscheidung. Corp-Seitenbindung wird dort geprüft, wo ein Corp-Opportunity-/Taken-Ereignis erforderlich ist; die Tagzustandsänderung selbst ist zurecht seitenneutral.
- Check: alle Konsumenten und Feldbindungen im zentralen Tag-Punish-Metrikaggregator statisch geprüft, `git diff --check` grün.

### AI-R32 – `decision/access-decision-projection.ts`

- **Kein Änderungsbedarf:** Die Projektion validiert zuerst den zentralen Access-Invariantenvertrag und leitet danach ausschließlich deklarative, sortierte Merkmale ab. Agenda-, Trash-, Waiver-, Reserve- und Poolzustände bleiben getrennt und deterministisch.
- Der Target-Choice-Pfad ist ausdrücklich Dry-Run: Typ und Evidence erzwingen `selectedChoicesCreated: false` und `selectedTargetsCreated: false`; er vervollständigt keine Action und schafft keine zweite Choice-Autorität. Evidence wird begrenzt.
- Check: direkter Projektions-Vitest grün (1 Datei, 7 Tests), `git diff --check` grün.

### AI-R33 – `runtime/runner-semantic-card-ids.ts`

- **Behobener niedriger Strukturfund / Datei entfernt:** Die Datei enthielt ausschließlich `BAD_PUBLICITY_LOSS_THRESHOLD_FOR_AI = 7`. Die Konstante wurde genau einmal in das zentrale Runtime-Dependency-Objekt geschrieben; repo-weite Referenzprüfung zeigte, dass weder ein Dependency-Vertrag noch produktiver Code `badPublicityLossThreshold` liest.
- Import und totes Objektfeld wurden entfernt, anschließend die nun funktionslose Datei gelöscht. Es geht kein Verhalten oder Konfigurationspunkt verloren; die Runtime-Oberfläche wird kleiner und geradliniger.
- Checks: keine Restreferenz; direkt betroffene Modulgrenzen- und Plan-first-Autoritäts-Suites grün (2 Dateien, 45 Tests), `git diff --check` grün.

### AI-R34 – `evaluation/practical-tactic-benchmark.ts`

- **Kein akuter Änderungsbedarf:** Die Datei ist mit rund 560 Zeilen groß, davon besteht der überwiegende Teil jedoch aus einem expliziten, balancierten 40-Fall-Benchmarkkorpus. Auswertung, Fixture-Bau und zehn Kategorien sind deterministisch und side-safe.
- Akzeptable und schlechte Action-IDs werden gegen reale LegalActions geprüft; Resultate kopieren Arrays und mutieren den Korpus nicht. Der Legacy-Selector ist ausschließlich eine eingefrorene Testbaseline und keine produktive Entscheidungsautorität.
- **Strukturhinweis:** Bei weiterem Wachstum sollten Fallgeneratoren in eine Fixture-Datei wandern; derzeit würde der Split Navigation verbessern, aber keine konkrete Fehlerquelle beseitigen. Check: direkter Benchmark-Vitest grün (1 Datei, 3 Tests), `git diff --check` grün.

### AI-R35 – `actions/persistent-development-action.ts`

- **Kein Änderungsbedarf:** Der Projektor normalisiert genau drei persistente Entwicklungsrouten und bindet Zielinstanz sowie optionale Definition an die aktuelle LegalAction. Direkter Install, Vorbereitung und Fortschritt eines Delayed-Installs bleiben klar unterschieden.
- `appliesInstallFitNow` gilt bewusst nur für unmittelbare Grip-Entwicklung, nicht beim späteren Counter-Fortschritt. Unbekannte Ability- oder fehlende Zielpayloads werden verworfen; keine Action wird ausgewählt oder ergänzt.
- Check: direkter Projektions-Vitest grün (1 Datei, 3 Tests), `git diff --check` grün.

### AI-R36 – `deck-doctrine-card-roles.ts`

- **Kein Änderungsbedarf:** Generierte Card-Spec-Hints sind die führende Quelle und fehlen fail-closed mit konkreter Karten-ID. Nur für nicht migrierte Runtime-Karten werden minimale, sichtbare Typ-/Subtype-/Subroutine-Rollen ergänzt.
- Rollen werden deterministisch dedupliziert und sortiert; Agenda-, Breaker- und ICE-Prädikate verwenden eng begrenzte Ontologieformen. Die Datei trifft keine Planwahl, sondern stellt Deckdoctrine-Fakten bereit.
- Check: direkter Rollen-Vitest grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R37 – `plans/plan-scheduler.ts`

- **Kein funktionaler Änderungsbedarf, aber mittlere Strukturverschuldung:** Der 1.200-Zeilen-Scheduler ist die ausdrücklich einzige globale Planinstanz und erzwingt Registry-, Assessment-, Support-, LegalAction-, Continuation- und Early-End-Turn-Invarianten fail-closed. Eine Zerlegung darf diese zentrale Autorität nicht verteilen.
- Laufzeitpfad und autoritätsloses Shadow-Enumeration sind sauber getrennt; der einzige `catch` wandelt Materialisierungsfehler ausschließlich im Diagnosepfad in typisierte Issues um. Exakte Providerbindung, aktueller StateVersion-Bezug und PlanExecutionOrigin bleiben erhalten.
- **Empfohlener späterer Split:** Support-Graph-Bindung und Early-End-Turn-Vertragsprüfung können als reine Scheduler-Unterbausteine ausgelagert werden; wegen Kernelrisiko und fehlendem Fehlerbeleg kein mechanischer Großrefactor in dieser Stichprobe. Check: direkte Scheduler-Suite grün (1 Datei, 42 Tests), `git diff --check` grün.

### AI-R38 – `runner/hand-development/runner-persistent-install-evaluation.ts`

- **Hohe Strukturverschuldung ohne akuten Funktionsfehler:** Rund 1.840 Zeilen vereinen Signalerzeugung, Engine-/Replacement-Profile, Breaker-Vergleich, Stackability, Nutzen-/Penalty-Berechnung und Hilfsprädikate. Die Funktionen sind überwiegend rein, exportiert und gut testbar, die Datei ist aber klar zu groß für schnelle Ownership-Navigation.
- Fachlich bleiben Entscheidungen konservativ: unbekannte Deck-Replacement-Verluste blockieren, Hidden-Zone-Daten werden nicht genutzt, Instanzbindungen kommen aus LegalAction/VisibleCard, und riskante Duplikate berücksichtigen Reserve, Handpuffer und MU.
- **Empfohlene Umstrukturierung:** in `persistent-card-profile`, `persistent-replacement`, `persistent-breaker-variant` und `persistent-install-utility` aufteilen, bei unverändertem zentralen Hand-Development-Owner. Kein Großsplit im Zufallspaket ohne eigenständigen Refactor-Gate. Check: direkte Suite grün (1 Datei, 31 Tests), `git diff --check` grün.

### AI-R39 – `runtime/semantic-runtime-corp-advancement-counter-context.ts`

- **Kein Änderungsbedarf:** Der 24-zeilige Context ist ein schmaler, typisierter Composition-Adapter. Er bindet die Advancement-Counter-Abhängigkeiten einmal und exponiert genau die fachliche Placement-Assessment-Funktion.
- Es gibt keine eigene Heuristik, keinen Fallback und keinen zweiten Owner. Eine Entfernung würde nur Dependency-Wiring zurück in die größere Scoring-Composition verlagern; die kleine Datei erfüllt eine klare Boundary-Aufgabe.
- Check: direkte Advancement-Counter-Suite grün (1 Datei, 19 Tests), `git diff --check` grün.

### AI-R40 – `plans/corp-counter-bank-preparation-quote.ts`

- **Kein Änderungsbedarf:** Der Quote-Reader revalidiert Schema, Kontext, Karteninstanz, StateVersion, Zähler, Standort und sämtliche Capability-/Kostenparameter vollständig, bevor ein Scoreplan die Karte als Counter-Bank behandelt.
- Die Quote beweist nur sichtbare Engine-Fähigkeit; strategische Nutzung verbleibt ausdrücklich beim Scoreplan. Abweichende oder unvollständige Werte liefern fail-closed `undefined`, ohne Ersatzannahme oder Legacy-Alias.
- Check: direkt konsumierende Counter-Bank-Scoreplan-Suite grün (1 Datei, 8 Tests), `git diff --check` grün.

### AI-R41 – `runtime/subroutine-indexes.ts`

- **Kein Änderungsbedarf:** Der Parser akzeptiert ausschließlich nichtnegative ganzzahlige Indizes, dedupliziert sie und vereinigt Multi- und Single-Payload deterministisch. Nichtstrings, leere Segmente, Brüche, negative und nichtendliche Werte werden ignoriert.
- Die Funktion interpretiert nur Engine-Payloads einer bereits aktuellen LegalAction; sie wählt weder Subroutine noch Break-Action. Größe und Verantwortungsumfang sind optimal.
- Check: direkt konsumierende Run-Plan-Path-Quote-Suite grün (1 Datei, 20 Tests), `git diff --check` grün. Ein zunächst adressierter, nicht vorhandener separater Testpfad wurde nicht als Produktfehler gewertet.

### AI-R42 – `simulation/ai-soak-runner.ts`

- **Behobener mittlerer Befund:** Bei explizitem Override von Runner- *und* Corp-Schwierigkeit iterierte der Runner weiterhin über alle Matrix-Schwierigkeiten, obwohl beide Werte im Callback überschrieben wurden. Jede Seed-Simulation lief dadurch identisch mehrfach und verzerrte Gewichtung sowie Laufzeit.
- Der Runner erzeugt nun Difficulty-Paare: bei beidseitigem Override genau eines, bei keinem oder einseitigem Override weiterhin die vollständige sinnvolle Matrix. Seeds, Decks und Aggregation bleiben unverändert.
- Regressionstest prüft exakt einen Aufruf pro Seed und beide übergebenen Schwierigkeitswerte. Check: direkter Vitest grün (1 Datei, 1 Test), `git diff --check` grün.

### AI-R43 – `card-spec-ai-hint-compiler.ts`

- **Kritische Strukturverschuldung, kein isolierter Funktionsfehler:** Mit rund 12.200 Zeilen und 87 Funktionen ist dies die mit Abstand zu große Datei der Stichprobe. Sie übersetzt zahlreiche geschlossene CardSpec-Unions in Rollen, Effects, Conditions, Targets, Costs, Risiken und Strategy-Evidence; Navigation und Reviewbarkeit sind dadurch unnötig schwer.
- Positiv: unbekannte Engine-Familien, Shapes, Owner, Werte und Ontologiebegriffe scheitern an vielen expliziten Guards fail-closed. Der Compiler liest strukturierte CardSpecs statt Spielzustand/Hidden Info und erzeugt keine Actionautorität.
- **Dringende Umstrukturierung empfohlen:** Translatoren nach Engine-Familien (Ability/Target, Costs, Risks, Effects, Strategy-Evidence) in interne Module zerlegen; `deriveCardSpecAiHint` bleibt alleiniger Orchestrator und öffentliche Oberfläche. Das ist ein eigenständiges, breit zu verifizierendes Architekturpaket und kein sicherer Nebenrefactor einer Zufallsprüfung. Checks: vier direkt betroffene Compiler-Suites grün (4 Dateien, 80 Tests), `git diff --check` grün.

### AI-R44 – `apps/server/src/index.ts`

- **Kein Änderungsbedarf:** Die 96-zeilige Server-Fassade kapselt Local-Demo-Erzeugung, Engine-Action-Anwendung und genau einen Corp-KI-Schritt. Der KI-Schritt bezieht aktuelle LegalActions, baut den side-sicheren DTO über `buildAiDecisionInput`, injiziert die Engine-Quote und reicht nur Action-ID, Seite und StateVersion an `applyAction` zurück.
- Vollständiger `GameState` bleibt an der privilegierten Server-/Engine-Grenze; die KI erhält die sanitizte Projektion. Kein eigener Regelentscheid, keine Payload-Rekonstruktion und kein Server-Fallback auf eine alternative Action.
- Check: vollständiger Import-/Callgraph der kleinen Datei und Input-DTO-Sanitizer statisch geprüft, `git diff --check` grün; kein eigener enger Test vorhanden.

### AI-R45 – `simulation/runner-run-target-context.ts`

- **Kein Änderungsbedarf:** Zwei kleine side-sichere Kontextprädikate: Das erste verlangt vorhandenes ICE und beweist, dass jedes ICE unbekannt oder unrezzed ist; das zweite sucht einen Start-Run auf exakt demselben Server in den letzten 24 öffentlichen Events.
- Es wird weder aus verdeckten Instanzen noch aus Full-State gelesen. Server-ID wird über den zentralen Public-Event-Parser bezogen; fehlender Server oder leere ICE-Liste ergibt konservativ `false`.
- Check: direkt konsumierende Known-No-Access-Suite grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R46 – `runtime/corp-exact-ice-rez-route.ts`

- **Behobener hoher Kontinuitätsbefund:** `exactCorpIceRezRoutesEqual` verglich bei Resource-Exchange-Routen weder normale/nichtnormale Creditanteile und Pfadverlust noch die zufälligen Breaker-Konsequenzen. Eine fachlich geänderte Engine-Quote konnte damit als dieselbe persistierte Route gelten.
- Der Vergleich umfasst nun alle numerischen Exchange-Fakten und jede Random-Consequence mit Karteninstanz, Definition, Kind und exakter Wahrscheinlichkeit. Bestehende strikte Quote-, StateVersion-, LegalAction- und Servervalidierung bleibt unverändert.
- Regressionstest verändert nur `runnerNormalCreditsLostOnAccessPath` und belegt Ungleichheit. Check: direkte Exact-Rez-Route-Suite grün (1 Datei, 42 Tests), `git diff --check` grün. Die 930-Zeilen-Datei ist groß; Quote-Lesen, Projektion und Equality könnten später ownergleich getrennt werden.

### AI-R47 – `runtime/protection-definition.ts`

- **Kein Änderungsbedarf:** Die 15-zeilige Funktion klassifiziert Schutz ausschließlich über den exakten CardSpec-Hint `remote_protection` und die drei geschlossenen räumlichen Scopes. Fehlende oder nur namensähnliche Definitionen ergeben `false`.
- Keine Textheuristik, kein Alias und kein Fallback; damit bleibt die Information an der strukturierten CardSpec-Autorität. Die kleine Datei wird von Simulation und Final-Advance konsistent wiederverwendet.
- Check: direkter Definitions-Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R48 – `runtime/semantic-runtime-corp-score-composition.ts`

- **Kein Änderungsbedarf:** Der 52-zeilige Composition-Adapter macht das vollständige Corp-Score-Dependency-Wiring explizit und übergibt es an den einzigen Score-Context. Optionale Completes-Score- und Scoreline-Window-Funktionen werden nur bei tatsächlicher Bereitstellung weitergereicht.
- Keine eigene Bewertung, kein Spread unbekannter Abhängigkeiten und keine parallele Entscheidungsschicht. Die scheinbar repetitive Auflistung ist hier ein hilfreicher Compile-Time-Vertrag gegen versehentliches Wiring.
- Check: vollständige 1:1-Abbildung gegen Dependency-Vertrag und einzigen Aufrufer statisch geprüft, `git diff --check` grün; kein enger eigener Test vorhanden.

### AI-R49 – `evaluation/replay-portable-fixtures.ts`

- **Kein Änderungsbedarf:** Die Datei erzeugt zwei explizit synthetische, nicht produktiv nutzbare Replay-Fixtures aus ausschließlich PlayerView und LegalActions. Schema, Herkunftsabweichung, erwartete Aktion und Runtime-Verbot sind im Typ fest verankert.
- Die Negativkontrolle entfernt `start_run` vollständig und kann daher eine erfundene Action zuverlässig erkennen. Keine SQLite-/Full-State- oder Hidden-Zone-Daten werden eingebettet; Karten sind absichtlich sichtbar modelliert.
- Check: direkter Fixture-Vitest grün (1 Datei, 2 Tests), `git diff --check` grün.

### AI-R50 – `simulation/runner-hand-use-diagnostics.ts`

- **Kein Funktionsfehler; mittlere Strukturbeobachtung:** Die 378 Zeilen projizieren eine große, aber mechanische Menge von Runner-Hand-, Trash- und Remote-Contest-Diagnosefeldern. Sämtliche fachlichen Klassifikationen werden als Dependencies bezogen; die Datei entscheidet keine Action.
- Flags sind streng an Runner-Seite, gewählte LegalAction, aktuelle Kosten-/Reservekontexte und sichtbare Remote-Daten gebunden. Aus nicht vorhandenen Diagnosewerten werden keine positiven Tatsachen erzeugt.
- Ein späterer Split der Remote-Trash-Feldprojektion würde die Navigation verbessern; wegen 1:1-Metrikmapping und fehlendem Fehler kein Umbau. Check: direkter Vitest grün (1 Datei, 1 Test), `git diff --check` grün. Die direkte Testtiefe ist im Verhältnis zur Feldanzahl niedrig und sollte bei künftigen Verhaltensänderungen erweitert werden.

### AI-R51 – `runtime/runner-loan-state-context.ts`

- **Kein Änderungsbedarf:** Die kleine Datei liefert genau zwei sichtbare Darlehenskontexte: eine deterministische Phase aus Punkten/Aktionszahl und Resource-Trash-Risiko aus öffentlichem Runner-Tagzustand beziehungsweise aktueller Remove-Tag-LegalAction.
- Schwellen sind klar, überschneidungsfrei priorisiert (Late vor Opening) und enthalten keine verdeckten Corp-Handinformationen. Die Funktionen bewerten nicht das Darlehen selbst, sondern liefern Fakten an dessen Owner.
- Check: vollständiger Aufrufer- und Typgraph statisch geprüft, `git diff --check` grün; kein separater enger Test vorhanden.

### AI-R52 – `runtime/encounter-action.ts`

- **Behobener hoher Robustheitsbefund:** Ohne `pumpStrengthAmount` in der LegalAction und ohne bekannte Pump-Ability erfand die Funktion Stärke `1`. Nichtendliche Payloadwerte liefen ebenfalls weiter und konnten Pumpanzahl/Kosten mit `NaN` kontaminieren.
- Die Projektion liefert nun nur einen endlichen, nichtnegativen Engine- oder CardSpec-Wert; sonst `undefined`. Beide Verbraucher behandeln das explizit fail-closed und bauen keine Pump-/Break-Sequenz.
- Regressionstest deckt fehlende Definition und `NaN` ab. Checks: direkter Helper- und betroffener Run-Path-Quote-Vitest grün (2 Dateien, 22 Tests), `git diff --check` grün.

### AI-R53 – `simulation/selfplay-trace-facts.ts`

- **Behobener mittlerer Diagnosebefund:** Wenn ein berechtigtes Finding-Fenster keine Alternative traf (etwa ungültiger Action-Index), hing die Funktion ersatzweise die erste irgendwo verfügbare Alternative an. Dadurch wurde fremde Entscheidungsevidence einem Finding zugeordnet.
- Der globale Fallback ist entfernt. Retention erfolgt nur noch über ein tatsächlich adressiertes Finding-Fenster oder einen expliziten Seed/Action-Snapshot-Request; sonst werden Alternativen gelöscht. Sanitizing und Redaction bleiben unverändert.
- Regressionstest belegt, dass ein ungültiges Finding nicht die Alternative von Action 0 behält. Check: direkter Vitest grün (1 Datei, 4 Tests), `git diff --check` grün.

### AI-R54 – `runtime/corp-scoreline/semantic-runtime-corp-score-state.ts`

- **Behobener hoher Zahlenbefund:** Eine sichtbare Agenda ohne bekannte Advancement-Requirement erhielt implizit `advancesRemaining = 0` und konnte als fertige aktive Scoreline behandelt werden. Das war ein fail-open Ersatzwert.
- Unbekannte Requirements werden nun aus der Active-Scoreline-Projektion ausgeschlossen; nur eine bekannte Zahl darf Reserve, Clock und Scoreline-Bewertung speisen. Sichtbare bekannte Agenden bleiben unverändert.
- Regressionstest nutzt eine bewusst unbekannte Agenda und erwartet keinen State. Checks: neuer direkter und angrenzender Active-Remote-Vitest grün (2 Dateien, 21 Tests), `git diff --check` grün.

### AI-R55 – `runtime/runner-program-sacrifice-exclusion.ts`

- **Kein Änderungsbedarf:** Der Helper besitzt eine einzige Verantwortung: Wenn eine bereits ownerseitig ermittelte Install-Assessment zwingend Speicher freimachen muss, aber kein akzeptables Opfer findet, wird die LegalAction ausgeschlossen.
- Fehlende oder nicht speicherrelevante Assessments erzeugen keine pauschale Sperre; die fachliche Assessment-Erzeugung bleibt im Program-Install/Trash-Context. Evidence wird deterministisch dedupliziert und enthält den exakt verwendeten Displacement-Penalty.
- Check: Dependency-Wiring und sämtliche Konsumenten statisch geprüft, `git diff --check` grün; kein enger eigener Test vorhanden.

### AI-R56 – `runner-breaker-development.ts`

- **Kein Änderungsbedarf:** Der Assessor trennt installierte Mindestabdeckung, Deckarchitektur und optionale Entwicklung. Nur hochkonfidente, tatsächlich relevante Breaker zählen; Definitionen werden deterministisch dedupliziert.
- Fehlendes Profil bleibt konservativ `unknown` mit primärem Breakerbedarf. Optionale Suche wird erst nach vollständiger Basisabdeckung und nur bei bekanntem Deckvorkommen plus aktueller Suchfähigkeit freigegeben.
- Check: direkter Breaker-Development-Vitest grün (1 Datei, 4 Tests), `git diff --check` grün.

## Abschlusskriterien

- Alle 40 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
