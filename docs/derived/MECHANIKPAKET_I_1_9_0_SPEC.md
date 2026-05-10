# Mechanikpaket I 1.9.0 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

V1.9.0 implementiert einen freigabefähigen 5-Karten-Kern plus Foundationscope für Ambush:

1. `L3_Deterministischer_Wuerfel_Zufall`
2. `L4_Konkreter_Sonderresolver_noch_offen` (konkretisiert für Banpei)
3. `L2_Ambush_auf_Access_Resolver` (Foundation mit Testnachweis, ohne Zusatz-Unlock)

## Nicht-Scope

- Keine zusätzliche Kartenfreigabe außerhalb des 5er-Kerns.
- Kein automatischer KI-Support für neue Karten.
- Keine V2.x-Produktfeatures.
- Keine Auflösung der V1.8.1-Deferred-Karten `Cockroach`, `Incubator`, `Grubb` im Kernscope.

## Kartenvertrag V1.9.0

- `onr_v1_005_bartmoss-memorial-icebreaker`
  - Runner-Program mit Pump/Break-Standardfähigkeiten.
  - Nach jedem erfolgreich passierten Encounter mit mindestens einem Bartmoss-Break: deterministischer Würfelwurf.
  - Ergebnis `1`: Bartmoss wird getrasht.

- `onr_v1_007_blink`
  - Runner-Program mit deterministischem Würfel-Break.
  - Bei Aktivierung auf eine konkrete Subroutine: Wurf `1..6`.
  - `4..6`: Subroutine wird gebrochen.
  - `1..3`: Runner erleidet `Net Damage` in Höhe des Ergebnisses.
  - Maximal eine Blink-Aktivierung je Encounter und Subroutine.

- `onr_v1_115_terrorist-reprisal`
  - Runner-Event mit Last-Turn-Bedingung.
  - Nur legal, wenn Corp im letzten Corp-Zug mindestens eine `black_ops`-Agenda gescored hat.
  - Effekt: bis zu fünf zufällige HQ-Karten werden deterministisch nach Archives verschoben.

- `onr_v1_223_banpei`
  - Corp-ICE mit zwei Subroutinen:
    1. `trash a program`
    2. `end the run`
  - Programm-Entsorgung nutzt einen konkreten, deterministischen Zielvertrag ohne Hidden-Info-Leak.

- `onr_v1_275_vacuum-link`
  - Corp-ICE mit Zufallssubroutine.
  - Wurf `1..3`: Run wird auf entsprechend viele rezzte ICE zurückgesetzt (mindestens bis erstes ICE), Runner kann anschließend regelkonform jacken oder fortsetzen.
  - Wurf `4..6`: kein zusätzlicher Rewind-Effekt.

## Engine-Vertrag

### 1) Deterministischer Würfelresolver

- Neuer zentraler Resolver `rollDeterministicDie(state, purpose): 1..6`.
- Berechnung ausschließlich aus `seed`, `purpose`, `randomCounter`.
- Jeder Wurf erzeugt einen RandomRecord mit purpose-Prefix `v190.die.*`.
- Keine zweite Zufallsquelle außerhalb dieses Pfads.

### 2) Encounter- und Breaker-Tracking

- Run-State erhält Encounter-gebundene Nutzungstracker für kartenspezifische Würfeltrigger:
  - Nutzung von Bartmoss beim Subroutine-Break.
  - Nutzung von Blink je Subroutine.
- Tracker werden bei Encounter-Wechsel deterministisch zurückgesetzt.

### 3) Corp-Last-Turn-Subtype-Tracking

- Zustandstracking für `corp_scored_black_ops_last_turn` wird explizit modelliert.
- Scoring-Events aktualisieren die laufenden Turn-Flags.
- Turn-Wechsel friert den letzten Corp-Zugwert für Runner-Events ein.

### 4) Randomisierte HQ-Discard-Operation

- Deterministische Auswahl ohne Duplikate aus `corp.hq`.
- Auswahlgröße: `min(5, hqCount)`.
- Zielzone: `corp.archives`, faceup/rezzed gemäß bestehendem Archives-Vertrag.
- Hidden-Info-Barriere bleibt aktiv.

### 5) Banpei-Sonderresolver

- `trash_installed_program` wird card-spezifisch für Banpei nach demselben deterministischen Zielvertrag ausgewertet wie bestehende Programm-Entsorgung.
- Fehlender Programmkandidat blockiert die Subroutine nicht; `end_the_run` bleibt davon unabhängig.

### 6) Vacuum-Link-Rewind

- Rewind betrachtet die aktuelle Server-ICE-Kette und zählt nur rezzte ICE rückwärts vom aktuellen Encounter-Kontext.
- Wenn nicht genug rezzte ICE vorhanden sind, wird auf das erste ICE zurückgesetzt.
- Nach Rewind wird der Run so positioniert, dass Jack-out-Fenster und Folgeencounter regelkonform erhalten bleiben.

### 7) Ambush-Foundation

- Access-Pipeline erhält einen dedizierten Resolver-Einstiegspunkt für Ambush-on-Access.
- V1.9.0 nutzt diesen Pfad zunächst foundationscope-basiert (Test-/Harness-Nachweis), ohne automatische Freigabe zusätzlicher Ambush-Karten.
- Ambush-Auflösung bleibt side-sicher und darf keine verdeckten Karteninformationen veröffentlichen.

## Visibility-/Replay-Vertrag

- Zufallswürfe, Rewind-Pfade und randomisierte HQ-Discards sind replaybar und statehash-stabil.
- PublicEvents enthalten nur notwendige, side-sichere Zufalls-/Resolverkontexte.
- Private Ableitungen bleiben in sidegebundenen Kontexten.

## Deferred-Hinweis

V1.9.0 hält den V1.8.1-Deferred-Überhang bewusst außerhalb des Kernscopes:

- `onr_v1_013_cockroach`
- `onr_v1_034_incubator`
- `onr_v1_030_grubb`

Diese drei Karten bleiben bis zu einem expliziten Folgegate deferred.
