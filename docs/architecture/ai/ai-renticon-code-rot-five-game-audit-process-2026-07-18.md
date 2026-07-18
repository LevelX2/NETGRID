# Rent-I-Con gegen CODE ROT: Fünf-Spiele-Audit vom 18.07.2026

Status: Umsetzung freigegeben, Remediation-Zyklus 1 aktiv

## Quelle, Deckpaar und Ziel

Ausgangspunkt ist das jüngste gespeicherte Spiel
`match_a7593a9bf8632052`. Verwendet werden exakt dessen Deckstände:

- Runner: `Rent-I-Con: Das Shellspiel`, Snapshot
  `local_runner_rent_i_con_shellspiel_2026_07_17_snapshot_v0_6`,
  Deck-Hash `fnv1a:ed5cbfb6`;
- Corp: `CODE ROT: Bitte eintreten v2`, Snapshot
  `local_corp_code_rot_bitte_eintreten_2026_07_16_snapshot_v0_6`,
  Deck-Hash `fnv1a:65883820`.

`/Goal`: Fünf vollständig deterministische KI-gegen-KI-Partien dieses
Deckpaars mit dauerhaft gesicherten Seeds und detaillierter, side-sicherer
Decision-Evidence ausführen, jede KI-Entscheidung klassifizieren, beide
Deck-Hint-/Consumer-Ketten prüfen und bestätigte Fehlentscheidungen samt
besserer legaler Alternative dokumentieren, ohne vor der ausdrücklichen
Nutzerfreigabe Produktionsverhalten zu ändern.

- Arbeitsbranch: `codex/ai-renticon-code-rot-five-game-audit`
- Worktree: `C:\Projekte\NETGRID_AI_RENTICON_CODE_ROT_FIVE_GAME_AUDIT`
- Ausgangs-`main`: `2b19e9b58e650c2954d0e1aec7d6fbac35b654db`
- Runtime-SQLite: ausschließlich read-only Referenzquelle
- Push oder Pull Request: nicht Teil des Prozesses

## Invarianten und Grenzen

- Rules Engine und `LegalActions` bleiben die einzige Aktionsautorität.
- Auswertung und Artefakte verwenden nur side-sichere PlayerViews,
  LegalActions, PublicEvents, AI-Traces und freigegebene Deck-Snapshots.
- Seed, Deck-Hashes, Git-Stand, Aktionslimit und Ausführungsbefehl werden so
  gesichert, dass dieselben fünf Läufe später identisch wiederholbar sind.
- Jede Runner- und Corp-Entscheidung der fünf Spiele gehört zum Nenner; reine
  Detector-Stichproben gelten nicht als vollständige Analyse.
- Replay-, StateHash-, Redaction- oder Decision-Coverage-Fehler blockieren
  eine fachliche Bewertung des betroffenen Laufs.
- Vor einer ausdrücklichen Nutzerfreigabe werden keine KI-, Hint-, Engine-
  oder UI-Fixes umgesetzt.
- Fremde Worktrees und zwischenzeitliche Änderungen auf `main` bleiben
  unangetastet.

## Paketfolge

### P0 – Preflight und Prozessbasis

