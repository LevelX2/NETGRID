# Originalset-Spotcheck 2026-05-15 Immunity/Cinderella Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-immunity-cinderella.md`

Status: `done`

## Umgesetzte Karten

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Diplomatic Immunity | `onr_v1_160_diplomatic-immunity` | Nacharbeit umgesetzt: installiertes Resource-Profil verhindert Meat Damage; Korp kann das Prevention-Fenster per Agenda-Punkt-Forfeit canceln | PublicPayload, Agenda-Kosten, Redaction und Replay ergänzt |
| AI Chief Financial Officer | `onr_v1_188_ai-chief-financial-officer` | Nachtest gehärtet: Sourcebindung, kurze R&D, harte Draw-5-Regel und Hidden-Zone-Counts | Wrong-side, stale und Replay ergänzt |
| Corporate War | `onr_v1_196_corporate-war` | Nachtest gehärtet: exakt 12 Credits erreicht die Schwelle | Replay und Payload-Grenzwert ergänzt |
| Political Coup | `onr_v1_209_political-coup` | Nachtest gehärtet: mehrere gescorte Kopien bleiben source-bound | Power-Counter-Kosten im PublicPayload ergänzt |
| Ball and Chain | `onr_v1_222_ball-and-chain` | Nacharbeit umgesetzt: Future-Encounter-Tax wird beim nächsten ICE bezahlt oder beendet den Run | Taxquelle, Zahlung und Run-Ende im PublicPayload ergänzt |
| Cinderella | `onr_v1_228_cinderella` | Nacharbeit umgesetzt: Trace-Erfolg trasht installierte Hardware, verursacht 2 nicht verhinderbares Meat Damage und beendet den Run ohne Tag | Shared-Text, Manifest, AI-Hint und Replay-Test korrigiert |
| Homewrecker | `onr_v1_248_homewrecker` | Nacharbeit umgesetzt: analog Cinderella mit Trace 5 statt Trace 6 | Shared-Text, Manifest, AI-Hint und Replay-Test korrigiert |
| Management Shake-Up | `onr_v1_292_management-shake-up` | Nacharbeit umgesetzt: drei Advancement-Counter auf advancebare installierte Korp-Karten | Manifest/AI-Hint korrigiert und Replay-Test ergänzt |
| Corprunner's Shattered Remains | `onr_v1_315_corprunners-shattered-remains` | Nacharbeit umgesetzt: Hardwaretrash skaliert mit Advancement-Countern | Mehrhardware-Test und Payload-Count ergänzt |
| Tokyo-Chiba Infighting | `onr_v1_371_tokyo-chiba-infighting` | Nachtest gehärtet: erfolgloser Run auf eigenem Server gibt exakt 2 Credits | Source-/Server-/Credit-Payload und Replay ergänzt |

## Geänderte Kernartefakte

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `data/ai/ai-card-hints-deck-legal-v1914.json`
- `data/ai/ai-card-hints-deck-legal-v1919.json`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `data/manifests/card-implementation-manifest-1.9.14.json`
- `data/manifests/card-implementation-manifest-1.9.19.json`
- `data/manifests/card-implementation-manifest-1.9.20.json`

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle Pflichtchecks waren grün.

## Restpunkte

Keine fachlichen Restpunkte aus dieser Runde. Der separat vorhandene ACME/V1.9.5-Dirty-State wurde nicht behandelt und gehört nicht zu diesem Job. Ein lokaler Commit wurde nicht erstellt, weil Git wiederholt `C:/Projekte/NETGRID/.git/index.lock` nicht anlegen konnte (`Permission denied`).
