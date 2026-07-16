# AI Match 03575 Trace/Repeat Remediation Process

Status: P0 bis P4 abgeschlossen; P5 verifiziert, lokale Integration ausstehend

## Quelle und Gesamtziel

Das zuletzt abgeschlossene Spiel `match_03575bf4efae5bc7` wurde vollständig über
gespeicherte LegalActions, PlayerViews, PublicEvents, Replayzustände und
AI-Decision-Traces auditiert. Zwei Runner-Entscheidungen sind als strategische
Regressionen freigegeben:

- Entscheidung 37 / StateVersion 61: ein maximaler Trace-Bid verbraucht sechs
  Credits, obwohl kein sichtbarer aktiver Tag-Punish vorliegt und die spätere
  Tag-Bereinigung plus Click-Economy einen um drei Credits besseren Folgezustand
  erlaubt hätte.
- Entscheidung 58 / StateVersion 94: ein frischer, erreichbarer R&D-Zugriff bei
  fünf Agenda-Punkten verliert allein durch eine pauschale Repeat-Run-Strafe
  gegen ein strategisch irrelevantes Ziehen.

Zusätzlich ist der generierte Basic-Facts-Eintrag für Networking veraltet: Die
Kartenimplementierung ist vorhanden und registriert, wird im Artefakt aber als
fehlend ausgewiesen. Ziel ist, alle drei Befunde an ihren generischen Quellen zu
beheben, spielgleiche Regressionsevidence zu erhalten und den fertigen Stand
lokal nach `main` zu integrieren.

## Präzisionsvertrag

- Jede beanstandete Spielentscheidung wird vor dem Fix als historischer
  Decision-Checkpoint mit exaktem Runtimezustand und LegalActions gesichert.
- Rote Zieltests dürfen vor dem Fix ausschließlich als
  `behavior_regression` klassifiziert sein; Infrastruktur-, Replay-, Side- oder
  LegalAction-Fehler sind Stop-Blocker.
- Gegenproben bleiben grün: sichtbarer Tag-Punish oder fehlender Bereinigungs-Click
  darf einen bezahlbaren Gewinn-Bid weiterhin rechtfertigen; ein tatsächlich
  abgestandener wiederholter Zentralserver-Run bleibt abwertbar.
- Produktionsänderungen sind generisch, side-safe und nutzen nur PlayerView,
  side-safe PublicEvents, LegalActions und bereits daraus abgeleitete Fakten.
- Die Rules Engine bleibt alleinige Regelautorität; es entstehen keine
  kartennamenspezifischen Spielheuristiken.

## Nicht-Ziele

- Keine Änderung der Trace-, Tag- oder Run-Regeln der Engine.
- Keine pauschale Abschaffung hoher Trace-Bids oder wiederholter R&D-Runs.
- Keine Nutzung verdeckter Corp-Karten oder des FullState durch die KI.
- Keine Änderung fachlich stimmiger Kartenhints ohne belegten Hint-Vertragsbruch.
- Kein Push und kein Pull Request.

## Arbeitsort

- Worktree: `C:\Projekte\NETGRID_AI_MATCH_03575BF4`
- Branch: `codex/ai-match-03575-trace-repeat`
- Integrationsbranch: lokales `main`

## Paketfolge

### P0: Worktree und Prozessvertrag

- Kollisionsfreien Worktree vom aktuellen lokalen `main` anlegen.
- Analysebefunde, Invarianten, Paketfolge und `/Goal` festschreiben.
- Done-Gate: sauberer Worktree, Prozessartefakt vorhanden,
  `git diff --check` grün.
- Commit: `docs(ai): plan match 03575 remediation`

### P1: Historische rote Evidence

- Entscheidungen 37 und 58 aus der Runtime-SQLite als eigenständige
  Decision-Checkpoint-Fixtures sichern.
- Exakte bessere Erwartungen und enge grüne Gegenproben ergänzen.
- Vorfix-Lauf dokumentieren: nur die beiden Zielentscheidungen sind
  `behavior_regression`; Gegenproben sind grün.
