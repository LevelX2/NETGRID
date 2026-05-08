# V1.1.3 to V1.2.1 Implementation Handoff

Stand: 2026-05-08
Status: bereit für Folgeumsetzung

## Zweck

Dieses Handoff fasst die Planungsentscheidung für V1.1.3, V1.2.0 und V1.2.1 zusammen. Es ist der Einstiegspunkt für einen späteren Umsetzungsthread.

## Reihenfolge

1. V1.1.3 ist ein abgeschlossener Planungs- und Normalisierungsschritt ohne Codeimplementierung.
2. V1.2.0 wird zuerst umgesetzt: Event Modification Foundation mit `would`, `prevent`, `avoid`, engem `interrupt` und bevorzugtem Damage-Prevention-Pilot.
3. V1.2.1 wird danach umgesetzt: Replacement Effects als getrennte Pipeline mit Originalevent und Replacementevent.

Weitere K-Kartenreleases kommen erst nach V1.2.0/V1.2.1 oder nach einer neuen ausdrücklichen Projektentscheidung.

## Verbindliche Artefakte

### V1.1.3

- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_REQUIREMENTS.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_TEST_MATRIX.md`
- `docs/derived/V1_1_3_REQUIREMENTS_REVIEW.md`

### V1.2.0

- `docs/derived/V1_2_0_EVENT_MODIFICATION_DETAILED_PLAN.md`
- `docs/derived/V1_2_0_REQUIREMENTS.md`
- `docs/derived/EVENT_MODIFICATION_1_2_0_SPEC.md`
- `docs/derived/V1_2_0_TEST_MATRIX.md`
- `docs/derived/V1_2_0_REQUIREMENTS_REVIEW.md`

### V1.2.1

- `docs/derived/V1_2_1_REPLACEMENT_EFFECTS_DETAILED_PLAN.md`
- `docs/derived/V1_2_1_REQUIREMENTS.md`
- `docs/derived/REPLACEMENT_EFFECTS_1_2_1_SPEC.md`
- `docs/derived/V1_2_1_TEST_MATRIX.md`
- `docs/derived/V1_2_1_REQUIREMENTS_REVIEW.md`

## Wichtigste Entscheidungen

- Die 52 O:NR-v1-Runtime-Karten bleiben `human_playable` und `deck_legal`, aber nicht automatisch `ai_supported`.
- Vorhandene KI-Smokes zählen als LegalAction-/PlayerView-Sicherheit, nicht als strategische KI-Freigabe.
- `deck_legal` setzt künftig `human_playable` voraus.
- `ai_supported` setzt `human_playable`, AI-Hints, KI-Szenario, DecisionDebug und KI-Smoke/Soak voraus.
- V1.2.0 darf keine Replacement Effects enthalten.
- V1.2.1 darf keine Prevention/Avoid-Ausweitung enthalten.
- Beide V1.2.x-Releases geben keine neuen Karten und keine KI-Decks frei.

## Harte Gates

Jede Umsetzung muss grün halten:

- Hidden Info in PlayerViews, PublicEvents, WebSocket, Reconnect, Undo-Preview, Logs, Fehlern, DOM, Replayprojektionen und KI-Inputs.
- LegalActions/PlayerActions/applyAction als einzige Aktionspipeline.
- Replay und StateHash deterministisch.
- Seed, RandomCounter und RandomDrawRecords korrekt.
- Multiplayer-Submit, Idempotency, stale StateVersion und Reconnect.
- Undo-Barrieren bei Hidden Info und Randomness.
- KI LegalAction-only, PlayerView-only und mit legalem Fallback.

## Scope-Grenzen

Nicht implementieren:

- neue Runtime-Karten,
- neue KI-Deckfreigaben,
- Special Zones, Set Aside, Remove from Game, Ownership oder Control,
- öffentliche Plattformfunktionen,
- Accounts, Matchmaking, Rankings, Turniere,
- offizielle Assets, Card Frames, Card Backs, Logos oder externe Kartendatenbank-Abhängigkeiten,
- Kartentextparser oder automatische Regelinterpretation.

## V1.2.0 Umsetzungskern

Priorität:

1. `ImminentEvent` und Event-Modification-Fenster.
2. Damage Prevention als Pilot.
3. Tag-Avoid nur als Alternativpilot bei Damage-Blocker.
4. EventLog/Replay/StateHash.
5. PlayerView/WebSocket/Reconnect/Undo/AIInput-Redaction.
6. KI-Pass-/No-op-Fallback.
7. No-Scope-Regression gegen Replacement und Kartenfreigaben.

## V1.2.1 Umsetzungskern

Priorität:

1. Replacement-Pipeline getrennt von V1.2.0.
2. Originalevent und Replacementevent im EventLog.
3. Einmal-pro-Fenster-Regeln.
4. Deterministische Kandidatenordnung.
5. Sichtbare Konfliktblocker.
6. Bevorzugt Damage Replacement als test-only Pilot.
7. Access/Trash/Steal-Replacement nur prüfen und blockiert lassen, sofern nicht ausdrücklich neu freigegeben.
8. KI-Fallback ohne strategischen Support.

## Offene Blocker

Keine blockierenden Planungsfragen.

Technische Umsetzungsentscheidungen:

- V1.2.0 muss wählen, ob Damage Prevention über test-only Fixture oder nicht-promotete Harness-Karte realisiert wird.
- V1.2.1 muss den konkreten test-only Damage-Replacement-Effekt wählen.

Beide Entscheidungen dürfen keine Runtime-Karte freigeben.

## Ready-Status

| Release | ready_for_implementation | Bemerkung |
| --- | --- | --- |
| V1.1.3 | false | Planungsrelease; keine Implementierung vorgesehen. |
| V1.2.0 | true | Umsetzbar nach diesem Handoff. |
| V1.2.1 | true | Umsetzbar nach grünem V1.2.0-Gate. |

## Kopierbarer Folgeprompt

```text
Setze V1.2.0 Event Modification Foundation um und bereite danach V1.2.1 Replacement Effects vor.

