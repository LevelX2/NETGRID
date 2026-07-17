# Letzte zwei Corp-KI-Spiele: Remediation-Prozess vom 17.07.2026

Status: aktiv; P0 in Bearbeitung

## Quelle und Zielprüfung

Quellen sind die beiden zuletzt abgeschlossenen Spiele aus der lokalen,
read-only ausgewerteten SQLite-Runtime:

- `match_a7593a9bf8632052`, 79/79 Entscheidungen mit detailliertem Trace;
- `match_8107a9dffe8cd234`, 113/113 Entscheidungen mit detailliertem Trace.

Der Nutzer hat nach der vollständigen Zuganalyse die direkte Behebung der
bestätigten Punkte freigegeben. Ein KI-Verhaltensfix wird nur umgesetzt, wenn
ein spielgleicher Checkpoint auf dem unveränderten aktuellen Code als
`behavior_regression` rot ist. Der abweichende Rez-Aktionstyp und die
blockierenden Deck-Hint-Überlappungen erhalten eigene Schichtverträge.

## Gesamtziel und `/Goal`

`/Goal`: Die bestätigten Fehlentscheidungen der letzten beiden Corp-KI-Spiele
zuerst als unveränderte historische Decision-Checkpoints oder enge
Schichtverträge sichern, ausschließlich aktuell reproduzierbare Fehler
generisch in Scoreline-, Plan-, Remote-Ziel- und Agenda-Risiko-Arbitration
korrigieren, den Rez-Aktionstyp vereinheitlichen, alle blockierenden
Compiled-Effect-Überlappungen beider Corp-Decks fachlich schließen, sämtliche
Gegenproben und breiten Gates grün verifizieren, jedes Paket einzeln
committen und den fertigen Arbeitsbranch lokal nach `main` integrieren.

- Arbeitsbranch: `codex/ai-latest-two-corp-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_LATEST_TWO_CORP_REMEDIATION`
- Ausgangs-`main`: `fac49a9a1911b71580dd719288888ed96e46a02e`
- Runtime-Evidence:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Regelkonforme Einzelentscheidungen ohne belegte bessere Alternative bleiben
  unverändert.
- Die fünf verdeckten Choice-Entscheidungen aus Match A und die geheime
  Zahlenwahl D13 aus Match B werden mangels belastbarer Gegenevidence nicht
  passend gestimmt.
- Die historischen Decklisten und Runtime-Daten werden nicht migriert.
- Hint-Korrekturen deduplizieren nur fachlich überlappende aktive,
  kompilierte oder abgeleitete Effekte; legitime Mehrfachsemantik bleibt
  erhalten.
- Fremde Worktrees und zwischenzeitliche `main`-Änderungen bleiben
  unangetastet.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben einzige Aktionsautorität.
- AI-Runtime und Checkpoints verwenden nur actor-sichere `PlayerView`-,
  `PublicEvent`-, Deck-Snapshot- und LegalAction-Daten.
- Vor dem Red-Evidence-Commit wird kein Produktionscode geändert.
- Nur `behavior_regression` autorisiert einen KI-Verhaltensfix; Drift- oder
  Infrastrukturstatus werden dokumentiert und nicht als rote Evidence
  ausgegeben.
- Historische Erwartungen werden nach dem roten Nachweis nicht abgeschwächt.
- Jede neue Priorität erhält mindestens eine enge Gegenprobe.
- Genau ein Paket ist aktiv. Jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Warmup-Drift und Redaction-Fehler sind keine
  KI-Verhaltensevidence.
- Lässt sich ein Finding nicht spielgleich reproduzieren, wird kein
  Verhalten passend gestimmt; stattdessen wird der aktuelle Status sichtbar
  dokumentiert.
- Erfordert eine Lösung Hidden Info, nicht deterministische Auswahl oder eine
  Umgehung von `LegalActions`, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety-, Hint- oder AI-Gate-Fehler
  blockieren Abschluss und Merge.

## State Machine

`preflight -> process_committed -> evidence_committed -> red_evidence_committed -> scoreline_fixed -> contracts_fixed -> broad_green -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Preflight, Worktree und Prozessbasis

- Ziel: Scope, `/Goal`, Invarianten, Paketfolge und Integrationsregeln
  versionieren.
- Check: `git diff --check`.
- Done-Gate: Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan latest corp match remediation`.

### P1 – Spiel-Evidence und Deck-Consumer-Ausgangslage

- Ziel: Entscheidungsabdeckung, Finding-Anker, bessere Alternativen,
  Nicht-Findings und beide vollständigen Deck-Hint-Audits dauerhaft
  dokumentieren.
- Kernartefakt:
  `docs/reviews/ai/latest-two-corp-match-remediation-evidence-2026-07-17.md`.
- Done-Gate: Match A ist mit 79/79, Match B mit 113/113 Decisions gedeckt;
  alle blockierenden Compiled-Effect-Überlappungen sind kartengenau erfasst.
- Commit: `docs(ai): record latest corp match evidence`.

### P2 – Spielgleiche Checkpoints und rote Schichtverträge

- Historische Zieldecisions:
  - Match A D45: trotz finanzierter, geschützter Scoreline weiterer
    Basiscredit statt Agenda-Entwicklung;
  - Match A D55: Paris City Grid blockiert die einzige geschützte
    Score-Remote;
  - Match B D27: drei unterschiedlich riskante Agenden erhalten denselben
    Installationswert;
  - Match B D110: bei 5:5 und stark geschützter Remote kein
    Matchpoint-Agendaaufbau.
