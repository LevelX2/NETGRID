# CardSpec-Zufallsreview Batch 11 – Umsetzungsprozess

Stand: 2026-08-16  
Arbeitsbranch: `codex/card-random-batch-11`  
Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_11`

## /Goal

Die im Prüfbericht Batch 11 genannten Befunde werden gegen den aktuellen
`main`-Stand, die lokalen Kartenquellen und die produktiven Consumer geprüft.
Nur bestätigte, noch offene Abweichungen werden ursachenorientiert umgesetzt,
fokussiert verifiziert, paketweise committed und anschließend lokal nach
`main` integriert. Der Arbeitsbranch und Worktree werden danach entfernt.

## Annahmen und Nicht-Ziele

- Der Bericht ist Review-Evidence, aber keine Regelautorität.
- Bereits auf `main` behobene Punkte werden nicht erneut geändert.
- Planungshinweise werden nur erweitert, wenn der bestehende Compiler oder
  zuständige Plan-Owner sie nutzt; dokumentarische Wunschheuristiken ohne
  Consumer werden nicht vorgetäuscht.
- Es entstehen keine Kartenname-Sonderresolver, keine zweite Choice-Autorität
  und keine neue Parallel- oder Fallbacklogik.
- Gegnerische Hidden Information bleibt unzugänglich. Eigene private und
  rechtmäßig betrachtete Information darf der zuständige Plan verwenden,
  ohne sie über öffentliche Payloads offenzulegen.
- Der Abschluss umfasst den lokalen Merge nach `main`, aber keinen Push.

## Pakete

### Paket 1 – Verifikation und Disposition

- alle 29 Findings gegen CardSpec, Quelle, generierte Hints und Consumer prüfen;
- bereits erledigte Punkte und bloße Empfehlungen sichtbar abgrenzen;
- konkrete Änderungsliste festhalten.

### Paket 2 – Kanonischer Text und Provenienz

- bestätigte Quelltextabweichungen korrigieren;
- fehlende belastbare Regelreferenz nur bei vorhandener lokaler Autorität
  ergänzen;
- Textänderungen getrennt von Mechanik halten.

Commit: `fix(cards): align batch 11 text and provenance`

### Paket 3 – Choice- und Zielsemantik

- unpassende oder leere TargetProfiles entfernen beziehungsweise präzisieren;
- vorhandene Plan-Owner für routendefinierende Varianten erweitern, falls der
  aktuelle Consumer die Abweichung tatsächlich erzeugt;
- Ownership- und Hidden-Info-Grenzen mit fokussierten Tests sichern.

Commit: `fix(ai): refine batch 11 target semantics`

### Paket 4 – Rollen-, Risiko- und Wertsemantik

- überbreite Strategieanker und sachlich falsche Planrollen bereinigen;
- Damage-, Restricted-Credit-, Action-Capacity- und Drawback-Semantik über
  bestehende generische Verträge ausdrücken;
- generierte AI-Hints deterministisch aktualisieren.

Commit: `fix(cards): calibrate batch 11 planning semantics`

## Abnahme

- fokussierte CardSpec-/Compiler-/Plan-Tests für die geänderten Pfade;
- betroffene Paket-Typechecks nur bei veränderten Typ- oder Paketoberflächen;
- generiertes Hint-Artefakt synchron;
- `git diff --check` und sauberer Arbeitsbranch;
- lokaler Fast-forward- oder konfliktbewusster Merge nach `main`;
- fremde Änderungen im primären Checkout unverändert;
- Worktree und Branch nach verifiziertem Merge entfernt.

## Verifikationsdisposition

- 27 Findings führten zu bestätigten Text-, Provenienz-, Choice-, Rollen-,
  Risiko- oder Compilerkorrekturen.
- Pile Drivers Verlust von Stealth-Credits wird bereits im generischen
  Run-Quote- und Credit-Budget-Pfad pro Ability-Nutzung berücksichtigt. Neben
  der Quelltextnotation entsteht deshalb kein zweiter Kostenpfad.
- Mastermind besitzt bereits das typisierte `brain_damage_ice`-Evidenzprofil;
  Iceberg projiziert seinen Net Damage bereits aus der mechanischen
  Subroutine. Beide Vorschläge waren auf dem geprüften Stand schon erfüllt.
- Bei Vacant Soulkiller wurde ein generischer Compilerfehler bestätigt:
  Advancement-skalierender Access-Schaden wurde unabhängig von `damageType`
  als Net-Damage-Ambush projiziert. Der Compiler erhält nun Net-, Meat- und
  Brain/Core-Identität durchgängig in Rollen, Effekten, Funktionssignalen und
  Strategieevidenz.
- TargetProfiles bleiben dort auf Kartenebene, wo der aktuelle Compiler für
  die zugrunde liegende Longtail-Choice keinen capability-nahen Owner besitzt.
  Die Auswahlsemantik wurde präzisiert, ohne eine zweite Entscheidungsautorität
  oder einen ungenutzten Compilervertrag einzuführen.
