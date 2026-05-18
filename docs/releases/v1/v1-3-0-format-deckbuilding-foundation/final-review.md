# V1.3.0 Final Review

Datum: 2026-05-08

## Gate-Entscheidung

Status: done.

V1.3.0 Format und Deckbuilding Foundation ist nach abgeschlossenem V1.2.3-Gate vollstaendig umgesetzt, dokumentiert und lokal verifiziert. Der Release bleibt innerhalb des privaten lokalen Scopes und vermischt keine Kartenfreigabe, offiziellen Assets oder Public-Plattformfunktionen.

## Finaler Scope

- Versioniertes Formatprofil `netgrid_private_local_v1` / `1.3.0`
- Formatprofil-Regeln als reine Einschraenkungsschicht
- getrennte Sichtbarkeit von Katalogstatus, Spielbarkeit, Decklegalitaet und Formatlegalitaet
- staerkere Deckvalidierung fuer Side, Identity, Card-Pool, Formatversion, Kopienlimit, Agenda-Punkte, Faction/Influence und fehlende Daten
- versionierte V1.3.0-Runner-/Corp-Snapshots mit decklistenfreier Public Metadata
- Server-Matchstart-Revalidierung fuer V1.3.0-Snapshots
- lokale Import-/Bibliotheksmarkierung alter Decks als `needs_revalidation`
- AI-Deckpool-Gate auf `ai_supported`
- E2E-Abdeckung fuer legalen und illegalen V1.3.0-Deckvalidierungspfad

## Gates

- `V1_3_0_implemented: true`
- `V1_3_0_verified: true`
- `V1_3_0_done: true`
- `release_boundary_sequence_respected: true`

## Pflichtchecks

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung ohne Build-Abbruch
- `corepack pnpm e2e`: pass, 8/8 Tests

## Nichtziele bestaetigt

- keine Public-Decklisten
- keine Accounts, Rankings, Turniere oder Matchmaking
- keine offiziellen Assets, Logos, Card Frames oder Card Backs
- kein Kartentextparser
- keine neuen Kartenfreigaben jenseits des bereits abgeschlossenen V1.2.3-Batches
- keine `ai_supported`-Freigabe fuer die V1.2.3/V1.3.0-human-only Karten
