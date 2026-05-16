---
jobId: spotcheck-2026-05-16-breaker-ice-subtype-mix
status: done
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:02:30+02:00
completedAt: 2026-05-16T18:22:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_052_raffles
    title: Raffles
  - cardId: onr_v1_054_raptor
    title: Raptor
  - cardId: onr_v1_058_seeya
    title: SeeYa
  - cardId: onr_v1_060_shaka
    title: Shaka
  - cardId: onr_v1_065_smarteye
    title: Smarteye
  - cardId: onr_v1_066_snowball
    title: Snowball
  - cardId: onr_v1_070_tinweasel
    title: Tinweasel
  - cardId: onr_v1_072_wild-card
    title: Wild Card
  - cardId: onr_v1_073_wizards-book
    title: Wizard's Book
  - cardId: onr_v1_074_worm
    title: Worm
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-breaker-ice-subtype-mix

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_052_raffles - Raffles

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_054_raptor - Raptor

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_058_seeya - SeeYa

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_060_shaka - Shaka

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_065_smarteye - Smarteye

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_066_snowball - Snowball

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_070_tinweasel - Tinweasel

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_072_wild-card - Wild Card

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_073_wizards-book - Wizard's Book

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_074_worm - Worm

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

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

Der Job wurde fachlich umgesetzt und geprüft, bleibt aber wegen der bekannten lokalen `.git`-ACL-Sperre auf `commit_pending`.

Umgesetzte Punkte:

- Raffles, Raptor, Shaka, Snowball, Tinweasel, Wild Card, Wizard's Book und Worm in matching ICE-Subtype-Encountern geprüft.
- Install-Aktionen der Breaker gegen wrong-side und stale `stateVersion` geprüft.
- SeeYa gegen Expose-Ziel-Drift und Hidden-Zone-Payload-Leaks geprüft.
- Smarteye als source-bound Approach-ICE-Reveal geprüft.
- Detailbericht, Register, JSON-Register und Wissenslog aktualisiert.

Grüne Checks:

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Commit-Status:

- Lokaler Commit wurde nach Worktree-Gitdir-Entsperrung erfolgreich erstellt.
