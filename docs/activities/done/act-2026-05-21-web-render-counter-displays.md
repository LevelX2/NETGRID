---
activityId: act-2026-05-21-web-render-counter-displays
status: done
kind: fix
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-counter-display-stored-credits-and-agenda-pools
  - act-2026-05-21-counter-display-special-and-recurring-counters
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/score-area-ui.ts
  - apps/web/app/score-area-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/score-area-ui.test.ts
  - corepack pnpm --filter @netgrid/web test
  - git diff --check
---

# Web rendert CounterDisplays statt roher Counter

## Ziel

Der Webclient soll Board-Counter-Badges aus `VisibleCard.counterDisplays` rendern und nicht mehr aus rohen `counters`, Karten-ID-Listen oder Countertyp-Vermutungen ableiten.

## Kontext und Quellen

- Aktuelle Hardcodings:
  - `STORED_CREDIT_COUNTER_SOURCES` und `armoredFridgeAblativeCounterBadge` in `apps/web/app/action-board-ui.ts`.
  - `storedCreditAmount`, `recurringCreditAmount`, `shellCounterAmount`, `dataRavenCounterAmount`, `counterAmount` und einzelne Badge-Komponenten in `apps/web/app/page.tsx`.
  - `scoredAgendaCreditCounterSource` in `apps/web/app/score-area-ui.ts`.
- Vorarbeiten:
  - `act-2026-05-21-counter-display-stored-credits-and-agenda-pools`
  - `act-2026-05-21-counter-display-special-and-recurring-counters`

## Scope

- Einen generischen CounterDisplay-Renderer in der Kartenanzeige einführen.
- Bestehende visuelle Muster wiederverwenden:
  - Credit-Token-Pattern für Stored/Recurring/Scored-Credit-Displays.
  - kompakte Textbadges für Spezialcounter.
  - Advancement-Gems nur dann umstellen, wenn das Foundation-Paket die Daten vollständig liefert.
- Alte kartenhartcodierte Helfer nur temporär als Fallback behalten und testbar markieren.
- Aria-Labels aus `counterDisplays` verwenden.
- Web-Tests für Broker, BBS/Braindance, Recurring Credit, Shell, Data Raven und Ablative ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine Änderung an Countertypen.
- Kein Entfernen der alten Helfer in diesem Paket, solange Drift-Tests noch nicht stehen.
- Keine Neugestaltung des gesamten Card-Layouts.

## Akzeptanzkriterien

- [x] Karten-Badges werden primär aus `counterDisplays` gerendert.
- [x] Broker-gespeicherte Credits hängen nicht mehr an einer Web-seitigen Karten-ID-zu-Countertyp-Tabelle.
- [x] Data Raven, Ablative, Shell und Recurring zeigen aus CounterDisplays korrekt an.
- [x] Fallback auf rohe `counters` ist sichtbar begrenzt und in Tests adressiert.
- [x] UI-Texte/Aria-Labels bleiben deutsch und enthalten keine Hidden-Info-Leaks.
- [x] Checks: passende Web-Tests und Typecheck.

## Umsetzungshinweise

- Die UI darf `usageHint` nur anzeigen, nicht interpretieren.
- Wenn CounterDisplays fehlen, soll das nicht durch neue Karten-ID-Sonderlisten kaschiert werden; stattdessen Folgepaket oder Testausnahme anlegen.

## Ergebnisnotiz

Erledigt. `CardView` rendert Counter-Badges primär aus `VisibleCard.counterDisplays`, nutzt die vom Engine-View gelieferten Aria-Labels und filtert Advancement-Displays aus, weil Advancement-Gems weiterhin separat gerendert werden. Stored/Recurring-Displays verwenden das bestehende Credit-Token-Muster; Shell, Data Raven, Ablative und weitere Spezialcounter laufen über kompakte Textbadges. Der Score-Area-Coup-Hardcode wurde entfernt; begrenzte Legacy-Fallbacks für alte rohe `counters` bleiben nur in `action-board-ui.ts` und sind durch Tests markiert.
