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

## Ergebnis und Disposition

- Batch 13 enthielt keinen neuen Runtime- oder Legalitätsfehler. Die vier
  bestätigten Abweichungen im kanonischen Text wurden ohne Mechanikänderung
  korrigiert.
- London City Grid und Street Enforcer werden nicht mehr künstlich an Remotes
  gebunden. Fortgebundene Break- und Tag-Taxes besitzen keine
  `requires_remote_server`-Bedingung und erzeugen nicht automatisch
  `remote.scoring_protection`.
- Terrorist Reprisal projiziert nun das enge Black-Ops-Zeitfenster und den
  zufälligen HQ-Discard aus dem typisierten Engine-Vertrag. Indiscriminate
  Response Team wird nicht mehr als eigener Corp-Draw missverstanden.
- Precision Bribery besitzt kein Scheinziel mehr. Der globale
  Fort-Erstellungs-Lock und seine Removal-Tax werden direkt aus dem Modifier
  projiziert.
- Code Viral Cache, Microtech Backup Drive, Mercenary Subcontract, Stumble
  through Wilderspace, Rent-to-Own Contract, Dr. Dreff, Singapore City Grid,
  Chimera, Eurocorpse Spin Chip und Marcel DeSoleil besitzen side-sichere,
  capability-gebundene TargetProfiles für ihre tatsächlichen Choices.
- Death Yo-Yo, Satellite Monitors, Stumble through Wilderspace und Executive
  Wiretaps wurden von überbreiten direkten Strategieankern befreit. Unlisted
  Research Lab erhielt dagegen den zu seiner wiederkehrenden Draw-Engine
  passenden formalen Anker.
- Self-Destructs Net-Damage-Ambush, Razor Wires typisierter Net Damage sowie
  Eurocorpses recurring Breaker Credits waren bereits generisch ableitbar.
  Dafür wurden keine redundanten Karten-Sonderverträge ergänzt; bei
  Eurocorpse wurde die fehlende generische Program-Host-Projektion ergänzt.
- Playful AI und Swiss Bank Account erhielten keine dekorative Modusheuristik.
  Der Bericht beschreibt dort sinnvolle spätere Policy-Arbeit, aber keinen
  fehlenden Rules-/Choice-Vertrag, den das aktuelle geschlossene
  TargetProfile-Vokabular wirksam besitzen würde. Back Door to Netwatch und
  Wired Switchboard wurden auf Trace-Defense und One-shot-Risiko bereinigt;
  die konkrete Einsatzschwelle bleibt beim zuständigen Trace-Plan.

## Verifikation

Bestanden:

- `@netgrid/cards` Typecheck;
- Cards-Registry und Planning-Annotationen: 44/44 Tests;
- fokussierte AI-Hint-, Typed-Translator-, Artefakt- und Ontologietests:
  92/92 Tests;
- deterministischer `check:card-spec-ai-hints`;
- `git diff --check`.

Der vollständige AI-Typecheck bleibt unabhängig vom Batch an vier lokal nicht
vorhandenen Migration-Report-JSON-Dateien unter `docs/reviews/cards/` hängen.
Die breiten Strategy-Owner-Tests enthalten außerdem bereits vor Batch 13
veraltete globale Zählwerte und Zeugen aus früheren Semantikbereinigungen.
Diese Baselinepunkte wurden nicht als Batch-13-Fix umgedeutet; die direkt
geänderten Owner-, Target- und Ontologiepfade sind fokussiert grün.
