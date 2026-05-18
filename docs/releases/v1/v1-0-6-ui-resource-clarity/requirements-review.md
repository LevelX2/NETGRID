# V1.0.6 Requirements Review - Aktionen, Credits und Kartenanzeige

Stand: 2026-05-05
Status: bestanden

## Review-Ergebnis

Die V1.0.6-Anforderungen sind ausreichend konkret, um nach dem V1.0.5-Gate eine Umsetzung zu beauftragen. Der Scope ist ein enger UI-/Präsentationsrelease: Aktionen werden als sichtbare Slots, Credits als Credit-/Münzressource und Card Display als kompakte, verständliche Vorschau-Steuerung modelliert.

V1.0.6 verändert keine Engine-Regeln, keine Karten, keine Mechaniken, keine LegalAction-/PlayerAction-Verträge, keine Replaydaten und keinen StateHash.

## Geprüfte Artefakte

- `docs/releases/v1/v1-0-6-ui-resource-clarity/plan.md`
- `docs/releases/v1/v1-0-6-ui-resource-clarity/requirements.md`
- `docs/releases/v1/v1-0-6-ui-resource-clarity/resource-card-display-spec.md`
- `docs/releases/v1/v1-0-6-ui-resource-clarity/test-matrix.md`
- `docs/releases/v1/v1-0-6-ui-resource-clarity/browser-playtest-smoke.md`
- `docs/releases/v1/v1-0-5-action-board-ux/requirements.md`
- `docs/releases/v1/v1-0-5-action-board-ux/action-board-ux-spec.md`
- `docs/releases/v1/v1-0-5-action-board-ux/board-run-ui-spec.md`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

## Konsistenzprüfung

| Vorgabe | Status | Ergebnis |
| --- | --- | --- |
| Engine bleibt Regelautorität | pass | V1.0.6 ist ausdrücklich reine Darstellung. |
| Technische `clicks` bleiben unverändert | pass | Nur sichtbare Labels wechseln zu `Aktionen`. |
| Credits bleiben vorhandene Ressource | pass | Nur Darstellung wird verbessert. |
| Keine offiziellen Assets | pass | Credit-Optik ist generisch. |
| Keine Hidden-Info-Leaks | pass | Card Display, Tooltip und Gegnerstatus haben No-Leak-Regeln und Testspuren. |
| Keine Replay-/StateHash-Wirkung | pass | Aktionsslot-Kapazität bleibt lokale UI-Präsentation. |
| V1.0.5 bleibt geschützt | pass | V1.0.5-Funktionen sind explizite Regression in Testmatrix und Browser-Smoke. |
| Umsetzung ist beauftragbar | pass | Plan, Requirements, Spec, Testmatrix und Smoke enthalten konkrete Akzeptanzkriterien. |

## Risikoentscheidungen

| Risiko | Entscheidung |
| --- | --- |
| Verbrauchte Aktionen sind nicht als eigenes Engine-Feld vorhanden. | Die UI nutzt eine tab-lokale Displaykapazität aus PlayerView, Side-Basiswerten und Turnwechseln. Falls das in der Umsetzung nicht stabil reicht, ist ein Requirements-Amendment vor einer Contract-Erweiterung Pflicht. |
| Bonusaktionen könnten zukünftige Mechaniken benötigen. | Für V1.0.6 reicht: Wenn verbleibende Aktionen die bekannte Kapazität überschreiten, wird die Anzeige lokal erweitert. |
| `Credits` haben kein offizielles lokales Symbol. | V1.0.6 nutzt generische Coin-/Credit-Optik ohne offizielle Symbole. |
| Card-Display-Modi könnten trotz Umbau redundant bleiben. | Die Modusaufgaben sind verbindlich getrennt: Bild = Bild/Fallback, Text = dichte Textkarte, Kompakt = platzsparend mit Tooltip/Overlay. |
| Tooltip-Nutzung könnte Maus-only bleiben. | Requirements verlangen Fokus- oder gleichwertige Tastaturbedienung. |

## Offene Punkte

Keine blockerrelevanten offenen Punkte.

Normale Implementierungsentscheidungen bleiben offen, aber ausreichend begrenzt:

- genaue Slotgröße und Slotposition im Spielerstatus,
- ob gegnerische Aktionsslots genauso prominent oder kompakter erscheinen,
- konkrete generische Credit-Icon-Form,
- ob Card-Display-Buttons nur Icons oder Icon plus kurzer Text auf Desktop zeigen,
- ob Kompaktmodus Regeltext per Tooltip, Fokus-Overlay oder kleinem Ausklappbereich zeigt,
- ob der Bonusaktionsfall zunächst über Unit-Test-Fixture statt realer Karte browsergetestet wird.

## Gate

`V1_0_6_requirements_freeze_done: true`

`ready_for_implementation_after_V1_0_5: true`
