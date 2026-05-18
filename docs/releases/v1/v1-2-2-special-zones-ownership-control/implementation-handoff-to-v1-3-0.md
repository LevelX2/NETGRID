# V1.2.2 to V1.3.0 Implementation Handoff

Stand: 2026-05-08
Status: bereit fuer Folgeumsetzung

## Zweck

Dieses Handoff fasst die Detailplanung fuer die naechsten drei Releases nach V1.2.1 zusammen. Es ist der empfohlene Einstiegspunkt fuer den Umsetzungsthread.

## Reihenfolge

1. V1.2.2: Special Zones, Ownership und Control.
2. V1.2.3: Mechanic Unlock Card Release 1.
3. V1.3.0: Format und Deckbuilding Foundation.

Die Reihenfolge ist hart:

- V1.2.3 darf erst nach gruenem V1.2.2-Final-Gate starten.
- V1.3.0 darf erst nach gruenem V1.2.3-Final-Gate starten.
- Kartenfreigaben duerfen nicht vor ihrer Mechanik-Coverage erfolgen.
- Formatprofile duerfen Karten nicht spielbar machen.

## Verbindliche Artefakte

### V1.2.2

- `docs/releases/v1/v1-2-2-special-zones-ownership-control/plan.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/spec.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/test-matrix.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements-review.md`

### V1.2.3

- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/plan.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/requirements.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/spec.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/test-matrix.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/requirements-review.md`

### V1.3.0

- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/plan.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/requirements.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/spec.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/test-matrix.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/requirements-review.md`

## Wichtigste Entscheidungen

- V1.2.2 ist kein Kartenrelease.
- V1.2.2 modelliert `set_aside`, `removed_from_game`, Owner/Controller und eng begrenzten Control-Wechsel.
- Ownership bleibt in V1.2.2 unveraenderlich.
- V1.2.3 ist ein Kartenrelease mit maximal 20 Karten.
- V1.2.3 braucht vor Code eine finale Kartenliste.
- V1.2.3 setzt `deck_legal` nur bei `human_playable`.
- `ai_supported` setzt AI-Hints, SzenarioRefs, DecisionDebug-Sicherheit und KI-Smoke/Soak voraus.
- V1.3.0 fuehrt lokale private Formatprofile ein.
- Formatprofile koennen Karten nur sperren, nie freigeben.
- V1.3.0 ist keine Public-Format-, Ranked- oder Turnierfunktion.

## Harte Dauer-Gates

Jede Umsetzung muss gruen halten:

- Rules Engine bleibt einzige Regelautoritaet.
- UI, Server, menschliche Spieler und KI reichen nur LegalActions-abgeleitete PlayerActions ein.
- `applyAction` revalidiert Side, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices.
- Hidden Info bleibt aus PlayerViews, PublicEvents, WebSocket, Reconnect, Undo-Previews, Logs, Fehlern, DOM, Replayprojektionen und KI-Inputs draussen.
- Replay, StateHash, Seed, RandomCounter und RandomDrawRecords bleiben deterministisch.
- Multiplayer-Submit, Idempotency, stale StateVersion und Reconnect bleiben side-sicher.
- KI nutzt nur PlayerView, LegalActions und side-gefilterte Events.
- Keine offiziellen Assets, Card Frames, Card Backs, Logos oder externen Kartendatenbank-Abhaengigkeiten.
- Keine Public-Plattformfunktionen ohne eigenes spaeteres Gate.

## V1.2.2 Umsetzungskern

Prioritaet:

1. Bestand von CardInstance, ZoneRef, Host, Move und Trash lesen.
2. `set_aside` und `removed_from_game` additiv modellieren.
3. Owner/Controller trennen, Ownership unveraenderlich halten.
4. Control-Wechsel als deterministische Engine-Transition.
5. ZoneRef-, Host- und Trash-Invarianten erweitern.
6. PlayerViews, PublicEvents, WebSocket, Reconnect und Undo redigieren.
7. Replay/StateHash fuer Zone und Controller testen.
8. KI-Fallback und DecisionDebug-Redaction.
9. Keine Kartenpromotion.

## V1.2.3 Umsetzungskern

Prioritaet:

