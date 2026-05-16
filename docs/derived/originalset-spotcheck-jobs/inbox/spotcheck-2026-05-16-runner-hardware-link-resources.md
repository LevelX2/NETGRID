---
jobId: spotcheck-2026-05-16-runner-hardware-link-resources
status: committed
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:58:00+02:00
completedAt: 2026-05-16T14:05:07+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_128_green-knight-surge-buffers
    title: Green Knight Surge Buffers
  - cardId: onr_v1_133_militech-mram-chip
    title: Militech MRAM Chip
  - cardId: onr_v1_141_raven-microcyb-owl
    title: Raven Microcyb Owl
  - cardId: onr_v1_143_techtronica-utility-suit
    title: Techtronica Utility Suit
  - cardId: onr_v1_144_tycho-mem-chip
    title: Tycho Mem Chip
  - cardId: onr_v1_145_wutech-mem-chip
    title: WuTech Mem Chip
  - cardId: onr_v1_146_zetatech-mem-chip
    title: Zetatech Mem Chip
  - cardId: onr_v1_152_back-door-to-hilliard
    title: Back Door to Hilliard
  - cardId: onr_v1_153_back-door-to-orbital-air
    title: Back Door to Orbital Air
  - cardId: onr_v1_154_broker
    title: Broker
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-hardware-link-resources

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_128_green-knight-surge-buffers - Green Knight Surge Buffers

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_133_militech-mram-chip - Militech MRAM Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_141_raven-microcyb-owl - Raven Microcyb Owl

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_143_techtronica-utility-suit - Techtronica Utility Suit

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_144_tycho-mem-chip - Tycho Mem Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_145_wutech-mem-chip - WuTech Mem Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_146_zetatech-mem-chip - Zetatech Mem Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_152_back-door-to-hilliard - Back Door to Hilliard

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_153_back-door-to-orbital-air - Back Door to Orbital Air

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Resource-Pfade betreffen Link, Tags, Credits, Prevention oder persistente Runner-Zustaende und muessen nach Tags-/Run-/Turnwechseln neu berechnet werden. Chronik braucht Install, Trigger, Counter/Credit/Tag-Aenderung und Cleanup mit Quelle. Mindestens Install, Tag-/Link-Drift, falsche Seite, stale, Removed-source und Replay/StateHash pruefen. Runner-Rig ist sichtbar, private Choices bleiben aber nur fuer Runner; PublicPayload enthaelt keine Hand-/Stack-Kartennamen. Haerte LegalActions fuer aktuelle Bedingung, Quelle, Ziel, Kosten und StateVersion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_154_broker - Broker

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

Status: `committed`. Der Job wurde fachlich umgesetzt und verifiziert.

Umgesetzt:

- Hardware- und Link-/Resource-Installationen fuer Green Knight Surge Buffers, Militech MRAM Chip, Raven Microcyb Owl, Techtronica Utility Suit, Tycho Mem Chip, WuTech Mem Chip, Zetatech Mem Chip, Back Door to Hilliard, Back Door to Orbital Air und Broker werden als oeffentliche Rig-Installationen ohne private Zonenleaks nachgetestet.
- Green Knight Surge Buffers und Techtronica Utility Suit bleiben als Damage-Prevention-Quellen source-bound, public-safe und replaybar.
- Broker wird gegen entfernte Quelle, Turnlimit, Countertransfer, PublicPayload-Ergebnisfelder und Replay/StateHash abgesichert.
- Fuer diesen Block waren keine Resolver-Aenderungen erforderlich; die vorhandenen Engine-Pfade wurden durch fokussierte Regressionen gehaertet.

Verifikation:

- `corepack pnpm --filter @netgrid/engine test` gruen mit 452 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen.
- `corepack pnpm --filter @netgrid/catalog test` gruen.
- `corepack pnpm typecheck` gruen.

Commit-Hinweis:

- Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
