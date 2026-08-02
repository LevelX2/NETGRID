# Zufalls-Standarddeck-Selfplay: Abschlussreview Runde 1

Stand: 2026-08-02

Status: abgeschlossen

## Gegenstand

- Runner: `Redline Riot` (`standard_runner_redline_riot`)
- Corp: `Shadoe Tag & Bag` (`standard_corp_shadoe_tag_bag`)
- Seed: `loop-20260802-1785650996082`
- Profile: Hard gegen Hard

Der Ausgangslauf endete nach 297 Aktionen durch Corp-Sieg mit 7:2 Punkten.
Replay, StateHash, LegalActions und Runtime waren technisch sauber. Die
vollständige Zugprüfung identifizierte drei Verhaltensfehler sowie vier
Metadaten-/Diagnosefehler.

## Generische Korrekturen

1. `corp.score_agenda` akzeptiert gestuftes ICE als Schutz einer mehrzügigen
   Agenda-Installation nur noch, wenn die bekannte Kartendefinition eine
   harte zugangsbeendende Subroutine und der Zustand eine vollständige,
   bezahlbare Rez-Quote liefert. Tag-, Trace- oder Jack-out-Effekte allein
   gelten nicht als Score-Schutz.
2. `runner.contest_remote` lässt einen erreichbaren öffentlichen terminalen
   Remote nicht mehr am gewöhnlichen Materialwertfilter scheitern. Der Plan,
   Step, die Action-ID und der Zielserver bleiben unverändert gebunden.
3. `runner.credit_bank` kann einen Cashout an die exakte terminale
   action-spezifische Run-Route binden, wenn der aus sichtbaren Trace-Fakten
   berechnete Finanzierungsabstand vollständig gedeckt wird. Eine bereits
   sichere Geschwisterroute verhindert den Cashout.
4. Gescorete, endliche Hosted-Credit-Pools tragen den allgemeinen
   `economy.temporary_resource_bank`-Vertrag vollständig.
5. Zielgebundene Multiaccess-Run-Events gelten in der Selfplay-Diagnostik als
   kompatible Aktionen ihres Central-Pressure-Plans.
6. Eine durch `corp.score_agenda` zertifizierte Same-Turn-Install-Advance-
   Score-Continuation wird nicht als `naked_agenda_install` fehlklassifiziert.
7. Plan-first liefert Top-Level-Why-not und einen `runtime_why_not`-Abschnitt.
   Werden ausschließlich private Ownerdetails aus der Selfplay-Evidence
   entfernt, bleibt ein redaktionssicherer Hinweis auf den vorhandenen
   Ownergrund erhalten.

Keine Runtime-Regel nennt Deck-, Match-, Seed-, Karten- oder Instanz-IDs. Es
wurde kein neuer Chooser, Override, Fallback oder Choice-Resolver eingeführt.

## Reproduktions- und Gegenprobe

Die drei historischen Entscheidungen wurden als portable Checkpoints
gesichert. Vor der Implementierung scheiterten alle ausschließlich als
`behavior_regression`. Nach der Implementierung sind sie grün:

- unsichere gestufte Agenda bleibt in HQ; `corp.defend_servers` sucht
  wirksamen Zugangsstopp;
- der direkt bezahlbare terminale Remote läuft unter
  `runner.contest_remote`;
- der Broker-Cashout bleibt Eigentum von `runner.credit_bank` und bindet die
  exakte Inside-Job-Remote-Action.

Die bestehenden 5F7924-Checkpoints wurden fachlich nachgeschärft: Jack Attack
ist kein harter Zugangsstopp und darf deshalb keine gestufte Agenda-
Installation rechtfertigen.

## Identischer Kontrolllauf

Der gleiche Seed wurde nach den Änderungen erneut vollständig ausgeführt:

- 371 Aktionen, 50 Züge, Corp-Sieg 8:4;
- Final-StateHash `fnv1a:d8a719f0`;
- 371/371 Entscheidungen und DecisionPoints erfasst;
- Replay erfolgreich, 0 Replayfehler, 0 IllegalActions, 0 Fallbacks,
  0 Timeouts und 0 Runtimefehler;
- 0 Selfplay-Detektorfunde aller Schweregrade;
- Top-Level-Why-not 225/225;
- Runtime-Why-not-Abschnitt 225/225;
- Why-not für nicht gewählte Alternativen 1682/1682;
- Redaction-Gate bestanden;
- Corp-Deck-Hint-Audit: 0 Blocker, 0 Warnungen.

Die lokalen privilegierten Rohdaten liegen absichtlich nur unter
`data/local/ai-loop/` und werden nicht versioniert.

## Gates

- fokussierte Checkpoint-, Hint-, Doctrine-, Trace-Mining- und Why-Coverage-
  Tests: grün;
- `@netgrid/ai`-Typecheck mit erhöhtem Prüfprozess-Heap: grün;
- `corepack pnpm test:ai:shards`: 3/3 Shards grün, insgesamt 4525 Tests;
- Git-Diff-Check und Replay-/Hidden-Info-Grenzen: grün.

## Ergebnis

Runde 1 ist fachlich und technisch abgeschlossen. Die nächste Loop-Runde
beginnt nach lokaler Integration mit einem neu ausgelosten Runner-/Corp-
Standarddeckpaar und neuem persistierten Seed.
