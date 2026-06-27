---
activityId: act-2026-06-27-variable-ice-strength-badge-only
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-27
startedAt: 2026-06-27
completedAt: 2026-06-27
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/features/cards/card-view-model.ts
  - apps/web/features/cards/CardView.tsx
  - apps/web/app/card-view-model.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/card-view-model.test.ts
  - git diff --check
  - corepack pnpm --filter @netgrid/web typecheck (scheitert an bestehenden strategy-profile-Typfehlern außerhalb dieses Pakets)
---

# ICE-Stärke-Badge nur für variable X-Stärke anzeigen

## Ziel

Der zusätzliche Gesamtstärke-Badge auf installierten ICE soll nur dort erscheinen, wo die gedruckte ICE-Stärke nicht als feste Zahl auf der Karte steht, insbesondere bei variabler `X`-Stärke. Normale ICE mit gedruckter numerischer Stärke sollen ihre gedruckte Zahl unten links frei behalten; bestehende `+1`-/`+2`-Stärke-Badges bleiben die Anzeige für Stärke-Modifikatoren.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-27: Durch ein ICE mit variabler Stärke wurde offenbar ein Badge eingeführt, der jetzt auf jedem ICE unten links die gedruckte Stärke überdeckt.
- Gewünschte Anzeigeentscheidung: Der Gesamtstärke-Badge ist bei `X` beziehungsweise praktisch fehlender fester Stärke sinnvoll. Bei normalem ICE reicht die gedruckte Stärke plus vorhandener Plus-/Minus- beziehungsweise Modifier-Badge.
- Verwandte erledigte Pakete:
  - `docs/activities/done/act-2026-05-17-proteus-variable-ice-contracts.md`
  - `docs/activities/done/act-2026-05-17-proteus-variable-ice-harness-slice.md`
- Wahrscheinliche Web-Stellen:
  - `apps/web/features/cards/CardView.tsx` rendert aktuell `IceStrengthBadge`, sobald bekanntes ICE eine numerische `card.strength` hat.
  - `apps/web/features/cards/CardBadges.tsx` enthält `IceStrengthBadge` und `StrengthBoostBadge`.
  - `apps/web/features/cards/card-view-model.ts` reichert sichtbare Karten mit Katalog-/Detailwerten und `strengthModifier` an.

## Scope

- Render-Bedingung für den zusätzlichen `IceStrengthBadge` so einschränken, dass er nur bei ICE mit variabler oder nicht fest numerisch gedruckter Stärke angezeigt wird.
- Sicherstellen, dass normale ICE mit gedruckter numerischer Stärke keinen zusätzlichen Gesamtstärke-Badge unten links erhalten.
- Sicherstellen, dass vorhandene Stärke-Modifikator-Badges wie `+1 Stärke` oder `+2 Stärke` weiterhin sichtbar bleiben, wenn eine feste gedruckte Stärke modifiziert wird.
- Für mindestens einen repräsentativen numerischen ICE- und einen variablen `X`-ICE-Fall einen fokussierten Web-/Komponententest oder eine gleichwertige UI-Regression ergänzen.

## Nicht im Scope

- Keine Änderung an Engine-Stärkeberechnung, `strengthModifier`, LegalActions, Replay, StateHash oder PlayerView-Daten.
- Keine Neugestaltung des gesamten Kartenlayouts oder der Badge-Sprache.
- Keine Entfernung der vorhandenen Plus-/Minus- beziehungsweise Modifier-Badges.
- Keine pauschale Textanalyse des Kartentexts als Regelautorität, wenn ein strukturierter Katalog-/Detailwert vorhanden ist.

## Akzeptanzkriterien

- [x] Ein bekanntes, geresstes ICE mit gedruckter numerischer Stärke zeigt keinen zusätzlichen `IceStrengthBadge`, auch wenn seine aktuelle Stärke im View als Zahl vorhanden ist.
- [x] Ein ICE mit gedrucktem `X` beziehungsweise ohne feste numerische Druckstärke zeigt den berechneten aktuellen Stärke-Badge weiterhin, sobald der Wert öffentlich bekannt ist.
- [x] Stärke-Modifikatoren auf numerischen ICE werden weiterhin über die bestehenden Modifier-Badges angezeigt, ohne die gedruckte Stärke zu überdecken.
- [x] Verdeckte oder unbekannte ICE erhalten dadurch keine zusätzlichen sichtbaren Informationen.
- [x] Fokussierte Web-Checks decken mindestens den numerischen Standardfall und den variablen `X`-Fall ab.

## Umsetzungshinweise

- Vor der Änderung prüfen, welche strukturierte Information im Webclient verfügbar ist, um gedruckte numerische Stärke von variabler `X`-Stärke zu unterscheiden. Bevorzugt den bestehenden Katalog-/Detailwert nutzen, nicht den sichtbaren Kartentext parsen.
- Wenn `CardView` den gedruckten Katalogwert nicht mehr kennt, lieber im `card-view-model.ts` ein explizites Anzeige-Flag oder eine kleine abgeleitete View-Eigenschaft vorbereiten, statt im Renderpfad implizit aus `card.strength` zu raten.
- UI-seitig sollte der Fix eng bleiben: Badge-Bedingung und Regressionstest, keine Layout-Grundsatzänderung.

## Ergebnisnotiz

Umgesetzt am 2026-06-27. `card-view-model.ts` übernimmt aus den strukturierten Katalogdaten die gedruckte Stärke als `printedStrength`; numerische Druckstärken bleiben Zahlen, variable beziehungsweise nicht numerische Druckstärken bleiben `null`. `CardView.tsx` rendert den zusätzlichen `IceStrengthBadge` nur noch, wenn ein bekanntes ICE eine aktuelle öffentliche Stärke hat und die gedruckte Katalogstärke nicht numerisch ist. Numerisch gedruckte ICE behalten ihre gedruckte Stärke frei; positive Abweichungen bleiben über den bestehenden `StrengthBoostBadge` sichtbar.

Der fokussierte Web-Test `apps/web/app/card-view-model.test.ts` deckt numerische ICE mit Stärke-Modifier, variable `X`-ICE und verdeckte ICE ab. `corepack pnpm --filter @netgrid/web exec vitest run app/card-view-model.test.ts` ist grün. `git diff --check` ist grün. `corepack pnpm --filter @netgrid/web typecheck` scheitert weiterhin an bereits vorhandenen `strategy-profile`-Typfehlern außerhalb dieses Pakets; im neuen Testlauf wurden keine paketbezogenen Typecheck-Fehler sichtbar.
