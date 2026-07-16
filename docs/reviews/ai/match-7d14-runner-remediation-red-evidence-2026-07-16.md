# Match 7D14 Runner-Remediation: Red Evidence (2026-07-16)

## Quelle und Capture-Grenze

- Match: `match_7d14d0a3bc0ecd79`
- Modus: menschliche Corp gegen Runner-KI
- Runner-Profil: `runner-ai-v0.9-hard`
- SQLite-Quelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Capture-Code: Ausgangs-`main` auf `d5e6c1353`

Die drei Checkpoints bauen PlayerView und LegalActions über die Engine neu auf, speichern nur das für den Runner redigierte Eventpräfix und exportieren den side-sicheren AI-Runtime-Checkpoint. Alle Captures liefen mit `--warmup-policy strict` und null Warmup-Drift:

| Finding | Anker | StateHash | Warmup | Eventpräfix |
| --- | --- | --- | ---: | ---: |
| 7D14-F01 | D105 / SV190 | `fnv1a:ccf48d04` | 104/104 kompatibel | 191 |
| 7D14-F01 | D106 / SV191 | `fnv1a:587ce56a` | 105/105 kompatibel | 192 |
| 7D14-F02 | D152 / SV256 | `fnv1a:cbe45bc0` | 151/151 kompatibel | 257 |

Die Checkpoint-Ausführung validiert Schema, Runtime-Version, Match-/State-Identität, StateHash und verbotene Transportfelder vor der Verhaltensauswertung.

## Rote Zielentscheidungen

| Anker | Aktuelle Wahl | Side-sichere Erwartung |
| --- | --- | --- |
| D105 / SV190 | `runner.gain_credit`; der absolute Handkartenplan blockiert den Raw-Score-Sieger `runner.start_run.rd` bei Score-Gap 3489 | den erreichbaren R&D-Run mit Pfadkosten 1 und neun verbleibenden Credits wählen; den Finanzierungsschritt nicht wählen |
| D106 / SV191 | Installation von Raven Microcyb Owl; der `funded_development_plan_controller` blockiert erneut den Raw-Score-Sieger `runner.start_run.rd` | den weiterhin erreichbaren R&D-Run mit Pfadkosten 1 und zehn verbleibenden Credits wählen; die Installation nicht wählen |
| D152 / SV256 | Discard von HQ Interface, Livewire's Contacts und Score! | HQ-Closeout-Karte und die sofort spielbare Liquidität behalten; keine exakte Dreierkombination erzwingen |

D105 ist die früheste kausale Fehlentscheidung. D106 wird als direkte Fortsetzung desselben Findings gebunden, damit die Revalidation nicht nur den Kredit-, sondern auch den unmittelbar folgenden Installationsschritt erfasst.

## Grüne Gegenproben

1. Die D105-Begleitprobe setzt die Runner-Credits auf null. Der sichtbare R&D-Pfad ist dadurch `blocked_unpayable`; der Finanzierungsschritt bleibt auf der roten Ausgangsbasis gewählt und erlaubt.
2. Die D152-Begleitprobe fügt eine bereits installierte zweite HQ-Interface-Instanz hinzu. Die Handkopie ist damit ein echtes vorhandenes Äquivalent und darf weiterhin abgeworfen werden.

Beide Begleitproben verändern nur den jeweils begrenzenden sichtbaren Faktor, berechnen den StateHash neu und bleiben bei identischer Runtime-/Event-Grenze side-safe.

## Red-Gate

Ausgeführt:

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/match-7d14-runner-decision-checkpoints.test.ts \
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis: eine erwartungsgemäß rote Testdatei, drei rote Zieltests und zwei grüne Gegenproben. Jeder Zieltest meldet ausschließlich `behavior_regression`:

- D105: aktuelle Wahl `runner.gain_credit`
- D106: aktuelle Wahl `runner.install_card.runner_onr_v1_141_raven-microcyb-owl_1.runner_onr_v1_141_raven-microcyb-owl_1`
- D152: aktuelle Wahl `runner.resolve_choice` mit der falschen Discard-Auswahl

Es liegt keine Engine-, Legalitäts-, Runtime-, Fixture-, Hash-, Redaction- oder Warmup-Drift vor. Damit sind beide freigegebenen Findings auf dem aktuellen Ausgangscode reproduziert und für generische Produktionsfixes autorisiert.

## Nicht autorisierte Nachbaränderungen

- Keine Kartennamens-Sonderregel für Raven Microcyb Owl, HQ Interface oder Livewire's Contacts.
- Keine Änderung an Engine, LegalActions, Replay, StateHash oder Randomness.
- Keine Nutzung späterer Matchinformationen oder verdeckter Corp-Karten.
- Die beim Kartenhint-Audit gefundenen kompilierten Effektüberlappungen bleiben mangels Kausalbezug außerhalb dieses Prozesses.