- Done-Gate: Fixture-Replay stabil, rote Zielursachen klassifiziert,
  `git diff --check` grün.
- Commit: `test(ai): capture match 03575 regressions`

### P2: Ökonomischer Trace-Bid

- Runner-Bid-Auswahl vergleicht die Bid-Kosten mit sichtbarem Tag-Risiko,
  Bereinigungsoption, Click-Opportunität und erforderlicher Economy-Reserve.
- Die Auswahl liefert erklärbare, optionennahe Runtime-Evidence.
- Done-Gate: Entscheidung 37 und Bid-Gegenproben grün; angrenzende
  Bid-/Trace-Tests grün.
- Commit: `fix(ai): preserve runner economy on trace bids`

### P3: Frischer R&D-Repeat-Run

- Repeat-Run-Bewertung unterscheidet frischen R&D-Zugriff von echtem, unverändertem
  Wiederholungsspam und berücksichtigt den Matchpoint-Horizont.
- Done-Gate: Entscheidung 58 und Gegenproben grün; Run-History- und
  Run-Target-Tests grün.
- Commit: `fix(ai): value fresh rd repeat runs`

### P4: Networking Basic-Facts-Auflösung

- Der Generator löst die registrierte Networking-Implementierung am aktuellen
  Pfad auf.
- Basic-Facts-Artefakt regenerieren und einen Gate-Test gegen erneute falsche
  `blocked_missing_implementation`-Einordnung ergänzen.
- Done-Gate: Networking wird als implementiert ausgewiesen; Generator-/Gate-Test
  und `git diff --check` grün.
- Commit: `fix(ai): resolve networking implementation facts`

### P5: Abschluss, Evidence und Integration

- Fokussierte und angrenzende Tests, AI-Typecheck, relevante breite Gates und
  `git diff --check` ausführen.
- Evidence-/Final-Review und dauerhaften AI-Vertrag aktualisieren.
- Aktuelles lokales `main` in den Arbeitsbranch integrieren, erneut verifizieren,
  lokal nach `main` mergen und den sauberen Worktree/Branch entfernen.
- Commit: `docs(ai): close match 03575 remediation`

## Automatische Fehlerbehandlung

Ein roter Test wird innerhalb des aktiven Pakets ursächlich untersucht. Das
nächste Paket beginnt erst nach grünem Done-Gate. Side-Safety-, Replay-,
LegalAction-, StateHash- oder Fixture-Rekonstruktionsfehler werden nicht als
gewünschte rote Evidence akzeptiert. Bei Abweichung des aktuellen `main` wird vor
der Integration rebasierungsfrei gemergt, konfliktbewusst geprüft und danach
erneut verifiziert.

## Verifikation

- Spielgleiche Decision-Checkpoint-Tests für Entscheidungen 37 und 58.
- Fokussierte Unit-Tests für Bid-Auswahl, Run-History und Repeat-Run-Scoring.
- Bestehende angrenzende historische Checkpoints, insbesondere der sichtbare
  Tag-Punish-/Run-Budget-Kontext.
- Basic-Facts-Generator-/Gate-Test und Artefaktprüfung für Networking.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- Relevante breite AI-Test-/Gate-Läufe in proportionalem Umfang.
- `git diff --check` je Paket und nach Main-Integration.

## /Goal

Arbeite P0 bis P5 sequenziell und ohne Scope-Erweiterung im Worktree
`C:\Projekte\NETGRID_AI_MATCH_03575BF4` auf Branch
`codex/ai-match-03575-trace-repeat` ab. Sichere beide falschen Entscheidungen vor
dem Produktionsfix als spielgleiche, reproduzierbar rote Decision-Checkpoints und
committe diese Evidence separat. Behebe danach Trace-Bid-Ökonomie,
R&D-Repeat-Run-Bewertung und Networking-Basic-Facts jeweils generisch mit eigenem
Commit. Markiere das Ziel erst nach grüner Abschlussverifikation, lokalem Merge
nach `main` und verifiziertem Cleanup von Worktree und Branch als abgeschlossen.
