---
jobId: spotcheck-2026-05-16-corp-asset-upgrade-rest
status: done
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:08:34+02:00
completedAt: 2026-05-16T18:25:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_337_rockerboy-promotion
    title: Rockerboy Promotion
  - cardId: onr_v1_352_chester-mix
    title: Chester Mix
  - cardId: onr_v1_353_chimera
    title: Chimera
  - cardId: onr_v1_361_namatoki-plaza
    title: Namatoki Plaza
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-corp-asset-upgrade-rest

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 4 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_337_rockerboy-promotion - Rockerboy Promotion

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Asset-/Node-Pfade muessen Install, Rez, Access-Trash, Counter/Credit/Trace/Tag/Action-Faehigkeiten und Source-Lebensdauer trennen. Chronik braucht Rez, Aktivierung, Counter-/Credit-/Tag-Aenderung, Access-Trash und Cleanup mit oeffentlicher Quelle. Mindestens Rez, unrezzed-Negativfall, removed source, Counter-/Kosten-Grenze, stale und Replay/StateHash pruefen. Installierte/rezzed Assets sind oeffentlich; private Korp-Zonen duerfen nie in Payloads oder Reconnect leaken. Haerte Rezzed-Gate, Serverbindung, Kosten, Zielwahl, Countertypen und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_352_chester-mix - Chester Mix

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Upgrade-Pfade muessen Serverbindung, Root-Zone, Rez-Status, Access/Run/Tag/Trace-Effekte und Trash-Cleanup exakt begrenzen. Chronik braucht Server-ID, Quelle, Timingfenster, Kosten/Tags/Trace oder Modifier-Ergebnis. Mindestens eigener Server, Fremdserver-Negativfall, unrezzed/trashed Quelle, stale und Replay/StateHash pruefen. Unrezzed Upgrades bleiben verborgen; oeffentliche Payloads nennen nur rezzed Quelle, Server und erlaubte Effekte. Haerte Server-Scope, Source-Zone, Timingpunkt, Choice-Ziele und Reconnect-Projektion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_353_chimera - Chimera

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Upgrade-Pfade muessen Serverbindung, Root-Zone, Rez-Status, Access/Run/Tag/Trace-Effekte und Trash-Cleanup exakt begrenzen. Chronik braucht Server-ID, Quelle, Timingfenster, Kosten/Tags/Trace oder Modifier-Ergebnis. Mindestens eigener Server, Fremdserver-Negativfall, unrezzed/trashed Quelle, stale und Replay/StateHash pruefen. Unrezzed Upgrades bleiben verborgen; oeffentliche Payloads nennen nur rezzed Quelle, Server und erlaubte Effekte. Haerte Server-Scope, Source-Zone, Timingpunkt, Choice-Ziele und Reconnect-Projektion.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_361_namatoki-plaza - Namatoki Plaza

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Upgrade-Pfade muessen Serverbindung, Root-Zone, Rez-Status, Access/Run/Tag/Trace-Effekte und Trash-Cleanup exakt begrenzen. Chronik braucht Server-ID, Quelle, Timingfenster, Kosten/Tags/Trace oder Modifier-Ergebnis. Mindestens eigener Server, Fremdserver-Negativfall, unrezzed/trashed Quelle, stale und Replay/StateHash pruefen. Unrezzed Upgrades bleiben verborgen; oeffentliche Payloads nennen nur rezzed Quelle, Server und erlaubte Effekte. Haerte Server-Scope, Source-Zone, Timingpunkt, Choice-Ziele und Reconnect-Projektion.

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

- `Chimera` revalidiert beim Resolve der Daemon-Trash-Choice die aktuell accessed Source und lehnt entfernte/verschobene Quellen ab.
- `Rockerboy Promotion` wurde mit Rezzed-Gate, Wrong-Side-/Stale-Revalidation, entfernter Source, PublicPayload-Leakscan und Replay/StateHash nachgetestet.
- `Chester Mix` wurde gegen serverfremde ICE-Installkostenreduktion nachgetestet.
- `Namatoki Plaza` wurde im generischen Upgrade-Access-/Trash-Pfad mit PublicPayload-Leakscan und Replay/StateHash nachgetestet.

Checks:

- `corepack pnpm --filter @netgrid/engine test` gruen
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen
- `corepack pnpm --filter @netgrid/catalog test` gruen
- `corepack pnpm typecheck` gruen

Commitstatus: Staging/Commit bleibt blockiert, weil `.git/index.lock` wegen `Permission denied` durch die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git` nicht erstellt werden kann.
