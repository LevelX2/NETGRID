# V1.2.0 Event Modification Foundation - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.2.0 schafft das Engine-Fundament für Event Modification: `would`, `prevent`, `avoid` und eng geführte `interrupt`-Fenster. Der Release ist ein Mechanik-/Timing-/Choice-Gate, kein Kartenbreitenrelease.

Replacement Effects sind ausdrücklich nicht Teil von V1.2.0.

## Quellenbasis

- `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/plan.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/post-v1-1-2-roadmap.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/final-review.md`
- `docs/architecture/card-rules/mechanics-coverage-matrix.md`
- `docs/KI-Player/NETGRID_KI_Releaseplanung_Codex_Briefing.md`
- bestehende Mechanikgates für Damage, Tags, Run/Breach, PendingChoice, Visibility, Replay und StateHash

## Scope

- `would`-/`prevent`-/`avoid`-/`interrupt`-Pipeline als Engine-Vertrag.
- Kanonisches Event-Objekt für imminent instructions.
- PendingChoice-Fenster für berechtigte Event-Modification-Entscheidungen.
- Damage Prevention als bevorzugter Pilotfall.
- Avoid für Tag- oder Run-Fälle als geprüfter Alternativpilot, falls Damage Prevention blockiert.
- EventLog-, Replay-, StateHash-, Visibility-, Undo-, Multiplayer-, Reconnect- und KI-Fallback-Verträge.
- Test-only Harness oder vorhandene nicht-promotete Fixture-Effekte sind erlaubt; keine Runtime-Kartenfreigabe.

## Nicht-Ziele

- Keine Replacement Effects.
- Keine neuen O:NR-v1-Runtime-Karten, keine KI-Deckfreigabe und kein neues Kartenrelease.
- Keine breite Prioritätsmaschine für alle offiziellen Timingfenster.
- Keine automatische Kartentextauslegung.
- Keine Special Zones, Ownership, Control, Set Aside oder Remove from Game.
- Keine öffentlichen Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turniere.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.

## Abhängigkeiten

| Abhängigkeit | Status | Nutzung in V1.2.0 |
| --- | --- | --- |
| PendingChoice/LegalActions | vorhanden, eng umgesetzt | Event-Modification-Entscheidungen werden als LegalActions abgebildet. |
| Damage/Flatline/Core Damage | vorhanden, eng umgesetzt | Bevorzugter Pilot für Prevention. |
| Tags | vorhanden, eng umgesetzt | Alternativpilot für Avoid. |
| Run/Breach/Access | vorhanden, eng umgesetzt | Alternativpilot für Avoid/Interrupt, aber mit höherem Hidden-Info-Risiko. |
| Replay/StateHash | vorhanden | Jeder Would-/Modify-/Resolve-Pfad muss deterministisch replayen. |
| Multiplayer/Reconnect/Undo | vorhanden | Neue Fenster müssen side-sicher wiederherstellbar und undo-klassifiziert sein. |
| KI LegalAction-only | vorhanden | KI darf nur angebotene Modifikations-LegalActions wählen oder legal passen. |

## Pilotentscheidung

Bevorzugter Pilot: Damage Prevention.

Begründung:

- Damage ist bereits als Eventfamilie mit Hidden-Info-Barriere, RandomDrawRecords und Flatline-Folge getestet.
- Prevention testet Betrag, Damage-Typ, betroffene Seite, Kosten/Choices, Replay und Undo besonders gut.
- Prevention vor Random-Trash verhindert, dass zufällige verdeckte Karten unnötig ausgewählt werden.

Alternativpilot: Avoid für Tag oder Run.

Der Alternativpilot darf nur gewählt werden, wenn die Umsetzung von Damage Prevention unerwartet blockiert ist. Dann ist Tag-Avoid gegenüber Run-Avoid zu bevorzugen, weil Tag öffentlich und einfacher zu redigieren ist. Run-Avoid darf nur test-only verwendet werden, wenn keine neuen Access-/Breach- oder Replacement-Semantiken entstehen.

## Ablaufplan

