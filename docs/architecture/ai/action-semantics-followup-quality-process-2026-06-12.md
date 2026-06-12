# Action Semantics Follow-up Quality Process 2026-06-12

## Status

`in_progress`

## Quelle/Vorgabe

Eingefügter GitHub-Prüfbefund vom 2026-06-12 zum gepushten Abschlussstand `6c620157` und den daraus abgeleiteten Folgeaufträgen 1 bis 10.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung hinreichend präzise. Kleine Lücken werden konservativ behandelt:

- AI022-/Hints-Änderungen sind ein separater lokaler Strang und wurden vor Prozessbeginn als `stash@{0}` mit Message `ai022-hints-local-baseline-before-followup-process` gesichert.
- Der neue Prozess arbeitet auf sauberem `main` im separaten Worktree.
- TargetProfiles werden nur ergänzt, wenn eine echte Ziel- oder Moduswahl besteht.
- Runtime-Cutover, Planner-Gewichte, neue LegalActions, Engine-Regelautorität und Hidden-Info-Verträge bleiben außerhalb des Scopes.
- Große Report-JSONs werden nicht pauschal gelöscht; zuerst wird Inventar und Begründung dokumentiert.

## Gesamtziel

Der Prozess bereinigt den formalen Abschluss der Action-Semantics-Foundation, korrigiert veraltete Contract-Kommentare, trennt lokale AI022-/Hints-Arbeit, reduziert messbare TargetProfile-Gaps, erweitert Coverage in Richtung Engine-backed LegalActions, prüft die Data-Fort-Reclamation-Boundary, härtet Signal-, Doctrine- und Shadow-Trace-Diagnostik und hält die Runtime-Cutover-Sperre explizit.

## Nicht-Ziele

- Keine produktive Aktivierung neuer KI-Entscheidungen.
- Keine LegalAction-Erzeugung außerhalb der Engine.
- Keine Hidden-Info-Projektion in öffentliche Reports, PlayerViews, Logs, Replays oder KI-Gegnerinputs.
- Keine automatische Bereinigung oder Aufgabe des separaten AI022-/Hints-Stashes.
- Keine Remote-Integration ohne ausdrücklichen Nutzerwunsch.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jedes Paket bekommt einen eigenen Commit.
- Runtime- und Engine-Verträge werden nicht durch Diagnosecode erweitert.
- `applyAction` und `LegalActions` bleiben die einzigen Ausführungsgrenzen.
- Reports und Gates dürfen Karten semantisch beschreiben, aber keine Entscheidung erzwingen.
- Bei Konflikten mit `main` werden beide Intentionen gelesen und erhalten, sofern fachlich kompatibel.

## Automatische Fehlerbehandlung

- Rote Tests werden zuerst auf den aktuellen Paketdiff zurückgeführt.
- Bestehende Baseline-Warnungen werden dokumentiert, aber nicht als Paketfehler behandelt, wenn der Exitcode grün ist.
- Wenn `format:changed -- origin/main` wegen alter lokaler Commits rot wird, wird das nicht als grün gemeldet; stattdessen gegen lokalen `main` geprüft und die Baseline-Abweichung dokumentiert.
- Ein Paket wird nicht still um Follow-ups erweitert.

## Sicherheitsblocker

Stoppen und Blocker-Report mit Removal Condition schreiben, wenn:

- verdeckte Karten-IDs, Handinhalte oder engine-only Targets in öffentliche Artefakte gelangen;
- ein Paket LegalActions erzeugt oder Legalität außerhalb der Engine definiert;
- Runtime-Entscheidungen ohne ausdrückliche Cutover-Freigabe neue Diagnostics konsumieren;
- Data-Fort-Reclamation neue öffentliche Choice-Payloads für verdeckte Karten benötigt;
- TargetProfiles Hidden-Info-Raten statt LegalAction-/ChoiceOption-Daten verlangen.

## State Machine

