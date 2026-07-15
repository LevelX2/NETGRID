# Rote KI-Evidence für Match 424A (2026-07-15)

## Zweck

Dieses Artefakt hält den Red-Nachweis vor jeder Produktionsänderung für die
freigegebenen Runner-Findings aus `match_424abdd1c7ac054d` fest. Die
Decision-Checkpoints wurden aus der lokalen SQLite-Runtime ausschließlich im
Read-only-Modus rekonstruiert. Expectations verwenden nur die damalige
Runner-PlayerView, LegalActions, öffentliche Events und erlaubte
Runtime-Metadaten.

## Capture-Kompatibilität

- D111 / StateVersion 202, D134 / StateVersion 245 und D143 / StateVersion
  265 ließen sich mit strengem historischem Warmup ohne Abweichung capturen.
- Ab D146 weicht der aktuelle Ausgangscode an genau einer früheren Stelle vom
  historischen Lauf ab: D143 installiert historisch MRAM, der aktuelle Code
  zieht stattdessen eine Karte. Das bestätigt, dass die inzwischen korrigierte
  MRAM-Semantik bereits wirkt.
- D146, D151 und D154 wurden deshalb mit explizitem Rebase auf den weiterhin
  identischen Engine-State, das öffentliche Event-Präfix und den kompatiblen
  aktuellen Runtime-Suffix gecaptured. Die einzige Warmup-Abweichung bleibt
  D143; es gibt keine Engine-, LegalAction-, Redaction- oder StateHash-Drift.
- Die MRAM-Erwartung wurde nicht künstlich rot gemacht. Sie bleibt als grüner
  historischer Kontrollpunkt und ist kein Produktions-Fix dieses Prozesses.

## Spielgleiche rote Checkpoints

Ausgeführt wurde:

```text
corepack pnpm exec vitest run packages/ai/src/evaluation/decision-checkpoints/match-424a-runner-endgame-decision-checkpoints.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
```

Ergebnis auf dem unveränderten Produktionscode: sechs rot, zwei grün.

| Finding | Historischer Zielpunkt | Aktuelle Auswahl / Diagnose | Red-Klasse |
| --- | --- | --- | --- |
| 424A-F01 | D111 / sv202 | zweites Force Shield statt Krash | `behavior_regression` |
| 424A-F02 | D134 / sv245 | Inside Job auf bekannt wertlose Archives | `behavior_regression` |
| 424A-F03 | D143 / sv265 | aktuelle Wahl vermeidet MRAM | grüne Gegenprobe, kein Fix |
| 424A-F04 | D146 / sv273 | Broker laden statt Remote mit SeeYa untersuchen | `behavior_regression` |
| 424A-F05 | D151 / sv283 | gewöhnliches Ziehen statt Pfadöffnung oder Bank-Cashout | `behavior_regression` |
| 424A-F06 | D154 / sv286 | Krash-Pfad als `blocked_missing_coverage`, Kosten 10, Rest 2 | `behavior_regression` |
| Kontrolle | synthetisch ohne Krash und ohne sichtbare Neural Blade | `blocked_missing_coverage` / `find_breaker_first` | grün |
| Kontrolle | synthetisch mit 14 Credits und installiertem Krash | weiterhin falsche Kosten 10 und `blocked_missing_coverage` | rot |

Der generische Checkpoint-Vertrag wurde dafür um `runTargets` erweitert. Er
prüft ohne Score-Festschreibung nur stabile Laufzielmerkmale wie Action,
Server, Passierbarkeit, sichtbare Pfadkosten, Credits nach dem Lauf,
Empfehlung und ausgewählte Evidence-Tokens.

## Rote Hint-Verträge

Ausgeführt wurde:

```text
corepack pnpm exec vitest run packages/ai/src/match-424a-card-hint-contract.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis: sechs rot und vier grün, jeweils gegen aktive und kompilierte Hints.

- Force Shield ist bei Rollen und Präventionseffekten korrekt, trägt aber
  fälschlich die Planrolle `recover_economy`.
- Core Command bildet nur einen beliebigen erfolgreichen Run ab, obwohl der
  Kartentext einen erfolgreichen HQ-Run verlangt.
- Broker ist fälschlich als Trash-Rekursion und Card-Flow beschrieben; die
  vorhandenen strukturierten Effekte erkennen bereits eine temporäre
  Credit-Bank.
- Inside Jobs Run- und Bypass-Effekte sind korrekt und bleiben grün.
- SeeYas Expose-Zielprofil und Forged Activation Orders sichtbarer
  Rez/Trash-Zielkontext sind korrekt und bleiben grün.

## Infrastruktur-Gate

```text
corepack pnpm --filter @netgrid/ai typecheck
```

Ergebnis: grün. Die roten Resultate sind damit fachliche Verhaltens- und
Hint-Verträge, keine TypeScript-, Fixture-, Engine- oder Runtime-Fehler.

## Fix-Regel

Die in diesem Paket versionierten Expectations bleiben unverändert. P3 und P4
dürfen ausschließlich generische Hint-, Consumer-, Plan- und
RunTargetEvaluation-Logik ändern. Match-ID, Seed, Decision-Index,
Karteninstanz oder Deck dürfen nicht als Produktionsbedingung verwendet
werden.
