# SeeYa-Informationswert: Remediation-Prozess 2026-07-17

## Status

P1 bis P6 abgeschlossen, P7 aktiv. Die fachliche Umsetzung ist vom Nutzer
freigegeben; gearbeitet wird im separaten Worktree und ohne Änderung der
Engine- oder LegalAction-Regeln.

## Quelle und Zielprüfung

Ausgangspunkt sind die Runner-KI-Entscheidungen aus
`match_fd7671d270e1a716` und `match_424abdd1c7ac054d`:

- In FD7671 aktivierte die KI SeeYa sechsmal und wählte fünfmal erneut eine
  unveränderte, bereits exponierte Position.
- Der Wiederholungs- und Zielwahlfehler wurde bereits generisch behoben.
- Im historischen 424A-Matchpoint-Zustand D146 / StateVersion 273 verdrängt
  auf aktuellem Code ein allgemeiner Broker-Aufbau mit 2062 Punkten die
  SeeYa-Aktivierung mit 1827 Punkten, obwohl kein konkreter
  Finanzierungsbedarf vorliegt.

Die Aufgabe ist präzise genug: SeeYa braucht einen expliziten, kostenbewussten
Einsatz- und Zielvertrag; dieser Vertrag muss den historischen Fehlgebrauch
verhindern, die sinnvolle Matchpoint-Nutzung erhalten und Broker außerhalb
akuter Informationsfenster weiterhin zulassen.

## Gesamtziel

Die Runner-KI soll das teure Informationswerkzeug SeeYa nur dann installieren
oder aktivieren, wenn ein noch unbekanntes legales Ziel einen konkreten
strategischen Informationsgewinn bietet. Bei gegnerischem Matchpoint soll eine
handlungsrelevante unbekannte Remote-Karte langsamen Hintergrundaufbau
überstimmen. Zielwahl, Wiederholungsbewertung und finale Arbitration müssen
denselben side-sicheren Vertrag verwenden.

## Vorläufiger Ist-Vertrag

- Installation: 3 Credits, 1 Klick und 1 MU; der aktive Hint führt SeeYa als
  `build_rig`- und `contest_remote`-Werkzeug, enthält aber keinen
  kostenabhängigen Installationsvertrag.
- Aktivierung: 1 Klick und 1 Credit; der Runtime-Bonus verlangt Runner-Seite,
  mindestens zwei verbleibende Klicks, gegnerischen Matchpoint und mindestens
  einen unbekannten Remote-Root.
- Aktivierungswert: pauschal +1800, bei fortgeschrittenem unbekanntem Root
  +2150. Kosten werden separat bewertet, aber nicht als gemeinsamer
  Informationswert nach Folgehandlungsfähigkeit ausgedrückt.
- Zielwahl: Remote-Root vor Remote-ICE vor zentralem ICE; Advancement erhöht
  den Zielwert. Exakt bereits exponierte unveränderte Positionen erhalten
  -10000 und werden nach Install/Move/Swap/Trash wieder freigegeben.
- Hintergrundökonomie: Broker erhält im stabilen Aufbau unabhängig vom
  Matchpoint-Informationsfenster +1200 für die erste beziehungsweise +1100 für
  eine weitere Ladung. Dadurch kann langsamer Bankaufbau den terminalen
  Informationsgewinn erneut verdrängen.

## Soll-Vertrag

### Installation

SeeYa ist kein generisches Rig-Pflichtprogramm. Eine Installation soll nur
deutlich aufgewertet werden, wenn alle folgenden Bedingungen erfüllt sind:

1. Es gibt mindestens eine unbekannte installierte Korp-Position, deren
   Aufdeckung strategisch relevant ist.
2. Der Runner kann Installationskosten, MU und eine spätere Aktivierung legal
   tragen; eine akute Überlebens-, Run- oder Finanzierungsaktion wird nicht
   verdrängt.
3. Entweder steht die Korp am Matchpoint und ein unbekannter Remote-Root kann
   noch rechtzeitig geprüft werden, das side-sichere Schadensmodell bestätigt
   eine Damage-Strategie mit relevantem unbekanntem Remote-Ziel und sicherem
   Handpuffer, oder ein konkreter aktueller Remote-Contest-/Informationsplan
   benötigt dieses Werkzeug.