1. Event-Objekt und Event-Taxonomie festlegen.
2. Imminent instruction vor der finalen State-Mutation erzeugen.
3. Candidate Collection für exakt freigegebene Prevention-/Avoid-/Interrupt-Effekte ergänzen.
4. PendingChoice-Fenster nur für die berechtigte Seite öffnen.
5. Pass/No-op als legale Standardentscheidung anbieten.
6. Kosten, Ziele, Betrag, Choice und StateVersion in `applyAction` erneut validieren.
7. Modifizierte oder unveränderte Events final auflösen.
8. EventLog so schreiben, dass Original, Entscheidung und Ergebnis replaybar sind.
9. PlayerViews, PublicEvents, WebSocket und Reconnect redigieren.
10. Undo-Barrieren pro Fenster dokumentieren und testen.
11. KI-Fallback für neue Fenster ergänzen.
12. No-Scope-Regression gegen Replacement und Kartenfreigaben prüfen.

## Engine-Vertrag

V1.2.0 führt konzeptionell drei Ebenen ein:

- `ImminentEvent`: eine noch nicht final aufgelöste Spielanweisung.
- `EventModificationWindow`: ein deterministisches Fenster mit Kandidaten, berechtigter Seite und Pass-Option.
- `ResolvedEvent`: das final angewandte oder verhinderte/vermiedene Ereignis.

Jede Transition bleibt Engine-autoritativ. UI, Server und KI wählen nur LegalActions.

## Server-Vertrag

- Server nimmt keine Event-Modification-Sonderbefehle außerhalb `PlayerAction` an.
- Idempotency und stale StateVersion gelten wie bei allen Actions.
- Reconnect liefert nur side-sichere PlayerView- und PendingChoice-Daten.
- WebSocket-Payloads dürfen keine private Candidate-Liste der Gegenseite enthalten.

## Web-Vertrag

- Web rendert PendingChoice generisch aus PlayerView.
- Client berechnet keine eigenen Kandidaten.
- Kosten, Ziel, Eventtyp und Pass-Option werden nur angezeigt, wenn sie in PlayerView sichtbar sind.
- Undo- und Reconnect-Hinweise dürfen keine verborgenen Modifikationsquellen nennen.

## KI-Vertrag

- KI erhält nur PlayerView, LegalActions und side-gefilterte Events.
- KI darf Prevention/Avoid/Interrupt nur wählen, wenn eine LegalAction existiert.
- KI-Fallback wählt bei unbekanntem Fenster eine legale Pass-/No-op-Aktion, falls vorhanden.
- `AiDecisionDebug` nennt keine verborgenen gegnerischen Kandidaten.
- Nicht `ai_supported` Event-Modification-Karten bleiben außerhalb von KI-Decks.

## Kartenstatus- und Mechanik-Coverage-Auswirkung

- Keine neue Karte wird in V1.2.0 promoted.
- Mechanik-Coverage darf nach Umsetzung höchstens für exakt getestete Pilotfamilien auf `implemented_limited` gesetzt werden, z. B. `event_modification.damage_prevention`.
- Generisches `event_modification` bleibt nicht vollständig implementiert.
- Karten mit Prevention/Avoid/Interrupt bleiben gesperrt, bis ihr konkreter Mechaniktyp, Resolver, Tests, Visibility, Replay/StateHash, Multiplayer und KI-Vertrag erfüllt sind.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Event wird still verändert. | Sehr hoch | Every modification needs EventLog entry and replay path. |
| Hidden-Info-Leak durch private Prevent-Karte. | Sehr hoch | Candidate- und Choice-Daten nur side-sicher anzeigen. |
| Random Damage wird vor Prevention ausgeführt. | Hoch | Damage Prevention muss vor RandomDrawRecords liegen. |
| Mehrere Kandidaten erzeugen Prioritätschaos. | Hoch | V1.2.0 erlaubt nur streng geordnete oder blockierende Kandidaten. |
| KI hängt in neuem Fenster. | Mittel | Pass-/No-op-Fallback ist Pflicht. |
| Replacement wird versehentlich miterledigt. | Hoch | No-Scope-Test und getrennte V1.2.1-Spezifikation. |

## Offene Fragen

Keine blockierende offene Frage für die Umsetzung.

Nicht blockierend:

- Ob der V1.2.0-Pilot intern als test-only Fixture oder als nicht-promotete lokale Harness-Karte modelliert wird, entscheidet der Umsetzungsthread. In beiden Fällen gibt es keine Runtime-Kartenfreigabe.
- Ob Tag-Avoid als Alternativpilot notwendig wird, entscheidet sich nur bei technischem Blocker im Damage-Pilot.

## Gate

`V1_2_0_requirements_freeze_done: true`

`ready_for_implementation: true`