- `P0_PROCESS_ARTIFACT`
- `P1_BASELINE_CLEANUP`
- `P2_TARGET_PROFILE_GAP_SPRINT_1`
- `P3_ENGINE_BACKED_ACTION_SEMANTIC_COVERAGE`
- `P4_DATA_FORT_OPTIONAL_REZ_BOUNDARY`
- `P5_SIGNAL_CATALOG_QUALITY`
- `P6_DECK_DOCTRINE_REAL_SNAPSHOTS`
- `P7_SEMANTIC_TRACE_REAL_ENGINE_CORPUS`
- `P8_RUNTIME_CUTOVER_LOCK`
- `P9_LOCAL_TRANSFER_REPORT_HYGIENE`
- `P10_FINAL_VERIFY_AND_MERGE`

## Paketfolge

1. P0 Prozessartefakt und Worktree-Preflight.
2. P1 Abschluss-/Baseline-Bereinigung und stale DFR-Kommentar.
3. P2 TargetProfile-Gap-Closure Sprint 1.
4. P3 Engine-backed ActionSemanticCoverage.
5. P4 Data Fort Reclamation optionale Rez-Boundary prüfen.
6. P5 Semantic Signal Catalog Quality Sprint.
7. P6 DeckDoctrine-v2 gegen echte Decksnapshots.
8. P7 Semantic Shadow Trace gegen Real-Engine-Corpus.
9. P8 Runtime-Cutover-Sperre explizit halten.
10. P9 Lokale Transfer-/Report-Hygiene.
11. P10 Finaler Volltest und lokale Main-Integration.

## Paketdetails

### P0 Prozessartefakt und Worktree-Preflight

Ziel: Prozess sauber starten.

Arbeit:

- AI022-/Hints-Strang klassifizieren und reversibel trennen.
- Worktree `C:\Projekte\NETGRID_ACTION_SEMANTICS_FOLLOWUP_QUALITY` auf Branch `codex/action-semantics-followup-quality` anlegen.
- Dieses Prozessartefakt erstellen.

Checks:

- `git status --short --branch`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Worktree ist sauber gestartet, Prozessartefakt liegt vor, AI022-/Hints-Strang ist dokumentiert getrennt.

Commit: `docs(ai): define action semantics followup quality process`

### P1 Abschluss- und Baseline-Bereinigung

Ziel: Der vorige Abschlussstand ist formal konsistent.

Arbeit:

- Alte Prozessdatei `action-semantics-ordered-sequence-foundation-2026-06-12.md` von `in_progress` auf `complete` setzen.
- P15-Formatbaseline präzisieren: Branch-Diff gegen lokalen `main` war grün; `origin/main`-Rot war lokale Main-Baseline vor Push und darf nicht als abschließend grün behauptet werden, falls nicht erneut geprüft.
- Abschlusskriterien an reale Checks angleichen.
- Stale Kommentar in `install-rez-sequence-handlers.ts` korrigieren: Region/required-rez-on-install ist umgesetzt; vollständig interaktive optionale Rez-Choice je nicht-required Karte bleibt deferred.
- AI022-/Hints-Stash in der Prozessdatei referenzieren.

Checks:

- `corepack pnpm format:changed -- main`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate: Abschlussdokumentation widerspricht nicht mehr dem tatsächlichen Stand, Kommentar ist aktuell.

Commit: `docs(ai): clean up action semantics baseline`

#### P1 Ergebnis

Umgesetzt:

- Vorige Foundation-Prozessdatei auf `complete` gesetzt.
- P15-Baseline-Widerspruch präzisiert: Branch-Diff gegen lokalen `main` war grün; die historische `origin/main`-Rotmeldung gehörte zur damals ungepushten lokalen Main-Baseline.
- Separater AI022-/Hints-Strang als Stash `ai022-hints-local-baseline-before-followup-process` dokumentiert.
- Abschlusskriterien auf die jeweils dokumentierte Paket- oder Integrationsbasis bezogen.
- Data-Fort-Reclamation-Kommentar aktualisiert: Region-Replacement und required root rez-on-install sind umgesetzt; vollständig interaktive optionale Rez-Choice je nicht-required Karte bleibt deferred.

