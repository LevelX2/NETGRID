# Originalset-Spotcheck 2026-05-16 Prevention/Interface/Agenda Actions

Job: `spotcheck-2026-05-16-prevention-interface-agenda-actions`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die Prevention-, R&D-Multiaccess-, Trace-Link-, Hidden-Zone-, Agenda- und rezzed-Asset-Pfade wurden gegen Source-Drift, PublicPayload-Leaks und Replay/StateHash-Regressionen nachgehärtet.

Commit-Status: `done`. Der lokale Commit wurde nach Worktree-Gitdir-Entsperrung erfolgreich erstellt.

## Umgesetzte Härtungen

- `R&D Interface` wurde aus dem Damage-Prevention-Pfad entfernt und als kumulativer R&D-Multiaccess-Modifikator modelliert.
- `Hell's Run` nutzt jetzt einen restricted Recurring Credit ausschließlich für Runner-Trace-Link-Bids und refreshed zum nächsten Runner-Zugstart.
- `Ronin Around` bleibt beim bestätigten Top-2-Stack-Reorder-Vertrag; die private Choice ist nun an die installierte Source gebunden.
- `Nasuko Cycle`, `Fall Guy` und `Nomad Allies` bleiben source-stabil in Damage-Prevention-Fenstern; entfernte Sources können offene Choices nicht mehr resolven.
- `Hostile Takeover` bleibt bei Gain 5 und scoret nur mit ausreichenden Advancements.
- `Political Overthrow` erzeugt nur aus der Korp-ScoreArea die Gain-3-Aktion und revalidiert Source-Drift.
- `Nevinyrral` löst beim Verlassen des Spiels in rezzed installiertem Zustand den Runner-Sieg aus.
- `Rustbelt HQ Branch` erhöht die Korp-Handgröße nur solange die rezzed Source installiert ist; Trash senkt sofort das Limit, ohne Sofortdiscard zu erzwingen.

## Kartenstatus

| Karte | Card ID | Status | Notiz |
|---|---|---|---|
| Nasuko Cycle | `onr_v1_135_nasuko-cycle` | completed | Prevention-Choice bleibt source-bound und replay-stabil. |
| R&D Interface | `onr_v1_139_r-and-d-interface` | completed | Kumulativer R&D-Multiaccess, AI-Hint, Manifest und Catalog-Gate korrigiert. |
| Fall Guy | `onr_v1_161_fall-guy` | completed | Resource-Prevention bleibt als eindeutige installierte Source sichtbar. |
| Hell's Run | `onr_v1_164_hells-run` | completed | Restricted Trace-Link-Recurring-Credit mit PublicPayload und Refresh geprüft. |
| Nomad Allies | `onr_v1_170_nomad-allies` | completed | Resource-Prevention bleibt source-stabil und hidden-info-sicher. |
| Ronin Around | `onr_v1_175_ronin-around` | completed | Top-2-Stack-Reorder-Vertrag bestätigt und Source-Removal-Drift gehärtet. |
| Hostile Takeover | `onr_v1_203_hostile-takeover` | completed | Gain-5-Score-Pfad und Advancement-Revalidation geprüft. |
| Political Overthrow | `onr_v1_210_political-overthrow` | completed | ScoreArea-Source und Gain-3-Aktion bleiben source-bound. |
| Nevinyrral | `onr_v1_331_nevinyrral` | completed | Rezzed Leave-play-Loss für die Korp ergänzt und replay-stabil geprüft. |
| Rustbelt HQ Branch | `onr_v1_338_rustbelt-hq-branch` | completed | Rezzed Handlimit-Lifecycle mit Trash-Rückbau geprüft. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün.
