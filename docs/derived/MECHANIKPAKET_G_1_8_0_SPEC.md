# Mechanikpaket G 1.8.0 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.8.0 implementiert einen freigabefähigen 6-Karten-Kern mit drei Blöcken:

1. Agenda-Difficulty-Modifikatoren
2. Scored-Agenda-Static-Effekte
3. Overadvance-basierte Agenda-Punkt-Berechnung beim Scoren

## Nicht-Scope

- Keine Counter-/Virus-/Purge-Breite aus V1.8.1.
- Keine Würfel-/Ambush-/Sonderresolver-Breite aus V1.9.0.
- Keine implizite AI-Support-Erweiterung.

## Kartenvertrag V1.8.0

- `onr_v1_083_desperate-competitor`
  - Runner Event.
  - Play-Gate: Im aktuellen Runner-Turn wurde mindestens eine `gray_ops`-Agenda gestohlen.
  - Effekt: Runner erhält genau 1 Agenda-Punkt.
- `onr_v1_090_hot-tip-for-wns`
  - Runner Event.
  - Play-Gate: Im aktuellen Runner-Turn wurde mindestens eine `black_ops`-Agenda gestohlen.
  - Effekt: Runner erhält genau 1 Agenda-Punkt.
- `onr_v1_156_corporate-ally`
  - Runner Resource (`unique`).
  - Zusätzliche Install-Kosten: 1 Agenda-Punkt.
  - Solange installiert: Difficulty aller Agendas +1.
- `onr_v1_159_databroker`
  - Runner Resource.
  - Installierte Ability-Aktion: 1 Klick, 1 Agenda-Punkt bezahlen, `Databroker` trashen, Runner erhält +10 Credits.
- `onr_v1_201_executive-extraction`
  - Corp Agenda.
  - Solange gescort: Difficulty von `gray_ops`-Agendas -1.
- `onr_v1_214_project-babylon`
  - Corp Agenda.
  - Beim Scoren: +1 zusätzlicher Agenda-Punkt pro zwei Overadvance-Counter über aktueller Difficulty.

## Engine-Vertrag

- Agenda-Difficulty wird zentral berechnet:
  - Basis: `advancementRequirement`
  - +1 bei installiertem `Corporate Ally`
  - -1 für `gray_ops`-Agenda bei gescortem `Executive Extraction`
  - Untergrenze: 0
- Score-Gates und tatsächliches `score_agenda` nutzen dieselbe Difficulty-Berechnung.
- Agenda-Punkt-Kostenpfad (`Corporate Ally`, `Databroker`) wird als deterministischer Forfeit nach `removed_from_game` geführt.
- Runner-Event-Agenda-Punkte aus `Desperate Competitor`/`Hot Tip for WNS` werden als score-area-kompatibler Agenda-Punkt-Marker geführt.
- `Project Babylon` speichert Zusatzpunkte beim Scoren deterministisch als Agenda-Counter auf der gescorten Agenda.

## Visibility-/Replay-Vertrag

- Keine Hidden-Info-Leaks in PlayerView/PublicEvents/WebSocket/Reconnect/Undo.
- Agenda-Punkt-Kosten, Difficulty-Effekte und Overadvance-Zusatzpunkte bleiben replaybar.
- StateHash bleibt deterministisch für:
  - Dynamic Agenda-Difficulty
  - Forfeit-zu-`removed_from_game`
  - Project-Babylon-Zusatzpunkte.

## Deferred-Hinweis

Der Planungskorb für V1.8.0 enthält 13 Karten. Der freigabefähige Kernrelease setzt 6 Karten um; 7 Karten bleiben in V1.8.0 deferred dokumentiert, weil zusätzliche Counter-/Virus-/Purge-Pflichten erst in V1.8.1 freigeschaltet werden.