- Schichtvertrag: ein erfolgreicher Nicht-ICE-Rez besitzt in LegalAction,
  Trace und PublicEvent denselben generischen Aktionstyp.
- Deckverträge: jede aktuell blockierende Compiled-Effect-Überlappung der
  beiden Decks ist rot erfasst.
- Gegenproben: ungeschützte oder nicht finanzierbare Scoreline, legitime
  zentrale Root-Installation, gleichwertige Agenda-Risiken, kein
  Matchpointfenster, regulärer ICE-Rez und legitime nicht überlappende
  Mehrfacheffekte.
- Done-Gate: valide Decision-Checkpoints sind ausschließlich als
  `behavior_regression` rot; Schichtverträge sind in ihrer eigenen Schicht
  rot; Gegenproben bleiben grün; alles ist vor Produktionscode committed.
- Commit: `test(ai): capture latest corp match regressions`.

### P3 – Scoreline-, Plan- und Agenda-Risiko-Arbitration

- Ziel: spekulative Punish-Pläne dürfen eine konkrete, finanzierte und
  ausreichend geschützte Scoreline nicht dauerhaft dämpfen; Support-Pläne
  dürfen keine wertmindernde Root-Belegung erzwingen; Agenda-Zielwerte
  unterscheiden den tatsächlich gefährdeten Agenda-Wert; Matchpointfenster
  bleiben trotz allgemeiner Exposure-Penalties handlungsfähig.
- Checks: vier historische Checkpoints, alle Gegenproben sowie angrenzende
  Scoreline-, PlanRanking-, Target- und Runtime-Tests.
- Done-Gate: historische Erwartungen und Gegenproben sind grün, ohne
  LegalAction-, Side-Safety- oder deterministische Verträge zu verändern.
- Commit: `fix(ai): convert protected corp scorelines`.

### P4 – Rez- und Deck-Hint-Verträge

- Ziel: Nicht-ICE-Rez wird als generische Rez-Aktion konsistent abgebildet;
  die blockierenden Effektüberlappungen von Corporate Coup, Hostile
  Takeover, Accounts Receivable, Closed Accounts, Efficiency Experts, Night
  Shift, Scorched Earth, Marine Arcology, Overtime Incentives und Red
  Herrings werden fachlich normalisiert.
- Checks: LegalAction/applyAction/PublicEvent/Replay-Verträge,
  Hint-Compiler/Inspector/Derived Facts, Capability-/Strategy-Consumer und
  beide feste Deck-Audits.
- Done-Gate: beide Deck-Audits melden `status=ok`, null Blocker und keine neu
  eingeführten Warnungen.
- Commit: `fix(engine-ai): normalize rez and deck hint contracts`.

### P5 – Breite Gates, Wissenspflege, Main-Integration und Cleanup

- Ziel: AI-Testshards beziehungsweise vollständige AI-Suite, relevante
  Engine-Tests, Typechecks, Hint-/Ontology-Gates, Abschlussreview und
  Wissenspflege abschließen; aktuelles `main` defensiv einbinden, final
  prüfen, lokal mergen und Worktree sowie Branch verifiziert entfernen.
- Done-Gate: alle Pflichtchecks sind grün oder nachvollziehbar als bestehende
  Baseline klassifiziert; `main` enthält alle Paketcommits und ist sauber;
  Worktree-Pfad und Arbeitsbranch existieren weder in Git noch im
  Dateisystem.
- Commit: `docs(ai): close latest corp match remediation`.

## Verifikations- und Integrationsregeln

- Decision-Checkpoints laufen mit Strict-Warmup und produktivem Chooser.
- Jede relevante Runtime-/Arbitration-Änderung durchläuft die AI-Testshards
  oder die vollständige AI-Suite.
- Hint-Änderungen durchlaufen Generator-/Konsistenzgates, Inspector-Checks
  und beide deckweiten Consumer-Audits.
- Engine-Änderungen werden deterministisch auf `LegalActions`, `applyAction`,
  Replay und StateHash geprüft.
- Vor jedem Commit laufen die relevanten Checks und `git diff --check`.
- Umsetzung erfolgt ausschließlich im Arbeitsworktree; der Hauptworkspace
  dient nur als read-only Runtime-Quelle und für den finalen lokalen Merge.
- Jedes Paket endet mit selektivem Staging und eigenem Commit.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_LATEST_TWO_CORP_REMEDIATION` auf Branch
`codex/ai-latest-two-corp-remediation`. Arbeite immer nur am aktuellen Paket,
sichere historische Fehlentscheidungen und Schichtverträge vor jeder
Produktionsänderung, akzeptiere nur `behavior_regression` als roten
KI-Nachweis, ändere danach keine Erwartungen, prüfe Hints bis zu ihren
produktiven Consumern, committe jedes abgeschlossene Paket und nutze den
Hauptworkspace nur für Runtime-Evidence und den finalen Merge.

## Abschlusskriterien

- Alle freigegebenen Punkte besitzen valide Checkpoints oder rote
  schichtspezifische Verträge und grüne Gegenproben.
- Jeder KI-Verhaltensfix war vorab als `behavior_regression` rot.
- Scoreline-, Plan-, Root- und Agenda-Risiko-Arbitration sind generisch,
  side-safe und replay-stabil korrigiert.
- Rez-Aktionstyp und beide Deck-Hint-/Consumer-Audits sind konsistent grün.
- Pflichtchecks und verbleibende Grenzen sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.

## Ausführungsstand

- P0 aktiv: Worktree und Arbeitsbranch sind angelegt; das Prozessartefakt
  wartet auf Diffprüfung und separaten Commit.