Checks:

- Grün: `corepack pnpm format:changed -- main`
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/ai typecheck`
- Grün: `git diff --check`

### P2 TargetProfile-Gap-Closure Sprint 1

Ziel: TargetProfile-Gaps messbar reduzieren, zuerst klare Proteus-Muster.

Arbeit:

- Für echte type/mode choices TargetProfiles mit `mode_choice` ergänzen, legal aus `LegalAction`/`ChoiceOption`, hidden-info-safe.
- Für mobile ICE echte Positionsprofile ergänzen.
- Access-Reveal/Ambush nicht als TargetProfile missbrauchen, wenn keine Auswahl besteht.
- Report aktualisieren und Gap-Differenz dokumentieren.

Checks:

- `node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report`
- `node scripts/check-ai-action-semantic-signal-catalog.mjs --check`
- `corepack pnpm check:ai`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: `target_profile_gaps` sinkt oder nicht senkbare Kandidaten sind mit reason deferred.

Commit: `feat(ai): reduce target profile signal gaps`

#### P2 Ergebnis

Umgesetzt:

- TargetProfile-Gaps von 116 auf 84 reduziert.
- Echte Choice-/Zielprofile ergänzt für:
  - Proteus ICE mit type/mode choices: Caryatid, Credit Blocks, Galatea, Lesser Arcana, Sphinx 2006, Sumo 2008.
  - Mobile ICE: Mobile Barricade, Walking Wall.
  - Temporäre/deferred Rez-Ziele: Emergency Rig, Rent-to-Own Contract.
  - Access-trash Runner-Karten: Crumble, Garbage In.
- Signale, die keine echte Ziel-/Moduswahl darstellen, zählen nicht mehr als TargetProfile-pflichtig: R&D-Reveal-Requirements, reine Access-Ambush-Current-Access-Effekte, statische Conditions, Self-Counter-Banks, Score-Fort-Trash und Random/Guessing.
- Active Hints, Compiled Hints, Inspector Index und Signal-Katalog-Report aktualisiert.

Checks:

- Grün: `node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report`
- Grün: `node scripts/check-ai-action-semantic-signal-catalog.mjs --check`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm --filter @netgrid/ai typecheck`
- Zunächst rot wegen generierter JSON-Formatierung, danach grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

### P3 Engine-backed ActionSemanticCoverage

Ziel: Coverage misst echte Engine-Situationen zusätzlich zu synthetischen Kandidaten.

Arbeit:

- Engine-backed Fixtures für Basic Turn, successful runs, score/rez/access windows und hidden-info barriers ergänzen.
- Coverage-Report um engine-backed Kandidaten und Raten erweitern.
- Hidden-info leaks und LegalAction-Generation-Änderungen explizit auf 0 prüfen.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts src/action-semantic-candidate.test.ts`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

Ergebnis:

- ActionSemanticCoverage trennt synthetische Kandidaten von Engine-backed LegalActions und schreibt diese Quellen in den Coverage-Report.
- Der Real-Engine-Anteil wird aus `collectRealEngineLegalActions()` gespeist; aktuell werden 33 Engine-backed Kandidaten gegen 11 synthetische Kandidaten ausgewertet.
- Der Report enthält Source-/Resolve-Raten sowie explizite Guard-Werte für Hidden-Info-Leaks und LegalAction-Generation-Änderungen.
- `scripts/check-ai-compiled-hints.mjs` vergleicht generierte JSON-Artefakte strukturell statt als exakte Textdatei. Das verhindert Formatierungs-Pingpong zwischen Generator und Prettier, ohne Inhaltsschwankungen zu tolerieren.

Done-Gate: Engine-backed candidate count > 0, hidden-info leaks = 0, LegalAction generation changes = 0.

Commit: `test(ai): add engine backed action semantic coverage`

### P4 Data Fort Reclamation optionale Rez-Boundary

Ziel: Verbliebene optionale Rez-Boundary fachlich prüfen.

Arbeit:

- Prüfen, ob aktuelle Nicht-Region-Root-Karten im DFR-Pfad vom Batch-Optional-Rez abweichen.
- Wenn keine aktuelle Karte betroffen ist, `no current behavioral divergence` dokumentieren und bestehenden Test absichern.
- Wenn betroffen, neues Sequenzmodell nur mit hidden-info-sicherem Choice-Vertrag vorbereiten oder blockieren.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/index-tests/mechanics/per-card-longtail.test.ts --testNamePattern "Data Fort Reclamation"`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

