---
activityId: act-2026-07-10-signed-ice-strength-modifier-badge
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-10
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Vorzeichenbehafteten ICE-Stärke-Modifier als Chip anzeigen

## Ziel

Öffentlich sichtbare negative ICE-Stärke-Modifier sollen ebenso wie positive Modifier direkt auf der betroffenen ICE-Karte erscheinen. Beim Encounter mit installiertem `Clown` soll das aktuell encounterte ICE deshalb einen klaren `−1 Stärke`-Chip zeigen, solange die Engine seine Stärke um 1 reduziert.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-10: `Clown` reduziert die regeltechnisch verwendete Stärke des encounterten ICE korrekt um 1, aber die Kartenansicht zeigt keinen erklärenden `−1`-Chip. Dadurch bleibt die Ursache der abweichenden Stärke optisch unsichtbar.
- `packages/shared/src/card-definitions.ts` und `packages/engine/src/card-implementations/onr-v1/runner/programs/clown.ts` definieren den öffentlichen, nur auf encountertes ICE wirkenden Stärke-Modifier.
- Der Engine-Test in `packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts` belegt bereits: Das encounterte Test-ICE hat mit installiertem `Clown` Stärke 2 statt 3.
- `apps/web/features/cards/card-view-model.ts` bildet aktuell nur positive Differenzen zwischen öffentlicher aktueller Stärke und gedruckter Katalogstärke als `strengthModifier` ab.
- `apps/web/features/cards/CardView.tsx` schneidet den Modifier zusätzlich mit `Math.max(0, ...)` auf nichtnegative Werte ab und rendert nur Werte größer als 0 über `StrengthBoostBadge`.
- Follow-up zu `docs/activities/done/act-2026-06-27-variable-ice-strength-badge-only.md`: Dort wurden Plus-/Minus- beziehungsweise Modifier-Badges als bestehende Anzeigeentscheidung festgehalten, umgesetzt und getestet wurde jedoch nur der positive Fall.

## Scope

- Die bestehende Stärke-Modifier-Anzeige so verallgemeinern, dass sie eine von null verschiedene vorzeichenbehaftete Differenz zwischen öffentlich sichtbarer aktueller ICE-Stärke und gedruckter numerischer Stärke übernehmen kann.
- Einen negativen Modifier als klaren Chip wie `−1 Stärke` auf der betroffenen ICE-Karte darstellen; positive Chips wie `+1 Stärke` bleiben erhalten.
- Den Clown-Fall als fokussierte UI-Regression abdecken: Während des Encounters zeigt das aktuell reduzierte ICE `−1 Stärke`; außerhalb des Encounters entsteht kein pauschaler Clown-Chip auf allen ICE.
- Sicherstellen, dass gestapelte Stärkeeffekte als saldierter aktueller Modifier verständlich dargestellt werden und bei einer Differenz von 0 kein Modifier-Chip erscheint.
- Benennung, Test-ID und Styling des bisherigen `StrengthBoostBadge` bei Bedarf neutral zu einem vorzeichenbehafteten Stärke-Modifier weiterentwickeln, ohne das Kartenlayout neu zu gestalten.

## Nicht im Scope

- Keine Änderung an Clowns Regeltext, CardImplementation, Engine-Stärkeberechnung oder Encounter-Timing.
- Keine permanenten `−1`-Chips auf allen ICE nur aufgrund eines installierten `Clown`; die Anzeige folgt ausschließlich der öffentlich projizierten aktuellen Stärke des jeweiligen ICE.
- Keine clientseitige Auswertung installierter Karten oder Kartentexte als Regelautorität.
- Keine Änderung an variablen `X`-ICE-Gesamtstärke-Badges oder an anderen Karten-, Counter- und Statuschips.
- Keine Änderung an LegalActions, `applyAction`, Hidden-Info, Replay oder StateHash.

## Akzeptanzkriterien

- [ ] Ein numerisches ICE mit öffentlicher aktueller Stärke 2 und gedruckter Stärke 3 erhält im Web-View-Model den Modifier `-1`.
- [ ] Die Kartenansicht rendert diesen Modifier sichtbar und barrierearm als `−1 Stärke`-Chip.
- [ ] Beim Encounter mit installiertem `Clown` ist der negative Chip auf dem aktuell encounterten ICE sichtbar, solange die Engine die reduzierte Stärke projiziert.
- [ ] Nicht encounterte ICE erhalten wegen `Clown` keinen pauschalen negativen Chip; verdeckte oder unbekannte ICE leaken keine Stärkeinformation.
- [ ] Bestehende positive Modifier-Chips bleiben unverändert funktionsfähig; bei einer saldierten Differenz von 0 erscheint kein Modifier-Chip.
- [ ] Variable ICE mit nicht numerischer Druckstärke behalten ihre bestehende Gesamtstärke-Anzeige und erhalten keinen irreführend berechneten Differenz-Chip.
- [ ] Fokussierte Webtests decken mindestens negativen, positiven, neutralen und verdeckten beziehungsweise nicht encounterten Zustand ab.
- [ ] `git diff --check` und die relevanten Webtests sind grün oder ein bereits bestehender, paketfremder Fehler ist klar benannt.

## Umsetzungshinweise

- Bevorzugt die vorhandene Differenz aus `VisibleCard.strength` und strukturiertem `detail.numeric.strength` verwenden. Weder `Clown` noch andere Effektquellen im Client gesondert erkennen.
- Wahrscheinliche Stellen:
  - `apps/web/features/cards/card-view-model.ts`
  - `apps/web/features/cards/CardView.tsx`
  - `apps/web/features/cards/CardBadges.tsx`
  - `apps/web/app/card-view-model.test.ts`
  - vorhandene CardView-/Board-Komponententests für die sichtbare Chip-Ausgabe
- Für die Anzeige ein typografisch klares Minus verwenden, intern aber weiterhin mit der numerischen Differenz arbeiten.
- Der Engine-/PlayerView-Vertrag für Clown ist bereits vorhanden. Falls die UI-Integration zeigt, dass die encounterte Karteninstanz nicht mit der projizierten `run.encounteredIce`-Stärke angereichert wird, diesen konkreten Projektions-/Mapping-Restpunkt im selben kleinen Paket nachweisen oder als separates Folgepaket ausgliedern.

## Ergebnisnotiz

Noch offen.
