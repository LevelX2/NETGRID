# Match A36A9664: Corp-Plan Red Evidence

Stand: 2026-07-30

Match: `match_a36a9664458303fc`

Arbeitsbranch: `codex/a36a9664-corp-plan-fixes`

## Capture-Vertrag

Sieben historische Corp-Entscheidungen wurden aus der Standard-Runtime-SQLite
mit dem produktiven Capture-Einstieg gesichert. Alle Captures verwenden:

- den exakten historischen `GameState`;
- ausschließlich das Eventpräfix bis zur Ziel-StateVersion;
- engine-erzeugte Corp-PlayerView und LegalActions;
- den produktiven Chooser;
- den eigenen Deck-Snapshot;
- `warmupPolicy: strict`;
- vollständigen Warmup ab Decision 1;
- `warmupDriftCount: 0`.

In allen Fixtures ist `strategicIntent` vorhanden. TacticalPlan,
PlanPortfolio und RunnerRunPlan waren an den Zielankern nicht als persistenter
Runtime-Snapshot vorhanden und sind daher bewusst `false`.

## Ergebnis

Sechs Zustände reproduzieren auf unverändertem aktuellem Code exakt als
`behavior_regression`. Ein historischer Fehler ist bereits behoben und bleibt
als grüner Checkpoint erhalten.

| Checkpoint                                 | Decision/State | Erwartung                                                             | Aktuelle Auswahl                              | Status                                  |
| ------------------------------------------ | -------------- | --------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| `cp-a36a-01-turn-completion-d11`           | D11/SV20       | normalen Credit nehmen, Zug nicht mit zwei Aktionen beenden           | `corp.end_turn`                               | **rot – behavior_regression**           |
| `cp-a36a-02-unsafe-corporate-war-d24`      | D24/SV50       | Corporate War nicht hinter sichtbar beantwortbare Einzelschicht legen | Chicago Branch in neuem Remote entwickeln     | **grün – aktuell nicht reproduzierbar** |
| `cp-a36a-03-funded-second-layer-rez-d46`   | D46/SV106      | exakt bezahlbare zweite Agenda-Defense-Schicht rezzen                 | Rez ablehnen                                  | **rot – behavior_regression**           |
| `cp-a36a-04-overtime-overflow-d75`         | D75/SV174      | keine Action-Capacity-Operation ohne gebundene Aktionslücke           | Overtime Incentives spielen                   | **rot – behavior_regression**           |
| `cp-a36a-05-counter-bank-replacement-d101` | D101/SV231     | Corporate War in neuen Remote statt über die Bank installieren        | Corporate War ersetzt Vapor Ops in `remote_1` | **rot – behavior_regression**           |
| `cp-a36a-06-terminal-rd-defense-d122`      | D122/SV279     | ICE vor R&D statt Credit bei terminaler Zentralgefahr                 | Basis-Credit                                  | **rot – behavior_regression**           |
| `cp-a36a-07-counter-bank-ready-d89`        | D89/SV203      | geladene Bank für Cross-Remote-Score nutzen                           | Basis-Credit für falsche Schutzlücke          | **rot – behavior_regression**           |

## Gegenfaktische Bewertung

### D11 – verbleibende normale Aktionen

Die LegalActions enthalten `corp.gain_credit`. Die aktuelle Runtime schließt
den Credit nur wegen
`corp_basic_credit_rejected_visible_liquidity_demand_satisfied` aus und lässt
anschließend den Turn-Completion-Plan gewinnen. Der Checkpoint verlangt
deshalb eng einen Basis-Credit und verbietet `end_turn`.

### D24 – früher Agenda-Rush

Der aktuelle Chooser installiert Corporate War nicht mehr. Stattdessen
entwickelt der Hand-/Agenda-Plan Chicago Branch in einem neuen Remote als
Score-Beschleunigungssetup. Damit ist der historische Agenda-Expositionfehler
bereits auf aktuellem Code behoben. Der Checkpoint verbietet die alte
Corporate-War-Installation weiterhin, akzeptiert aber die heutige
Planentwicklung. Für D24 erfolgt kein weiterer Verhaltensfix.

