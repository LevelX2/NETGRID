# Netrunner

Private Netrunner-Webapplikation für einen schrittweise aufgebauten MVP:

- MVP 0.1: Human Runner gegen einfache Corp-KI mit festen Demo-Decks.
- MVP 0.2: privates Human-vs-Human-Multiplayer über dieselbe Engine.
- MVP 0.3: Runner-KI, Corp-KI v2, Human-vs-KI in beide Richtungen und KI-vs-KI-Simulation.
- MVP 0.4: kleiner interner Kartenpool, kuratierte V0.4-Decks, Hardware, einfaches Upgrade und Tags.
- MVP 0.5: lokaler Kartenimport-Snapshot, Kartenkatalog, Statusmodell, read-only Katalog-API und funktionale Katalogansicht.

MVP 0.1 bis 0.5 sind abgeschlossen. Der aktuelle Stand unterstützt private Human-vs-Human-Partien, Human-vs-KI in beide Richtungen, KI-vs-KI-Simulationen, einen kleinen kontrollierten internen V0.4-Kartenpool sowie einen lokalen Kartenkatalog. Damage, freie Decks, offizielle Assets und öffentliche Plattformfunktionen bleiben außerhalb des aktuellen Scopes.

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
corepack pnpm -F @netrunner/server dev
corepack pnpm -F @netrunner/web dev
```

Der Multiplayer-Server läuft standardmäßig unter `http://127.0.0.1:8787`. Die Weboberfläche läuft standardmäßig unter `http://127.0.0.1:3000` und nutzt `NEXT_PUBLIC_NETRUNNER_SERVER_URL`, falls der Server nicht auf dem Default-Port läuft.

Für ein privates Match im lokalen Netz:

- Host öffnet `http://127.0.0.1:3000`, erstellt ein Match und kopiert den Join-Link.
- Zweites Browserfenster oder zweiter lokaler Client öffnet den Join-Link.
- Für KI-Partien kann in der Startansicht Runner vs Corp-KI, Corp vs Runner-KI oder KI vs KI gewählt werden.
- Außerhalb von localhost HTTPS/WSS verwenden und Tokens wie Passwörter behandeln.
- Runtime-Storage liegt unter `data/runtime/` und ist nicht versioniert; bei längerer Nutzung regelmäßig sichern.

## Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Aktueller Stand

MVP 0.1, 0.2, 0.3, 0.4 und 0.5 haben Requirements, Implementierung, Validierung, Hardening und Final Review bestanden. Der aktuelle Stand ist eine private lokale Spiel-, Simulations- und Katalogbasis ohne öffentliche Plattformfunktionen.

Lokaler Werkzeughinweis vom Setup: Auf dieser Maschine war beim Einrichten Node `v24.15.0` aktiv. Das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; falls `pnpm` nicht direkt im PATH liegt, verwende `corepack pnpm ...`.
