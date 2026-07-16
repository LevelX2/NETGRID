# Match 36BA22D6: Runner-Plan-, Bank- und Access-Risk-Remediation

Status: P0 bis P2 abgeschlossen, P3 aktiv

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_36ba22d6a89b2ac4` aus der lokalen,
read-only ausgewerteten SQLite-Runtime. Alle 98 Runner-KI-Entscheidungen sind
durch detaillierte AI-Traces gedeckt. Der Nutzer hat nach der vollständigen
Analyse die direkte Umsetzung der folgenden Punkte freigegeben:

- Opening-Hand-Bewertung erkennt eine ausführbare Breaker-Suchlinie nicht;
- Cortical-Cybermodem-Funding verdrängt wiederholt bessere Sofortaktionen,
  ohne den finanzierten Installationsplan abzuschließen;
- Streetware Distributor erhält in demselben Zug wiederholt den vollen
  Bank-Aufladungsbonus;
- ein Remote-Contest-Plan erzwingt trotz `gain_credits_first` einen
  unterfinanzierten Run;
- zwei aufeinanderfolgende öffentliche Trace-5-Subroutinen werden nur als
  isolierte Einzelchoices bewertet;
- der Runner setzt am Jack-out-Fenster trotz zweier sichtbarer Dedicated
  Response Teams und garantierter Flatline fort.

Die Vorgabe ist für einen sequenziellen Paketprozess präzise. Änderungen
werden nur für Checkpoints umgesetzt, die auf dem aktuellen Code als
`behavior_regression` rot sind. Engine-, Runtime-, Fixture- oder
LegalAction-Drift ist zunächst Infrastrukturarbeit und kein bestätigter
KI-Fehler.

## Gesamtziel und `/Goal`

`/Goal`: Die freigegebenen Findings aus Match 36BA22D6 im eigenen Worktree
zuerst als spielgleiche Decision-Checkpoints mit historischem Runtime-Zustand
sichern, ausschließlich bestätigte `behavior_regression`-Fälle generisch in
Opening-Hand-, Plan-, Bank-, Trace- und Access-Risk-Consumern korrigieren,
unveränderte Erwartungen und enge Gegenproben grün verifizieren, alle Pakete
einzeln committen und den fertigen Arbeitsbranch lokal nach `main`
integrieren.

- Arbeitsbranch: `codex/ai-match-36ba22d6-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_36BA22D6_REMEDIATION`
- Ausgangs-`main`: `abe7a29709fc13d87b9abc8ddf2c8d14075e68ce`
- Runtime-Evidence:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Rules Engine, Kartentext und aktive Hints waren für die untersuchten
  Runner-Karten und Dedicated Response Team fachlich korrekt. Der Prozess
  ändert sie nur, falls ein Checkpoint eine entgegenstehende aktuelle
  Evidence liefert.
- Das Match beweist technische Verhaltensfehler, aber keine globale
  Deckoptimalität. Der Prozess baut das Deck nicht um.
- Die erste Streetware-Aufladung bleibt zulässig. Begrenzt werden nur
  wiederholte Aufladungen ohne akuten, zeitnah auszahlbaren Bedarf.
- Frühe Informations-Runs gegen unbekanntes ICE bleiben zulässig. Verboten
  wird nur der belegte Run, dessen eigene aktionsspezifische Bewertung
  `gain_credits_first` und eine verletzte Reserve meldet.
- Access-Risk verwendet ausschließlich bereits sichtbare, bekannte Karten,
  aktuelle Tags, Handgröße und öffentliche beziehungsweise side-safe
  Semantik. Unbekannte Root-Karten dürfen nicht erraten werden.
- D96 bis D98 sind erzwungene Folgen von D95 und erhalten keinen künstlichen
  Verhaltensfix.
- Der fremde Worktree `codex/ai-match-03575-trace-repeat` verändert bereits
  `packages/ai/src/runtime/bid-choice-option.ts`. Der Trace-Befund wird hier
  zunächst nur capturt und klassifiziert. Eine notwendige Änderung an dieser
  Datei erfolgt erst nach einem kollisionsfreien Main-Abgleich.
- Fremde Worktrees und ihre offenen Änderungen bleiben unangetastet.

## Controller-Invarianten

- `LegalActions` und Rules Engine bleiben alleinige Aktionsautorität.
- Checkpoints enthalten nur das öffentliche Eventpräfix bis zur Zieldecision,
  den historischen Actor-/Deck-Kontext und side-safe Runtime-Memory.
- Vor dem Red-Evidence-Commit wird kein Produktionscode geändert.
- Nur `behavior_regression` autorisiert einen Verhaltensfix. Bereits grüne
  oder driftende Fälle werden dokumentiert, nicht durch Score-Tuning
  nachgebaut.
- Aktionsspezifische RunTarget-Evaluation schlägt eine generische spätere
  Server-Neuberechnung.
- Planfortschritt muss Kosten, verbleibende Klicks, aktuelle Liquidität,
  Zielerreichbarkeit und zwischenzeitliche Planabweichungen revalidieren.
- Verzögert auszahlbare Bankwerte sind keine sofort verfügbare Liquidität.
- Ein Survival-Interrupt darf einen bekannten, kumulativ tödlichen
  Access-Pfad deterministisch abbrechen; unbekannte Access-Karten bleiben
  unsichtbar.
- Genau ein Paket ist aktiv. Jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Warmup-Drift und Redaction-Fehler werden eng
  diagnostiziert und nicht als rote Verhaltensevidence ausgegeben.
- Ist ein historischer Fall auf aktuellem Code bereits grün, bleibt die
  Expectation als Regression erhalten; es entsteht kein zusätzlicher Fix.
- Fehlt am D95-Snapshot wegen aktueller Engine-Semantik das historische
  Jack-out-Fenster, wird eine explizite Fixture-Migration separat behandelt.
  Der AI-Fix wartet auf einen validen produktiven LegalAction-Kontext.
- Erfordert eine Lösung Hidden Info, nicht deterministische Auswahl oder eine
  KI-seitige Umgehung fehlender LegalActions, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler
  blockieren Abschluss und Merge.

## State Machine

`preflight -> process_committed -> evidence_committed -> checkpoints_classified -> red_evidence_committed -> behavior_fixed -> focused_green -> broad_green -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Preflight, Worktree und Prozessbasis

