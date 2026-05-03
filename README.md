# Netrunner

Private Netrunner-Webapplikation für einen schrittweise aufgebauten MVP:

- MVP 0.1: Human Runner gegen einfache Corp-KI mit festen Demo-Decks.
- MVP 0.2: privates Human-vs-Human-Multiplayer über dieselbe Engine.

MVP 0.1 ist als erster spielbarer Stand abgeschlossen: eine lokale Human-Runner-vs-Corp-KI-Partie mit festen Demo-Decks, deterministischer Engine, LegalActions/PlayerActions, PlayerViews, EventLog, Replay/StateHash, Visibility-Tests und einfacher Next.js-Weboberfläche. Der vollständige GameState bleibt serverseitig; der Browser erhält nur Runner-PlayerView-Payloads.

## Einstieg

Für Codex-Arbeit gelten zuerst:

1. `AGENTS.md`
2. `KI-Wissen-Netrunner/00 Projektstart.md`
3. `docs/codex/CODEX_STATUS.md`
4. `docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md`

Die verbindlichen Quellen liegen unter `docs/source/`, soweit bereits vorhanden. Ergänzende Spezifikationen liegen weiterhin unter `docs/`.

## Stack-Ziel

- Node 24 LTS
- pnpm Workspaces
- TypeScript strict
- Vitest
- Next.js/React für die Web-UI, sobald die Umsetzung beginnt
- Reines TypeScript-Engine-Paket ohne UI-, Netzwerk-, Datenbank- oder KI-Abhängigkeiten

## Lokaler Start

```powershell
corepack pnpm install
corepack pnpm -F @netrunner/web dev
```

Die Weboberfläche läuft standardmäßig unter `http://127.0.0.1:3000`.

## Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Aktueller Stand

MVP 0.1 hat Requirements, Implementierung, Validierung, Hardening und Final Review bestanden. MVP 0.2 darf als Requirements-Phase beginnen; die Multiplayer-Implementierung bleibt bis zum 0.2-Requirements-Gate gesperrt.

Lokaler Werkzeughinweis vom Setup: Auf dieser Maschine war beim Einrichten Node `v24.15.0` aktiv. Das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; falls `pnpm` nicht direkt im PATH liegt, verwende `corepack pnpm ...`.
