# Root-Rez-Geheimhaltung: Match-Evidence

## Match

- Match-ID: `match_0fcb17642297a8a2`
- Status bei Analyse: aktiv
- Modus: `human_runner_vs_corp_ai`
- untersuchte Entscheidung: StateVersion 150, Decision-Index 73
- Timingpunkt: `run.approach_ice`
- angegriffener Server: `remote_1`
- Runposition: ICE-Index 2

Die Analyse erfolgte read-only aus
`data/runtime/multiplayer/netgrid.sqlite`. Spätere verdeckte Informationen
wurden nicht als damalige Entscheidungsgrundlage verwendet.

## Sichtbarer Kontext

Remote 1 enthielt drei ICE:

- ICE 0: Cortical Scrub, gerezzt
- ICE 1: Keeper, ungerezzt
- ICE 2: Shotgun Wire, ungerezzt und gerade approached

Im Root lag Vapor Ops ungerezzt mit zwei Advancement-Countern. Die Corp hatte
10 Credits.

## Fehlentscheidung

Die Corp-KI wählt im ersten Rez-Fenster:

| Alternative | Score |
|---|---:|
| Vapor Ops rezzen | 1582 |
| Shotgun Wire rezzen | 452 |
| Rez ablehnen | -645 |

Vapor Ops erhielt `+760` durch
`corp.tactical.rez_relevant_ice` und `+750` für zahlbare Rez-Kosten von null.
Der technische Aktionstyp `rez_ice` bezeichnet auch Root-Rez-Aktionen. Sowohl
Zielbildung als auch Zielabgleich behandelten ihn ohne Prüfung der sichtbaren
Kartenquelle als echtes ICE.

Die bestehende Funktion `corpRootRezTimingComponent` erfasste
Access-Ambushes und runrelevante Root-Effekte. Für eine ausschließlich im
Corp-Hauptzug nutzbare Root-Karte lieferte sie jedoch keine Komponente. Damit
blieb der strategische Wert der Geheimhaltung unbewertet.

## Erwarteter Vertrag

- `corp.tactical.rez_relevant_ice` passt nur auf Aktionen mit sichtbarer
  ICE-Quelle.
- Eine Root-Karte ohne Effekt im aktuellen Runfenster wird während des Runs
  nicht gerezzt.
- Das Vertagen ist im Score-Breakdown explizit erkennbar.
- Vapor Ops kann im Corp-Hauptzug gerezzt und unmittelbar verwendet werden.
- Zugriffsschutz und andere runrelevante Root-Karten behalten ihre späte
  Rez-Logik.

## Regressionen

1. Drei-ICE-Remote mit Vapor Ops im Root: Root-Rez verliert gegen Ablehnen und
   gegen das tatsächlich approached ICE.
2. Taktisches Rez-Ziel: Root-Karte passt nicht, echtes ICE passt weiterhin.
3. Nicht angegriffener oder zu früher runrelevanter Root-Schutz wird
   vertagt; im letzten sinnvollen Fenster bleibt er positiv.
4. Außerhalb eines Runs erhält eine Corp-Main-Root-Karte keine
   Geheimhaltungsstrafe.
