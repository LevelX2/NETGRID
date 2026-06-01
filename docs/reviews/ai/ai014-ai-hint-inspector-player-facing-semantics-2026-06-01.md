# AI014 AI Hint Inspector Player Facing Semantics

Aufgabe-ID: AI014

## Kurzfazit

AI014 vereinfacht die Standardansicht des AI Hint Inspector im Kartenkatalog auf fachliche KI-Semantik. Die offene Hauptansicht beantwortet jetzt zuerst: Was kann die Karte taktisch leisten, welche Strategie trägt sie, welche Rolle spielt sie innerhalb dieser Strategie und welche echten Prüfpunkte bleiben offen.

## Warum die vorherige Ansicht noch zu technisch war

Nach AI013 waren Zielmodell und Legacy zwar getrennt, die offene Kartenansicht zeigte aber weiterhin zu viele interne Schichten: mechanische Facts standen vor den eigentlichen Taktiksignalen, `Quality` war ein eigener Hauptblock, und Strategieanker wurden doppelt als abgeleiteter Strategieanker und gültiger `lineSupport` angezeigt. Das war technisch nachvollziehbar, wirkte in der fachlichen Prüfung aber wie ein Entwicklerdump.

## Neue Hauptstruktur

Die offene Hauptansicht besteht jetzt aus vier Bereichen:

- `Taktiksignale`: vorhandene Function-Signals aus dem Inspector-ViewModel, deutsch geführt als fachliche Funktionsaussage.
- `Strategieanker`: eindeutige Strategy Goals aus abgeleiteten Strategieankern und gültigem normalisiertem `lineSupport`.
- `Strategische Rolle`: gültige `strategicRole`-Werte als Rolle innerhalb einer Strategie.
- `Prüfpunkte`: nur fachlich relevante Prüfpunkte wie Human Review, niedrige Confidence, Descriptor-Gaps, Missing compiled hint, Invalid/Hard Problem, fehlende Taktiksignale trotz mechanischer Daten und kompakter Legacy-Hinweis.

## Zusammenführung von Strategieankern

Derived Strategy Anchors und normalisierter `lineSupport` werden in der UI zu einer eindeutigen Liste zusammengeführt. Wenn ein Strategy Goal aus beiden Quellen kommt, erscheint es nur einmal mit `Quelle: abgeleitet + lineSupport`. Reine abgeleitete Anker zeigen `Quelle: abgeleitet`, reine normalisierte `lineSupport`-Anker zeigen `Quelle: lineSupport`.

Alias-, Legacy- oder Review-`lineSupport`-Werte bleiben aus der Hauptansicht heraus und stehen weiter im Legacy-/Migrationsbereich.

## Herleitung / mechanische Details

