# AI-Random-40-Source-Qualitätsprüfung

Status: AI-R27

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
| AI-R27 | 483 | `packages/ai/src/runtime/simulation-card-target.ts` | aktiv |
| AI-R28 | 544 | `packages/ai/src/simulation/corp-effective-remote-safety-metrics.ts` | offen |
| AI-R29 | 151 | `packages/ai/src/plans/credit-demand.ts` | offen |
| AI-R30 | 277 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-active-remote.ts` | offen |
| AI-R31 | 647 | `packages/ai/src/simulation/tag-punish-funnel-predicates.ts` | offen |
| AI-R32 | 53 | `packages/ai/src/decision/access-decision-projection.ts` | offen |
| AI-R33 | 413 | `packages/ai/src/runtime/runner-semantic-card-ids.ts` | offen |
| AI-R34 | 109 | `packages/ai/src/evaluation/practical-tactic-benchmark.ts` | offen |
| AI-R35 | 34 | `packages/ai/src/actions/persistent-development-action.ts` | offen |
| AI-R36 | 80 | `packages/ai/src/deck-doctrine-card-roles.ts` | offen |
| AI-R37 | 165 | `packages/ai/src/plans/plan-scheduler.ts` | offen |
| AI-R38 | 219 | `packages/ai/src/runner/hand-development/runner-persistent-install-evaluation.ts` | offen |
| AI-R39 | 433 | `packages/ai/src/runtime/semantic-runtime-corp-advancement-counter-context.ts` | offen |
| AI-R40 | 139 | `packages/ai/src/plans/corp-counter-bank-preparation-quote.ts` | offen |
| AI-R41 | 488 | `packages/ai/src/runtime/subroutine-indexes.ts` | offen |
| AI-R42 | 520 | `packages/ai/src/simulation/ai-soak-runner.ts` | offen |
| AI-R43 | 49 | `packages/ai/src/card-spec-ai-hint-compiler.ts` | offen |
| AI-R44 | 3 | `apps/server/src/index.ts` | offen |
| AI-R45 | 617 | `packages/ai/src/simulation/runner-run-target-context.ts` | offen |
| AI-R46 | 256 | `packages/ai/src/runtime/corp-exact-ice-rez-route.ts` | offen |
| AI-R47 | 325 | `packages/ai/src/runtime/protection-definition.ts` | offen |
| AI-R48 | 456 | `packages/ai/src/runtime/semantic-runtime-corp-score-composition.ts` | offen |
| AI-R49 | 118 | `packages/ai/src/evaluation/replay-portable-fixtures.ts` | offen |
| AI-R50 | 605 | `packages/ai/src/simulation/runner-hand-use-diagnostics.ts` | offen |
| AI-R51 | 377 | `packages/ai/src/runtime/runner-loan-state-context.ts` | offen |
| AI-R52 | 315 | `packages/ai/src/runtime/encounter-action.ts` | offen |
| AI-R53 | 628 | `packages/ai/src/simulation/selfplay-trace-facts.ts` | offen |
| AI-R54 | 285 | `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-state.ts` | offen |
| AI-R55 | 395 | `packages/ai/src/runtime/runner-program-sacrifice-exclusion.ts` | offen |
| AI-R56 | 205 | `packages/ai/src/runner-breaker-development.ts` | offen |
| AI-R57 | 514 | `packages/ai/src/simulation/ai-simulation-action-sequence-entry.ts` | offen |
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

## Abschlusskriterien

- Alle 40 Dateien sind mit konkreten Fundstellen geprüft.
- Jeder belastbare Befund ist behoben oder als echter Blocker dokumentiert.
- Jedes Paket besitzt einen eigenen Commit und bestandenes Done-Gate.
- Ausschließlich direkt änderungsnahe Tests und Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Branch sind entfernt und die Entfernung ist verifiziert.
