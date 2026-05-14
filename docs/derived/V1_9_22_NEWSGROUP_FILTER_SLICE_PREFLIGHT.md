# V1.9.22 Newsgroup Filter Slice Preflight

Stand: 2026-05-14
Status: Runtime-WIP mit installierter Credit-Faehigkeit umgesetzt, keine Catalog-/AI-Promotion

## Lokaler Regelkern

`data/rules/v1922-local-card-facts.json` fuehrt fuer `onr_v1_045_newsgroup-filter` folgende lokal bestaetigte Fakten:

- Seite/Typ: Runner-Programm.
- Zahlen: Installkosten 5, MU 2.
- Effektkern laut Nutzerklaerung 2026-05-14: `[A]: Gain 2 Credits`.

## Umsetzungsschnitt

Der kleinste Code-Schnitt ist jetzt umgesetzt: eine installierbare Runner-Programm-Definition mit einer aktivierbaren Economy-Faehigkeit.

- Timing: Runner-Main-Action-Fenster.
- Kosten: 1 normale Runner-Aktion.
- Effekt: Runner gewinnt 2 Credits.
- Limit: nur durch verfuegbare Aktionen begrenzt; kein eigenes once-per-turn-Limit dokumentiert.
- PublicPayload: sichtbare Information darf nur Programmquelle, Credit-Gain und Runner-Creditstand ausweisen.
- Replay: Aktivierung muss deterministisch im StateHash liegen; kein Use-/Tap-Flag noetig.

## Entscheidung

Runtime-Code ist als enger Teilschnitt umgesetzt: `Newsgroup Filter` kann fuer 5 Credits und 2 MU installiert werden und oeffnet danach im Runner-Main-Action-Fenster eine installierte Programm-Aktion `[A]: Gain 2 Credits`. Der Pfad ist Wrong-Side-/Stale-revalidiert, prueft die installierte Quelle erneut, dokumentiert `gainCreditsAmount: 2`, `gainedCredits: 2` und den Runner-Creditstand oeffentlich und bleibt replay-/StateHash-stabil. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.

## Removal Condition

Der technische Runtime-Vertrag ist fuer den WIP-Schnitt erfuellt:

1. LegalAction-Projektion nur fuer installierten `Newsgroup Filter`, Runner-Seite und Runner-Main-Action-Fenster.
2. `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timing, installierte Quelle und 1 Aktionskosten.
3. PublicPayload zeigt Quelle, `gainCreditsAmount: 2` und Runner-Creditstand ohne private Daten.
4. Replay-/StateHash-Smoke bleibt deterministisch.

Verbleibende Removal Condition fuer Releaseabschluss: finaler V1.9.22 Catalog-/AI-/Webclient-/Final-Review-Gate. Bis dahin bleibt die Karte `runtime_wip_no_promotion`.
