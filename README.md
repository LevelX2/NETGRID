# NETGRID

NETGRID ist eine private Webanwendung für ein asymmetrisches, rundenbasiertes Kartenspiel mit verdeckten Informationen.

## Spielidee

Zwei Seiten treten mit unterschiedlichen Möglichkeiten gegeneinander an:

- Eine Seite versucht, gezielt Ziele zu erreichen und dabei Risiken einzugehen.
- Die andere Seite baut Druck auf, kontrolliert kritische Bereiche und reagiert auf Vorstöße.
- Karten, Ressourcen und Timing entscheiden darüber, wann ein direkter Vorstoß sinnvoll ist und wann Absicherung wichtiger ist.

Das Spiel wird vollständig durch eine deterministische Regel-Engine gesteuert. Alle Clients sehen nur die Informationen, die sie laut Spielzustand sehen dürfen.

## Was die App bietet

- Partien Mensch gegen KI in beiden Seitenrollen
- KI-gegen-KI-Simulationen
- Lokaler privater Multiplayer für zwei menschliche Spieler
- Kartenverwaltung, Deckauswahl und Match-Setup

## Technischer Rahmen

- Node 24 LTS
- pnpm Workspaces
- TypeScript (strict)
- Vitest
- Next.js/React für die Weboberfläche
- SQLite für lokalen Laufzeit-Storage

## Lokaler Start

```powershell
corepack pnpm install
corepack pnpm -F @netgrid/server dev
corepack pnpm -F @netgrid/web dev
```

- Server: `http://127.0.0.1:8787`
- Weboberfläche: `http://127.0.0.1:3100`
- Abweichende Server-URL über `NEXT_PUBLIC_NETGRID_SERVER_URL`

## Lokales Match starten

1. Browser öffnen: `http://127.0.0.1:3100`
2. Match erstellen und Join-Link teilen
3. Zweiten Client über den Join-Link beitreten lassen
4. Auf beiden Seiten ein gespeichertes Deck wählen und starten

Hinweise:

- KI-Partien sind direkt in der Startansicht verfügbar.
- Für Nutzung außerhalb von localhost HTTPS/WSS verwenden und Tokens wie Passwörter behandeln.
- Laufzeitdaten liegen unter `data/runtime/` (Default: `data/runtime/multiplayer/netgrid.sqlite`).

## Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
```
