# V1.0.4 Zwei-Tab-Smoke

Stand: 2026-05-05

Status: repeatable_smoke

## Zweck

Dieser Smoke prüft den privaten Match-Lifecycle in zwei Browser-Tabs. Er ist bewusst auf V1.0.4 begrenzt: Cancel, Leave, Forfeit, Recreate, Reconnect, Recent-Session-Sicherheit und Gegnernamen. Er erweitert keine Karten, Engine-Regeln, offiziellen Assets oder Plattformfunktionen.

## Voraussetzung

- Branch: `codex/v1-0-4-requirements-sharpening`
- Server und Web laufen lokal.
- Zwei Browser-Tabs oder zwei getrennte Browserprofile sind geöffnet.
- DevTools Application/Storage ist für Stichproben verfügbar.

## Ablauf

1. Tab A öffnet die Web-App, erstellt ein Human-vs-Human-Match als Host mit Anzeigename `Host V104` und kopiert den Join-Link.
2. Tab B öffnet den Join-Link, setzt Anzeigename `Joiner V104`, wählt Runner- und Corp-Decks und tritt bei.
3. Prüfen: Beide Tabs zeigen die Startbereitschaftslobby, die Gegnernamen erscheinen side-sicher, und `netrunner.recentSessions` enthält nur MatchId, Seite, Anzeigename, optionalen Gegnernamen, Status und Zeitstempel.
4. Tab A nutzt `Match abbrechen`.
5. Prüfen: Beide Tabs zeigen terminal `cancelled`; der alte Join-Link ist ungültig; `sessionStorage` ist nach Refresh kein stiller Fortsetzen-Pfad mehr.
6. Tab A nutzt `Neu erstellen`.
7. Prüfen: Neue `matchId`, neuer Join-Link, neuer Seed und neue Session-/Reconnect-Tokens; die alte Lobby bleibt terminal und wird nicht aktiv.
8. Tab B tritt dem neuen Link erneut bei, beide Seiten setzen Ready, warten bis `countdown` sichtbar ist.
9. Tab B nutzt `Lobby verlassen`.
10. Prüfen: Beide Tabs zeigen terminal `abandoned`; der Countdown startet kein GameState; der Host sieht Recreate.
11. Erneut neu erstellen, beitreten und ein aktives Spiel starten.
12. Tab A lädt neu und nutzt `Fortsetzen`, solange der Token im tab-lokalen `sessionStorage` vorhanden ist.
13. Prüfen: Reconnect/Bootstrap liefert side-sichere Payloads und rotiert nur tab-lokale Tokens; Recent Sessions enthalten weiterhin keine Tokens, Decklisten, Deckhashes oder Hidden Info.
14. Im aktiven Spiel nutzt ein menschlicher Spieler `Aufgeben`.
15. Prüfen: Status `forfeited`, Result-Grund `forfeit`, Gewinner ist die Gegenseite, der finale Engine-StateHash ist der letzte echte Engine-StateHash, und `advance_ai`/KI-Pacing laufen nicht weiter.
16. Tab A nutzt `Verwerfen`.
17. Prüfen: Nur der lokale Recent-Session-Eintrag verschwindet; serverseitig wird kein weiteres Lifecycle-Kommando ausgelöst.

## Pflicht-Stichproben

- `localStorage.netrunner.recentSessions` enthält keine `sessionToken`, `reconnectToken`, `hostSessionToken`, `hostReconnectToken`, `joinToken`, Decklisten, Deckhashes oder verdeckte Karteninformationen.
- WebSocket-Kommandos werden nicht für explizite Lifecycle-Schreibpfade genutzt; Cancel, Leave, Forfeit und Recreate laufen über REST.
- `PublicEvents`, Reconnect-Payloads, Lifecycle-Payloads und AI-Inputs enthalten keine neuen Lifecycle-Tokens.
- Gegnernamen erscheinen in Lobby, Header, Result Modal, Reconnect Panel, OpponentPanel und `opponent_status` ohne Deck-/Token-/Hidden-Info-Anhänge.

## Automatisierte Abdeckung

- `apps/server/src/multiplayer.test.ts` deckt Cancel, Leave, Forfeit, Human-vs-KI-Forfeit, Recreate, Token-Invalidierung und Replay/StateHash ab.
- `tests/specs/visibility-contract.test.ts` deckt UI-Vertrag, Recent-Session-Sanitizing, REST-Lifecycle-Pfade, Reconnect/Fortsetzen/Verwerfen und Gegnernamen ab.
