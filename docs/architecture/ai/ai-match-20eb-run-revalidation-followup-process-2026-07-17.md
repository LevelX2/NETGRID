# KI-Run-Revalidierung für Match 20EB (Follow-up, 2026-07-17)

Status: P4 abgeschlossen, P5 aktiv

## Quelle und Zielprüfung

Dieser Follow-up-Prozess ergänzt die bereits abgeschlossene Remediation für
`match_20eb121f1a2b3b1b`. Die ursprüngliche Vollanalyse, die Eurocorpse-,
Run-Lock-, Draw- und Bankkorrekturen sowie alle 146 klassifizierten
Runner-Entscheidungen bleiben führende Grundlage. Nach dem Abschluss wurde die
Einordnung von D92 anhand der öffentlichen Kartenhistorie korrigiert:

1. Die bei D92 verbleibende verdeckte Rootkarte in Remote 1 war nicht bloß
   unbekannt. Ihr Titel war unbekannt, ihr Typ war aus stabiler Kartenidentität,
   Root-Kapazität und dem öffentlichen Agenda-Austausch eindeutig als Upgrade
   ableitbar.
2. Der `opponent_matchpoint_contest`-Override behandelte sie dennoch als
   mögliche Agenda und erzwang einen sehr teuren Run.
3. Nach dem späteren öffentlichen Rez von Dr. Dreff revalidierte D113 den
   verbleibenden Access-Payoff nicht und belegte `jack_out` mit einer pauschalen
   Verluststrafe.

Der Nutzer hat beide Punkte ausdrücklich zur Umsetzung freigegeben.

Die ebenfalls angesprochene Portfolio-Kadenz ist auf dem Ausgangsstand bereits
als weiche Ranking-Schwelle umgesetzt: Wiederholte Hintergrundaktionen bleiben
legal und wählbar, wenn keine wirklich sinnvolle Alternative existiert. Dieser
Vertrag wird in diesem Follow-up erneut geprüft, aber nur bei einem aktuellen
roten Checkpoint geändert. Die abgeschlossene Eurocorpse-Remediation wird nicht
dupliziert und bleibt Teil der Abschlussregression.

## Gesamtziel und `/Goal`

`/Goal`: Die korrigierten D92-/D113-Findings aus Match 20EB side-safe und
spielgleich auf aktuellem Code reproduzieren, als dauerhafte rote
Decision-Checkpoints mit engen Gegenproben sichern, nur weiterhin rote Fehler
generisch in Belief-State, RunTarget-/Contest- und Run-Revalidierungs-Consumern
beheben, die weiche Portfolio-Kadenz sowie Eurocorpse regressionssicher prüfen,
alle Pakete einzeln committen, den Arbeitsbranch lokal nach `main` integrieren
und anschließend Worktree sowie Branch verifiziert entfernen.

- Arbeitsbranch: `codex/ai-match-20eb-run-revalidation`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_20EB_RUN_REVALIDATION`
- Ausgangs-`main`: `47edb735c5fa4934c11e167b344497cec3fe25e9`
- Runtime-Datenbank: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Hauptworkspace: nur für read-only Runtime-Evidence und den finalen lokalen
  Merge; fremde offene Web-/Wissensänderungen bleiben unangetastet
- Push und Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Die Typableitung verwendet ausschließlich Runner-PlayerView, aktuelle
  Root-Anzahl, öffentliche Events und öffentliche Installations-/Score-
  Metadaten. Sie benötigt weder Karteninstanz noch Kartentitel.
- Ein verdeckter Titel bleibt verdeckt. Gespeichert wird nur eine öffentlich
  beweisbare Typ-Kandidatenmenge wie `upgrade`, nicht die spätere Kartenidentität.
- Ein normaler unbekannter Remote, eine nach dem Score neu installierte Karte
  oder ein Server mit tatsächlich möglicher Agenda bleibt contestbar.
- Matchpoint-Druck wird nicht pauschal abgeschwächt; nur ein nachweislich
  agendaunfähiger Root-Payoff darf den terminalen Override nicht auslösen.
- Jack-out wird nicht pauschal bevorzugt. Eine laufende Sequenz wird nur dann
  neu bewertet, wenn öffentliche Zustandsänderungen den geplanten Payoff oder
  den verbleibenden Pfad wesentlich verändern.
- Engine-Regeln, LegalAction-Erzeugung, Replay, StateHash und Hidden-Info-
  Grenzen bleiben unverändert, sofern kein echter Engine-Blocker entsteht.
- Die bereits integrierte Eurocorpse- und Bankimplementierung wird nur bei
  aktueller roter Regression erneut verändert.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Historische Zustände werden mit exakt ihrem öffentlichen Eventpräfix
  gecapturt; spätere Reveals dienen nur als Folgebeobachtung.
- Produktionscode wird erst nach einem roten `behavior_regression`-Nachweis
  geändert.
- `engine_legality_drift`, `runtime_state_drift`, Fixture- oder Redactionfehler
  sind Infrastrukturarbeit und keine bestätigte KI-Regression.
- Expectations werden nach dem roten Nachweis nicht abgeschwächt.
- Jede neue negative Grenze erhält mindestens eine enge positive Gegenprobe.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket wird separat committed.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Ist D92 oder D113 auf aktuellem Code bereits fachlich grün, endet das
  zugehörige Produktionspaket mit dokumentiertem `no_fix`.
- Benötigt eine Lösung spätere Hidden Info oder eine Aktion außerhalb der
  LegalActions, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler blockieren
  den Abschluss.
- Überschneidungen mit fremden uncommitteten `main`-Änderungen werden nicht
  überschrieben; dieser Prozess nutzt kollisionsfreie neue Artefakte.
- Worktree-Cleanup erfolgt erst nach erfolgreichem Merge, sauberem Status und
  exakter Pfad-/Branchprüfung.

## State Machine

`preflight -> process_committed -> red_evidence_committed -> behavior_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Follow-up-Prozess und korrigierte Evidence

