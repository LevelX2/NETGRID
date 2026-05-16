---
jobId: spotcheck-2026-05-16-runner-resource-contacts
status: committed
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T14:21:23+02:00
completedAt: 2026-05-16T14:25:30+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_157_crash-everett-inventive-fixer
    title: Crash Everett, Inventive Fixer
  - cardId: onr_v1_158_danshis-second-id
    title: Danshi's Second ID
  - cardId: onr_v1_159_databroker
    title: Databroker
  - cardId: onr_v1_162_field-reporter-for-ice-and-data
    title: Field Reporter for Ice and Data
  - cardId: onr_v1_163_floating-runner-bbs
    title: Floating Runner BBS
  - cardId: onr_v1_165_junkyard-bbs
    title: Junkyard BBS
  - cardId: onr_v1_166_karl-de-veres-corporate-stooge
    title: Karl de Veres, Corporate Stooge
  - cardId: onr_v1_167_leland-corporate-bodyguard
    title: Leland, Corporate Bodyguard
  - cardId: onr_v1_168_loan-from-chiba
    title: Loan from Chiba
  - cardId: onr_v1_176_the-shell-traders
    title: The Shell Traders
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-resource-contacts

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_157_crash-everett-inventive-fixer - Crash Everett, Inventive Fixer

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_158_danshis-second-id - Danshi's Second ID

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_159_databroker - Databroker

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_162_field-reporter-for-ice-and-data - Field Reporter for Ice and Data

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_163_floating-runner-bbs - Floating Runner BBS

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_165_junkyard-bbs - Junkyard BBS

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_166_karl-de-veres-corporate-stooge - Karl de Veres, Corporate Stooge

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_167_leland-corporate-bodyguard - Leland, Corporate Bodyguard

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_168_loan-from-chiba - Loan from Chiba

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_176_the-shell-traders - The Shell Traders

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

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

## Umsetzungsabschluss 2026-05-16

Status: `committed`. Der vorherige lokale Commit-Blocker beim Erstellen von `.git/index.lock` ist in diesem Abschlusslauf nicht mehr aufgetreten.

Umgesetzt:

- Installationen fuer Crash Everett, Danshi's Second ID, Databroker, Field Reporter for Ice and Data, Floating Runner BBS, Junkyard BBS, Karl de Veres, Leland, Loan from Chiba und The Shell Traders werden gegen Wrong-Side, stale `stateVersion`, entfernte Source, PublicPayload-Leaks und Replay/StateHash geprueft.
- Danshi's Second ID veroeffentlicht entfernte Tags und den verbleibenden Runner-Tagstand.
- Databroker bleibt an installierte Quelle und Runner-Agenda-Kosten gebunden; PublicPayload nennt Creditgewinn und bezahlten Agenda-Punkt.
- Floating Runner BBS, Loan from Chiba und The Shell Traders bleiben ueber Turnwechsel und Recurring-Refresh replaybar.

Verifikation:

- `corepack pnpm --filter @netgrid/engine test` gruen mit 461 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen.
- `corepack pnpm --filter @netgrid/catalog test` gruen.
- `corepack pnpm typecheck` gruen.

Commit-Hinweis:

- Die Änderung wird im Abschlusscommit dieses Spotcheck-Pakets lokal festgeschrieben.