Ohne konkretes Informationsfenster bleibt SeeYa eine optionale Entwicklung,
nicht die bevorzugte `build_rig`-Aktion.

### Aktivierung

Eine Aktivierung ist nur positiv priorisiert, wenn:

1. mindestens ein noch nicht exakt exponiertes legales Ziel existiert;
2. nach Bezahlung mindestens ein Klick für eine Folgeaktion verbleibt;
3. der Informationsgewinn eine aktuelle Entscheidung verändern kann, vor allem
   bei gegnerischem Matchpoint und unbekanntem Remote-Root oder bei bestätigter
   sichtbarer Damage-Strategie mit relevantem unbekanntem Remote-Ziel;
4. keine bereits bekannte, unmittelbar produktive Contest-Aktion oder ein
   konkreter notwendiger Funding-Schritt fachlich höherwertig ist.

Bei keinem neuen Ziel wird die Aktivierung stark negativ bewertet. Eine reine
Hintergrundaktion wie Bankaufbau darf ein terminales Informationsfenster ohne
konkreten Finanzierungsbedarf nicht überstimmen.

### Zielwahl

Ziele werden ausschließlich aus `LegalActions`/Choice-Optionen und sichtbaren
Positionsmerkmalen geordnet:

1. unbekannter fortgeschrittener Remote-Root;
2. sonstiger unbekannter Root eines akuten Matchpoint-/Contest-Remotes;
3. unbekanntes Remote-ICE des akuten Zielservers;
4. sonstiges unbekanntes Remote-ICE;
5. zentrales unbekanntes ICE oder Root nur mit konkretem aktuellen
   Informationsbedarf.

Eine unveränderte exakt exponierte Position ist kein neues Ziel. Öffentliche
Install-, Move-, Swap- oder Trash-Ereignisse invalidieren ausschließlich die
betroffene Positionshistorie.

## Annahmen und Nicht-Ziele

- Der aktuelle 424A-Checkpoint bleibt unverändert die positive
  Matchpoint-Evidence.
- Die Lösung wird über generische Informationswert-, Bank- und
  Arbitration-Merkmale umgesetzt, nicht über die Karten-ID von SeeYa.
- Keine Hidden-Info, keine Vollzustandsauswertung und keine Engine-Änderung.
- Kein pauschales Unterdrücken von Broker oder anderen Kreditbanken.
- Keine Behauptung, dass jedes unbekannte ICE oder jeder unfortgeschrittene
  Remote-Root einen SeeYa-Einsatz rechtfertigt.
- Kein Push oder Pull Request.

## Controller-Invarianten und Blocker

- Genau ein Paket ist aktiv; vor dem ersten Verhaltensfix liegt reproduziertes
  `behavior_regression`-Rot vor.
- Zieltest und Gegenproben werden nicht an das neue Verhalten angepasst.
- Jede neue Priorität braucht mindestens eine Gegenprobe, in der sie bewusst
  nicht greift.
- Hidden-Info-Abhängigkeit, LegalAction-Lücke, Engine-Drift oder fachlich
  widersprüchliche bestehende Verträge stoppen die Umsetzung.

## State Machine

`PREPARED -> AUDITED -> RED_EVIDENCE -> CRITERIA_IMPLEMENTED -> VERIFIED ->`
`MERGED -> CLEANED`

## Paketfolge

### P1 – Prozess und Ist-/Soll-Scope

- Prozessartefakt und vorläufigen Einsatzvertrag erstellen.
- Done-Gate: Scope, Invarianten, Pakete und Prüfregeln dokumentiert.
- Commit: `docs(ai): define SeeYa information value process`

### P2 – Vollständiger Ist-Audit

- Karte, Hint, ActionSemanticCandidate, Installation, Aktivierung, Zielwahl,
  Positionshistorie, Bankkontext, Plan-Memory und finale Arbitration prüfen.
- Den Soll-Vertrag anhand der side-sicheren verfügbaren Signale schärfen.
- Done-Gate: Evidence-Report mit eindeutigen Kriterien und Nicht-Zielen.
- Commit: `docs(ai): audit SeeYa information value contract`

