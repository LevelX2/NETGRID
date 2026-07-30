# Teststufen und Paketgrenzen

Stand: 2026-07-10

## Verbindliche Teststufen

NETGRID trennt lokale Rückmeldung von vollständiger Abschlussprüfung. Ein
kleiner Lauf ersetzt keinen paketnahen Test nach einer fachlichen Änderung.

| Stufe     | Befehl                                                                 | Zweck                                                    |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Paketnah  | `corepack pnpm --filter <paket> test`                                  | Direkt betroffene Unit- und Regressionstests             |
| Verträge  | `corepack pnpm test:contracts`                                         | Shared-Verträge sowie Phase-1- und Sichtbarkeitsverträge |
| AI-Shards | `corepack pnpm test:ai:shards`                                         | Vollständige AI-Suite in drei stabilen Vitest-Shards     |
| Full Gate | `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` | Projektweiter Abschluss vor Integration                  |

Der Sammelbefehl startet die drei festen AI-Shards im lokalen Normalfall
parallel. Jeder Shard bleibt intern auf genau einen Vitest-Worker begrenzt.
Damit nutzt der vollständige AI-Lauf mehrere CPU-Kerne, ohne die
Determinismus-, Speicher- und Zustandsrisiken einer beliebig hohen
Worker-Anzahl innerhalb eines Testprozesses einzugehen. Der Sammelbefehl wartet
alle drei Ergebnisse ab und schlägt fehl, sobald mindestens ein Shard rot ist.

Die Shards können zur Diagnose einzeln mit
`corepack pnpm --filter @netgrid/ai test:shard:1`, `:2` oder `:3` ausgeführt
werden. Für nachweislich speicherarme oder instabile Umgebungen gibt es den
bewussten Fallback `corepack pnpm test:ai:shards:serial`. Mehr als die drei
festen Parallelprozesse oder mehr als ein Worker je Shard werden erst nach
einer dokumentierten Laufzeit-, RAM- und Stabilitätsmessung zum neuen Standard.

Tests mit Timeout oder abgebrochene Prozesse gelten nicht als bestanden.

## Abhängigkeitsrichtung

`corepack pnpm check:package-boundaries` prüft die produktiven TypeScript- und
JavaScript-Dateien fail-closed gegen folgende Schichten:

```text
shared
  ↑
catalog    engine
  ↑          ↑
decks ───────┘
  ↑
ai
```

- `shared` importiert kein anderes NETGRID-Paket.
- `catalog` importiert nur `shared`.
- `decks` importiert nur `catalog` und `shared`.
- `engine` importiert nur `shared`.
- `ai` importiert nur `catalog`, `decks`, `engine` und `shared`.
- Normale Webclient-Module importieren weder `engine` noch `ai` direkt.
  Server-Routen und das ausdrücklich isolierte Tutorial bleiben ausgenommen.

Der Check untersucht nur versionierte Produktionsdateien. Tests dürfen für
Vertrags- und Integrationsprüfungen breiter importieren. Neue Pakete müssen
vor ihrer Aufnahme eine explizite Richtung in diesem Dokument und im Gate
erhalten; unbekannte NETGRID-Imports innerhalb einer geregelten Schicht
schlagen fehl.

`corepack pnpm check:package-boundaries:selftest` belegt mit positiven und
negativen Beispielen, dass erlaubte Imports passieren und verbotene Shared-
oder Webclient-Abhängigkeiten das Gate tatsächlich rot schalten.
