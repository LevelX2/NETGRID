# Originalset-Spotcheck 2026-05-15 Trace/Prevention/Assets

Job: `spotcheck-2026-05-15-trace-prevention-assets`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die zehn bereits decklegalen Originalset-Karten wurden gegen Engine-Vertrag, PublicPayload-Redaktion, `applyAction`-Revalidation, Replay/StateHash und relevante Katalog-/AI-Verträge nachgehärtet.

## Umgesetzte Härtungen

- `Parraline 5750` nutzt jetzt den bestätigten lokalen Vertrag: Installkosten 5, +1 MU, 1 recurring credit für Icebreaker-Nutzung während Runs und Deck-Einzigartigkeit. Shared-Definition, AI-Hint und V1.9.22-Contract-Matrix wurden auf diesen Stand gezogen.
- `Black Ice Quality Assurance` wirkt als globaler Modifier nur aus der gescorten Korp-ScoreArea und nur auf ICE mit `black_ice`-Subtype. Runner-ScoreArea-Drift aktiviert keinen Korp-Modifier.
- `Evil Twin` und `Wilson, Weeflerunner Apprentice` wurden in fokussierten Prevention-Pfaden gegen Turn-Limit, stale Choices, installierte Quelle und öffentliche Damage-Payloads geprüft.
- `Forged Activation Orders` deckt öffentliche Multi-ICE-Zielwahl, Redaction der Choice-Optionen und stale Ziel-Drift vor der Korp-Choice ab.
- `Access to Arasaka`, `Fetch 4.0.1` und `Rex` wurden gemeinsam im Trace-/Link-Pfad geprüft: Base-Link zählt genau einmal, entfernte Link-Quelle zählt nicht weiter, Fetch/Rex behalten ihre cardId-spezifischen Rez-/Trace-Werte.
- `BBS Whispering Campaign` und `Omniscience Foundation` wurden als rezzed Asset-/Shell-Verträge gegen entfernte Quellen und nicht implementierte verdeckte Fähigkeiten abgesichert.

## Kartenstatus

| Karte | Card ID | Status | Notiz |
|---|---|---|---|
| Evil Twin | `onr_v1_023_evil-twin` | completed | Core-Damage-Prevention bleibt instanz- und turnbegrenzt. |
| Forged Activation Orders | `onr_v1_086_forged-activation-orders` | completed | Stale Ziel-Drift vor Korp-Choice wird abgelehnt. |
| Parraline 5750 | `onr_v1_137_parraline-5750` | completed | Kosten/MU/Recurring/Deck-Vertrag korrigiert. |
| Access to Arasaka | `onr_v1_149_access-to-arasaka` | completed | Base-Link zählt im Trace und fällt nach Trash weg. |
| Wilson, Weeflerunner Apprentice | `onr_v1_187_wilson-weeflerunner-apprentice` | completed | Meat-Prevention bleibt auf 1 pro Turn begrenzt. |
| Black Ice Quality Assurance | `onr_v1_191_black-ice-quality-assurance` | completed | Scored-only Black-ICE-Modifier umgesetzt. |
| Fetch 4.0.1 | `onr_v1_243_fetch-4-0-1` | completed | Trace-3-Tag-Pfad mit RezCost 0 geprüft. |
| Rex | `onr_v1_264_rex` | completed | Trace-3-Tag-Pfad mit RezCost 4 geprüft. |
| BBS Whispering Campaign | `onr_v1_309_bbs-whispering-campaign` | completed | Rezzed-only Economy und removed-source Guard geprüft. |
| Omniscience Foundation | `onr_v1_333_omniscience-foundation` | completed | Rezzed Shell-Asset ohne verdeckte LegalAction bestätigt. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

## Offene Punkte

Keine fachlichen Blocker aus diesem Spotcheck. Weitere Vollresolver bleiben in ihren bereits blockierten Spotcheck-Jobs dokumentiert und wurden in diesem Lauf nicht berührt.

Commit-Status: `commit_pending`. Der lokale Commit ist durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git` konnte ohne erhöhte Berechtigung nicht entfernt werden.
