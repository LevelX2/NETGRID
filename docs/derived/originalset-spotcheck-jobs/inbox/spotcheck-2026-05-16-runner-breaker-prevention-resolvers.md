---
jobId: spotcheck-2026-05-16-runner-breaker-prevention-resolvers
status: inbox
createdAt: 2026-05-16T12:30:00+02:00
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

Status: offen.

Aktueller Runtime-Stand: installierbares Stealth-/Fracter-Programm mit Pump-/Break-Grundfläche und Recurring-Credit-Oberfläche. Der bestätigte lokale Kartentext verlangt zusätzlich einen eigenen Break-Vertrag: `3: Break up to four wall subroutines on a single piece of ice` und beim Nutzen dieser Break-Walls-Fähigkeit exakt 3 Verlust von Stealth-Karten.

Umsetzung:

- Multi-Subroutine-Break-LegalAction für bis zu vier Wall-Subroutinen auf einem einzelnen encountered ICE modellieren.
- Stealth-Verlust von exakt 3 als Kosten-/Choice-Vertrag abbilden; verfügbare Stealth-Quellen, Kostenverteilung und Sourcebindung in `applyAction` erneut validieren.
- Nicht-Wall, falsches ICE, falscher Encounter, manipulierte Subroutine-Indizes, wrong-side und stale `stateVersion` ablehnen.
- PublicPayload auf Break-Anzahl, Quelle und Stealth-Delta beschränken.

Akzeptanz:

- Pile Driver bricht nur Wall-Subroutinen und höchstens vier Subroutinen derselben ICE.
- Stealth-Verlust ist exakt 3 und replay-/StateHash-stabil.
- Manipulierte Ziele oder unzureichende Stealth-Ressourcen mutieren den State nicht.

### onr_v1_127_full-body-conversion - Full Body Conversion

Status: offen.

Aktueller Runtime-Stand: generisches Damage-Prevention-Profil mit `maxPerTurn: 1` für Meat Damage. Der lokale Vertrag verlangt vollständige Meat-Damage-Prevention mit Korp-Zahlungs-/Bypass-Modell.

Umsetzung:

- Führenden Vertrag finalisieren und Runtime, Shared-Text, Katalog und AI-Hint synchronisieren.
- Falls der lokale Vertrag gilt: Event-Modification-/Prevention-Fenster für vollständige Meat-Damage-Prevention ergänzen.
- Korp-Bypass-Zahlung als LegalAction-/Choice-Fenster modellieren und in `applyAction` gegen Credits, Seite, Timing, Quelle, Schadensereignis und StateVersion revalidieren.
- Damage-/Flatline-Payloads auf Beträge, Schadensart, Quelle und Ergebnis beschränken; keine Gripkarten leaken.

Akzeptanz:

- Full Body Conversion verhindert Meat Damage nach finalem Vertrag vollständig oder bewusst begrenzt, aber nicht widersprüchlich.
- Korp-Bypass ist kosten- und timingvalidiert.
- PublicEvents, PlayerViews, KI-Inputs und Replay-Payloads enthalten keine privaten Grip-/Heap-Details.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

