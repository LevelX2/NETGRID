# Zufalls-Standarddeck-Selfplay: Remediation-Loop

Stand: 2026-08-02

Status: in Umsetzung

## Ziel

Die sieben freigegebenen Befunde aus dem Selfplay `Redline Riot` gegen
`Shadoe Tag & Bag` werden als generische Verträge der allgemeinen KI,
Metadaten und Diagnostik korrigiert. Danach wird ein neues zufälliges Paar
aus Runner- und Corp-Standarddeck mit den KI-Profilen gegeneinander gespielt
und erneut vollständig analysiert.

## Architektur- und Scope-Prüfung

Kein Befund benötigt eine Karten-ID-, Deck-ID-, Match-ID-, Seed- oder
Instanz-Sonderregel:

1. Mehrzügige Agenda-Installationen gehören zu `corp.score_agenda`. Der Plan
   darf sie nur mit Engine-zertifizierter Konversionsdauer und belastbarer
   Schutz-Evidence zulassen. `corp.defend_servers` bleibt alleiniger Owner
   jeder ICE-Allokation und liefert ausschließlich typisierte Schutzfacts.
2. Die unmittelbar terminale Remote-Abwehr gehört zu
   `runner.contest_remote`. Eine generische Vorbewertung darf die exakt
   erreichbare P1-Route nicht durch einen gewöhnlichen Materialwert-Filter
   verbergen.
3. Bank-Cashout ist ausschließlich Economy-Support des exakt gebundenen
   `runner.contest_remote`-Parents. Zielserver, Run-Action und
   `PlanExecutionOrigin` bleiben über Cashout und action-spezifischen
   Run-Event erhalten.
4. Die Political-Coup-Abweichung ist ein generischer Function-Signal-Vertrag
   für einen endlichen, aktiv auszahlbaren temporären Ressourcenpool; die
   Runtime erhält keine Karten-ID-Policy.
5. Die Plan-/Action-Mismatch-Erkennung bewertet Run-Events anhand ihrer
   strukturierten Run- und Zielbindung statt einer geschlossenen Liste
   einzelner Capability-Namen.
6. `naked_agenda_install` beschreibt Exposition und darf eine nachweislich
   geschützte Same-Turn-Score-Continuation nicht als nackte Installation
   zählen.
7. Nicht gewählte legale Geschwistervarianten benötigen vollständige
   `whyNot`-Evidence des zuständigen Owners; die Ergänzung verändert keine
   Plan- oder Actionwahl.

## Nicht-Ziele und verbotene Abkürzungen

- keine Sonderbehandlung von Political Coup, Hunter, Broker oder Inside Job
  im Planer;
- kein neuer Chooser, Override, Verhaltensfallback oder Resolver mit
  Strategieautorität;
- keine Rekonstruktion von LegalActions, Kosten oder verdeckten Karten;
- keine Änderung der Engine-Regeln oder PlayerView-Grenzen;
- keine Anpassung von Erwartungen an ein nachträglich beobachtetes Ergebnis;
- kein Start von Server oder Webclient im Worktree.

## Paketfolge

### P0 – Prozess und Preflight

- Worktree, Branch, Main-Ausgangsstand und Owner prüfen.
- Prozessartefakt mit Scope, Nicht-Zielen und Gates anlegen.
- Commit: `docs(ai): plan random selfplay remediation loop`.

### P1 – Rote Evidence und Gegenproben

- historische Decisions 138, 240 und 287 spielgleich erfassen;
- nur `behavior_regression` als erwartete rote Evidence akzeptieren;
- Gegenproben für nichtterminale, unbezahlbare und bereits sicher
  konvertierbare Lagen anlegen;
- Diagnose- und Hint-Verträge mit gezielten Tests festhalten;
- Commit: `test(ai): capture random selfplay regressions`.

### P2 – Generische Verhaltenskorrekturen

- `corp.score_agenda`: mehrzügige Installation nur mit vollständiger
  Konversions- und Schutzevidence;
- `runner.contest_remote`: unmittelbar terminale direkte und
  action-spezifische Run-Routen vor gewöhnlichen Materialwertfiltern
  materialisieren;
- `runner.economy`: Broker-artigen Cashout nur als exakt gebundenen
  Same-Turn-Funding-Child der terminalen Contest-Route zulassen;
- Plan, Step, Route, Action-ID und Zielbindung in Tests nachweisen;
- Commit: `fix(ai): preserve terminal score and contest routes`.

### P3 – Metadaten, Diagnostik und Why-not

- generisches Signal für aktiv auszahlbare temporäre Ressourcenpools
  vervollständigen;
- Run-Event-Mismatch und Same-Turn-Naked-Agenda-Tags korrigieren;
- fehlende Why-not-Dispositionen für legale Geschwistervarianten
  vervollständigen;
- Commit: `fix(ai): harden selfplay audit evidence`.

### P4 – Verifikation und Review

- Checkpoints und fokussierte Runtime-, Simulation-, Hint- und
  Evidence-Tests ausführen;
- AI-Typecheck, Strukturgates und drei AI-Shards ausführen;
- Ergebnis, Restpunkte und Wissenslog dokumentieren;
- Commit: `docs(ai): close random selfplay remediation round one`.

### P5 – Integration und Cleanup

- aktuelles `main` defensiv integrieren und relevante Gates wiederholen;
- Arbeitsbranch lokal bevorzugt per Fast-Forward nach `main` integrieren;
- Main prüfen, Worktree entfernen und Branch löschen;
- weder Push noch Pull Request.

### P6 – Nächste Loop-Runde

- Runner- und Corp-Standarddeck neu zufällig auslosen;
- Seed persistieren und Hard-vs-Hard-Selfplay mit Replayprüfung ausführen;
- jede KI-Entscheidung gegen PlayerView, LegalActions, Plan/Step/Route,
  Alternativen und Folgeereignisse prüfen;
- Deck-Hint-Consumer-Audits ausführen;
- bei neuen konkreten Befunden den vom Analyse-Skill verlangten
  matchbezogenen Freigabepunkt einhalten.

## Done-Gates

- rote Verhaltenscheckpoint-Evidence wird unverändert grün;
- Gegenproben verhindern generische Übersteuerung;
- keine Karten-ID-Sonderlogik und keine zweite Entscheidungsautorität;
- null IllegalAction-, Replay-, StateHash-, Hidden-Info- oder Runtimefehler;
- fokussierte Tests, AI-Typecheck, aktive Strukturgates und AI-Shards grün;
- Evidence, Review und Monatslog aktualisiert;
- lokal nach `main` integriert sowie Worktree und Branch entfernt;
- nächste Zufallsrunde vollständig analysiert.