- Ziel: Scope, öffentliche Kausalkette, Invarianten, Worktree und `/Goal`
  dauerhaft dokumentieren.
- Artefakte: dieses Prozessdokument und der Follow-up-Evidence-Bericht.
- Checks: `git diff --check`.
- Done-Gate: beide Artefakte sind auf dem Arbeitsbranch committed.
- Commit: `docs(ai): plan match 20eb run revalidation follow-up`

### P1 – Spielgleiche rote D92-/D113-Checkpoints

- D92: Ein Remote mit ausschließlich als Upgrade ableitbarem Root darf nicht
  durch `opponent_matchpoint_contest` erzwungen werden; die produktive Auswahl
  muss in der akzeptablen Menge sinnvoller Alternativen liegen.
- D113: Nach öffentlichem Upgrade-Rez und entfallenem Agenda-Payoff muss der
  laufende Plan revalidiert werden; `continue_run` darf nicht allein durch die
  pauschale Jack-out-Strafe gewinnen.
- Gegenproben:
  - nach dem Score neu installierte unbekannte Rootkarte bleibt contestbar;
  - tatsächlich mögliche oder sichtbare Agenda bleibt terminal contestbar;
  - Jack-out wird nicht gewählt, wenn ein plausibler Agenda-/Trash-Payoff oder
    ein ausreichend finanzierter Restpfad besteht.
- Done-Gate: historische Ziele sind nur als `behavior_regression` rot oder
  ausdrücklich `no_fix`; Gegenproben sind grün; separater Red-Evidence-Commit.
- Commit: `test(ai): capture match 20eb run revalidation regressions`

### P2 – Öffentliche Root-Typableitung und Matchpoint-Contest

- Ziel: aktuelle Root-Anzahl und öffentliche Austausch-/Score-Ereignisse in
  eine konservative Typ-Kandidatenmenge überführen und im
  RunTarget-/Matchpoint-Consumer verwenden.
- Done-Gate: D92 und alle Gegenproben unverändert grün; keine Hidden-Info-
  oder allgemeine Contest-Regression.
- Commit: `fix(ai): preserve public remote root type deductions`

### P3 – Run-Plan nach öffentlichem Payoffwechsel revalidieren

- Ziel: Continue/Jack-out gegen den aktuellen sichtbaren Access-Payoff,
  Restpfad und verbleibende Finanzierung bewerten, ohne pauschale
  Jack-out-Bevorzugung.
- Done-Gate: D113 und Gegenproben unverändert grün; angrenzende Run-Choice- und
  RunTarget-Tests bleiben grün.
- Commit: `fix(ai): revalidate run payoff before continuation`

### P4 – Portfolio-/Eurocorpse-Regression, breite Gates und Abschluss

- Ziel: bestehenden weichen Hintergrundaktionsvertrag und abgeschlossene
  Eurocorpse-Verträge fokussiert prüfen, AI-Gates ausführen und Final-Report
  ergänzen.
- Pflichtchecks: neue Checkpoints, Match-20EB-Eurocorpse-Checkpointdatei,
  Portfolio-/Banktests, angrenzende Belief-/RunTarget-/Runtime-Tests,
  AI-Typecheck, `check:ai`, realistisch vollständige AI-Testshards und
  `git diff --check`.
- Done-Gate: Checks und Grenzen dokumentiert; Arbeitsbranch sauber.
- Commit: `docs(ai): close match 20eb run revalidation follow-up`

### P5 – Main-Integration und Cleanup

- Aktuelles `main` defensiv in den Arbeitsbranch integrieren, finale Checks
  wiederholen und bevorzugt per Fast-Forward lokal mergen.
- Arbeits-Worktree nur sauber und nach verifiziertem Merge entfernen.
- Branch mit `git branch -d` löschen und Pfad-/Worktree-/Branchentfernung
  doppelt prüfen.

## Abschlusskriterien

- D92/D113 besitzen spielgleiche Checkpoints und enge Gegenproben.
- Weiterhin reproduzierbare Fehler sind generisch und side-safe behoben.
- Die bestehende weiche Bankkadenz erlaubt weiterhin sinnvolle Wiederholungen.
- Eurocorpse-Regressionen bleiben grün.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
