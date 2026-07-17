# Rote Evidence: Match 20EB mit Eurocorpse-Fokus (2026-07-17)

Status: P1 abgeschlossen, vor Produktionsänderungen

## Capture-Vertrag

Alle Fixtures stammen aus der read-only geöffneten Runtime-Datenbank
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`. Capture lief
gegen den unveränderten Code-Commit `15a3f64b1` mit
`--warmup-policy strict`.

| Fixture                                        | Decision / StateVersion | Strict Warmup | Ziel                                                         |
| ---------------------------------------------- | ----------------------: | ------------: | ------------------------------------------------------------ |
| `cp-20eb-01-background-bank-cadence-d39`       |              D39 / SV80 |   38, Drift 0 | Wertvoller Draw schlägt wiederholte Hintergrundbank          |
| `cp-20eb-02-viable-run-lock-release-d54`       |             D54 / SV110 |   53, Drift 0 | Bezahlbare Sperre mit glaubwürdigem Folgepfad lösen          |
| `cp-20eb-03-no-empty-eurocorpse-d55`           |             D55 / SV111 |   54, Drift 0 | Eurocorpse nicht ohne hostbaren Breaker installieren         |
| `cp-20eb-04-host-breaker-before-overflow-d59`  |             D59 / SV120 |   58, Drift 0 | Krash hosten statt über das Handlimit ziehen                 |
| `cp-20eb-05-no-late-bank-without-need-d129`    |            D129 / SV242 |  128, Drift 0 | Keine verzögerte Bank am gegnerischen Matchpoint ohne Bedarf |
| `cp-20eb-06-first-early-bank-load-control-d38` |              D38 / SV79 |   37, Drift 0 | Erste frühe Hintergrundbank-Aktion bleibt erlaubt            |

Alle Captures enthalten TacticalPlan, PlanPortfolio und StrategicIntent; ein
RunnerRunPlan war in diesen Zuständen nicht aktiv. Es gab weder
Warmup-Drift noch fehlende Runtime-Snapshots.

## Rote historische Zielverträge

Der fokussierte Vitest-Lauf meldete für alle fünf historischen Ziele
ausschließlich `behavior_regression`:

1. D39 wählt erneut
   `runner.activated_card_ability...streetware-distributor...activated.0`
   statt des wertvollen bestätigten Handpuffer-Draws.
2. D54 wählt `runner.draw_card` statt `runner.trigger_ability` zur
   Run-Sperrenfreigabe.
3. D55 installiert
   `onr_proteus_139_eurocorpse-tm-spin-chip`, obwohl kein Breaker unmittelbar
   gehostet werden kann.
4. D59 wählt `runner.draw_card` statt der legalen Action, Krash in
   Eurocorpse zu hosten.
5. D129 lädt Streetware am gegnerischen Matchpoint ohne konkreten oder
   terminalen Finanzierungsbedarf.

Kein Ziel scheiterte als `engine_legality_drift`, `runtime_state_drift`,
Fixture-Migration oder Redaction-Fehler. Damit dürfen die fünf zugehörigen
Produktionspfade nach Skill-Vertrag bearbeitet werden.

## Grüne Gegenproben vor dem Fix

Fünf enge Grenzen waren auf demselben unveränderten Code grün:

- D38: Die erste frühe Streetware-Ladung bleibt zulässig.
- D54 ohne Folgeclick: Die Run-Sperre wird nicht sinnlos als letzte Aktion
  gelöst.
- D55 mit einem aus dem Stack in den Grip variierten Krash: Eurocorpse darf
  installiert werden, wenn ein Breaker sofort hostbar ist.
- D59 mit einer Karte unter dem effektiven Handlimit: Basic Draw bleibt
  zulässig.
- D39 mit bereits vollem synthetischem effektivem Grip: Eine weitere
  Streetware-Ladung bleibt zulässig, wenn der Handpuffer-Draw keine sinnvolle
  Alternative mehr ist.

Die letzte Gegenprobe setzt die Nutzerklärung verbindlich um:
`maxActionsPerTurn: 1` ist für Hintergrundbanken eine weiche Normalfrequenz,
kein hartes Verbot. Die Remediation muss Wiederholungen erkennen und gegen
wirklich sinnvolle Alternativen abwerten, darf sie aber nicht pauschal
unterbinden.

## Unveränderliche Expectations

Die historischen Expectations und die beschriebenen Gegenproben werden nach
diesem Red-Nachweis nicht abgeschwächt. Produktionsänderungen bleiben
kartennamenfrei und side-safe; sie dürfen ausschließlich LegalActions und
damalige PlayerView-/PublicEvent-Informationen verwenden.
