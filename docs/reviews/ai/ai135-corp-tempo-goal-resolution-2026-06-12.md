# AI135 Corp Tempo Goal Resolution v1

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI135 klassifiziert Corp-LegalActions in Endfenstern als Tempo- oder Nicht-Tempo-Ziele. Das Paket ist shadow-only und verändert keine Live-Auswahl.

## Änderung

Neue Datei:

- `packages/ai/src/decision/corp-tempo-goals.ts`

Klassifizierte Fits:

- `safe_score`
- `advance_to_score`
- `protect_remote`
- `protect_central`
- `rez_meaningful_ice`
- `install_meaningful_ice`
- `economy_only`
- `opaque_ability`
- `unrelated`

## Safety

- Activated Abilities zählen nur dann als Progress, wenn side-safe Evidence Score-, Protection-, Rez-/ICE-, Flatline- oder Tag-Bezug enthält.
- Reine Economy wie Corporate Boon bleibt `economy_only`.
- Die Klassifikation nutzt keine Hidden-Zonen, keine privaten Kartenlisten und keinen `FullGameState`.

## Tests

Abgedeckte Fälle:

- Corporate Boon bleibt Economy-only
- Score und Advance werden als echte Scoreline-Progress klassifiziert
- opake Ability bleibt opaque ohne side-safe Tempo-Evidence
- sichtbare Remote-/Central-Protection wird als meaningful Tempo erkannt

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- corp-tempo-goals`
- `git diff --check`
