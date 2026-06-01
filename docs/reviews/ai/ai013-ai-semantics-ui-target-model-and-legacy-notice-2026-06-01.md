# AI013 AI Semantics UI Target Model and Legacy Notice

Aufgabe-ID: AI013

## Kurzfazit

AI013 trennt die KI-Semantik-UI klarer nach Zielmodell, Diagnose und Legacy-/Migrationsdaten. Der Kartenkatalog zeigt in der offenen Inspector-Hauptansicht nur noch Zielmodell-Gruppen und kompakte Prüfpunkte. Der DeckDoctrine Strategy Viewer ist sichtbar als diagnostisches KI-Deckprofil ohne direkte Plannerwirkung gekennzeichnet; Legacy-Signal-Counts sind nachrangig und standardmäßig eingeklappt.

## Bezug zu AI012

AI012 hat als Readiness-Audit festgehalten, dass `roles`, `planRoles`, `card-role-manifest` und `ownDeckDoctrine.planWeights` noch runtimewirksam sind, während neue Semantikfelder teils diagnostisch und teils runtime-nah sind. AI013 setzt daraus nur die UI-Trennung um. Es wurden keine Hints migriert, keine Legacy-Daten entfernt und keine Plannerpfade geändert.

## Warum Zielmodell und Legacy getrennt werden

Die bisherige UI konnte Legacy-Rollen, Planrollen und Legacy-Signal-Counts so prominent zeigen, dass sie wie die neue fachliche KI-Semantik wirkten. Das ist fachlich irreführend, weil die neue Zielsemantik aus mechanischen Facts, Function-Signals, Strategy Anchors, `strategicRole` und `quality` besteht, während alte Rollenpfade nur noch Kompatibilitäts-, Debug- und Migrationsbestand sind.

## AI Hint Inspector

Die offene Hauptansicht ist jetzt in diese Zielmodell-Sektionen geschnitten:

- `Mechanische Facts`: `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `targetProfiles`.
- `Taktiksignale (Function-Signals)`: nur aus dem vorhandenen Inspector-ViewModel.
- `Strategieanker`: abgeleitete Strategy Anchors und nur normalisierter `lineSupport`.
- `Strategische Rolle`: gültige `strategicRole`-Werte.
- `Quality`: nur tatsächlich vorhandene Quality-Felder.
- `Prüfpunkte`: compiled-hint/mechanical/generated Status, Descriptor-Gaps, Deferred/Human Review, Missing compiled hint, Invalid/Hard Problem und kompakter Legacy-Hinweis.

Legacy-Details stehen im geschlossenen Bereich `Legacy / Migration / Entwicklerdetails`. Dort bleiben `roles`, `planRoles`, Legacy-`lineSupport`, Alias-/Migrationsklassifikationen, alte Rohkategorien und ein `card-role-manifest`-Hinweis sichtbar.

## Legacy-Hinweise

Die Hauptansicht zeigt bei vorhandenem Legacy nur kompakt `Legacy-Daten vorhanden` plus den Hinweis:

`Hinweis: Legacy-Rollen werden intern noch teilweise von der KI verwendet.`

Der Legacy-/Migrationsbereich enthält zusätzlich:

`Diese Felder gehören zum bisherigen KI-Pfad und werden noch nicht vollständig entfernt, solange Teile der KI darauf angewiesen sind. Sie sind nicht die neue Zielsemantik.`

Das alte Fallback-Panel ohne Inspector heißt jetzt `Legacy / Migration / KI-Hinweise` und ist weiterhin geschlossen.

## DeckDoctrine Viewer

Der DeckDoctrine Strategy Viewer zeigt jetzt:

- `Diagnostisches KI-Deckprofil`.
- `Noch keine direkte Plannerwirkung`.
- `Strategieprofile werden aus neuer KI-Semantik berechnet`.
- `Legacy-Signale werden getrennt gezählt`.

Die Strategy Scores bleiben sichtbar, sind aber als `Strategien (diagnostisch)` gekennzeichnet. `Legacy-Signal-Counts` wurden in den standardmäßig geschlossenen Bereich `Legacy / Migration Signal-Counts` verschoben und die Gruppen heißen `Legacy roles`, `Legacy planRoles`, `Legacy lineSupport` beziehungsweise `Weitere Legacy-/Migrationssignale`.

## Tests

Gezielte Tests wurden ergänzt oder angepasst:

- `apps/web/app/ai-hint-inspector-ui.test.ts`: Zielmodell-Sektionen, Legacy-Hauptansicht nur kompakt, geschlossener Legacy-/Migrationsbereich, Runtime-Legacy-Hinweis, keine JSON-Wand, keine Hidden-/Runtime-Felder.
- `apps/web/app/api/decks/strategy-profile/strategy-profile-data.test.ts`: diagnostisches Deckprofil, keine direkte Plannerwirkung, neue KI-Semantik als Quelle, getrennte Legacy-Signale und Runtime-/Planner-Feldschutz.
- `apps/web/app/deck-strategy-profile-ui.test.ts`: bestehende Field-Safety- und Formatierungsabdeckung bleibt grün.

## Browser-Smoke

Lokale App über `scripts/start-netgrid.ps1 -OpenUrl http://127.0.0.1:3100` gestartet.