1. V1.2.2-Final Review und MechanicSupport lesen.
2. Finale Kartenliste mit maximal 20 Karten festlegen.
3. Karten nach `requiredMechanics`, ResolverRefs, Statusziel und AI-Hints clustern.
4. Manifest `card-implementation-manifest-1.2.3.json` erstellen.
5. Runtime-Gate allowlist-basiert erweitern.
6. Pro Karte Unit-/Integrationstest plus Batch-Szenario mit StateHash.
7. Visibility, Replay/StateHash, Multiplayer, Reconnect, Undo und E2E smoken.
8. AI-Hints nur fuer `ai_supported` Karten.
9. Final Review mit freigegebenen, human-only, ai-supported und deferred Karten.

## V1.3.0 Umsetzungskern

Prioritaet:

1. V1.2.3-Final Review und Cardpool-Version lesen.
2. Lokales privates Formatprofil versionieren.
3. Deckvalidierung um Faction, Influence, Mindestdeckgroesse, Agenda-Regeln und Kopienlimit erweitern.
4. Decksnapshots mit FormatProfile-ID und Version versehen.
5. Import/Export und alte lokale Decks revalidation-pflichtig behandeln.
6. Matchstart serverseitig erneut validieren.
7. Deckeditor-Feedback sicher darstellen.
8. KI-Deckbau AI-supported-only halten.
9. Visibility-/Leaktests fuer Decklisten, Deckhashes und Validation Errors.
10. No-Scope gegen Public Decklists, Accounts, Ranked, Turniere, Karten und Assets.

## Erwartete neue Umsetzungsartefakte

### Nach V1.2.2

- `docs/releases/v1/v1-2-2-special-zones-ownership-control/implementation-review.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/final-review.md`
- aktualisierte Mechanik-Coverage, z. B. `data/rules/mechanics-coverage-1.2.2.json`

### Nach V1.2.3

- `data/manifests/card-implementation-manifest-1.2.3.json`
- `data/scenarios/v123-card-release-smoke.json`
- optionaler AI-Hints-/Card-Role-Snapshot fuer V1.2.3
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/implementation-review.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/final-review.md`

### Nach V1.3.0

- versionierte Formatprofil-Daten, z. B. unter `data/decks/`
- Deckvalidierungsmanifest fuer V1.3.0
- legale und illegale Beispielsnapshots
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/implementation-review.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/final-review.md`

## Offene Blocker

Keine blockierenden Planungsfragen.

Technische Umsetzungsentscheidungen:

- V1.2.2 waehlt die genaue technische Modellierung als ZoneKind oder ZoneState.
- V1.2.3 waehlt die finale Kartenliste im Preflight.
- V1.3.0 legt die konkrete private lokale Agenda-Dichte- oder Agenda-Punkte-Regel fest.

## Ready-Status

| Release | ready_for_implementation | Bemerkung |
| --- | --- | --- |
| V1.2.2 | true | Umsetzbar nach V1.2.1. |
| V1.2.3 | true_after_V1.2.2 | Kartenliste wird im Preflight finalisiert. |
| V1.3.0 | true_after_V1.2.3 | Formatprofile koennen Karten nur sperren. |

## Kopierbarer Folgeprompt

```text
Setze V1.2.2 Special Zones, Ownership und Control um und bereite danach V1.2.3 sowie V1.3.0 entlang des Handoffs vor.

Repository: C:\Projekte\NETGRID

Arbeite wiki-first und gemaess AGENTS.md. Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/implementation-handoff-to-v1-3-0.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/plan.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/spec.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/test-matrix.md
- docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements-review.md

Implementiere zuerst nur V1.2.2:
- set_aside und removed_from_game als Spezialzonen oder ZoneStates.
- Owner/Controller getrennt, Ownership unveraenderlich.
- Control-Wechsel als deterministische Engine-Transition.
- ZoneRef-, Host-, Move- und Trash-Invarianten.
- PlayerView, PublicEvents, WebSocket, Reconnect, Undo, Replay, StateHash, AIInput und DecisionDebug side-sicher.

Nicht erweitern:
- keine Kartenfreigabe,
- keine KI-Deckfreigabe,
- keine Format-/Deckbuilding-Regeln,
- keine Public-Plattformfunktionen,
- keine offiziellen Assets,
- kein Kartentextparser.

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
