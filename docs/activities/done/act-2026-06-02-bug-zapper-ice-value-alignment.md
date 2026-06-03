---
activityId: act-2026-06-02-bug-zapper-ice-value-alignment
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index-tests/proteus/variable-ice.test.ts
checks:
  - "PASS: pnpm exec vitest run packages/engine/src/index-tests/proteus/variable-ice.test.ts -t \"relative ICE|Relative Board-Count ICE|Bug Zapper|Hunting Pack|Mastermind|Dog Pile\""
  - "PASS: pnpm exec vitest run packages/engine/src/index-tests/proteus/variable-ice.test.ts"
  - "PASS: pnpm --filter @netgrid/shared typecheck"
  - "PASS: pnpm --filter @netgrid/shared test"
  - "PASS: git diff --check"
  - "WARN: pnpm --filter @netgrid/engine typecheck scheitert weiterhin an bestehendem, unberührtem TS2739 in packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts:131"
---

# Bug Zapper und ICE-Basiswerte gegen Katalog ausrichten

## Ziel

`Bug Zapper` soll mit den korrekten ICE-Basiswerten verwendet werden: Rez-Kosten 6, Stärke 2 und passender Subtyp `Hellbolt`. Der irreführende `+1 Stärke`-Badge darf ohne echte Effektquelle nicht mehr erscheinen. Zusätzlich soll geprüft werden, ob andere aktive ICE-Karten vergleichbare unbegründete Abweichungen zwischen Katalog/Spoiler und Runtime/Shared-Definition haben; klare Fehler sollen im selben Paket korrigiert werden.

## Kontext und Quellen

- Nutzerfund vom 2026-06-02: Beim Ausspielen beziehungsweise Anzeigen von `Bug Zapper` erscheint sofort ein `+1 Stärke`-Chip, obwohl keine Karte oder Fähigkeit einen Stärkeeffekt vergibt.
- Analyse vom 2026-06-02:
  - `docs/source/Proteusspoiler.txt` nennt `Bug Zapper` als `Ice-Sentry-AP-Hellbolt` mit `Cost/Strength: 6/2`.
  - `data/cards/proteus-cards.json` führt `onr_proteus_012_bug-zapper` mit `rezCost: 6`, `strength: 2` und Subtypen `ap`, `hellbolt`, `sentry`.
  - `packages/shared/src/index.ts` führt dieselbe Karte aktuell mit `rezCost: 5`, `strength: 3` und ohne `hellbolt`.
  - Die Web-UI setzt `strengthModifier`, wenn die sichtbare Runtime-Stärke größer ist als die Katalogstärke; dadurch entsteht aus `3 - 2` der sichtbare `+1 Stärke`-Badge.
- CardImplementation-Befund:
  - `packages/engine/src/card-implementations/proteus/corp/ice/bug-zapper.ts` enthält keinen `strengthBonusPerCount`.
  - `Dog Pile` und `Mastermind` haben dagegen bewusst `strengthBonusPerCount: 1`; dieser Unterschied muss erhalten bleiben.
- Auffällige Nebenbefunde:
  - AI024-Review-/Hint-Artefakte klassifizieren `Bug Zapper` teils mit `ice.strength_modifier`, obwohl der Kartentext keinen Stärkeeffekt hat. Prüfen, ob diese Metadaten regeneriert oder korrigiert werden müssen.

## Scope

- `Bug Zapper`-Basisdaten in der aktiven Runtime-/Shared-Definition korrigieren:
  - `rezCost: 6`
  - `strength: 2`
  - Subtyp `hellbolt` ergänzen, falls der lokale Subtyp-Standard das zulässt.
- Sicherstellen, dass `Bug Zapper` ohne externe Stärkequelle keinen `+1 Stärke`-Badge mehr bekommt.
- Sicherstellen, dass die dynamische Damage-Subroutine unverändert korrekt bleibt: 2 Net Damage pro gerezztem ICE außerhalb von Bug Zapper.
- Einen fokussierten Paritätscheck für aktive/compiled ICE-Karten durchführen:
  - `packages/shared/src/index.ts` beziehungsweise aktive Runtime-Definitionen gegen `data/cards/*-cards.json` und bei Bedarf lokale Spoilerquelle vergleichen.
  - Mindestens `rezCost`, `strength`, ICE-Subtypen und sichtbaren Kartentext so prüfen, dass falsche Stärke-/Kosten-Badges auffallen.
- Klar unbegründete ICE-Basiswert-Abweichungen im selben Paket korrigieren, wenn sie klein und eindeutig sind.
- Für unklare oder regelrelevante Abweichungen kein stilles Umdeuten vornehmen; stattdessen Ergebnis dokumentieren und kleine Folge-Activities anlegen.
- Regressionen ergänzen oder aktualisieren:
  - Bug Zapper hat in PlayerView/Run-Encounter Stärke 2 ohne Badge.
  - Bug Zapper kostet beim Rezzen 6 Credits.
  - Dog Pile/Mastermind behalten ihre echten relativen Stärke-Boni.
  - Paritätscheck oder Test schützt mindestens gegen erneute Bug-Zapper-Basiswertdrift.

## Nicht im Scope

