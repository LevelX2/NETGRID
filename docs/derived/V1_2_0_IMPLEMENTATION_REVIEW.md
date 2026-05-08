# V1.2.0 Implementation Review - Event Modification Foundation

Stand: 2026-05-08
Status: implemented

## Ergebnis

V1.2.0 ist als enge Event-Modification-Foundation umgesetzt. Der Release ergänzt eine kanonische `ImminentEvent`-Pipeline und ein side-privates `would`/`prevent`/`avoid`/eng geführtes `interrupt`-Fenster. Der aktive Pilot ist Damage Prevention. Tag-Avoid wurde nicht als Ersatzpilot benötigt, weil kein Damage-Blocker auftrat. Replacement Effects bleiben getrennt und wurden in V1.2.0 nicht aktiviert.

## V1.1.3 Preflight

Der vorgeschaltete V1.1.3-Baseline-Preflight wurde ohne Codeänderung bestanden:

- Statusmodell: `listed`/`engine_supported`/`human_playable`/`ai_supported` bleibt als Grundlage tragfähig.
- Mechanik-Coverage: Event Modification war vor V1.2.0 offen und konnte als eigenes Gate geschnitten werden.
- AI-Level-Audit: bestehende KI-Sicherheitsabdeckung bleibt gültig, ohne neue KI-Deckfreigabe.
- Handoff: `docs/derived/V1_1_3_TO_V1_2_1_IMPLEMENTATION_HANDOFF.md` passt als Umsetzungsgrundlage.

## Umgesetzter Scope

- Damage-Auflösung erzeugt vor Randomness ein kanonisches `ImminentEvent`.
- Event-Modification-Kandidaten laufen über ein side-privates PendingChoice-Fenster.
- Damage Prevention kann optional angewendet oder passiert werden.
- Vollständige Prevention verhindert RandomDrawRecords und den eigentlichen Damage.
- Partielle Prevention reduziert den Schaden deterministisch und lässt den Rest über den vorhandenen Damage-Pfad laufen.
- `applyAction` revalidiert Side, Choice, StateVersion und Kandidat erneut.
- EventLog enthält Fensteröffnung, Entscheidung und Outcome mit redaktionierten PublicEvent-Payloads.
- Replay und StateHash bleiben deterministisch.
- PlayerViews, WebSocket- und Reconnect-Payloads zeigen nur side-sichere PendingChoice-Daten.
- Undo bleibt nach Damage/Hidden-Info-Barriere blockiert.
- KI nutzt ausschließlich LegalActions/PlayerView und fällt deterministisch auf sichere PendingChoice-Auswahl zurück.
- Web-UI kann generische PendingChoices wie Prevention ohne spezielle Client-Regelautorität bedienen.

## Geänderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`

## Architekturentscheidungen

- `ImminentEvent` ist Engine-State und wird nicht als versteckte Kartenquelle in PlayerViews gespiegelt.
- Kandidaten sind deterministisch sortiert; V1.2.0 aktiviert im Runtime-Vertrag nur den Damage-Prevention-Pilot.
- Prevention/Avoid/Interrupt und Replacement bleiben getrennte Mechanikfamilien. V1.2.0 öffnet keine Replacement-Pipeline.
- Der Pilot nutzt test-only Harness-Daten statt neue Runtime-Karten, damit keine Kartenfreigabe durch die Mechanikfoundation entsteht.
- Öffentliche Events enthalten nur IDs, Typen und Ergebniszahlen, keine Kandidatenquellen mit verdecktem Wissen.

## Bekannte Grenzen

- Avoid und Interrupt sind als Foundation-Typen vorbereitet, aber ohne Runtime-Pilot.
- Tag-Avoid wurde nicht umgesetzt, weil der bevorzugte Damage-Prevention-Pilot grün war.
- Keine neuen Runtime-Karten, keine KI-Deckfreigabe und keine Kartenpool-Erweiterung.
- Keine Special Zones, Ownership, Control, Set Aside oder Remove from Game.