Repository: C:\Projekte\NETGRID

Arbeite wiki-first und gemäß AGENTS.md. Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- docs/codex/CODEX_STATUS.md
- docs/derived/V1_1_3_TO_V1_2_1_IMPLEMENTATION_HANDOFF.md
- docs/derived/V1_2_0_EVENT_MODIFICATION_DETAILED_PLAN.md
- docs/derived/V1_2_0_REQUIREMENTS.md
- docs/derived/EVENT_MODIFICATION_1_2_0_SPEC.md
- docs/derived/V1_2_0_TEST_MATRIX.md
- docs/derived/V1_2_0_REQUIREMENTS_REVIEW.md
- docs/derived/V1_2_1_REPLACEMENT_EFFECTS_DETAILED_PLAN.md
- docs/derived/V1_2_1_REQUIREMENTS.md
- docs/derived/REPLACEMENT_EFFECTS_1_2_1_SPEC.md
- docs/derived/V1_2_1_TEST_MATRIX.md
- docs/derived/V1_2_1_REQUIREMENTS_REVIEW.md

Implementiere zuerst V1.2.0:
- ImminentEvent / would-prevent-avoid-interrupt Pipeline.
- Damage Prevention als bevorzugten Pilot.
- Tag-Avoid nur als Alternativpilot bei dokumentiertem Damage-Blocker.
- EventLog, Replay, StateHash, Visibility, Undo, Multiplayer/Reconnect und KI-Fallback.

Danach erst V1.2.1:
- Replacement-Pipeline getrennt von Prevention/Avoid.
- Originalevent und Replacementevent im EventLog.
- Einmal-pro-Fenster-Regeln.
- deterministische Kandidatenordnung.
- sichtbare Konfliktblocker.
- bevorzugt test-only Damage Replacement.

Nicht erweitern:
- keine neuen Runtime-Karten,
- keine KI-Deckfreigabe,
- keine Replacement Effects in V1.2.0,
- keine Prevention/Avoid-Ausweitung in V1.2.1,
- keine Special Zones, Ownership, Control, Set Aside oder Remove from Game,
- keine öffentlichen Plattformfunktionen,
- keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.

Pflichtgates:
- Hidden Info,
- Replay/StateHash,
- LegalActions/applyAction,
- PlayerViews,
- WebSocket/Reconnect,
- Undo,
- KI-Inputs und AiDecisionDebug-Redaction,
- Multiplayer/Idempotency/stale StateVersion,
- No-Scope-Regression.
```