- Ziel: Scope, `/Goal`, Invarianten, bekannte Parallelität und
  Integrationsregeln versionieren.
- Check: `git diff --check`.
- Done-Gate: Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan match 36ba22d6 remediation`

### P1 – Spiel-Evidence und Fehlergruppen

- Ziel: 98/98-Decision-Coverage, Fehlerdecisions, bessere Alternativen,
  Hint-/Consumer-Ketten, aktuelle Einzelgegenprüfung und Grenzen dauerhaft
  dokumentieren.
- Kernartefakt:
  `docs/reviews/ai/match-36ba22d6-runner-remediation-evidence-2026-07-17.md`.
- Done-Gate: Evidence trennt historische Findings, aktuelle
  Reproduktionsindikatoren und nicht freigabefähige Drift.
- Commit: `docs(ai): record match 36ba22d6 evidence`

### P2 – Spielgleiche Checkpoints und Red-Evidence

- Ziel: mindestens D01, D39 oder D42, D68, D81, D91 und D95 strikt capturen.
- Erwartungen:
  - D01: Keep statt Mulligan für die ausführbare Such-/Ökonomiehand;
  - D39/D42: nach höchstens einer Background-Aufladung eine produktive
    Nicht-Aufladungsaction;
  - D68: kein Start-Run bei eigener Empfehlung `gain_credits_first`;
  - D81: keine letzte Funding-Aktion, wenn der Plan nicht im selben Zug
    konvertierbar ist und ein freier Remote-Run verfügbar ist;
  - D91: bei mehreren unvermeidbar nicht vollständig bezahlbaren
    Tag-Traces kein wirkungsloser Teil-Bid;
  - D95: Jack-out vor kumulativ tödlichem sichtbarem Access-Schaden.
- Gegenproben:
  - Mulligan ohne Breaker und ohne erreichbare Suchlinie;
  - erste Bank-Aufladung oder akuter auszahlbarer Fundingbedarf;
  - vollständig finanzierter Remote-Run mit erreichbarem Access;
  - unmittelbar konvertierbarer Handkarten-Fundingplan;
  - einzelne bezahlbare Trace, die einen Tag vollständig verhindert;
  - unbekannter oder nicht tödlicher Access-Schaden.
- Done-Gate: jeder valide rote Zieltest scheitert ausschließlich als
  `behavior_regression`; grüne beziehungsweise driftende Fälle sind separat
  klassifiziert; Red-Evidence ist vor Produktionscode committed.
- Commit: `test(ai): capture match 36ba22d6 regressions`

Ergebnis:

- D01 wurde mit `warmup-policy strict`, ohne Warmup-Drift und mit dem
  historischen State 0 als spielgleicher Checkpoint capturt. Der unveränderte
  aktuelle Code scheitert ausschließlich als `behavior_regression` und wählt
  `mulligan` statt `keep`.
- Die enge Gegenprobe ersetzt nur den in der Hand liegenden Programmsucher
  durch eine dritte Druck-/Ökonomiekarte. Sie bleibt auf demselben aktuellen
  Code grün und wählt weiterhin `mulligan`.
- Der Strict-Capture aller späteren Zielentscheidungen stoppt bereits im
  Warmup an D02: historisch wurde `runner.gain_credit`, aktuell
  `runner.start_run.rd` gewählt. Ein `rebase` würde den historischen
  Runtime-Zustand kaschieren und wurde deshalb nicht verwendet.
- F2 bis F5 sind damit aktuell nicht spielgleich reproduzierbar und
  autorisieren keinen Verhaltensfix. F5 ist zusätzlich in der direkten
  zustandslosen Gegenprüfung bereits fachlich grün (`bid_0`).
- F6 besitzt auf dem aktuellen Engine-Stand am historischen Snapshot keine
  LegalActions mehr und bleibt zusätzlich als `engine_legality_drift`
  klassifiziert.
- Dauerhafte Red-Evidence:
  `docs/reviews/ai/match-36ba22d6-runner-checkpoint-red-evidence-2026-07-17.md`.

### P3 – Bestätigte generische Verhaltenskorrekturen

- Ziel: ausschließlich rote Verhaltensverträge beheben.
- Mögliche Consumer:
  - `deck-opening-hand.ts` für ausführbare Breaker-Suchlinien;
  - Handkartenentwicklung und `semantic-choice-ranking.ts` für erreichbare,
    bounded Funding-Pläne;
  - `runner-bank-investment-context.ts` und PlanPortfolio-Kadenz für
    Aufladungsgrenzen und Auszahlungsdauer;
  - Remote-Contest-Mapping für `gain_credits_first` und Reserveverletzung;
  - Trace-Choice nur nach kollisionsfreiem Main-Abgleich;
  - neuer side-safe Runner-Access-Risk-Consumer am Jack-out-Fenster.
- Done-Gate: unveränderte rote Expectations und Gegenproben grün; keine
  Karten-, Match-, Seed- oder Instanzsonderregeln.
- Commitfolge: nach bestätigter Fehlergruppe getrennte `fix(ai): ...`-Commits.

### P4 – Fokussierte und angrenzende Regressionen

- Ziel: Checkpoints, neue Gegenproben und direkt angrenzende Opening-, Plan-,
  Economy-, RunPlan-, Trace- und Access-Tests grün.
- Checks: direkte Vitest-Dateien, AI-Typecheck und `git diff --check`.
- Done-Gate: keine neue rote fokussierte Erwartung.
- Commit: `test(ai): verify match 36ba22d6 remediation`

### P5 – Breite Gates, Review und Wissenspflege

- Ziel: vollständige AI-Suite oder AI-Testshards, relevante Hint-/Ontology-
  Gates, Final Review, AI-Architekturindex und Monatslog abschließen.
- Done-Gate: Baseline-Abweichungen sind klassifiziert; Arbeitsbranch ist
  sauber und merge-bereit.
- Commit: `docs(ai): close match 36ba22d6 remediation`

### P6 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, relevante Checks wiederholen,
  bevorzugt Fast-Forward nach lokalem `main` mergen und Worktree sowie Branch
  verifiziert entfernen.
- Done-Gate: `main` enthält alle Paketcommits und ist sauber; Worktree-Pfad
  und Arbeitsbranch existieren weder in Git noch im Dateisystem.

## Verifikationsregeln

- Checkpoint-Erwartungen werden nach dem roten Nachweis nicht abgeschwächt.
- Jede neue Priorität erhält eine enge positive oder negative Gegenprobe.
- Fokussierte Vitest-Dateien werden direkt mit einem verfügbaren Binary
  ausgeführt; fehlende Worktree-Dependencies rechtfertigen keinen Mock.
- Bei Runtime-/Arbitration-Änderungen werden die AI-Testshards oder die
  vollständige AI-Suite ausgeführt.
- Hint-/Deck-Audit bleibt nach Consumer-Änderungen 20/20 ohne neue Warnung.
- Vor dem finalen Merge werden zwischenzeitliche `main`-Änderungen und der
  fremde Trace-Branch inhaltlich geprüft. Fremde Intentionen bleiben erhalten.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_MATCH_36BA22D6_REMEDIATION`.
