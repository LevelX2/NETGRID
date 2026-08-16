# CardSpec-Zufallsreview Batch 12 – Umsetzungsprozess

Stand: 2026-08-16  
Quelle: `NETGRID_CardSpec_Zufallsreview_Batch_12_Findings.md`  
Arbeitsbranch: `codex/card-random-batch-12`  
Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_12`

## /Goal

Die 25 im Prüfbericht genannten Findings werden gegen den aktuellen
`main`-Stand, die lokalen Kartenquellen und die produktiven CardSpec-/AI-
Consumer geprüft. Nur bestätigte, noch offene Abweichungen werden
ursachenorientiert umgesetzt, fokussiert verifiziert, paketweise committed
und anschließend lokal nach `main` integriert. Der Arbeitsbranch und Worktree
werden danach entfernt.

## Annahmen und Nicht-Ziele

- Der Bericht ist Review-Evidence, aber keine Regelautorität.
- Bereits erfüllte oder durch generische Verträge korrekt abgedeckte Vorschläge
  erzeugen keine redundanten Änderungen.
- Planning-Annotationen bleiben read-only. TargetProfiles beschreiben nur
  echte Choice-Payloads und erzeugen weder Legalität noch eine zweite
  Planungsautorität.
- Eigene private Information darf der zuständige Plan side-sicher verwenden;
  unbekannte gegnerische Information wird weder erraten noch publiziert.
- Es entstehen keine Kartenname-Sonderresolver, neuen Strategie-IDs oder
  globalen Bewertungsboni.
- Der Abschluss umfasst den lokalen Merge nach `main`, aber keinen Push.

## Paketfolge

### Paket 1 – Verifikation und Disposition

- alle 25 Findings gegen CardSpec, Source, generierte Hints und relevante
  Consumer prüfen;
- bereits erfüllte Punkte und reine Wunschheuristiken abgrenzen;
- bestätigte Änderungen nach Text, Choice und Funktionssemantik schneiden.

### Paket 2 – Kanonischer Text

- bestätigte Symbol- und Quelltextabweichungen korrigieren;
- Mechanik und Runtime unverändert lassen;
- fokussierte Registry-/Textprojektion prüfen.

Commit: `fix(cards): align batch 12 canonical text`

### Paket 3 – Target- und Choice-Semantik

- Profile bei fest gebundenen Zielen entfernen;
- echte Mengen-, Reihenfolge-, Host-, Server- und Sacrifice-Choices mit dem
  bestehenden geschlossenen Vokabular präzisieren;
- Ownership- und Hidden-Info-Grenzen erhalten.

Commit: `fix(ai): refine batch 12 choice semantics`

### Paket 4 – Rollen-, Damage- und Access-Semantik

- überbreite Strategieanker und falsch gerichtete Economy-/Draw-Rollen
  bereinigen;
- Damage-, Denial-, Access-, Runpfad- und Drawback-Semantik über bestehende
  generische Verträge ausdrücken;
- generiertes Hint-Artefakt deterministisch aktualisieren.

Commit: `fix(cards): calibrate batch 12 planning semantics`

## Abnahme

- Cards-Typecheck und fokussierte Planning-/Registry-Tests;
- fokussierte AI-Hint-Compiler-/Typed-Translator-Tests;
- generiertes Hint-Artefakt synchron;
- `git diff --check` und sauberer Arbeitsbranch;
- aktuelles `main` vor Integration konfliktbewusst einbinden;
- lokaler Merge nach `main`, ohne fremde Änderungen zu verwerfen;
- Worktree und Branch nach verifiziertem Merge entfernen.
