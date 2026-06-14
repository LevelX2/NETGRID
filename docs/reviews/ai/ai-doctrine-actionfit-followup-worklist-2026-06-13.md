# Doctrine Goal ActionFit Follow-up Worklist

Status: `report_only_worklist`

Datum: 2026-06-13

Bezug: AI-MAT5-13

## Ziel

Doctrine Goals dürfen nicht nur aggregiert als Fit-Lücke erscheinen. Wenn ein Doctrine Goal keinen passenden ActionFit findet, erzeugt `buildDoctrineGoalActionFitReport()` jetzt einen Worklist-Kandidaten.

## Kandidatentypen

- `missing_action_candidate`: Für das Doctrine Goal gibt es keinen relevanten oder geblockten Action-Kandidaten.
- `blocked_action_fit`: Es gibt Action-Kandidaten, aber alle relevanten Fits sind durch Hard Gates geblockt.

## Verbindliche Grenzen

- Die Kandidaten sind `report_only`.
- `productiveUseAllowed` bleibt `false`.
- Es werden keine LegalActions, Choices, Targets oder Runtime-Overrides erzeugt.
- Evidence bleibt side-safe und darf keine Hidden-Info-Marker enthalten.

## Triage-Nutzung

Ein Kandidat benennt `scenarioId`, `goalId`, `family`, `reason`, benötigte Action-Signale und vorhandene Blocker. Daraus können kleine Folgepakete entstehen, zum Beispiel:

- fehlende Action-Semantik für eine Doctrine-Familie ergänzen,
- Hard-Gate-Blocker fachlich prüfen,
- Deck-Doctrine-Ziel feiner zuschneiden,
- Korpusfall als dauerhafte Regression übernehmen.
