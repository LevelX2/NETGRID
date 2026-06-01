# AI018c - Icebreaker Subtype Coverage Fix

Datum: 2026-06-01

## Ergebnis

AI018c korrigiert die beiden nach der AI018-Abnahme noch zu breit abgeleiteten subtype-limited Icebreaker:

- Dogcatcher erzeugt nicht mehr `breaker.watchdog`, sondern flache support-only Signale für das eingeschränkte Sentry-Subtype-Profil.
- Reflector erzeugt nicht mehr `breaker.ap`, sondern flache support-only Signale für das eingeschränkte AP-Subtype-Profil.
- Flak bleibt der Kontrollfall für echte allgemeine AP-Coverage mit `breaker.ap`.

Keine Änderung hat Plannerwirkung, Action Scores, PlanWeights, Engine-Regeln, Legalität, Targeting-KI, Profile, Defaults oder UI-Ableitungslogik.

## Geänderte Signale

Neue support-only Taktiksignale:

- `breaker.sentry_subtype_limited`
- `breaker.ap_subtype_limited`
- `breaker.subtype.pit_bull`
- `breaker.subtype.hellhound`
- `breaker.subtype.bloodhound`
- `breaker.subtype.watchdog`
- `breaker.subtype.stun`
- `breaker.subtype.hellbolt`
- `breaker.subtype.knockout`

Katalogstand nach AI018c:

- Taktiksignale: 88
- Function-Signal-Derivation-Regeln: 107
- Strategy-Anchor-fähige Signale: unverändert nur über bestehende `mayAnchorStrategy`-Policy
- Neue Signale: alle `supportOnly: true`, `mayAnchorStrategy: false`, `targetProfileRelevant: false`

## Karten-Delta

| Karte | Vorher | Nachher | Anchors | TargetProfile |
| --- | --- | --- | --- | --- |
| `onr_v1_018_dogcatcher` Dogcatcher | `breaker.watchdog` | `breaker.sentry_subtype_limited`<br>`breaker.subtype.bloodhound`<br>`breaker.subtype.hellhound`<br>`breaker.subtype.pit_bull`<br>`breaker.subtype.watchdog` | - | nicht erforderlich |
| `onr_v1_055_reflector` Reflector | `breaker.ap` | `breaker.ap_subtype_limited`<br>`breaker.subtype.hellbolt`<br>`breaker.subtype.knockout`<br>`breaker.subtype.stun` | - | nicht erforderlich |
| `onr_v1_027_flak` Flak | `breaker.ap` | unverändert `breaker.ap` | - | nicht erforderlich |

Bulldozer bleibt bewusst unverändert/deferred. AI018c fügt keine spekulativen subtype-limited Signale für Hardware oder nicht geprüfte Supportfälle hinzu.

## Post-Review- und Search/Recovery-Abnahme

Die vollständige AI018-Post-Review-Liste bleibt in `ai018-adjustments-icebreaker-semantics-review-2026-06-01.md` und dem zugehörigen JSON-Report. AI018c aktualisiert dort nur die Dogcatcher- und Reflector-Zeilen.

Bestätigte Abnahmezählung:

- 85 aktive/compiled Zuordnungen geprüft
- 7 inaktive Classic-Kandidaten geprüft
- 10 Search-/Recovery-Fälle separat geprüft
- Search-/Recovery-Anker unverändert: 6 behalten, 4 generische Anker entfernt

## Implementationsgrenze

Die breite `breakerProfile.coverage` bleibt als bestehende strukturierte Datenbasis erhalten. AI018c ergänzt nur:

- eine read-only Derivation-Quelle `breakerProfile.restrictions`
- ein Derivation-Gate `breakerProfileRestrictionAbsent`
- eine generierte Dogcatcher-Restriction `pit_bull_hellhound_bloodhound_watchdog_only`

Damit können allgemeine Coverage-Signale für eingeschränkte Profile unterdrückt werden, ohne Planungsdaten, Runtime-Regeln oder Zielauswahl zu verändern.

## Verifikation

Ausgeführt:

- `node scripts/check-ai-derived-facts.mjs --write` -> OK, 0 Errors
- `node scripts/check-ai-derived-facts-full.mjs --write` -> OK, 0 Errors
- `corepack pnpm build:ai-compiled-hints` -> OK
- `corepack pnpm build:ai-hint-inspector-index` -> OK
- `node scripts/check-ai-hint-compiled-index.mjs --write` -> OK, 0 Errors
- `corepack pnpm check:ai-strategy-taxonomy` -> OK, 88 Function-Signale, 0 Errors
- `corepack pnpm check:ai-hint-inspector-index` -> OK
- `corepack pnpm vitest run packages/ai/src/strategy-taxonomy.test.ts packages/ai/src/ai-hint-inspector-index.test.ts` -> 2 Dateien, 17 Tests bestanden
- `corepack pnpm check:ai:full` -> OK, 0 Errors

Die Generatorwarnungen bleiben bestehende warn-only Klassen und sind nicht neu als Hard Error eingeführt.
