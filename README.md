# Netrunner

Private Netrunner-Webapplikation für einen schrittweise aufgebauten MVP:

- MVP 0.1: Human Runner gegen einfache Corp-KI mit festen Demo-Decks.
- MVP 0.2: privates Human-vs-Human-Multiplayer über dieselbe Engine.

Dieses Repository ist aktuell in der Setup-Phase. Die Projektumgebung, Codex-Regeln, Dokumentstruktur und Monorepo-Platzhalter sind angelegt; Engine, UI, Server, KI und Tests sind noch nicht implementiert.

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

## Aktueller Stand

Noch keine Abhängigkeiten installieren oder Implementierung starten, solange die nächste Phase nicht ausdrücklich beauftragt ist. Der nächste sinnvolle Schritt ist die Requirements-Ableitung für MVP 0.1 aus den vorhandenen Quellen.

Lokaler Werkzeughinweis vom Setup: Auf dieser Maschine war beim Einrichten Node `v24.15.0` aktiv. Das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; falls `pnpm` nicht direkt im PATH liegt, verwende `corepack pnpm ...`.