- Worktree, Branch, Scope, Deckidentität, Invarianten und Paketfolge sichern.
- Done-Gate: Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan five game deck audit`.

### P1 – Reproduzierbarer Selfplay-Korpus

- Exakte Snapshots aus der gespeicherten Match-Evidence side-sicher laden.
- Fünf feste Seeds und vollständige Laufkonfiguration im Seed-Manifest
  versionieren.
- Fünf Spiele mit Detailtraces bis zum regulären Ergebnis oder einem
  sichtbar klassifizierten Aktionslimit ausführen.
- Done-Gate: Deck-Hashes stimmen; fünf Resultate besitzen Replay-,
  Redaction-, StateHash- und Coverage-Nachweis.
- Commit: `test(ai): record reproducible five game corpus`.

### P2 – Vollständige Entscheidungs- und Deckanalyse

- Jede Runner- und Corp-Decision einschließlich Choice-, Rez-, Run-, Access-
  und weiterer Parent-/Child-Fenster klassifizieren.
- Für jeden belastbaren Befund eine bessere konkrete LegalAction und die
  sinnvolle Folgeauswahl benennen.
- Beide vollständigen Deck-Hint-/Consumer-Audits ausführen; nur
  `status=ok` schließt die jeweilige Kette.
- Done-Gate: Decision-Nenner vollständig geschlossen, Befunde dedupliziert,
  Unsicherheiten und Nicht-Findings ausdrücklich dokumentiert.
- Commit: `docs(ai): analyze five selfplay games`.

### P3 – Review und Freigabepause

- Ergebnisübersicht, Einzelspielverläufe, Fehlentscheidungen, bessere
  Alternativen und geplante Anpassungsmaßnahmen als führendes Review
  dokumentieren.
- Dem Nutzer alle eindeutigen Punkte vorlegen und genau eine Freigabefrage
  für eine mögliche Umsetzung stellen.
- Done-Gate: Keine Produktionsänderung; Worktree bleibt für eine mögliche
  freigegebene Remediation erhalten.

## State Machine

`preflight -> process_committed -> seeds_committed -> games_complete -> decisions_audited -> deck_audits_complete -> review_committed -> approval_pause -> remediation_red -> remediation_green -> five_game_cycle -> full_audit -> (remediation_red | zero_error_gate) -> final_verify -> main_merge -> cleanup`

## Sicherheits- und Fehlerbehandlung

- Ein nicht auflösbarer Snapshot- oder Hash-Drift stoppt die Läufe.
- Ein am Aktionslimit beendetes Spiel wird nicht als Sieg gewertet und
  ausdrücklich als unvollständig ausgewiesen; sein bis dahin vorhandener
  Decision-Nenner bleibt prüfpflichtig.
- Nicht reproduzierbare, hidden-info-abhängige oder nicht durch LegalActions
  belegte Vermutungen werden nicht als KI-Fehler klassifiziert.
- Erst nach Nutzerfreigabe dürfen bestätigte Punkte über spielgleiche rote
  Checkpoints in weitere Umsetzungspakete überführt werden.

## Ausführungsstand

- P0 abgeschlossen und committed: `ca1da3cf3`.
- P1 abgeschlossen und committed: `d1f740f5b`.
- P2 abgeschlossen und committed: `9e2c82add`; fünf Seeds ausgeführt,
  1.629/1.629 Entscheidungsversuche klassifiziert, beide Deck-Audits
  `status=ok`, Review und redaktionssicheres Ledger erstellt.
- P3 abgeschlossen: Nutzerfreigabe zur Umsetzung und zu wiederholten
  Fünferzyklen erteilt.

### P4 – Rote Remediation-Evidence

- Die acht bestätigten Selfplay-Entscheidungen aus den Seeds 002, 003 und 004
  als unveränderte `captured_selfplay`-Checkpoints sichern.
- Für jede Fehlergruppe enge positive Gegenproben ergänzen.
- Die verschachtelte Secret-Spend-/Target-Choice als Engine-Sequenztest bis
  zum bisherigen Invariant-Abbruch reproduzieren.
- Den vollständigen Export-Payload gegen rohe Karteninstanz-IDs testen.
- Done-Gate: KI-Zielchecks melden ausschließlich `behavior_regression`,
  Gegenproben bleiben grün, Engine- und Trace-Zieltests sind kausal rot.
- Commit: `test(ai): capture five game remediation regressions`.

### P5 – Engine- und Trace-Korrektur

- Neue PendingChoices aus verschachtelten Choices auf die tatsächlich nächste
  StateVersion synchronisieren, ohne die `applyAction`-Validierung zu lockern.
- Detaillierte Action-Alternativen zentral und side-sicher sanitizen; den
  gesamten Export statt nur aggregierter Findings blockierend prüfen.
- Done-Gate: unveränderte Engine-/Trace-Zieltests grün, angrenzende Engine-
  und Simulationstests grün.
- Commit: `fix(engine): stabilize nested choice versions and traces`.

### P6 – Generische Corp-KI-Korrektur

- `dead_as_first_ice` und nicht finanzierbare äußere ICE-Installationen in der
  finalen Arbitration zuverlässig ausschließen.
- Begonnene, ausreichend geschützte Scorelines mit reservierter Advancement-
  Finanzierung konvertieren und den Remote-Überbau begrenzen.
- Kritischen Matchpoint-Zentralschutz vor stale Remote-Plan-Mapping stellen.
- Done-Gate: alle acht unveränderten Checkpoints und ihre Gegenproben grün;
  angrenzende Corp-Runtime-Regressionen grün.
- Commit: `fix(ai): correct corp placement and scoreline arbitration`.

### P7 – Wiederholter Fünferzyklus

- Exakt die fünf festgeschriebenen Seeds mit unveränderten Deck-Hashes und
  Hard-vs-Hard-Konfiguration erneut ausführen.
- Jeden Entscheidungsversuch einschließlich Parent-/Child-Fenstern
  klassifizieren und beide Deck-Hint-/Consumer-Audits wiederholen.
- Bei einem neuen bestätigten Fehler: als roten Checkpoint sichern, generisch
  beheben, fokussiert verifizieren und denselben Fünferzyklus erneut starten.
- Done-Gate: fünf regulär abgeschlossene Spiele, null Engine-/Replay-/StateHash-
  /Redaction-/Coverage-Fehler, keine Fallbacks oder Timeouts und nach
  vollständigem Audit keine bestätigte bessere LegalAction.
- Commit je zusätzlichem Fixzyklus; Abschlusscommit:
  `test(ai): verify zero error five game cycle`.

### P8 – Abschluss, Wissenspflege und lokale Integration

- Finalreport und dauerhafte Engine-/KI-/Trace-Verträge dokumentieren.
- Breite AI-/Engine-Gates ausführen, aktuelles `main` defensiv integrieren,
  erneut verifizieren und den Arbeitsbranch lokal per Fast-Forward nach
  `main` übernehmen.
- Den sauberen Worktree entfernen, Entfernung doppelt verifizieren und den
  vollständig gemergten Arbeitsbranch löschen.
- Done-Gate: `main` grün und sauber; Worktree und Branch entfernt.
