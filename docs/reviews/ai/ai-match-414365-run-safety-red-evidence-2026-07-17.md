# Rote Evidence: Match 414365 Run-Sicherheit (2026-07-17)

Status: vor Produktionsänderungen reproduziert

## Quelle und Abdeckung

Quelle ist das abgeschlossene Spiel `match_414365c726112bf4` aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.
Die Datenbank enthält 65 Runner-Entscheidungen; Decision-Coverage,
LegalActions und redigierte Ereignispräfixe waren vollständig konsistent.

`Eurocorpse` ist nicht im 45-Karten-Deck `Classic Runner - Cybernetics Risk
Rig` enthalten. Es gab daher keine Eurocorpse-Aktivierung und keinen
Eurocorpse-spezifischen Fehler in diesem Match.

## Side-safe Befunde

### F01 – Running Interference wurde als Economy entwickelt

Bei D32/StateVersion 56 wählte die KI `runner.gain_credit`, obwohl die rohe
HQ-Aktion den stärksten sinnvollen Druck bot. Die Handentwicklungs-Consumer
lesen den Geldtext von `Running Interference` vor seiner Run-Event-Semantik und
erzeugen daher den falschen Plan `runner.develop_hand_card` mit
`gain_credits`.

Der dauerhafte Checkpoint
`cp-414365-01-running-interference-not-economy-d32` verlangt unverändert den
HQ-Run und verbietet die Kreditaktion.

### F02 – Persistenter Data-Raven-Zähler wurde ignoriert

Nach der korrekt entfernten ersten Markierung (D52) war bei D54/StateVersion
91 ein Data-Raven-Zähler für eine Aktion und einen Credit entfernbar. Die KI
wählte stattdessen `runner.gain_credit`. Der Zähler erzeugte zu Beginn des
nächsten Runner-Zugs erneut eine Markierung und stellte die gleiche Lage bei
D58 nochmals her.

Der Checkpoint `cp-414365-03-data-raven-counter-removal-d54` verlangt die
legale Kartenfähigkeit und verbietet die Kreditaktion. Die enge positive
Gegenprobe `cp-414365-02-data-raven-immediate-tag-control-d52` bewahrt die
bereits richtige sofortige Tag-Entfernung.

### F03 – Bekannter, nicht überwindbarer Data-Raven-HQ-Run

Bei D59/StateVersion 101 war Data Raven auf HQ offen bekannt. Der Runner hatte
keinen Sentry-Breaker, Link 0 und nur 2 Credits; die sichtbare Trace 5 war
nicht sicher vermeidbar. Der Start-Run (`runner.start_run.hq`) führte deshalb
vor dem Access zu Markierung und einem zweiten persistierenden Zähler. Mit
verbleibender Markierung konnte der Corp danach flatlinen.

Die KI kannte weder die spätere `Scorched Earth` noch andere verdeckte
Corp-Karten; diese werden nicht als Entscheidungsgrund verwendet. Der Fehler
ist allein der vermeidbare bekannte Trace-/Tag-Pfad bei verfügbarem
Gegenmittel. `cp-414365-04-known-data-raven-run-denial-d59` verbietet den
HQ-Run und akzeptiert nur den Zählerabbau oder Ziehen.

## Abgrenzung: gültiger Prüfrun

Der frühere Run in unbekanntes erstes ICE bleibt ausdrücklich außerhalb dieses
Fixes. Ein solcher Lauf kann sinnvolle Information über die spätere
Run-Kalkulation geben und darf bei erstem Encounter sauber enden. Kein
Checkpoint und keine Erwartung verbieten unbekannte Prüfruns pauschal.

## Red-Evidence-Lauf

```text
corepack pnpm exec vitest run \
  packages/ai/src/evaluation/decision-checkpoints/match-414365-run-safety-decision-checkpoints.test.ts \
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose

-> 3 x behavior_regression
   - D32: runner.gain_credit
   - D54: runner.gain_credit
   - D59: runner.start_run.hq
-> 1 x grüne Gegenprobe
   - D52: runner.remove_tag
```

Die gespeicherten Entscheidungen vor D2 differieren auf dem aktuellen Code
bereits durch einen integrierten Frühfix (`runner.gain_credit` →
`runner.start_run.remote_1`). Alle vier Captures verwenden deshalb
`warmup-policy=rebase` und denselben stabilen 29–56 Entscheidungen langen
kompatiblen Suffix. Diese Warmup-Drift ist getrennt vom Zieltest; die drei
roten Resultate tragen jeweils den Code `behavior_regression`.

## Deckfähigkeits-Consumer-Audit

Aktive und kompilierte Hints für `Schematics Search Engine` sind korrekt:
`program/expose/hq_access`, `information_gain`, HQ-Info und Expose. Der
Deckfähigkeits-Consumer durchsucht jedoch auch Titel und Card-ID textuell; der
Name „Search Engine“ kann daher fälschlich ein Tutorprofil erzeugen. Dies ist
ein unabhängiger Consumer-Fehler ohne Hint- oder Kartentextänderung und erhält
einen fokussierten Vertrag im Produktionspaket.
