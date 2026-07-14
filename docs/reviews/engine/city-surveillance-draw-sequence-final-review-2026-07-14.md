# Final Review: City-Surveillance-Ziehsequenz

Datum: 2026-07-14
Arbeitsbranch: `codex/city-surveillance-draw-choices`
Prozess:
`docs/architecture/city-surveillance-per-draw-choice-process-2026-07-14.md`

## Ergebnis

City Surveillance wird nicht mehr vor einer Mehrfachziehaktion pauschal
bezahlt. Jede tatsächlich gezogene Runner-Karte ist jetzt ein eigener
fortsetzbarer Engine-Schritt. Für jede zu diesem Zeitpunkt gerezzte
Draw-Tax-Quelle entscheidet der Runner separat zwischen 1 Credit und 1 Tag.

Damit sind bei `Jack 'n' Joe` drei Credits, drei Tags oder jede Mischung
daraus legal. `Bodyweight™ Synthetic Blood` öffnet bis zu fünf aufeinander-
folgende Entscheidungen. Mehrere gerezzte City-Surveillance-Kopien werden pro
Karte einzeln abgearbeitet.

## Regelvertrag

Die lokale Primärquelle
`docs/source/Netrunner Errata 1.70.md` hält drei Punkte fest:

- City Surveillance gilt für jede Karte, die der Runner zieht.
- Bei `Jack 'n' Joe` sind drei Tags, drei Credits oder jede Kombination
  erlaubt.
- Die Korp darf City Surveillance unmittelbar vor dem Ziehen rezzen.

Das Gegenstück ist ebenfalls festgeschrieben: Ein Effekt, der nicht „draw“
sagt, löst City Surveillance nicht aus. `Arasaka Owns You` sagt „refresh your
hand“ und nutzt deshalb einen ausdrücklich steuerfreien Hand-Refresh-Pfad.
Die bereits vorhandene automatische Credit-Zahlung dieses Sonderpfads wurde
im Abschlussreview entfernt.

## Engine-Auflösung

Die Engine verwendet eine persistente `runnerDrawSequence`:

1. Vor jeder einzelnen Karte erhält die Korp für jede installierte und aktuell
   bezahlbare Draw-Tax-Quelle ein Rez-/Pass-Fenster.
2. Nach einem Rez wird das Fenster für weitere bezahlbare Kopien erneut
   angeboten; nach Pass oder ohne weitere Quelle wird genau eine Karte
   gezogen.
3. Die beim konkreten Draw gerezzten Quellen werden gebunden und nacheinander
   über `runner_draw.draw_tax` aufgelöst.
4. Credits, Tags, Quellen, Choice, Seite und `stateVersion` werden bei jeder
   Action erneut validiert.
5. Erst danach folgt die nächste Karte oder der Abschluss der Sequenz.

Leerer Stack, mehrere Quellen und Mehrfachziehen enden mit der tatsächlich
gezogenen Kartenanzahl. Crash Everetts Zusatzkarte durchläuft dieselben
Fenster; seine verdeckte Trash-/Stack-Top-Choice öffnet erst nach Abschluss
aller Draw-Tax-Entscheidungen.

## UI, KI und Informationsgrenzen

- Der normale Draw bleibt genau eine neutrale LegalAction `Karte ziehen`.
- Runner-Pay/Tag und Korp-Rez/Pass verwenden das bestehende generische
  Choice-Panel; es gibt keine UI-eigene Regelentscheidung.
- Die KI zahlt, wenn `pay_credit` legal ist, nimmt andernfalls den Tag und
  rezzt eine angebotene bezahlbare Draw-Tax-Quelle vor Pass.
- Die jeweilige Choice ist nur in der PlayerView der entscheidenden Seite
  vorhanden. Gezogene Karten-IDs und `runnerDrawSequence` gelangen nicht in
  die Korp-PlayerView.
- Ein Korp-Pass nennt öffentlich keine verdeckte installierte Karten-ID. Ein
  tatsächlicher Rez darf die danach öffentliche Quelle nennen.
- Replay und StateHash reproduzieren Mischentscheidungen, Rez/Pass,
  Mehrfachziehen und Crash-Everett-Fortsetzungen.

## Regressionen

- `Jack 'n' Joe`: drei unabhängige Mischentscheidungen.
- `Bodyweight™ Synthetic Blood`: fünf Karten und Stack-Ende.
- zwei gerezzte Quellen pro Karte.
- bezahlbares und unbezahlbares Pre-Draw-Rez-Fenster, mehrere Rez-Schritte und
  stale Action.
- Crash-Everett-Zusatzdraw sowie Crash nach wiederholtem Korp-Pass.
- `Arasaka Owns You`: Hand-Refresh trotz gerezzter City Surveillance ohne
  Credit- oder Tag-Effekt.
- Human-Choice-Routing, produktive KI-Choices, PlayerView-Redaktion, Replay und
  StateHash.

## Gesamtverifikation

- fokussierter Querschnitt: 6 Dateien, 189 Tests bestanden
- vollständige Engine-Suite: 185 Dateien, 1669 Tests bestanden
- vollständige KI-Suite: 323 Dateien, 2148 Tests bestanden
- vollständige Web-Suite: 42 Dateien, 577 Tests bestanden
- `corepack pnpm typecheck`: alle 7 Workspace-Projekte bestanden
- `corepack pnpm test:contracts`: 11 Shared- und 8 Contracttests bestanden
- `corepack pnpm check:package-boundaries`: 1732 Dateien, Gate grün
- `corepack pnpm format:changed`: grün
- `git diff --check`: grün

Kein Browser-E2E und kein Build wurden ausgeführt: Die Webänderung entfernt
nur das alte Zwei-Draw-Aktionslabel und nutzt das bereits getestete generische
Choice-Panel; die vollständige Websuite und der Web-Typecheck decken den
geänderten Vertrag ab. Ein Selfplay-/Benchmark-Langlauf war für die
deterministische Choice-Auswahl nicht erforderlich; die vollständige KI-Suite
ist grün.

## Architekturprüfung und Restpunkt

Die neu eingeführten Choice-IDs und Sources sind generisch als
`runner_draw.draw_tax` und `runner_draw.draw_tax_rez` benannt. Nach dieser
Korrektur meldet der Architekturcheck keinen City-Surveillance-Treffer mehr.

Der projektweite Check
`check:engine-cardimplementation-architecture-target` bleibt dennoch rot mit
zwölf bereits vor diesem Branch vorhandenen Treffern in unveränderten Dateien:
fünf zu Shell Traders und sieben zu Inside Job. Der zugehörige
Card-Function-Abstraction-Inventory-Guard ist deshalb ebenfalls nicht
baselinegleich. Die automatisch erzeugte Baseline-Aktualisierung wurde bewusst
nicht übernommen, weil sie diese fremden Treffer als neuen Sollstand
festgeschrieben hätte. Diese Befunde wurden in diesem kartenspezifischen
Prozess weder verändert noch verdeckt.

## Freigabe

Der City-Surveillance-Regelvertrag, die Human-/KI-Pfade und die
Hidden-Info-/Replay-Gates sind geschlossen. Der Arbeitsbranch ist für den
defensiven Abgleich mit dem aktuellen lokalen `main` und die anschließende
lokale Integration freigegeben.
