---
jobId: spotcheck-2026-05-16-runner-breaker-prevention-resolvers
status: done
createdAt: 2026-05-16T12:30:00+02:00
startedAt: 2026-05-16T17:05:15+02:00
completedAt: 2026-05-16T17:19:30+02:00
requiresImplementation: true
priority: high
sourceBlockedJobs:
  - spotcheck-2026-05-15-virus-link-archives
cards:
  - cardId: onr_v1_047_pile-driver
    title: Pile Driver
  - cardId: onr_v1_127_full-body-conversion
    title: Full Body Conversion
---

# Originalset-Spotcheck Follow-up Job spotcheck-2026-05-16-runner-breaker-prevention-resolvers

## Herkunft

Dieser Folgejob ersetzt nicht den blockierten Nachweis `blocked/spotcheck-2026-05-15-virus-link-archives.md`, sondern zieht dessen offene Removal Condition als kleineres Umsetzungsbündel zurück in die Inbox.

Der alte Sammeljob bleibt `blocked`, weil sichere Teilfixes bereits umgesetzt wurden, aber diese zwei Karten eigene Resolververträge benötigen.

## Aktueller Befund

### onr_v1_047_pile-driver - Pile Driver

Status: umgesetzt.

Aktueller Runtime-Stand: installierbares Stealth-/Fracter-Programm mit Pump-/Break-Grundfläche und Recurring-Credit-Oberfläche. Der bestätigte lokale Kartentext verlangt zusätzlich einen eigenen Break-Vertrag: `3: Break up to four wall subroutines on a single piece of ice` und beim Nutzen dieser Break-Walls-Fähigkeit exakt 3 Verlust von Stealth-Karten.

Umsetzung:

- Multi-Subroutine-Break-LegalAction für bis zu vier Wall-Subroutinen auf einem einzelnen encountered ICE modelliert.
- Stealth-Verlust von exakt 3 als Resolververtrag abgebildet; verfügbare Stealth-Quellen, Kosten und Sourcebindung werden in `applyAction` erneut validiert.
- Falsches ICE, falscher Encounter, erledigte/manipulierte Subroutine-Indizes, wrong-side und stale `stateVersion` werden abgelehnt.
- PublicPayload bleibt auf Quelle, Break-Anzahl und Stealth-Delta beschränkt.

Akzeptanz:

- Pile Driver bricht nur Wall-Subroutinen und höchstens vier Subroutinen derselben ICE.
- Stealth-Verlust ist exakt 3 und replay-/StateHash-stabil.
- Manipulierte Ziele oder unzureichende Stealth-Ressourcen mutieren den State nicht.

### onr_v1_127_full-body-conversion - Full Body Conversion

Status: umgesetzt.

Aktueller Runtime-Stand: generisches Damage-Prevention-Profil mit `maxPerTurn: 1` für Meat Damage. Der lokale Vertrag verlangt vollständige Meat-Damage-Prevention mit Korp-Zahlungs-/Bypass-Modell.

Umsetzung:

- Führender lokaler Vertrag finalisiert und Runtime, Shared-Text und Katalog synchronisiert.
- Event-Modification-/Prevention-Fenster verhindert Meat Damage vollständig, sofern die Korp keine Bypass-Credits zahlt.
- Korp-Bypass-Zahlung wird als Korp-Choice modelliert und gegen Credits, Seite, Timing, Quelle, Schadensereignis und StateVersion revalidiert.
- Damage-/Flatline-Payloads bleiben auf Beträge, Schadensart, Quelle und Ergebnis beschränkt; keine Gripkarten werden geleakt.

Akzeptanz:

- Full Body Conversion verhindert Meat Damage nach finalem Vertrag vollständig oder bewusst begrenzt, aber nicht widersprüchlich.
- Korp-Bypass ist kosten- und timingvalidiert.
- PublicEvents, PlayerViews, KI-Inputs und Replay-Payloads enthalten keine privaten Grip-/Heap-Details.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

## Abschluss

Umgesetzt in `packages/engine/src/index.ts`, `packages/engine/src/mechanics/damage-prevention.ts`, `packages/shared/src/index.ts`, `packages/catalog/src/catalog-gates.ts` und `packages/engine/src/index.test.ts`.

Checks:

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` - grün, 470 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 2 Dateien / 48 Tests.
- `corepack pnpm typecheck` - grün.
