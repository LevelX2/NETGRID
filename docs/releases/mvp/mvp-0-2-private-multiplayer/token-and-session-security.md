# Token and Session Security MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

## Tokenarten

| Token | Zweck | Regel |
|---|---|---|
| Host Session Token | Host authentifizieren. | Seitenspezifisch, geheim, nicht loggen. |
| Join Token | Freie Seite übernehmen. | Einmalig oder begrenzt nutzbar, Hash speichern. |
| Reconnect Token | Dieselbe Seite wieder aufnehmen. | Seitenspezifisch, darf Gegenseite nie übernehmen. |

## Mindestregeln

- Mindestens 192 Bit Entropie.
- Speicherung nur als SHA-256-Hash plus serverseitigem Salt.
- Token nur einmal im Link oder Response ausgeben.
- Fehler bei ungültigem Token bleiben generisch.
- Logs redigieren `token`, `sessionToken`, `reconnectToken`, `tokenHash`.
- Tokens erscheinen nie in PublicEvents, WebSocket-Broadcasts oder Replays.

## Tests

- MT-TOKEN-001: Token-Erzeugung und Hash-Speicherung.
- MT-TOKEN-002: falscher Token abgelehnt ohne Seiten-/Matchdetail-Leak.
- MT-SEC-001: Log-/Payload-Scan enthält keine Klartexttokens.

