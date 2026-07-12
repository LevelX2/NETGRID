# Upgrade Placement Signal Contract Final Review 2026-07-12

## Status

`ready_for_integration`

## Ergebnis

Die bestehende Upgrade-Placement-Guardrail war fachlich korrekt, erhielt im
produktiven Semantic-Runtime-Pfad aber nicht die reviewten kartenweiten
Placement-Signale. Der Hint-zu-Score-Vertrag ist jetzt geschlossen.

Agenda-Difficulty-Upgrades erhalten wieder:

- `-5200` auf HQ, R&D und Archives;
- `+850` auf einem vorbereiteten Scoring-Remote;
- `+1600` auf einem aktiven Scoreline-Remote.

Damit werden die im aktiven Match beobachteten HQ-Installationen von Networked
Center und Research Bunker verhindert, ohne die Engine-LegalActions zu
verändern oder eine Kartennamen-Sonderregel einzuführen.

## Geänderte Artefakte

- `packages/ai/src/actions/action-card-semantic-profiles.ts`
- `packages/ai/src/actions/action-card-semantic-profiles.test.ts`
- `packages/ai/src/runtime/corp-upgrade-placement-signal-contract.test.ts`
- `docs/architecture/ai/upgrade-placement-signal-contract-remediation-process-2026-07-12.md`
- `docs/reviews/ai/upgrade-placement-signal-contract-evidence-2026-07-12.md`
- `docs/reviews/ai/upgrade-placement-signal-contract-final-review-2026-07-12.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`

## Verifikation

- Fokussiert: 3 Testdateien, 120 Tests bestanden.
- Vollständige `@netgrid/ai`-Suite: 289 Testdateien, 1.905 Tests bestanden.
- `@netgrid/ai`-Typecheck bestanden.
- `git diff --check` bestanden.

Der erste breite Startversuch wurde nach fünf Sekunden vom bewusst zu kurzen
Tool-Timeout beendet und hatte keinen Testbefund. Der getrennte vollständige
Lauf endete nach 225,56 Sekunden erfolgreich.

## Sicherheits- und Architekturprüfung

- Keine Hidden-Info-Auswertung ergänzt.
- Keine Änderung an PlayerView, PublicEvents, Replay oder StateHash.
- LegalActions bleiben einzige Aktionsbasis.
- Reviewte Hint-Signale bleiben Compatibility-Evidence und werden nicht
  pauschal zu allgemeinen Action-Taktiksignalen erhoben.
- Panic Button und Simon Francisco bleiben als legitime Central-Upgrades
  explizit abgesichert.

## Nicht-Ziele und Restpunkt

Eine allgemeine Opportunity-Cost-Regel für Region-Replacements wurde nicht
eingeführt. Der beobachtete direkte Ersatz von Networked Center durch Research
Bunker wird bereits durch den wiederhergestellten Central-Mismatch verhindert.

Für einen manuellen Gegencheck muss die lokale App über
`scripts/start-netgrid.ps1` mit dem integrierten Code neu gestartet werden.
