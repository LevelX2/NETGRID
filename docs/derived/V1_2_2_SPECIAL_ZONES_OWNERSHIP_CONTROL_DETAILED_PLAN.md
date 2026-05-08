# V1.2.2 Special Zones, Ownership und Control - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.2.2 ergänzt Sonderzonen und Kartenkontrolle als Engine-Grundlage für spätere Kartenfamilien. Der Release modelliert `set_aside`, `removed_from_game`, Owner/Controller und Control-Wechsel so, dass ZoneRef-Invarianten, PlayerViews, Reconnect, Undo, Replay und StateHash stabil bleiben.

V1.2.2 ist kein Kartenrelease. Es darf nur test-only Harnesses oder nicht promotete Fixture-Effekte nutzen.

## Quellenbasis

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/V1_2_0_FINAL_REVIEW.md`
- `docs/derived/V1_2_1_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-1.2.1.json`
- bestehende Specs und Reviews fuer Hosting, Hidden-Zone-Tools, Full Archives Access, Replacement, Visibility, Replay, StateHash, Reconnect und Undo

## Scope

- Spezialzonen als Engine-Zonen oder klar typisierte ZoneStates.
- `set_aside` und `removed_from_game` als erste freigegebene Sonderzonen.
- Owner und Controller als getrennte CardInstance-Vertraege.
- Ownership bleibt unveraenderlich, sofern kein eigenes spaeteres Gate eine Ausnahme freigibt.
- Control-Wechsel als deterministische StateTransition mit sauberem Ursprung, Ziel, Controllerwechselgrund und Sichtbarkeit.
- ZoneRef-, Host-, Trash- und Move-Invarianten fuer neue Zonen.
- PlayerView-, PublicEvent-, WebSocket-, Reconnect- und Undo-Vertraege fuer sichtbare und verborgene Spezialzonen.
- Replay/StateHash-Szenarien fuer Set Aside, Remove from Game und Control-Wechsel.
- KI-Sicherheitsabdeckung: keine neuen Hidden-Zone-Daten, LegalAction-only, Fallback ohne strategischen Control-Support.

## Nicht-Ziele

- Keine neue Runtime-Karte.
- Keine `human_playable`- oder `ai_supported`-Freigabe.
- Keine V1.2.3-Kartenimplementierung.
- Keine Format- oder Deckbuilding-Regeln.
- Keine Public-Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turniere.
- Keine offiziellen Assets, Card Frames, Card Backs, Logos oder externen Kartendatenbank-Abhaengigkeiten.
- Kein automatischer Kartentextparser.
- Kein Ownership-Wechsel, ausser als explizit blockierter oder test-only dokumentierter Sonderfall.
- Keine rekursiven Spezialzonenketten ohne eigenes spaeteres Gate.

## Abhaengigkeiten

| Abhaengigkeit | Status | Nutzung in V1.2.2 |
| --- | --- | --- |
| V1.2.0 Event Modification | umgesetzt | Neue Zonen duerfen Eventfenster nicht umgehen und muessen Undo-/Visibility-Barrieren respektieren. |
| V1.2.1 Replacement | umgesetzt | Replacement darf keine Special-Zone-Semantik implizit erzeugen; Konflikte bleiben blockiert. |
| Hosting/Counter V0.99 | umgesetzt_limited | Host-Trash-Kaskaden und CardInstance-Referenzen muessen mit Controller-Wechsel kompatibel bleiben. |
| Hidden-Zone-Tools V0.98 | umgesetzt_limited | Sichtbarkeitsklassen fuer Search/Reveal/Expose helfen bei Spezialzonen-Projektionen. |
| Full Archives Access V1.1.2 | umgesetzt | Archives-Redaction dient als Muster fuer gemischte sichtbare/verborgene Karten. |
| Multiplayer/Reconnect/Undo | umgesetzt | Neue ZoneStates muessen side-sicher wiederherstellbar und undo-klassifiziert sein. |

## Leitentscheidung

V1.2.2 modelliert Sonderzonen als Engine-Bestandteil, nicht als Kartensonderfall. Karten duerfen spaeter nur dann darauf zugreifen, wenn ihre `requiredMechanics` exakt auf die implementierten Mechanik-IDs zeigen.

Bevorzugte Mechanik-IDs nach Umsetzung:

- `mechanic.special_zones.set_aside`
- `mechanic.special_zones.removed_from_game`
- `mechanic.card_control.controller`
- `mechanic.card_control.control_change_limited`

## Umsetzungspakete

1. **Bestandsaufnahme**
   - Aktuelle CardInstance-, ZoneRef-, Move-, Trash-, Host- und Visibility-Vertraege lesen.
   - Pruefen, ob vorhandene `owner`/`controller`-Felder existieren oder additiv eingefuehrt werden muessen.
   - Snapshot- und Persistenzfolgen fuer neue Zonen klaeren.

2. **Engine-Datenmodell**
   - `set_aside` und `removed_from_game` in ZoneRef oder ZoneState aufnehmen.
   - Owner/Controller-Vertrag festlegen.
   - Control-Wechsel als kontrollierten StateChange definieren.
   - ZoneRef-Invarianten und CardInstance-Eindeutigkeit erweitern.

3. **Transitionen und Events**
   - Move nach Set Aside.
   - Move nach Removed from Game.
   - Rueckkehr aus Set Aside nur als test-only Harness, falls fuer Roundtrip-Tests noetig.
   - Control-Wechsel ohne Ownership-Wechsel.
   - Host-/Trash-Kaskaden bei kontrollierten Karten pruefen.

4. **Sichtbarkeit und PlayerViews**
   - Sichtbarkeit je Sonderzone definieren: public, side_private, hidden, replay_only.
   - PublicEvents redigieren.
   - WebSocket- und Reconnect-Payloads aus PlayerViews ableiten.
   - DOM-/Storage-/Payload-Leak-Scan vorbereiten.

5. **Undo, Replay, StateHash**
   - Undo vor und nach Zone-Move definieren.
   - Hidden-Info-Barrieren bei neu sichtbaren Zoneninformationen setzen.
   - Replay-Szenarien fuer Set Aside, Remove from Game und Control-Wechsel.
   - StateHash fuer gleiche sichtbare Projektion, aber unterschiedlichen Controller, pruefen.

6. **KI**
   - KI erhaelt keine zusaetzlichen Hidden-Zone-Daten.
   - LegalAction-only-Fallback fuer Special-Zone-Fenster.
   - DecisionDebug darf nur sichtbare Zonen- und Controllerdaten nennen.
   - Keine KI-Deckpool-Erweiterung.

7. **No-Scope und V1.2.3-Vorbereitung**
   - Keine Karte promoten.
   - Kartenkandidaten nur als Liste fuer V1.2.3 vorbereiten.
   - Mechanik-Coverage nach V1.2.2 granular aktualisieren.
   - Implementation Review muss alle blockierten Spezialfaelle benennen.

## Daten- und Persistenzfolgen

- Bestehende alte Matches duerfen nicht brechen. Neue Zonefelder brauchen Default-/Migration- oder kompatible Deserialisierung.
- Persistierte Snapshots muessen neue Zonen kanonisch serialisieren.
- Backups/Restore aus V1.0.8 muessen neue Felder unveraendert transportieren.
- Replays mit alter Baseline bleiben als alte Baseline markiert; neue Replays nutzen die neue Mechanics-Baseline.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| CardInstance existiert gleichzeitig in alter und neuer Zone. | Sehr hoch | ZoneRef-Invariantentest und Move-Atomizitaet. |
| Controller-Wechsel wird als Ownership-Wechsel missverstanden. | Hoch | Getrennte Felder, Tests und PublicEvent-Texte. |
| Spezialzone leakt verdeckte Karte. | Sehr hoch | PlayerView-/Reconnect-/Payload-Redaction als Pflichtgate. |
| Host-Trash-Kaskade verliert gehostete Karten. | Hoch | Kaskadentests mit kontrollierter und gehosteter Karte. |
| Undo macht neue Hidden-Info rueckgaengig. | Hoch | Hidden-Info-Barriere pro ZoneMove definieren. |
| V1.2.3 nutzt Mechanik vor vollstaendigem Gate. | Mittel | Card-Release-Abhaengigkeit auf V1.2.2-Final Review. |

## Offene Fragen

Keine blockierende offene Frage.

Nicht blockierend:

- Ob `set_aside` und `removed_from_game` technisch als eigene ZoneKinds oder ZoneStates umgesetzt werden, entscheidet der Umsetzungsthread. Die Semantik muss in beiden Faellen gleich bleiben.
- Ob ein test-only Rueckkehrpfad aus Set Aside gebraucht wird, entscheidet die Testabdeckung. Eine Runtime-Kartenfreigabe entsteht dadurch nicht.

## Gate

`V1_2_2_requirements_freeze_done: true`

`ready_for_implementation: true`