- Desktop: Kartenkatalog zeigt `KI-Semantik Zielmodell`, `Mechanische Facts`, `Taktiksignale (Function-Signals)`, `Strategieanker`, `Strategische Rolle`, `Quality`, `Prüfpunkte`, `Legacy / Migration / Entwicklerdetails` und den Runtime-Legacy-Hinweis.
- Desktop: Deck-Editor zeigt `Diagnostisches KI-Deckprofil`, `Noch keine direkte Plannerwirkung`, neue KI-Semantik als Aggregationshinweis und geschlossene `Legacy / Migration Signal-Counts`.
- Kleiner Viewport `390x844`: Deck-Viewer bleibt lesbar, Legacy-Details bleiben geschlossen, der Deckprofil-Panelbereich hat keinen eigenen horizontalen Overflow.
- Browser-Konsole: keine Error-Logs.

## Checks

Grün:

- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy` mit bestehenden warn-only Legacy-/Descriptor-Klassen
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-quality` mit bestehenden warn-only Legacy-/Singleton-Klassen
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- gezielte Webtests: `app/ai-hint-inspector-ui.test.ts`, `app/deck-strategy-profile-ui.test.ts`, `app/api/decks/strategy-profile/strategy-profile-data.test.ts`

Nicht grün, nicht AI013-blockierend:

- `corepack pnpm --filter @netgrid/web test` scheitert nur in `app/api/cards/catalog-data.test.ts` an der bekannten Catalog-/Proteus-Baseline-Drift: AI-supported Count 564 statt alter Erwartung, Proteus-AI-Promotion, altes `rig_first` und alter Descriptor-Gap-Name. AI013 hat keine Catalog-/Proteus-Baseline geändert.

## Bewusst nicht geändert

- Keine Hintänderung.
- Keine Hintmigration.
- Keine Taxonomieänderung.
- Keine Function-Signal-Ableitungsänderung.
- Keine Plannerwirkung.
- Keine Action-Score- oder PlanWeight-Änderung.
- Keine DeckDoctrine-Scoringänderung.
- Keine Engine-/Legalitätswirkung.
- Keine Legacy-Entfernung.
- Keine Profil-/Default-Umschaltung.
- Keine Catalog-/Proteus-Baseline-Korrektur.
- Keine neue Ableitungslogik im React/UI-Code.
- Keine Hidden-Info- oder Runtime-Spieldatenanzeige.

## Bekannte Grenzen

- Legacy ist intern weiter runtimewirksam.
- Die spätere Planner-Ablösung von `roles`, `planRoles`, `card-role-manifest` und bestehenden DeckDoctrine-/Legacy-PlanWeights bleibt separates Folgepaket.
- Breitere Direct-Deriver-/Descriptor-Erweiterungen, besonders für `costProfile`, bleiben separates Folgepaket.
