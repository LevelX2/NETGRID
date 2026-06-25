---
activityId: act-2026-06-24-vacuum-link-chronicle-rewind-transparency
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-24
startedAt: 2026-06-24
completedAt: 2026-06-24
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/public-context.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/action-cues.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/action-cues.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts action-cues.test.ts
  - corepack pnpm --filter @netgrid/engine test -- hidden-access-run-regressions.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Vacuum Link: Würfelwurf und Run-Zurücksetzen in der Spielchronik transparent machen

## Ziel

Die Spielchronik soll bei `Vacuum Link` sichtbar und eindeutig zeigen, welcher Würfelwurf gefallen ist und welche Run-Folge daraus entstanden ist: kein Zurücksetzen bei 4 bis 6 oder Zurücksetzen um 1 bis 3 gerezzte ICE beziehungsweise zum ersten ICE, inklusive Hinweis auf das Ausstöpsel-Fenster.

## Kontext und Quellen

- Nutzerfund vom 2026-06-24: Beim Auslösen von `Vacuum Link` steht in der Chronik nur sinngemäß, dass ungebrochene Subroutinen ausgelöst wurden. Der konkrete Wurf und die resultierende Bewegung im Run bleiben intransparent.
- Karte: `onr_v1_275_vacuum-link`, Implementierung unter `packages/engine/src/card-implementations/onr-v1/corp/ice/vacuum-link.ts`.
- Relevante Engine-Mechanik: `rewind_run_to_rezzed_ice_by_die` schreibt aktuell generische Payloadfelder wie `rezzedIceRewindDieRoll`, `rezzedIceRewindApplied`, `rezzedIceRewindRezzedIceBack` und `rezzedIceRewindTargetIceIndex`.
- Relevanter Web-Stand: `apps/web/app/chronicle.ts` besitzt bereits eine Vacuum-Link-spezifische Anzeige, erwartet aber `vacuumLinkDieRoll`, `vacuumLinkRewindApplied`, `vacuumLinkRewindRezzedIceBack` und `vacuumLinkTargetIceIndex`.
- Verwandtes erledigtes Paket: `docs/activities/done/act-2026-05-22-chronicle-ice-subroutine-resolution-lines.md` hat generische Subroutinenzeilen verbessert, deckt diesen spezifischen Zufalls-/Run-Rewind-Fall aber nicht ab.

## Scope

- Die bestehende Vacuum-Link-Chronikdarstellung an die realen PublicEvent-/LegalAction-Payloadfelder aus der Engine anbinden oder die Payload-Brücke sauber vereinheitlichen.
- Sichtbare Chronikzeile und Action-Cue für beide Seiten sicherstellen:
  - Wurf 1, 2 oder 3: Wurfzahl, Anzahl gerezzter ICE zurück, Ziel-ICE beziehungsweise Fallback zum ersten ICE und Ausstöpsel-Möglichkeit.
  - Wurf 4, 5 oder 6: Wurfzahl und klarer Hinweis, dass der Run weiterläuft und kein Zurücksetzen passiert.
- Bestehende Tests so ergänzen oder anpassen, dass mindestens ein echter `rezzedIceRewind*`-Payloadfall die Web-Chronik erreicht.
- Prüfen, ob `public-context.ts` die relevanten Felder side-sicher durchreicht oder bewusst normalisiert.

## Nicht im Scope

- Keine Änderung an der Regelauflösung von `Vacuum Link`.
- Keine Änderung an Zufall, Seed, `RandomDrawRecords`, Replay oder StateHash.
- Keine neue Entscheidung zur Frage, wann der Runner tatsächlich ausstöpselt.
- Kein Redesign der gesamten Spielchronik.
- Keine Hidden-Info-Ausweitung; nur öffentlich ableitbare Run-/ICE-Positionsinformationen anzeigen.

## Akzeptanzkriterien

- [x] Ein realer `Vacuum Link`-Subroutinen-Resolve mit Wurf 1 bis 3 erzeugt in der Spielchronik eine konkrete Zeile mit Wurfzahl und Zurücksetz-Ergebnis.
- [x] Ein realer `Vacuum Link`-Subroutinen-Resolve mit Wurf 4 bis 6 erzeugt in der Spielchronik eine konkrete Zeile mit Wurfzahl und „kein Zurücksetzen“ beziehungsweise „Run läuft weiter“.
- [x] Die generische Meldung „ungebrochene Subroutinen ausgelöst“ bleibt nicht die einzige sichtbare Erklärung für den Vacuum-Link-Fall.
- [x] Runner- und Korp-Ansicht erhalten denselben öffentlichen Würfel-/Run-Ausgang ohne verdeckte Kartendaten.
- [x] Regressionstests decken die Payload-Brücke zwischen Engine-Event und Web-Chronik ab; reine synthetische `vacuumLink*`-Formattertests reichen allein nicht.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/game/run/encounter-special-windows.ts`
  - `packages/engine/src/public-context.ts`
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/action-cues.ts`
- Zuerst entscheiden, ob die generischen `rezzedIceRewind*`-Felder im Web direkt verstanden werden oder ob `public-context.ts` sie bei `Vacuum Link` auf die bestehenden `vacuumLink*`-Felder normalisiert.
- Bestehende Tests in `apps/web/app/chronicle.test.ts` und `apps/web/app/action-cues.test.ts` nicht nur mit synthetischen `vacuumLink*`-Payloads absichern, sondern um den aktuell aus der Engine kommenden Feldnamenpfad erweitern.
- Falls die Ziel-ICE-Position aus Hidden-Info-Gründen nicht vollständig angezeigt werden darf, mindestens die öffentliche Folge formulieren: Wurf, Zurücksetzen angewendet/nicht angewendet, Anzahl gerezzter ICE zurück oder Fallback zum ersten ICE.

## Ergebnisnotiz

Erledigt. `public-context.ts` reicht die generischen `rezzedIceRewind*`-Payloadfelder jetzt public-safe durch. Die Web-Chronik und Action-Cues verstehen diese Felder zusätzlich zu den bestehenden `vacuumLink*`-Namen und zeigen Wurf, Zurücksetzen beziehungsweise Weiterlaufen, Ziel-ICE und Ausstöpselhinweis sichtbar an. Die fokussierten Tests wurden auf den realen Engine-Feldnamenpfad umgestellt; Web- und Engine-Checks sind grün.