- Hauptworkspace nur für Runtime-Evidence und finalen lokalen Merge nutzen.
- Jedes Paket endet mit Checks, `git diff --check`, selektivem Staging und
  eigenem Commit.
- Kein Push und kein Pull Request.
- Kein fremder Worktree wird verändert, bereinigt oder entfernt.
- Vor Cleanup werden absoluter Worktree-Pfad, sauberer Status und erfolgreiche
  Main-Integration erneut geprüft.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_36BA22D6_REMEDIATION` auf Branch
`codex/ai-match-36ba22d6-remediation`. Arbeite immer nur am aktuellen Paket,
capture historische Verhaltensverträge vor Produktionsänderungen, akzeptiere
nur `behavior_regression` als roten Nachweis, ändere danach keine
Expectations, committe jedes abgeschlossene Paket und nutze den
Hauptworkspace nur für Runtime-Evidence und den finalen Merge.

## Abschlusskriterien

- Alle freigegebenen Zieldecisions besitzen valide Checkpoints oder eine klar
  dokumentierte Driftklassifikation.
- Jeder umgesetzte Fix war vorab als `behavior_regression` rot.
- Unveränderte Zielerwartungen und enge Gegenproben sind grün.
- Opening-Hand-, Plan-, Bank-, Remote-, Trace- und Access-Risk-Verträge sind
  generisch, side-safe und replay-stabil.
- Pflichtchecks und verbleibende Grenzen sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
