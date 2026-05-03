# Netrunner

Private Netrunner-Webapplikation für einen schrittweise aufgebauten MVP:

- MVP 0.1: Human Runner gegen einfache Corp-KI mit festen Demo-Decks.
- MVP 0.2: privates Human-vs-Human-Multiplayer über dieselbe Engine.

MVP 0.1 ist als erster spielbarer Stand implementiert: eine lokale Human-Runner-vs-Corp-KI-Partie mit festen Demo-Decks, deterministischer Engine, LegalActions/PlayerActions, PlayerViews, EventLog, Replay/StateHash, Visibility-Tests und einfacher Next.js-Weboberfläche.

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

Phase 1 Requirements ist abgeschlossen und committed. Phase 2 MVP-0.1-Implementierung ist umgesetzt und lokal grün geprüft. Phase 3 Validierung, Hardening und Abschlussdokumentation ist der nächste Gate-Schritt.

Lokaler Werkzeughinweis vom Setup: Auf dieser Maschine war beim Einrichten Node `v24.15.0` aktiv. Das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; falls `pnpm` nicht direkt im PATH liegt, verwende `corepack pnpm ...`.