- Keine generische Neugestaltung der Kartenimport-Pipeline.
- Keine Änderung an allgemeinen ICE-Stärke-Modifikatoren, Agenda-Modifikatoren oder City-Grid-/Asset-Effekten außer zur Regression.
- Keine Änderung an der Bug-Zapper-Damage-Regel, an Run-/Encounter-Timing oder an LegalAction-/`applyAction`-Verträgen außer der korrekten Rez-Kosten-Revalidation.
- Keine pauschale Korrektur aller Kartenfamilien außerhalb aktiver ICE-Basiswerte.
- Keine Hidden-Info-Offenlegung durch Paritätschecks, PlayerViews, PublicEvents, Reconnect, Replay oder KI-Inputs.

## Akzeptanzkriterien

- [x] `Bug Zapper` hat in der aktiven Runtime/Shared-Definition Rez-Kosten 6 und Stärke 2.
- [x] `Bug Zapper` zeigt ohne echte externe Stärkequelle keinen `+1 Stärke`-Badge.
- [x] `Bug Zapper` behält die korrekte dynamische Damage-Subroutine mit 2 Net Damage pro gerezztem ICE außerhalb von Bug Zapper.
- [x] `Dog Pile` und `Mastermind` behalten ihre regelkonformen relativen Stärke-Boni; `Bug Zapper` erhält keinen solchen Bonus.
- [x] Ein ICE-Paritätscheck für aktive/compiled ICE-Karten wurde durchgeführt und im Ergebnis benannt.
- [x] Alle dabei gefundenen klar unbegründeten kleinen ICE-Basiswert-Abweichungen sind korrigiert.
- [x] Unklare oder größere Abweichungen sind nicht still korrigiert, sondern als Folgepunkte oder Folge-Activities dokumentiert.
- [x] Falls AI-Hints/AI024-Artefakte `Bug Zapper` fälschlich als Stärke-Modifikator führen und diese Daten aktuell verbraucht werden, sind sie korrigiert oder die Nicht-Korrektur ist begründet.
- [x] Fokussierte Engine-/Web-/Katalog-Checks sind ausgeführt oder begründet ausgelassen.
- [x] `git diff --check` ist grün.

## Umsetzungshinweise

- Naheliegende betroffene Dateien:
  - `packages/shared/src/index.ts`
  - `data/cards/proteus-cards.json`
  - `packages/engine/src/card-implementations/proteus/corp/ice/bug-zapper.ts`
  - `packages/engine/src/index-tests/proteus/variable-ice.test.ts`
  - `apps/web/app/page.tsx` oder passende Webtests für `strengthModifier`-Anzeige, falls bestehende Tests keine ausreichende Abdeckung haben.
- Für den Paritätscheck vorzugsweise eine kleine scriptbare Prüfung verwenden, statt Werte manuell aus einzelnen Dateien zu lesen.
- Bei Subtypen auf bestehende Normalisierung achten (`hellbolt`, `sentry`, `ap`) und keine UI-/AI-Subtyp-Signale aus bloßen Typdaten ableiten.
- Die Ursache des beobachteten Badges liegt wahrscheinlich nicht in der CardImplementation, sondern in der Drift zwischen Katalogstärke 2 und Runtime-Stärke 3.

## Ergebnisnotiz

Umgesetzt am 2026-06-03.

- `Bug Zapper` ist in der aktiven Shared-Definition auf Rez-Kosten 6, Stärke 2 und Subtyp `hellbolt` korrigiert. Im fokussierten Encounter-Test bleibt `strengthModifier` ohne externe Quelle leer beziehungsweise 0; der irreführende `+1 Stärke`-Badge entsteht damit nicht mehr aus der Katalogdrift.
- Die dynamische Damage-Regel bleibt unverändert über die bestehende CardImplementation abgedeckt: 2 Net Damage pro gerezztem ICE außerhalb von `Bug Zapper`.
- Der Proteus-Regressionstest schützt zusätzlich die Basiswerte von `Bug Zapper`, `Dog Pile`, `Hunting Pack` und `Mastermind`; `Dog Pile` und `Mastermind` behalten ihre echten relativen Stärke-Boni.
- Ein scriptbarer ICE-Paritätscheck gegen `data/cards/*-cards.json` wurde ausgeführt. Klare kleine Proteus-Drifts wurden im selben Paket korrigiert: `Dog Pile` Rez-Kosten 5, `Hunting Pack` Rez-Kosten 1 plus Subtyp `bloodhound`, `Mastermind` Rez-Kosten 7 plus Subtypen `black_ice` und `zombie`.
- Unverändert geblieben sind `Digiconda` und `Homing Missile`, weil die verbleibende Differenz `strength: 0` in der aktiven Runtime gegen `null` im Katalog X-Stärke-Placeholder betrifft und nicht als stiller Basiswertfehler korrigiert wurde.
- AI-Hint-/AI024-Artefakte führen `Bug Zapper` weiterhin mit dem Signal `ice.strength_modifier`. Diese generierten/AI-semantischen Daten wurden in diesem Runtime-/Badge-Paket bewusst nicht geändert, weil bereits ein separates AI-Semantik-Review-Paket offen ist und aktuell ein unversionierter AI023-Report im Workspace liegt.
- Ein separater Web-Check wurde nicht ausgeführt, weil die Badge-Ursache direkt im PlayerView-Wert `strengthModifier` abgesichert ist und kein Web-Code geändert wurde.
