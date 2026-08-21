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

Commit: `fix(ai): bind batch 12 card choices to their owners`

### Paket 4 – Rollen-, Damage- und Access-Semantik

- überbreite Strategieanker und falsch gerichtete Economy-/Draw-Rollen
  bereinigen;
- Damage-, Denial-, Access-, Runpfad- und Drawback-Semantik über bestehende
  generische Verträge ausdrücken;
- generiertes Hint-Artefakt deterministisch aktualisieren.

Commit: `fix(cards): calibrate batch 12 planning semantics`

## Ergebnis und Disposition

- Die bestätigten Quelltextabweichungen wurden ohne Mechanikänderung
  korrigiert. Pile Driver war bereits durch Batch 11 korrekt und erhielt
  keinen redundanten Patch.
- Tesseract und Syd besitzen jetzt TargetProfiles für ihre tatsächlichen
  Server- beziehungsweise ICE-Choices. Gypsy Schedule Analyzer und I Spy
  besitzen keine erfundene freie Zielwahl mehr.
- Eigene bekannte Karten- und Boardinformation wird bei Library Search,
  Planning Consultants, Corporate Detective Agency und Imp nicht mehr als
  unzulässige gegnerische Hidden Information behandelt.
- Chihuahua führte zu einem generischen Ursachenfix: Trace-Hints werden aus
  dem konkreten Erfolgs-Outcome abgeleitet. Tag, Damage, Run-Ende, Run-Lock
  und persistenter Counter werden nicht mehr pauschal gleichgesetzt.
- Ein reiner Corp-Rezrabatt erzeugt keinen Runner-Tax mehr. Die zugehörige
  Strategie-Evidence unterscheidet nun Installationsrabatt, Rezrabatt,
  Strength-/Break-Tax, Steal-/Trash-Tax und Agenda-Difficulty.
- Dieter Esslins Net-Damage-Access-Semantik war bereits durch den generischen
  Access-Damage-Vertrag aus Batch 11 korrekt. Es entstand kein Kartenpatch.
- Überbreite Mehrfachanker und sachfremde Rollen wurden proportional
  zurückgenommen; Project Zurich erhielt dagegen den durch seinen echten
  Overadvance-Payoff gerechtfertigten formalen Anker.

## Verifikation

Bestanden:

- `@netgrid/cards` Typecheck;
- Cards-Registry: 23/23 Tests;
- generische Typed-Translator-Tests: 33/33 Tests;
- AI-Hint-Artefakttests: 8/8 Tests;
- fokussierte Virus-Test-Site-Kompatibilität: 2/2 Tests;
- deterministischer `check:card-spec-ai-hints`;
- `git diff --check`.

Der vollständige AI-Typecheck bleibt unabhängig vom Batch an vier lokal nicht
vorhandenen Migration-Report-JSON-Dateien unter `docs/reviews/cards/` hängen.
Der breitere bestehende Kompatibilitätslauf enthält außerdem bereits
abweichende Alt-Erwartungen für Data Masons, Digiconda und Roving Submarine
sowie einen veralteten Strategy-Owner-Zählwert. Diese Baselinepunkte wurden
nicht als Batch-12-Fix umgedeutet; die direkt geänderten Pfade sind fokussiert
grün.

## Abnahme

- Cards-Typecheck und fokussierte Planning-/Registry-Tests;
- fokussierte AI-Hint-Compiler-/Typed-Translator-Tests;
- generiertes Hint-Artefakt synchron;
- `git diff --check` und sauberer Arbeitsbranch;
- aktuelles `main` vor Integration konfliktbewusst einbinden;
- lokaler Merge nach `main`, ohne fremde Änderungen zu verwerfen;
- Worktree und Branch nach verifiziertem Merge entfernen.
