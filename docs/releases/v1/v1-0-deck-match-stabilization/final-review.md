# V1.0 Deck- und Match-Setup-Stabilisierung Final Review

Status: done
Stand: 2026-05-04

## Ergebnis

V1.0 stabilisiert Deckbau, Deckauswahl beim Spielstart und private Matchserien als verlässliche Testbasis für weitere Entwicklung.

Umgesetzt:

- Produktentscheidungen festgelegt und im V1.0-Plan dokumentiert:
  - Serienwertung autoritativ nach Siegen/Niederlagen/Draws.
  - Aggregierte Agenda-Punkte werden gespeichert und angezeigt, aber nicht als V1.0-Tie-Breaker verwendet.
  - KI-Deckpolitik: `fixed`, `selected`, `seeded_random`.
  - UI-Modell mit vier Slots für Teilnehmer A/B und Runner/Corp.
- Server-Matchstart modelliert persönliche Deckpaare über `participantADecks` und `participantBDecks`.
- Serien-Folgespiele verwenden beim Seitenwechsel die persönlichen Runner-/Corp-Deckpaare statt nur globale Side-Snapshots.
- KI-Deckpolitik:
  - `fixed` nutzt das feste V0.8-Standarddeckpaar.
  - `selected` nutzt die explizit gewählten KI-Slots.
  - `seeded_random` wählt deterministisch aus eingefrorenen, validierten Snapshots.
- Web-Matchstart zeigt nur validierte versionierte Snapshots und validierte lokale Snapshots als Matchstart-Option.
- Web-Startbereich zeigt V1.0 und die vier Deckslots.
- Private lokale O:NR-v1-Härtung ergänzt:
  - AI- und Multiplayer-Smokes mit lokalen O:NR-Snapshots.
  - Manifest-/Review-Abgleich für lokal `playable` und `deck_legal` markierte O:NR-Karten.
  - Hidden-Info- und Payload-Safety-Abdeckung bleibt aktiv.
- AI-Simulation erkennt lokale O:NR-v1-Deckkarten als V0.94-Harness-Pool.

## Browser-Smoke

Am 2026-05-04 wurde der Browser-Smoke über die lokale Weboberfläche ausgeführt:

1. Deck aus Template `Runner Demo Deck 08 - Starter Pressure` kopiert.
2. Deck geändert.
3. Deck über die Web-Deckvalidierung validiert.
4. Validierten lokalen Snapshot in das Match Setup übernommen.
5. Runner-vs-Corp-KI-Match gestartet.

Ergebnis: Das Match startete mit dem lokalen Runner-Snapshot und dem ausgewählten Corp-Deck. Die Browser-Konsole meldete keine Warnungen oder Fehler.

## Verifikation

Bestanden am 2026-05-04:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

Der Gesamttestlauf umfasst 175 Tests. Die frühere Turbopack-NFT-Warnung zur bestehenden `card-images`-Route ist durch feste repo-relative Datenpfade behoben; der Build ist erfolgreich.

## Grenzen

Nicht erweitert:

- Keine Accounts.
- Keine Cloud-Decks.
- Keine öffentlichen Decklisten.
- Kein Matchmaking.
- Keine Rankings.
- Keine Turnierlegalität.
- Keine öffentliche Distribution offizieller Assets.

Weiterhin offen für spätere Gates:

- Vollständige offizielle Deckbuilding- und Formatregeln.
- Vollständige öffentliche Plattformfunktionen.
- M11+ Mechaniken, Prevention/Avoid/Interrupt/Replacement, Set Aside, Remove from Game und Ownership-/Control-Wechsel.
