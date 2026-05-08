# V1.2.2 Implementation Review - Special Zones, Ownership and Control

Stand: 2026-05-08
Status: implemented

## Ergebnis

V1.2.2 ist als Grundlagenrelease fuer Spezialzonen, Owner/Controller und enge Control-Wechsel umgesetzt. `set_aside` und `removed_from_game` sind kanonische Spezialzonen im GameState, werden in PlayerViews nur gemaess expliziter Sichtbarkeit gezeigt und bleiben Replay-/StateHash-deterministisch. Ownership bleibt unveraenderlich; Control kann nur ueber LegalActions und erneute `applyAction`-Validierung geaendert werden.

## Umgesetzter Scope

- `ZoneRef` und GameState kennen `set_aside` und `removed_from_game`.
- Spezialzonenbewegungen entfernen Karten atomar aus allen normalen Zonen.
- Set-Aside-Rueckkehr ist nur fuer Set Aside moeglich; Removed from Game bleibt terminal.
- Visibility-Policies `public`, `side_private`, `hidden` und `replay_only` redigieren PlayerViews, PublicEvents, Reconnect und KI-Inputs.
- Nicht-oeffentliche Spezialzonenbewegungen erzeugen Hidden-Info-Barrieren fuer Undo.
- CardInstances fuehren Owner und Controller sichtbar dort, wo die Karte sichtbar ist.
- Owner bleibt unveraenderlich; Control-Wechsel veraendert nur `controller`.
- Hosted-card-Invarianten bleiben auch nach Control-Wechsel und Trash-Kaskaden gueltig.
- Die Web-UI zeigt Spezialzonen ausschliesslich aus der bereits redigierten PlayerView.
- Die KI verwendet weiterhin nur LegalActions, PlayerView und side-sichere Eventdaten.

## Geaenderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/web/app/action-board-ui.ts`

## Architekturentscheidungen

- V1.2.2 nutzt test-only Harness-Aktionen fuer Spezialzonen und Control-Wechsel. Dadurch ist die Engine-Grundlage testbar, ohne Karten freizugeben.
- Spezialzonen sind keine normalen Hand-/Board-/Discard-Zonen, sondern eigene kanonische Platzierungen mit Sichtbarkeitspolitik.
- Control-Wechsel bleibt ein enger CardInstance-Zustand, keine Ownership-Mutation und keine Deck-/Formatfreigabe.
- PlayerViews bleiben die einzige Datenquelle fuer Web und KI; verdeckte Spezialzonenidentitaeten werden nicht ueber Transport- oder Fehlerpfade offengelegt.
- Die kleine UI-Korrektur an der KI-Steuerung prueft die aktuelle Spielansicht gegen die KI-Präsentation, damit ein alter KI-Takt keinen stale Schritt mehr ausloest.

## Bekannte Grenzen

- Keine Runtime-Karte nutzt die neuen Spezialzonen oder Control-Wechsel.
- Keine neuen Karten, keine KI-Deckfreigabe und keine Format-/Deckbuilding-Regeln.
- Kein Card-Text-Parser, keine externen Kartendatenbank-Abhaengigkeiten und keine offiziellen Assets.
- Keine Public-Plattformfunktionen, kein Matchmaking, keine Rankings und keine Turnierfunktionen.
