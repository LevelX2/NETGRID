# CardSpec-Zufallsreview Batch 13 – Umsetzungsprozess

Stand: 2026-08-16  
Quelle: `NETGRID_CardSpec_Zufallsreview_Batch_13_Findings.md`  
Arbeitsbranch: `codex/card-random-batch-13`  
Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_13`

## /Goal

Die 29 im Prüfbericht genannten Findings werden gegen den aktuellen
`main`-Stand, die lokalen Kartenquellen und die produktiven CardSpec-/AI-
Consumer geprüft. Nur bestätigte, noch offene Abweichungen werden
ursachenorientiert umgesetzt, fokussiert verifiziert, paketweise committed
und anschließend lokal nach `main` integriert. Der Arbeitsbranch und Worktree
werden danach entfernt.

## Annahmen und Nicht-Ziele

- Der Bericht ist Review-Evidence, aber keine Regelautorität.
- Batch 13 enthält nach der Vorprüfung keinen neuen bestätigten Runtime- oder
  Legalitätsfehler. Der Umsetzungsscope liegt in kanonischem Text, Choice-
  Semantik und Planning-Metadaten.
- Bereits erfüllte oder generisch korrekt abgedeckte Vorschläge erzeugen keine
  redundanten Kartenpatches.
- Planning-Annotationen bleiben read-only. TargetProfiles vervollständigen nur
  echte Choice-Payloads und werden weder zu Legalitäts- noch zu einer zweiten
  Planungsautorität.
- Eigene private beziehungsweise öffentlich bekannte Information darf der
  zuständige Plan side-sicher verwenden; unbekannte gegnerische Information
  wird weder erraten noch publiziert.
- Reine Wunschheuristiken werden nur übernommen, wenn ein vorhandener Owner
  und ein wirksamer geschlossener Vertrag sie tragen. Es entstehen keine
  dekorativen Annotationen, Kartenname-Sonderresolver oder neuen Strategie-IDs.
- Der Abschluss umfasst den lokalen Merge nach `main`, aber keinen Push.

## Paketfolge

### Paket 1 – Verifikation und Disposition

- alle Findings gegen CardSpec, Source, generierte Hints und relevante
  Consumer prüfen;
- echte Text-, Ownership-, Target- und Funktionsfehler von optionaler
  Bewertungsverfeinerung trennen;
- bereits durch Batch 12 oder generische Compilerverträge erfüllte Punkte
  dokumentiert auslassen.

### Paket 2 – Kanonischer Text

- bestätigte Credit- und Aktivierungssymbolabweichungen korrigieren;
- Mechanik und Runtime unverändert lassen;
- fokussierte Registry-/Textprojektion prüfen.

Commit: `fix(cards): align batch 13 canonical text`

### Paket 3 – Target-, Choice- und Informationssemantik

- echte Server-, Karten-, Host-, Mengen- und Subroutine-Choices präzisieren;
- Profile bei nicht vorhandenen oder fest gebundenen Zielen entfernen;
- eigene bekannte Information zulassen, ohne gegnerische Hidden Information
  oder öffentliche Payloads zu erweitern.

Commit: `fix(ai): bind batch 13 card choices to their owners`

### Paket 4 – Rollen-, Strategie- und Risikosemantik

- falsch gerichtete Draw-, Remote-, Tag-, Tax- und Strategy-Annotationen
  bereinigen;
- wiederkehrende Engines, probabilistische Quellen, optionale Kosten und
  fortgebundene Effekte proportional einordnen;
- das generierte Hint-Artefakt deterministisch aktualisieren.

Commit: `fix(cards): calibrate batch 13 planning semantics`

## Abnahme

- Cards-Typecheck und fokussierte Registry-/Planning-Tests;
- fokussierte AI-Hint-Compiler-/Typed-Translator-Tests;
- generiertes Hint-Artefakt synchron;
- `git diff --check` und sauberer Arbeitsbranch;
- aktuelles `main` vor Integration konfliktbewusst einbinden;
- lokaler Merge nach `main`, ohne fremde Änderungen zu verwerfen;
- Worktree und Branch nach verifiziertem Merge entfernen.