### P3 – Red Evidence und Gegenproben

- 424A-F04 unverändert auf aktuellem Code als `behavior_regression` rot
  bestätigen.
- FD7671-Zielwahl und Wiederholungsschutz grün bestätigen.
- Gegenproben für Broker ohne Matchpoint-Gefahr, keine neuen Expose-Ziele und
  fehlende Folgeaktion sichern.
- Done-Gate: roter Zielvertrag, grüne Kontrollen, eigener Commit.
- Commit: `test(ai): lock SeeYa cost-aware decision boundaries`

### P4 – Generische Kriterien umsetzen

- Informationswert und Hintergrund-Bankaufbau in derselben akuten
  Matchpoint-Arbitration vergleichbar machen.
- Nur nötige Installations-/Aktivierungs-/Zielkriterien ergänzen, die in P2/P3
  reproduzierbar belegt sind.
- Done-Gate: unveränderte Zieltests und Gegenproben grün.
- Commit: `fix(ai): prioritize actionable SeeYa information`

### P5 – Breite Verifikation und Wissenspflege

- Angrenzende 424A- und FD7671-Checkpoints, Runtime-Tests, AI-Typecheck,
  vollständige AI-Suite soweit realistisch und `git diff --check` ausführen.
- Final-Report und aktuellen Betriebslog ergänzen.
- Done-Gate: keine relevante Regression, sauberer Arbeitsbranch.
- Commit: `docs(ai): close SeeYa information value remediation`

### P6 – Damage-Informationsgrund

- Das vorhandene side-sichere Schadensmodell mit SeeYas Informationswert
  verbinden.
- Nur `deckBelief: confirmed`, sicheren `flatlineRisk`-Handpuffer,
  unbekanntes Remote-Ziel und die vollständige kurze Aktionssequenz zulassen.
- `deckBelief: suspected`, zu kleinen Handpuffer und ausschließlich zentrale
  Ziele als Gegenproben sichern; bestätigtes Deckwissen bleibt nach Abklingen
  der akuten Gefahr erhalten.
- Commits: `test(ai): lock damage-aware SeeYa scouting` und
  `fix(ai): scout damage remotes with SeeYa`

### P7 – Integration und Cleanup

- Aktuelles `main` defensiv integrieren, Pflichtchecks wiederholen und lokal
  nach `main` mergen.
- Sauberen Worktree entfernen, Entfernung doppelt verifizieren und den
  gemergten Arbeitsbranch löschen.

## Worktree-, Git- und Verifikationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_SEEYA_CRITERIA`
- Branch: `codex/ai-seeya-criteria`
- Hauptworkspace ausschließlich für finalen lokalen Merge.
- Jedes Paket endet mit fokussierten Checks, `git diff --check` und Commit.
- Pflichtchecks: 424A-/FD7671-Decision-Checkpoints,
  `runner-terminal-remote-tool-score`,
  `runner-expose-installed-card-choice`, angrenzende Bankkontexttests,
  `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.

## Controller-Prompt-Kern

`/Goal Arbeite die SeeYa-Informationswert-Remediation sequenziell von P1 bis`
`P7 im festgelegten Worktree ab. Sichere unveränderte rote Evidence vor dem`
`Fix, verwende nur side-sichere generische Kriterien, committe jedes Paket und`
`merge erst nach vollständiger Verifikation lokal nach main. Entferne danach`
`den sauberen Worktree und den gemergten Branch.`

## Abschlusskriterien

- SeeYa besitzt einen dokumentierten, kostenbewussten Installations-,
  Aktivierungs- und Zielvertrag.
- Historische Wiederholungen bleiben verhindert.
- Bestätigte sichtbare Damage-Strategien erzeugen nur mit sicherem Handpuffer
  und relevantem unbekanntem Remote-Ziel einen kleineren proaktiven Bonus.
- 424A-F04 und alle fachlich angrenzenden Kontrollen sind grün.
- Broker bleibt ohne akutes Informationsfenster eine zulässige
  Hintergrundaktion.
- `main` enthält die verifizierte Änderung; Worktree und Branch sind entfernt.
