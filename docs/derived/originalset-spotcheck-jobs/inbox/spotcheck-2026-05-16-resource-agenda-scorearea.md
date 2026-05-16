---
jobId: spotcheck-2026-05-16-resource-agenda-scorearea
status: ready_for_implementation
createdAt: 2026-05-16T11:08:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_178_short-term-contract
    title: Short-Term Contract
  - cardId: onr_v1_179_silicon-saloon-franchise
    title: Silicon Saloon Franchise
  - cardId: onr_v1_183_technician-lover
    title: Technician Lover
  - cardId: onr_v1_184_top-runners-conference
    title: Top Runners' Conference
  - cardId: onr_v1_185_trauma-team
    title: Trauma Team
  - cardId: onr_v1_186_umbrella-policy
    title: Umbrella Policy
  - cardId: onr_v1_199_employee-empowerment
    title: Employee Empowerment
  - cardId: onr_v1_206_marine-arcology
    title: Marine Arcology
  - cardId: onr_v1_214_project-babylon
    title: Project Babylon
  - cardId: onr_v1_220_tycho-extension
    title: Tycho Extension
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-resource-agenda-scorearea

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_178_short-term-contract - Short-Term Contract

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_179_silicon-saloon-franchise - Silicon Saloon Franchise

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_183_technician-lover - Technician Lover

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_184_top-runners-conference - Top Runners' Conference

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_185_trauma-team - Trauma Team

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_186_umbrella-policy - Umbrella Policy

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_199_employee-empowerment - Employee Empowerment

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Agenda-Pfade muessen Score/Steal, On-score-Faehigkeiten, ScoreArea-Quelle und persistente Modifier streng trennen. Chronik braucht Advancement, Score/Steal, On-score-Ausloesung, Zielwahl und aktive Modifier mit oeffentlicher Quelle. Mindestens Score, Steal-Negativfall, mehrere Kopien, Ziel-Drift, stale und Replay/StateHash pruefen. Scored Agendas sind oeffentlich; private HQ-/R&D-Ziele duerfen erst nach legaler Reveal-/Rez-Aufloesung erscheinen. Haerte ScoreArea-Bindung, On-score-Choice, Kostenfreiheit/Kostenpflicht, Payload und Modifier-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_206_marine-arcology - Marine Arcology

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Agenda-Pfade muessen Score/Steal, On-score-Faehigkeiten, ScoreArea-Quelle und persistente Modifier streng trennen. Chronik braucht Advancement, Score/Steal, On-score-Ausloesung, Zielwahl und aktive Modifier mit oeffentlicher Quelle. Mindestens Score, Steal-Negativfall, mehrere Kopien, Ziel-Drift, stale und Replay/StateHash pruefen. Scored Agendas sind oeffentlich; private HQ-/R&D-Ziele duerfen erst nach legaler Reveal-/Rez-Aufloesung erscheinen. Haerte ScoreArea-Bindung, On-score-Choice, Kostenfreiheit/Kostenpflicht, Payload und Modifier-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_214_project-babylon - Project Babylon

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Agenda-Pfade muessen Score/Steal, On-score-Faehigkeiten, ScoreArea-Quelle und persistente Modifier streng trennen. Chronik braucht Advancement, Score/Steal, On-score-Ausloesung, Zielwahl und aktive Modifier mit oeffentlicher Quelle. Mindestens Score, Steal-Negativfall, mehrere Kopien, Ziel-Drift, stale und Replay/StateHash pruefen. Scored Agendas sind oeffentlich; private HQ-/R&D-Ziele duerfen erst nach legaler Reveal-/Rez-Aufloesung erscheinen. Haerte ScoreArea-Bindung, On-score-Choice, Kostenfreiheit/Kostenpflicht, Payload und Modifier-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_220_tycho-extension - Tycho Extension

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Agenda-Pfade muessen Score/Steal, On-score-Faehigkeiten, ScoreArea-Quelle und persistente Modifier streng trennen. Chronik braucht Advancement, Score/Steal, On-score-Ausloesung, Zielwahl und aktive Modifier mit oeffentlicher Quelle. Mindestens Score, Steal-Negativfall, mehrere Kopien, Ziel-Drift, stale und Replay/StateHash pruefen. Scored Agendas sind oeffentlich; private HQ-/R&D-Ziele duerfen erst nach legaler Reveal-/Rez-Aufloesung erscheinen. Haerte ScoreArea-Bindung, On-score-Choice, Kostenfreiheit/Kostenpflicht, Payload und Modifier-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

## Gesamtplan

1. Karten in der Frontmatter-Reihenfolge bearbeiten und nicht mit anderen Queueberichten mischen.
2. Pro Karte zuerst den bestehenden Engine-Vertrag nachtesten, dann nur konkrete Luecken haerten.
3. PublicPayload, PlayerView, Reconnect und Chronik immer zusammen pruefen.
4. Nach Umsetzung Bericht nach `done/` verschieben und Register separat aktualisieren.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- Fokussierte Tests in `packages/engine/src/index.test.ts` fuer die im Block genannten Card IDs.
- Leakscan fuer PublicPayload, PlayerViews, Reconnect-Payloads, Chronik und Replay/StateHash.