Mechanische Facts wurden aus der Hauptansicht in `Herleitung / mechanische Details` verschoben. Dort bleiben `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `targetProfiles` und die compiled source sichtbar. Der Bereich ist standardmäßig geschlossen und steht nach der Hauptsemantik.

Wenn mechanische Daten vorhanden sind, aber keine Taktiksignale abgeleitet wurden, zeigt die Hauptansicht einen klaren Hinweis. Zusätzlich erscheint dies als fachlicher Prüfpunkt.

## Interne Qualität / Reviewdaten

Quality-/Review-Metadaten wurden aus dem Hauptblock in `Interne Qualität / Reviewdaten` verschoben. Dort bleiben vorhandene Felder wie `hintReviewed`, `strategyCovered`, `confidence`, `needsHumanReview`, Review-Datum oder Reviewer sichtbar.

Prominent bleiben nur fachliche Prüfpunkte: `needs_human_review` und `confidence low`.

## Legacy / Migration

`Legacy / Migration / Entwicklerdetails` bleibt standardmäßig geschlossen und nachrangig. Dort bleiben `roles`, `planRoles`, Legacy-`lineSupport`, Alias-/Migrationsklassifikationen, alte Rohkategorien, der Runtime-Legacy-Hinweis und der `card-role-manifest`-Hinweis sichtbar.

Die Hauptansicht zeigt Legacy nur kompakt als `Legacy-Daten vorhanden` mit Verweis auf den Detailbereich. Legacy-Existenz allein wird nicht als großer roter Problemblock dargestellt.

## Tests

Angepasst und ergänzt wurde `apps/web/app/ai-hint-inspector-ui.test.ts`:

- Hauptansicht zeigt `Taktiksignale`, `Strategieanker`, `Strategische Rolle` und `Prüfpunkte`.
- Herleitung, interne Qualität und Legacy sind standardmäßig geschlossen.
- Doppelte Strategieanker aus derived Anchors und `lineSupport` erscheinen nur einmal.
- Quellenhinweis `abgeleitet`, `lineSupport` oder `abgeleitet + lineSupport` wird angezeigt.
- Strategische Rolle erscheint nur mit gültigen Werten.
- `needs_human_review`, `confidence low`, Deferred/Human Review und Descriptor-Gaps bleiben prominent.
- Mechanische Facts und Review-Metadaten stehen nicht mehr in der offenen Hauptansicht.
- Legacy-`roles` und `planRoles` bleiben nur im Legacy-/Migrationsbereich.
- Karten ohne Taktiksignale und Karten ohne Strategieanker bleiben verständlich.
- Roh-JSON sowie Hidden-/Runtime-Felder bleiben ausgeschlossen.

## Browser-Smoke

Lokale App über `scripts/start-netgrid.ps1 -OpenUrl http://127.0.0.1:3100` gestartet.

- Desktop, `On-Call Solo Team`: offene Hauptansicht zeigt `Taktiksignale` mit `damage.payoff`, `score.agenda_action` und `tag.payoff`; `Strategieanker` führt `corp.damage_kill`, `corp.fast_advance` und `corp.tag_trace_punish` eindeutig zusammen und zeigt Quellen wie `abgeleitet + lineSupport`; `Strategische Rolle` zeigt `punish_payoff`; Herleitung, interne Qualität und Legacy bleiben geschlossen.
- Desktop, `Ice Transmutation`: offene Hauptansicht zeigt `Keine Taktiksignale vorhanden`, den Hinweis `Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet`, `Keine aktive Strategiezuordnung` und die fachlichen Prüfpunkte `needs_human_review`, `confidence low`, Taktiksignal-Lücke und Deferred/Human Review.
- Schmaler Viewport `390x844`: `On-Call Solo Team` bleibt mit Taktiksignalen, Strategieankern, strategischer Rolle und Prüfpunkten lesbar; der Inspector-Panelbereich hat keinen eigenen horizontalen Overflow. Seitenweiter Overflow besteht weiter als bekannte Layout-Eigenschaft außerhalb dieses AI014-Panels.
- Browser-Konsole: keine Error-Logs.

## Checks

Grün:

- `corepack pnpm --filter @netgrid/web exec vitest run app/ai-hint-inspector-ui.test.ts`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy` mit bestehenden warn-only Legacy-/Descriptor-Klassen
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-quality` mit bestehenden warn-only Legacy-/Singleton-Klassen
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git diff --cached --check`

Der gesamte Webtest wurde nicht erneut ausgeführt, weil AI014 nur die Inspector-UI und ihre gezielten Tests ändert und die bekannte Catalog-/Proteus-Baseline-Drift nicht Teil dieses Pakets ist.

## Bewusst nicht geändert

- Keine Hintänderung.
- Keine Hintmigration.
- Keine Semantikänderung.
- Keine Function-Signal-Ableitungsänderung.
- Keine neuen Taktiksignale.
- Keine neuen Strategieanker.
- Keine Plannerwirkung.
- Keine Action-Score- oder PlanWeight-Änderung.
- Keine DeckDoctrine-Scoringänderung.
- Keine Engine-/Legalitätswirkung.
- Keine Taxonomieänderung.
- Keine Profil-/Default-Umschaltung.
- Keine Catalog-/Proteus-Baseline-Korrektur.
- Keine neue Ableitungslogik im React/UI-Code.
- Keine Hidden-Info- oder Runtime-Spieldatenanzeige.
