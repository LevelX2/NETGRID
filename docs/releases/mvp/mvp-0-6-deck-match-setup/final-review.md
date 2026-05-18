# MVP 0.6 Final Review

Stand: 2026-05-03

## Ergebnis

MVP 0.6 Deck Editor und Match Setup Foundation ist abgeschlossen.

`MVP_0.6_done: true`

Der nächste empfohlene Scope ist V0.7 Requirements/Design Freeze. V0.7 wurde in diesem Thread nicht begonnen.

## Bestätigter Scope

- Allgemeines Deckmodell jenseits von `DemoDeckId`.
- Lokale editierbare Decks mit Erstellen aus Templates, Speichern, Laden, Duplizieren, Löschen, Import und Export.
- Deckvalidierung v2 gegen Side, Identity, Kartenstatus, Mengen, Agenda Points, Formatprofil und Kartenpool.
- Deterministische immutable Deck-Snapshots mit Hash.
- Server-seitiger Matchstart mit revalidierten Runner- und Corp-Snapshots.
- Human-vs-Human, Human-vs-KI und KI-vs-KI nutzen Snapshot-Decks, soweit Engine/KI den Kartenpool abdecken.
- Gegnerische Decklisten bleiben privat; erlaubt sind nur Side, Identity, Deckname, Kartenpool-/Formatprofil und Deckhash.

## Gate-Prüfung

| Gate | Ergebnis |
|---|---|
| Jede Must-Anforderung hat Test- oder Szenarioabdeckung. | pass |
| Spielbare Karten bleiben durch Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke abgesichert. | pass |
| Katalog-, Deck- und Match-Payloads leaken keine Hidden Info. | pass |
| Importierte, aber nicht spielbare Karten können keine Matches starten. | pass |
| Deck-Snapshots bleiben stabil, auch wenn der Entwurf später geändert wird. | pass |
| Bestehende MVP-0.1 bis MVP-0.5 Tests bleiben grün. | pass |
| V0.7 UI-Neugestaltung bleibt außerhalb des Umsetzungsscopes. | pass |

## Checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- `corepack pnpm --filter @netgrid/decks test`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass.
- Deck API smoke: pass.
- Deck validation smoke: pass.
- Matchstart API smoke with V0.6 snapshots: pass.
- Browser smoke for Deck Editor and Match Setup: pass.

## Annahmen und Abweichungen

- Lokale private Deckentwürfe werden in V0.6 im Browser `localStorage` gehalten. Session-Tokens bleiben im `sessionStorage`.
- Vollständige offizielle Turnierlegalität, Rotation, Banlisten und Influence bleiben außerhalb von V0.6.
- V0.6 nutzt weiterhin interne/fiktive Projektkarten und keine offiziellen Artworks, Logos, Frames, Card Backs oder externen Kartendatenbanken.
- JSON/Browser-Lokalspeicherung ist für V0.6 ausreichend; SQLite bleibt eine spätere Betriebs-/Härtungsoption.

## Risiken

- Lokale Deckdaten sind nicht synchronisiert und nicht versioniert.
- Die UI ist funktional, aber bewusst kein V0.7-Redesign.
- Weitere echte Karten dürfen erst nach separatem Karten-/Resolver-/Testgate spielbar werden.

## Nächster Scope

Empfohlen: V0.7 Requirements/Design Freeze für die UI-Neugestaltung auf Basis der vorhandenen Designsets und Realismusprüfung.

Nicht in diesem Thread beginnen: V0.7-Implementierung, echte Kartenabbilder, offizielle Assets, öffentliche Plattformfunktionen, Accountsystem, Matchmaking oder Rankings.