Ergebnis:

- Kein aktueller Nicht-Region-/Nicht-Rez-on-install-Root-Sonderfall erzwingt eine abweichende Runtime-Semantik.
- Der bestehende Vertrag bleibt: normale ICE, Assets und Upgrades werden erst vollständig in das neue Remote installiert und danach in einer gemeinsamen Korp-privaten optionalen Rez-Choice angeboten.
- Region-Upgrades und verpflichtende Root-Rez-on-install-Karten bleiben innerhalb der geordneten Install-Sequenz abgesichert.
- Der Runtime-Vertrag dokumentiert die Boundary und die Removal Condition für ein späteres echtes per-card Install/Rez-Interleaving.

Done-Gate: Boundary ist getestet oder als fachlicher Blocker mit Removal Condition dokumentiert.

Commit: `test(engine): document data fort optional rez boundary`

### P5 Semantic Signal Catalog Quality Sprint

Ziel: Qualität der covered Karten absichern, nicht nur Gaps zählen.

Arbeit:

- Harte Gate-Prüfungen für forbidden subtype-only signals, support-only-only Evidence, erlaubte `no_signal_reason`, echte TargetProfile-Relevanz und deferred owner/scope ergänzen.
- Report-Deltas für covered/deferred/gap, neue/geschlossene Gaps und geänderte Signals ausgeben.
- Die 25 `no_signal_reason != none` als Review-Startpunkt ausgeben, ohne Semantik zu erzwingen.

Checks:

- Grün: `node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report`
- Grün: `node scripts/check-ai-action-semantic-signal-catalog.mjs --check`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

Ergebnis:

- Das Signal-Catalog-Gate validiert erlaubte `no_signal_reason`-Werte, verbietet unbekannte/strukturreine Signale und prüft TargetProfile-Gaps auf echte target-relevante Signale.
- Deferred Rows erhalten `deferred_review_scope` und `deferred_owner`; der Report muss jede deferred Karte in `qualityGate.deferredReviewRows` ausweisen.
- Die 25 No-Signal-Karten werden in `qualityGate.noSignalReviewStart` und im Markdown als Review-Startpunkt aufgeführt.
- Der Report enthält Deltas gegen die P2-Baseline; P5 selbst verändert keine Semantikzahlen: covered 539, deferred 45, no-signal 25, TargetProfile-Gaps 84.

Done-Gate: Quality-Gate läuft ohne Fehler und Report enthält Deltas.

Commit: `feat(ai): harden semantic signal catalog quality gate`

### P6 DeckDoctrine-v2 echte Decksnapshots

Ziel: DeckDoctrine-v2-Diagnostik gegen reale Deckformen prüfen.

Arbeit:

