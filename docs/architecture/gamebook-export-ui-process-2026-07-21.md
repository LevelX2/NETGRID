# Paketprozess: Spielprotokoll in der Spieleübersicht

**Status:** in Umsetzung  
**Datum:** 21.07.2026  
**Branch:** `codex/gamebook-ui`  
**Worktree:** `C:\Projekte\NETGRID_GAMEBOOK_UI`

## /Goal

In der Spieleübersicht lässt sich für jedes abgeschlossene öffentliche Spiel
das vorhandene Spielprotokoll als Markdown-Datei herunterladen.

## Anlass und Rahmen

Der Export-Endpunkt `GET /api/replays/:matchId/gamebook` ist bereits
implementiert. Die Spieleübersicht soll ihn sichtbar und direkt nutzbar
machen. Der Client entscheidet dabei weder über die Verfügbarkeit noch über
Zugriffsrechte; diese verbleiben vollständig beim Server.

## Umsetzungspakete

### UI-001 – Download in abgeschlossenen öffentlichen Spielen

- In der Karte eines abgeschlossenen öffentlichen Spiels neben dem Replay-Link
  einen klar benannten Download anbieten.
- Die URL verwendet die konfigurierte Multiplayer-Serveradresse und kodiert
  die Match-ID.
- Laufende und offene Spiele erhalten keinen Download-Link.
- Einen fokussierten Test für die Ziel-URL und die Sichtbarkeit ergänzen.

### UI-002 – Prüfung und Integration

- Web-Tests, Typecheck und Build ausführen.
- Änderungen prüfen, paketweise committen und lokal nach `main` integrieren.
- Worktree und Branch entfernen, soweit das ohne Datenverlust möglich ist.

## Akzeptanzkriterien

1. Abgeschlossene öffentliche Spiele zeigen „Spielprotokoll herunterladen“.
2. Der Link lädt `.../api/replays/<matchId>/gamebook` vom Multiplayer-Server.
3. Match-IDs werden URL-sicher kodiert.
4. Die bestehende Server-Autorisierung und die Hidden-Information-Grenze
   bleiben unverändert.
