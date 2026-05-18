---
jobId: spotcheck-2026-05-16-corp-operation-asset-node
status: done
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:24:57+02:00
completedAt: 2026-05-16T18:42:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_295_night-shift
    title: Night Shift
  - cardId: onr_v1_297_overtime-incentives
    title: Overtime Incentives
  - cardId: onr_v1_306_trojan-horse
    title: Trojan Horse
  - cardId: onr_v1_310_blood-cat
    title: Blood Cat
  - cardId: onr_v1_311_braindance-campaign
    title: Braindance Campaign
  - cardId: onr_v1_316_cowboy-sysop
    title: Cowboy Sysop
  - cardId: onr_v1_318_department-of-truth-enhancement
    title: Department of Truth Enhancement
  - cardId: onr_v1_320_encoder-inc
    title: Encoder, Inc.
  - cardId: onr_v1_321_esa-contract
    title: ESA Contract
  - cardId: onr_v1_335_remote-facility
    title: Remote Facility
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-corp-operation-asset-node

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_295_night-shift - Night Shift

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_297_overtime-incentives - Overtime Incentives

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_306_trojan-horse - Trojan Horse

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_310_blood-cat - Blood Cat

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_311_braindance-campaign - Braindance Campaign

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_316_cowboy-sysop - Cowboy Sysop

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_318_department-of-truth-enhancement - Department of Truth Enhancement

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_320_encoder-inc - Encoder, Inc.

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_321_esa-contract - ESA Contract

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_335_remote-facility - Remote Facility

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

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

## Umsetzung 2026-05-16

Status: `done`.

Umgesetzt:

- `Night Shift` und `Trojan Horse` schreiben sichere Ergebnisfelder fuer Draw/Credit bzw. Tags in den PublicPayload-Kontext.
- `Overtime Incentives` wurde als LegalAction-only-Aktionsgewinn mit Payload und Replay nachgetestet.
- `Blood Cat` wurde als rezzed Asset-Trace-Quelle mit Trace 5, Tag-Ergebnis und Replay/StateHash nachgetestet.
- `Cowboy Sysop` revalidiert sichtbare installierte Runner-Ziele; entfernte Ziele werden abgelehnt.
- `Braindance Campaign`, `ESA Contract` und `Remote Facility` wurden als rezzed Asset-Aktionen source- und replay-sicher nachgetestet.
- `Remote Facility`/`v1920AssetAbility`-Aktionen erhalten eine öffentliche Source-Erkennung für sichtbare rezzed Quellen.
- `Department of Truth Enhancement` wurde im generischen Access-/Trash-Pfad geprüft.
- `Encoder, Inc.` wurde als rezzed Code-Gate-Rez-Kostenmodifier mit öffentlicher Modifikatorquelle geprüft.

Checks:

- `corepack pnpm --filter @netgrid/engine test` gruen
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen
- `corepack pnpm --filter @netgrid/catalog test` gruen
- `corepack pnpm typecheck` gruen

Commitstatus: Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