- 4 bis 6 kleine Decksnapshot-Fixtures ergänzen.
- Anchorless bleibt NeutralDoctrine, partial bleibt partial, complete nur mit echten StrategyAnchors.
- Report `docs/reviews/ai/deck-doctrine-v2-diagnostic-fixtures-2026-06-12.md` erzeugen.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/deck-doctrine-strategy.test.ts`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

Ergebnis:

- DeckDoctrine-v2 wird zusätzlich gegen sechs echte Snapshots aus `data/decks/deck-snapshots-0.8.json` geprüft: V0.8 Demo Runner/Corp, Originalset Runner/Corp und Proteus Runner/Corp.
- Die Matrix erzwingt `diagnostic_only`, `productiveUseAllowed=false`, Side-Sicherheit und non-`unknown_snapshot` für reale Snapshots.
- `anchorless` bleibt an `NeutralDoctrine` und null StrategyAnchors gebunden; nicht-anchorless Diagnostics müssen echte StrategyAnchors haben.
- Der Fixture-Report `docs/reviews/ai/deck-doctrine-v2-diagnostic-fixtures-2026-06-12.md` dokumentiert Snapshots und Assertions.

Done-Gate: DeckDoctrine erfindet keine Strategie aus bloßen FunctionSignals.

Commit: `test(ai): verify deck doctrine v2 fixtures`

### P7 Semantic Shadow Trace Real-Engine-Corpus

Ziel: Shadow Trace liest realistischere LegalAction-Sets.

Arbeit:

- Real-Engine-Corpus um sechs Entscheidungspunkte ergänzen.
- Je Snapshot LegalActions, ActionSemanticCandidates, optionale DeckDoctrine und Trace erzeugen.
- Determinismus, LegalAction-Bindung, kein `selectedActionId`, keine Hidden-Info-Marker prüfen.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/semantic-shadow-decision.test.ts src/evaluation/real-engine-decision-corpus.test.ts`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

Ergebnis:

- Der Real-Engine-Decision-Corpus wurde von 12 auf 18 Entscheidungspunkte erweitert.
- Jedes Sample kann nun eine DeckDoctrine-v2-Diagnose als reinen Diagnosekontext tragen; die Trace-/Ranking-Logik konsumiert daraus keine produktiven Gewichte.
- Die Tests erzwingen LegalAction-Bindung, Candidate-Count-Gleichlauf, Side-Safety, `trace.noRuntimeEffect=true` und kein produktives `selectedActionId`.
- Neue Real-Engine-Situationen decken Runner-Click-/Remote-/R&D-Druck sowie Corp-Remote-Defense-, Install-Credit-Pressure- und High-Credit-Main-Window ab.

Done-Gate: Trace bleibt no-effect und real-engine-backed lesbar.

Commit: `test(ai): trace semantic shadow decisions on engine corpus`

### P8 Runtime-Cutover-Sperre

Ziel: Diagnostics bleiben aus produktiver Auswahl heraus.

Arbeit:

- Tests, dass SemanticShadowDecisionTrace nicht produktiv exportiert wird.
- Tests, dass DeckDoctrine-v2 nicht vom Legacy-Planer konsumiert wird.
- Tests, dass ActionSemanticCandidate keine LegalActions erzeugt.
- Feature-Flag-Grenzen dokumentieren.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm check:ai`
- `git diff --check`

Done-Gate: Kein diagnostischer Baustein ist produktiver Cutover-Pfad.

Commit: `test(ai): keep semantic diagnostics out of runtime cutover`

#### P8 Ergebnis

Umgesetzt:

- Runtime-Cutover-Tests erzwingen, dass Shadow-Trace, DeckDoctrine-v2, Real-Engine-Corpus und Semantic-Decision-Frame nicht über die öffentliche AI-Runtime-API exportiert werden.
- ActionSemanticCandidate bleibt eine Projektion über vorhandene LegalActions: keine LegalAction-Erzeugung, kein `applyAction`-Pfad, kein Runtime-Cutover.
- SemanticShadowDecision und DeckDoctrine-v2 bleiben `diagnostic_only`, `productiveUseAllowed=false` und ohne `selectedActionId`.
- Der 18-Sample-Real-Engine-Corpus wird zusätzlich auf no-effect Trace-Verhalten geprüft.
- Durch P2/P7 sichtbar gewordene rote Tests wurden im selben Block korrigiert:
  - TargetProfile-Ontologie um die tatsächlich genutzten aktiven Profilwerte erweitert.
  - Semantic-Shadow-League-Test an die zentrale Korpusquelle gebunden statt an die alte 12-Sample-Verteilung.
  - Inspector-Index-Check auf strukturellen JSON-Vergleich gehärtet, damit Prettier und Determinismus-Test nicht gegeneinander laufen.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/hint-ontology.test.ts src/ai-hint-inspector-index.test.ts src/evaluation/semantic-shadow-league.test.ts`
