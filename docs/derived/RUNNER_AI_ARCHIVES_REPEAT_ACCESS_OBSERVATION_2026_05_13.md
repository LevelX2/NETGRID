# Runner-KI Archives Repeat Access Observation

Stand: 2026-05-13
Status: umgesetzt

## Beobachtung

In einem lokalen Human-Korp-vs-Runner-KI-Spiel lief die Runner-KI mehrfach auf Archives und griff wiederholt auf dieselbe offene Operation `Accounts Receivable` zu. Im Board lagen weitere offene Archives-Karten und mindestens eine verdeckte Archives-Karte.

## Einordnung

Regeltechnisch muss ein erfolgreicher Run auf Archives alle Karten in Archives accessen. Verdeckte Archives-Karten bleiben bis zu ihrem Zugriff verborgen, werden beim Zugriff aber aufgedeckt. Der konkrete Match-Record lief noch mit Engine-Baseline `0.94.0`; dadurch wurde der alte Einzelkarten-Zugriffspfad verwendet, obwohl die Full-Archives-Breach-Queue seit V1.1.2/V0.97 vorhanden ist.

Zusätzlich bewertete die Runner-KI einen unveränderten wiederholten Archives-Zugriff als `safe_probe_run` weiter hoch, obwohl side-sicher beobachtbar war, dass der letzte Archives-Zugriff nur dieselbe bekannte offene Operation traf und Archives seitdem nicht verändert wurde.

## Umsetzung

- Neue private lokale O:NR-Matches mit `cardPoolVersion` `private-local-onr-v1` starten im Multiplayer-Server jetzt mit `MVP_0_99_BASELINE` statt `MVP_0_94_BASELINE`. Dadurch ist die bestehende Archives-Breach-Queue aktiv und verdeckte Archives-Karten werden beim Zugriff korrekt aufgedeckt.
- Die Runner-KI erkennt unveränderte wiederholte Archives-Zugriffe auf dieselbe bekannte wertlose Karte und wertet den `safe_probe_run` mit `known_archives_access_not_fresh` ab.
- Archives-Änderungen wie Corp-Discard nach Archives, Trash oder gespielte Operationen invalidieren diese Abwertung konservativ, damit ein neuer Archives-Run wieder attraktiv werden kann.

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts`: pass, 89 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test -- src/multiplayer.test.ts`: pass, 72 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- Gespeicherter Match-Snapshot `match_817978996ca28b31` / `snap_before_127`: wählt nach der Änderung `runner.gain_credit` statt erneut `runner.start_run.archives`.

## Gate-Hinweis

Der Hidden-Info-Vertrag bleibt erhalten: Die KI sieht verdeckte Archives-Karten nicht vor dem Zugriff. Sie nutzt nur öffentliche Counts, sichtbare Archives-Karten, rechtmäßig beobachtete Zugriffe und öffentliche Archives-Änderungen.
