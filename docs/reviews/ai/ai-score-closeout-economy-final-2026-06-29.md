# AI Score-Closeout Economy Abschluss

Datum: 2026-06-29

Branch: `codex/ai-score-closeout-economy`

Ausgangsspiel: `match_8ff8d058ccad6138`

## Umgesetzte Punkte

- Same-Turn-Score-Closeouts werden bei `advance_card` erkannt, wenn die Corp mit sichtbaren Agenda-Countern, Credits und Klicks die Agenda noch im selben Turn scorebar machen kann.
- Eine bereits legal scorebare Agenda ohne sichtbaren Overadvance-Payoff bekommt gegen weiteres `advance_card` einen harten Malus, damit `score_agenda` gewinnt.
- Sichtbare aktivierte Corp-Fähigkeiten mit unmittelbarem Credit-/Draw-Effekt werden als Economy-Aktionen bewertet; das deckt Marine Arcologys `[A], [A]: Gain 3 credits.` ab.
- Die Corp-Board-Triage erkennt solche aktivierten Economy-Fähigkeiten ebenfalls als Economy-Fit, statt sie gegenüber `gain_credit` neutral zu lassen.

## Regressionsschutz

- Same-Turn-Advance-Closeout schlägt einfache Economy.
- Scorebare Non-Overadvance-Agenda wird gescored statt weiter advanced.
- Sichtbare Overadvance-Agenda wird nicht pauschal durch den Non-Overadvance-Malus blockiert.
- Marine-Arcology-Ability schlägt `gain_credit` und erhält Triage-Alignment.

## Validierung

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`: grün, 39 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm check:ai`: grün; bekannte Warnlisten ohne Errors.
- `git diff --check`: grün.
- `corepack pnpm typecheck`: scheitert in unberührten `apps/web/app/api/decks/strategy-profile/...`-Dateien mit Literal-Typ-Mismatches; alle vorherigen Workspace-Pakete inklusive `@netgrid/ai` laufen dabei durch.

## Rest-Risiko

- Der Closeout-Check bewertet nur sichtbare Corp-eigene Boarddaten und aktuelle LegalActions. Er simuliert keine komplette Folgesequenz mit neu erzeugten LegalActions nach jedem Advance; die Engine bleibt Regelautorität.
- Overadvance wird bewusst generisch über sichtbare Mechanik-/Textsignale erkannt. Karten mit verstecktem oder unklar formuliertem Overadvance-Payoff brauchen weiterhin passende Hint-/Definitionstexte.
