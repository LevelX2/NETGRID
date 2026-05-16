# Originalset-Spotcheck 2026-05-15 Modifier/Agenda Risk

Job: `spotcheck-2026-05-15-modifier-agenda-risk`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die zehn Karten wurden als Engine-Härtung gegen LegalAction-/`applyAction`-Revalidation, PlayerView-/PublicPayload-Redaktion, ScoreArea-/Zone-Drift und Replay/StateHash geprüft.

Commit-Status: `commit_pending`. Der lokale Commit ist durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git` konnte ohne erhöhte Berechtigung nicht entfernt werden.

## Umgesetzte Härtungen

- `Gremlins`, `Preying Mantis`, `Corporate Boon`, `Subsidiary Branch` und `Euromarket Consortium` wurden als Shell-/Oberflächenverträge gegen versehentliche nicht implementierte LegalActions abgesichert.
- `MRAM Chip` recomputed Handlimit ausschließlich aus aktiver Rig-Hardware; stale Install wird abgelehnt und Zonewechsel entfernt die Projektion.
- `Corporate Coup` revalidiert Counter und ScoreArea-Quelle; Runner-ScoreArea-Drift und 0-Counter scheitern.
- `On-Call Solo Team` revalidiert Runner-Tag beim `applyAction`; Damage-Payload bleibt redigiert.
- `Executive Extraction` bleibt an die Korp-ScoreArea gebunden; Runner-ScoreArea-Kopien sind keine Korp-Modifierquelle.
- `Canis Major` setzt den Future-Encounter-Strength-Bonus runlokal, wendet ihn auf das nächste ICE an und räumt ihn beim Run-Ende ab.

## Kartenstatus

| Karte | Card ID | Status | Notiz |
|---|---|---|---|
| Gremlins | `onr_v1_029_gremlins` | completed | Shell-Vertrag legal-action-gated, keine Zusatzaktion. |
| MRAM Chip | `onr_v1_134_mram-chip` | completed | Handlimit-Projektion und Zonewechsel gehärtet. |
| Preying Mantis | `onr_v1_171_preying-mantis` | completed | Shell-Vertrag legal-action-gated, keine Zusatzaktion. |
| Corporate Boon | `onr_v1_192_corporate-boon` | completed | Gescorte Shell-Agenda erzeugt keine ungeprüfte Aktion. |
| Corporate Coup | `onr_v1_193_corporate-coup` | completed | Counter-/ScoreArea-Revalidation ergänzt. |
| Executive Extraction | `onr_v1_201_executive-extraction` | completed | Korp-ScoreArea-Bindung nachgetestet. |
| On-Call Solo Team | `onr_v1_208_on-call-solo-team` | completed | Tag-Drift und Damage-Redaction gehärtet. |
| Subsidiary Branch | `onr_v1_218_subsidiary-branch` | completed | Gescorte Shell-Agenda erzeugt keine ungeprüfte Aktion. |
| Canis Major | `onr_v1_225_canis-major` | completed | Runbonus-Lebensdauer replay-stabil geprüft. |
| Euromarket Consortium | `onr_v1_322_euromarket-consortium` | completed | Rezzed Shell-Asset erzeugt keine ungeprüfte Aktion. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test -- --runInBand "Originalset Spotcheck 2026-05-15 Modifier/Agenda risk hardening"`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Der lokale Commit bleibt bis zur `.git`-ACL-Reparatur blockiert.
