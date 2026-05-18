# Mechanikpaket B 1.6.2 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.6.2 implementiert einen freigabefähigen Kern mit 5 Karten und drei Blöcken:

1. globale statische ICE-Rez-Kosten-Modifier
2. globale statische ICE-Stärke-Modifier
3. score-/rez-basierte persistente Modifierpfade

## Nicht-Scope

- Kein Upgrade-/Uninstall-/ChoiceFlow-Scope aus V1.6.3.
- Kein Hosting-/Recurring-/Unique-Scope aus V1.7.0.
- Keine zusätzliche AI-Support-Freigabe.

## Kartenvertrag V1.6.2

- `onr_v1_212_priority-requisition`
  - beim Scoren: ein installiertes unrezzed ICE kostenfrei rezzen (deterministisch)
- `onr_v1_215_security-net-optimization`
  - solange gescort: alle ICE +1 Stärke
- `onr_v1_317_data-masons`
  - solange gerezzt: Walls kosten 2 weniger zu rezzen und erhalten +1 Stärke
- `onr_v1_320_encoder-inc`
  - solange gerezzt: Code Gates kosten 2 weniger zu rezzen
- `onr_v1_341_skalderviken-sa-beta-test-site`
  - solange gerezzt: Black ICE kosten 2 weniger zu rezzen

## Engine-Vertrag

- Rez-Kosten werden legal-action-seitig und bei Ausführung über denselben `rezCostForCard`-Pfad bestimmt.
- ICE-Stärke im Encounter und in PlayerViews folgt demselben `iceStrengthFor`-Pfad.
- Modifierquellen sind nur:
  - rezzed Corp-Root-Karten
  - gescorte Corp-Agendas
- Priority Requisition nutzt deterministische Zielauswahl: höchste Rez-Kosten, danach ID-Reihenfolge.

## Datenartefakte

- `data/manifests/card-implementation-manifest-1.6.2.json`
- `data/scenarios/v162-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.6.2.json`

## Deferred-Regel

Karten außerhalb des 5er-Kernkorbs bleiben in V1.6.2 deferred, wenn Upgrades/ChoiceFlow, Hosting/Unique oder weitere spätere Mechanikfamilien erforderlich sind.
