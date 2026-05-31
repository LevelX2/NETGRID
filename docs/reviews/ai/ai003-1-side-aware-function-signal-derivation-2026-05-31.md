# AI003-1 Side-aware Function Signal Derivation

Datum: 2026-05-31
Aufgabe: AI003-1
Aktualisiert: AI003
Status: umgesetzt, read-only

## Kurzfazit

AI003-1 schaerft den AI003-Vertrag fuer abgeleitete Function-Signals und Strategieanker. Ableitungsregeln duerfen nicht mehr allein aus `effects.kind` strategische Bedeutung ziehen, sondern pruefen jetzt Seite, Kartentyp und fachlichen Scope. Damit bleiben mechanische Hints weiter read-only, aber offensichtliche Cross-Side-Fehlschluesse werden hard-gate-faehig verhindert.

Keine Runtime-, Engine-, LegalAction-, Planner-, Profil-, Deck- oder Hint-Migration wurde vorgenommen.

## Vertragsaenderung

`data/ai/function-signal-derivation-v1.json` beschreibt jetzt side-aware Gates fuer Ableitungsregeln:

- `side`
- `cardType`
- `effectScope`
- `target`
- `controller`
- `beneficiary`
- `remoteRole`
- `breakerProfileCoverage`

Der Check `corepack pnpm check:ai-strategy-taxonomy` validiert diese Gates zusaetzlich:

- unbekannte Gate-Felder sind Hard Errors;
- ungueltige Gate-Werte sind Hard Errors;
- jede Regel mit `strategyAnchorFor` braucht ein `side`-Gate;
- Strategieanker duerfen nur zu der Seite passen, die das `side`-Gate erlaubt;
- effect-basierte Strategieanker ohne `match.scope` oder `gates.effectScope` bleiben Warnungen.

## Geschlossene Fehlerklasse

Die bisherige rein `effects.kind`-basierte Ableitung konnte mechanisch gleiche Begriffe auf die falsche Spielseite projizieren. AI003-1 verhindert diese Kategorien:

- Corp-`extra_action` erzeugt keinen Runner-Run-Tempo-Anker.
- Corp-ICE-`future_run_effect` erzeugt keinen Runner-Run-Tempo-Anker.
- Corp-`topdeck_info` erzeugt keinen Runner-R&D-Druck-Anker.
- Runner-`tag_source` erzeugt keinen Corp-Tag-/Punish-Anker.
- Runner-`damage` erzeugt keinen Corp-Damage-/Kill-Anker.

Der neue Report weist `preventedWrongSideAnchorCount: 26` und `wrongSideAnchorMatchCount: 0` aus.

## Bewusst erhaltene Ableitungen

Die gewollten positiven Faelle bleiben aktiv:

- Runner-R&D-Multiaccess erzeugt `access.rnd_multiaccess` und die Strategieanker `runner.rnd_pressure` sowie `runner.interface_closeout`.
- Corp-Tag-Punish-Payoff erzeugt `tag.payoff` und `corp.tag_trace_punish`.
- Corp-Damage-Payoff erzeugt `damage.payoff` und `corp.damage_kill`.

Diese Faelle sind als Smoke-Tests im Report und in `packages/ai/src/strategy-taxonomy.test.ts` abgesichert.

## Ergebniszahlen

- Strategy Goals: 20
- Strategic Roles: 11
- Function-Signals: 51
- Derivation Rules: 57
- Karten mit abgeleiteten Function-Signals: 330
- Karten mit abgeleiteten Strategieankern: 226
- Abgeleitete Strategieanker insgesamt: 277
- Hard Errors: 0
- Warnings: 70

Die 70 Warnings bleiben die bekannten AI003-Warnklassen: Legacy-`lineSupport`, unbekannte `roles`/`planRoles` und drei Descriptor-Gaps. Sie sind nicht neu durch AI003-1.

## Artefakte

- `data/ai/function-signal-derivation-v1.json`
- `scripts/check-ai-strategy-taxonomy.mjs`
- `packages/ai/src/strategy-taxonomy.test.ts`
- `docs/reviews/ai/ai003-1-side-aware-function-signal-derivation-report-2026-05-31.json`
- `docs/reviews/ai/ai003-strategy-taxonomy-report-2026-05-31.json`
- `docs/reviews/ai/ai003-strategy-taxonomy-alias-report-2026-05-31.json`

## Verifikation

- `corepack pnpm check:ai-strategy-taxonomy`: bestanden, 0 Errors, 70 bekannte Warnings.
- `corepack pnpm check:ai-compiled-hints`: bestanden, 564 Karten, 0 Errors.
- `corepack pnpm check:ai-hint-quality`: bestanden, 564 Hints, 0 Errors.
- `corepack pnpm check:ai-approval-consistency`: bestanden, 564 `ai_supported` Karten konsistent.
- `corepack pnpm --filter @netgrid/ai test`: bestanden, 30 Testdateien, 603 Tests.
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`: bestanden.
- `git diff --check`: bestanden; Git meldete nur den bestehenden LF/CRLF-Hinweis fuer `scripts/check-ai-strategy-taxonomy.mjs`.
- `git diff --cached --check`: bestanden.

## Nicht-Scope

- keine Engine-Regelaenderung
- keine LegalAction-Aenderung
- keine Plannerwirkung
- keine Action-Score- oder PlanWeight-Aenderung
- keine Profil- oder Default-Umschaltung
- keine Deckaenderung
- keine Hint-Migration
- keine Aenderung an `ai-card-hints-active.json`
- keine Aenderung an `ai-card-hints-compiled.json`