- Grün: `corepack pnpm --filter @netgrid/ai test`
- Grün: `corepack pnpm check:ai`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

### P9 Lokale Transfer- und Report-Hygiene

Ziel: Lokale Commit- und Reportlage wird inventarisiert.

Arbeit:

- Lokale Commits seit `origin/main` beziehungsweise seit Prozessstart gruppieren.
- Große Diagnose-JSONs nach Notwendigkeit, Determinismus und Reproduzierbarkeit bewerten.
- Keine inhaltliche Report-Löschung ohne separates Gate.

Checks:

- `git log origin/main..HEAD --oneline`
- `git diff --name-status main..HEAD`
- `git diff --check`

Done-Gate: Inventar/Review liegt vor und trifft keine ungesicherte Löschentscheidung.

Commit: `docs(ai): inventory local report hygiene`

#### P9 Ergebnis

Umgesetzt:

- Lokale Prozesscommits seit `main` inventarisiert.
- Geänderte Dateien und größte Prozessdiffs nach Daten-, Report-, Script- und Testartefakten gruppiert.
- Große Diagnose- und AI-JSON-Artefakte bewertet: deterministisch und gate-/review-relevant, daher keine Löschung ohne separates Gate.
- Ältere große `docs/reviews/ai/*.json`-Artefakte als außerhalb dieses Prozessdiffs liegend klassifiziert.
- Bericht erstellt: `docs/reviews/ai/action-semantics-followup-local-report-hygiene-2026-06-12.md`.

Checks:

- Grün: `git log --oneline main..HEAD`
- Grün: `git diff --name-status main..HEAD`
- Grün: `git diff --check`

### P10 Finaler Volltest

Ziel: Alle Änderungen abschließend prüfen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm -r --if-present typecheck`
- `corepack pnpm -r --if-present --no-bail test`
- `corepack pnpm test`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Keine durch diesen Prozess verursachten roten Tests. Branch ist lokal nach `main` integriert, Worktree entfernt, Goal complete.

Commit: `test(ai): verify action semantics followup quality process`

#### P10 Ergebnis

Umgesetzt:

- Finaler Volltest ausgeführt.
- Durch den Prozess verursachter Typecheck-Fehler in `real-engine-decision-corpus-fixtures.ts` behoben: rohe JSON-Snapshot-Seiten werden jetzt explizit auf `runner`/`corp` validiert, bevor sie in DeckDoctrine-Diagnostik gelangen.
- Keine zusätzlichen roten Tests nach Korrektur.

Checks vor Integration:

- Grün: `corepack pnpm check:ai`
- Zunächst rot, danach grün: `corepack pnpm -r --if-present typecheck`
- Grün: `corepack pnpm -r --if-present --no-bail test`
- Grün: `corepack pnpm test`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Keine `test.skip`-Einführung.
- Wenn Tests aus Zeitgründen fokussiert sind, wird der Finalblock trotzdem vollständig ausgeführt.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_ACTION_SEMANTICS_FOLLOWUP_QUALITY`.
- Arbeitsbranch: `codex/action-semantics-followup-quality`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Push nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite Action Semantics Follow-up Quality vollständig und sequenziell von P0 bis P10 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ACTION_SEMANTICS_FOLLOWUP_QUALITY auf Branch codex/action-semantics-followup-quality. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Voriger Abschlussstand ist formal konsistent.
- AI022-/Hints-Strang ist getrennt und nachvollziehbar.
- TargetProfile- und Signal-Katalog-Gates sind strenger und messbarer.
- Engine-backed Coverage, Doctrine-Fixtures und Trace-Korpus existieren oder Blocker sind sauber dokumentiert.
- Runtime-Cutover-Sperre ist testbar.
- Alle Pflichtchecks sind grün oder bestehende Baseline-Abweichungen sind ehrlich dokumentiert.
- Lokaler `main` enthält alle Paketcommits.