### D46 – finanzierte zweite Schutzschicht wird nicht aktiviert

Die Corp besitzt beim Angriff noch genau einen Credit; der vollständige
Engine-Rez-Quote der aktuell erreichten Data Wall verlangt genau einen
Credit. Die bekannte Schutzbewertung zeigt bei unveränderter
Zugriffswahrscheinlichkeit eine zusätzliche Runner-Pfadsteuer von einem
Credit. Die Runtime lehnt das Rezzen dennoch wegen
`corp_ice_rez_resource_exchange_unknown` ab. Der Checkpoint verlangt die
konkrete `rez_ice`-Action und verbietet `decline_rez`.

### D75 – Action Capacity als Handmüllentsorgung

Der Handmanagement-Plan verwendet Overtime Incentives unter
`corp_hq_overflow_exact_conversion:1`. Eine konkrete Score- oder
Action-Capacity-Lücke existiert nicht. Der Checkpoint akzeptiert eine normale
Finanzierungs- oder Installationsaktion und verbietet nur die konkrete
Action-Capacity-Operation. Die bestehenden Action-Capacity-Routentests bleiben
grün und sichern die legitime Nutzung zum Schließen einer echten Aktionslücke.

### D89 und D101 – Counter Bank

D89 zeigt die vorgelagerte Passivität: Trotz geladener Vapor Ops und
Corporate War auf HQ berechnet die Runtime eine Schutzlücke für den falschen
Same-Remote-Pfad und nimmt einen Credit. D101 zeigt anschließend die
destruktive Ausführung: Corporate War wird in `remote_1` installiert und
ersetzt Vapor Ops.

Beide Checkpoints verlangen dieselbe positive Gegenlinie: Corporate War in
einen neuen Remote installieren, während die Bank in `remote_1` erhalten
bleibt. D89 verbietet zusätzlich den passiven Basis-Credit, D101 die konkrete
Same-Root-Installation.

### D122 – terminale R&D-Verteidigung

Bei 5:5 sind mehrere ICE-Installationen vor R&D legal. Die Runtime schließt
sie als
`corp_additional_central_ice_deferred_without_exact_route:rd` aus und wählt
Economy. Der Checkpoint akzeptiert jede konkrete `install_card`-Action mit
Ziel `rd` und verbietet den Basis-Credit.

## Grüne Nachbar- und Gegenproben

Vor dem Verhaltensfix liefen folgende angrenzenden Tests unverändert grün:

- `corp-counter-bank-score-plan.test.ts`
- `action-capacity-route.test.ts`
- `corp-central-defense-facts-adapter.test.ts`
- `corp-central-defense-allocation.test.ts`
- `plan-first-live-runtime-central-defense-allocation-contract.test.ts`
- `latest-two-corp-match-remediation-decision-checkpoints.test.ts`

Ergebnis: 6 Testdateien, 68 Tests, alle grün.

Das grüne Ergebnis des bestehenden Counter-Bank-Tests ist selbst Teil der
diagnostizierten Blindstelle: Er erwartet noch die Same-Remote-Installation
und muss im Umsetzungspaket durch Cross-Remote- und Replacement-Gegenproben
ersetzt werden.

## Roter Testlauf

```text
packages/ai/src/evaluation/decision-checkpoints/
  match-a36a9664-corp-plan-decision-checkpoints.test.ts

7 Tests:
- 6 x behavior_regression
- 1 x grün / aktuell nicht reproduzierbar
```

Es traten keine `engine_legality_drift`, `runtime_state_drift`,
`fixture_migration_required`, Redaction- oder Fixture-Fehler auf.

## Scope-Folge

Die Umsetzungspakete bearbeiten nur die sechs roten Zustände. D24 bleibt als
grüne Regression erhalten. Die korrigierten StateVersion-Anker wurden
gleichzeitig in den vollständigen Entscheidungs-Audit zurückgeführt; an den
fachlichen Einzelbewertungen ändert diese Dokumentationskorrektur nichts.
