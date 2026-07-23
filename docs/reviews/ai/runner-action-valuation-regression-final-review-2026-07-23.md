# Abschlussreview: Runner-Aktionsbewertung und Regressionsschutz

Stand: 2026-07-23

## Ergebnis

Das fehlerhafte Runner-Verhalten aus
`match_fd22cad3cc454a9e` ist als exakter, redaktionssicherer
Regressionsvertrag eingefroren. Vier historische Fehlentscheidungen bleiben
bewusst als `behavior_regression` sichtbar: die redundante zweite
`Psychic Friend`-Installation sowie drei sofortige Zugenden mit vier
Restklicks.

Fünf Positivkontrollen verhindern eine pauschale Gegenkorrektur:

- erste sinnvolle Installation von `Matador`;
- erste sinnvolle Installation von `Psychic Friend`;
- zwei reguläre Zugenden ohne Restklicks;
- sofortiges Zugende mit Restklicks für einen deterministischen
  Corp-Deckout-Sieg.

Die Diagnosemetriken unterscheiden dieselben Fälle in Selfplay- und
Behavior-Baseline-Artefakten. Im vollständigen 60-Spiele-Lauf sind 22
vorzeitige Runner-Zugenden und 16 redundante negativ bewertete persistente
Installationen sichtbar. Sichere Deckout-Zugenden werden separat gezählt und
nicht als Fehler klassifiziert.

## Architektur- und Seiteneffekte

- Produktives KI-Verhalten ist unverändert.
- Es gibt keinen neuen positiven oder negativen Wert für `end_turn`.
- Es gibt keinen neuen Ausschluss für Installationen.
- Die Rules Engine und `LegalActions` bleiben unverändert.
- Die Metriken lesen ausschließlich vorhandene redigierte
  Entscheidungssequenzen und strukturierte Evidence.
- Auswahl, Replay, StateHash und Hidden-Info-Verträge bleiben unangetastet.
- Kartenhints, Decks und Strategy-Zuordnungen wurden nicht geändert.

Damit schützt das Paket die nächste fachliche Korrektur vor dem von der
Analyse ausdrücklich unerwünschten Pendeln: Ein späterer Fix muss die roten
Fälle schließen, ohne erste Breaker-Installationen, null-Klick-Zugenden oder
den sicheren Deckout-Pfad zu beschädigen.

## Offener Befund

Der Standard-Behavior-Baseline-Lauf erreicht in genau einem reproduzierbaren
Slot das 480-Aktionen-Limit. Derselbe isolierte Seed endet erneut nach 480
Aktionen und 41 Zügen mit demselben StateHash. Er enthält keinen Treffer der
beiden neuen Fehlerklassen. Da dieses Paket keine produktive Auswahl ändert,
ist der Befund kein Integrationsfehler des Pakets, bleibt aber als
eigenständiger KI-Qualitäts-Follow-up offen.

## Führende Artefakte

- Prozess:
  `docs/architecture/ai/runner-action-valuation-regression-protection-process-2026-07-23.md`
- Detailnachweis:
  `docs/reviews/ai/runner-action-valuation-regression-evidence-2026-07-23.md`
- Checkpoints:
  `packages/ai/src/evaluation/decision-checkpoints/fixtures/cp-fd22-*.json`
- Checkpoint-Vertrag:
  `packages/ai/src/evaluation/decision-checkpoints/fd22-runner-action-valuation-regressions.test.ts`
- Metriken:
  `packages/ai/src/simulation/runner-action-valuation-baseline-metrics.ts`

## Freigabe

Das Test- und Diagnosepaket ist für die lokale Integration freigegeben. Eine
produktive Remediation bleibt ein getrennt zu planender Änderungssatz und
muss gegen die jetzt vorhandenen Negativ- und Positivverträge arbeiten.
