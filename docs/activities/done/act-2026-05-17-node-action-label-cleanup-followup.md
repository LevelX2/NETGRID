---
activityId: act-2026-05-17-node-action-label-cleanup-followup
status: done
kind: fix
area: cards
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-installed-card-action-label-cleanup
resultArtifacts:
  - packages/engine/src/mechanics/payment-costs.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "South African Mining Corp"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "installed asset names"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Follow-up: Node-Aktionslabels und fehlende South-African-Mining-Corp-Fähigkeit

## Ziel

Direkt am Node angezeigte Aktionsbuttons sollen klar benennen, welche Aktion ausgeführt wird. Der Button soll den Node-Namen nicht redundant wiederholen, wenn der Kartenkontext durch die Position klar ist. Zusätzlich muss geprüft werden, warum die eigentliche Fähigkeit von `South African Mining Corp` nicht angeboten wird.

## Kontext und Quellen

- Vorarbeit: `act-2026-05-17-installed-card-action-label-cleanup` wurde bereits abgeschlossen.
- Nutzerbefund vom 2026-05-17 nach der Vorarbeit: Bei einem neu installierten Node erscheint die Aktion zwar korrekt direkt unter dem Node, der Aktionstext beginnt aber weiterhin mit dem Namen des Nodes.
- Dadurch ist im kompakten Button kaum erkennbar, was die Aktion eigentlich macht.
- Mögliche Erklärung: Falls der Fix bereits im Code liegt, kann ein altes laufendes Spiel oder ein nicht neu gestarteter Web-/Server-Prozess noch die alte Anzeige zeigen. Trotzdem braucht der Fall eine gezielte Nachprüfung.
- Nachtrag vom 2026-05-17: Browser-Hard-Refresh mit `Strg+F5` hat den Befund nicht behoben. Reiner Browser-Cache ist damit unwahrscheinlich; zu prüfen bleiben Implementierungslücke, laufender Dev-/Serverprozess oder ein Labelpfad, den die Vorarbeit nicht abgedeckt hat.
- Nachtrag vom 2026-05-17: Die sichtbare Aktion am Node war offenbar nicht die Node-Fähigkeit, sondern eine Trash-Aktion. Weil der Button nur mit dem Node-Namen begann, war nicht erkennbar, dass der Klick den Node trasht.
- Präzisierung vom 2026-05-17: Nicht vorschnell als Trash-Kosten-Fall behandeln. Bei Nodes kann es eine generische Standardmöglichkeit zum Trashen geben, die nichts mit aufgedruckten Trash-Kosten zu tun hat. Der Worker soll Regel-/Engine-Vertrag prüfen und das Label entsprechend korrekt benennen.
- Konkreter Kartenbefund: Bei `South African Mining Corp` fehlt die eigentliche Node-Fähigkeit `bezahle 3 Aktionen und erhalte 6 Credits` vollständig bzw. wird nicht als ausführbare Aktion angeboten.

## Scope

- Prüfen, ob der abgeschlossene Label-Cleanup-Fix im aktuell laufenden Build/Server wirklich aktiv ist.
- Einen konkreten Node-Fall reproduzieren, bei dem die Aktion direkt unter dem Node hängt und trotzdem mit dem Node-Namen beginnt.
- Die Label-Kürzung für Node-Kontextaktionen so nachziehen, dass sie nicht nur bei einzelnen Karten, sondern generisch für installierte Node-Aktionen greift.
- Trash-Aktionen direkt an Nodes klar als Trash-Aktion beschriften, z. B. `Trashen`; nur bei tatsächlichen Kosten-/Access-Fällen `Trash-Kosten bezahlen`, statt nur den Kartennamen zu zeigen.
- `South African Mining Corp` gegen lokale Quellen prüfen und die Korp-Fähigkeit modellieren bzw. sichtbar machen: 3 Aktionen bezahlen, 6 Credits erhalten.
- Sicherstellen, dass die Korp-Fähigkeit nur der Korp angeboten wird und dass Trash-Aktion und Korp-Node-Fähigkeit nicht verwechselt werden.
- Systematisch alle vergleichbaren Node-Trash-Aktionen prüfen: Wenn eine Trash-Aktion am Node hängt, muss das Label als Trash-Aktion erkennbar sein; Kosten nur nennen, wenn die konkrete Aktion tatsächlich Kosten bezahlt.
- Systematisch vergleichbare installierte Nodes/Assets prüfen, deren eigene Fähigkeiten eine oder mehrere Aktionen kosten; solche Fähigkeiten sollen als kartennahe Aktionen am Node/Asset erscheinen, nicht nur in einer zentralen Liste.
- Sicherstellen, dass zentrale Aktionslisten weiterhin den Kartennamen behalten dürfen, wenn der Kartenkontext dort fehlt.
- Prüfen, ob ein laufender Server-/Client-Neustart nötig ist, damit die Änderung sichtbar wird, und das Ergebnis dokumentieren.
- Browser-Cache als alleinige Ursache nicht mehr annehmen; `Strg+F5` wurde bereits erfolglos getestet.

## Nicht im Scope

- Keine breite Engine-Regeländerung außerhalb der konkret fehlenden `South African Mining Corp`-Fähigkeit.
- Keine Änderung an bestehenden LegalAction-Grundverträgen, `actionId`, Replay, StateHash oder KI über die notwendige Kartenfähigkeit hinaus.
- Keine erneute breite Umgestaltung aller Kartenaktionsmenüs.
- Keine Entfernung von Kartennamen aus Kontexten ohne sichtbaren Kartenbezug.
- Keine KI-Optimierung für die Nutzung von `South African Mining Corp`, außer falls bestehende KI-Tests eine Mindestbehandlung brauchen.

## Akzeptanzkriterien

- [ ] Mindestens ein Node-Fall mit kartennahem Aktionsbutton ist reproduziert oder als stale-runtime-Fall erklärt.
- [ ] Direkt am Node angezeigte Aktionsbuttons beginnen nicht redundant mit dem Node-Namen.
- [ ] Die eigentliche Aktion bleibt im Button klar erkennbar.
- [ ] Trash-Aktionen an Nodes sind als Trash-Aktion erkennbar und nicht nur über den Kartennamen beschriftet.
- [ ] Vergleichbare Node-Trash-Aktionen wurden systematisch geprüft und nutzen konsistente, verständliche Trash-Labels; Trash-Kosten werden nur genannt, wenn sie tatsächlich Teil der Aktion sind.
- [ ] `South African Mining Corp` bietet der Korp eine ausführbare Fähigkeit an, um 3 Aktionen zu bezahlen und 6 Credits zu erhalten.
- [ ] Vergleichbare installierte Nodes/Assets mit eigenen Aktionskosten-Fähigkeiten wurden geprüft; ihre Fähigkeiten erscheinen am Kartenort, sofern der Kartenkontext sichtbar ist.
- [ ] Die `South African Mining Corp`-Fähigkeit revalidiert Side, StateVersion, installierte/rezzed Quelle, verfügbare Aktionen und Timing.
- [ ] Trash-Aktion und Korp-Node-Fähigkeit werden UI-seitig getrennt und nicht miteinander verwechselt.
- [ ] Zentrale Aktionsleisten behalten nötigen Kontext, falls der Kartencontainer dort nicht sichtbar ist.
- [ ] Falls ein Neustart von Webclient/Server nötig war, ist das in der Ergebnisnotiz festgehalten.
- [ ] Der Befund ist nach `Strg+F5` gezielt neu bewertet; falls weiterhin reproduzierbar, ist die tatsächliche Labelquelle identifiziert.
- [ ] Fokussierte Engine- und Web-/Label-Regressionen decken Trash-Label und `South African Mining Corp`-Fähigkeit ab, oder Testauslassungen sind begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche UI-Startpunkte sind die kontextuelle Kartenaktionslabel-Ableitung in `apps/web/app/action-board-ui.ts` und die Kartenaktionsdarstellung in `apps/web/app/page.tsx`.
- Wahrscheinliche Engine-/Kartendaten-Startpunkte sind die Node-/Asset-Resolverpfade in `packages/engine/src/index.ts` bzw. ausgelagerte Mechanics-Module und die Kartendaten für `South African Mining Corp`.
- Bei der Prüfung zwischen echter Regression und altem laufendem Bundle unterscheiden.
- Falls der Text aus der Engine-LegalAction kommt, sollte die Kürzung trotzdem in der UI-Kontextschicht passieren, nicht durch Änderung stabiler Action-IDs.
- Für Trash-Aktionen ist der Kartenname im zentralen Aktionskontext hilfreich, am Kartenort aber nicht ausreichend; dort muss die Aktion selbst sichtbar werden. Ob Kosten dazugehören, muss aus dem konkreten Regel-/LegalAction-Vertrag kommen.
- Für eigene Node-/Asset-Fähigkeiten mit Aktionskosten gilt dieselbe UI-Leitlinie wie bei anderen kartengebundenen Aktionen: Der Kartencontainer liefert das Subjekt, der Button zeigt Kosten und Effekt.

## Ergebnisnotiz

Erledigt. Der Befund lag nicht nur an altem Browser-Cache: Der v1920-Asset-Faehigkeitspfad hatte noch kein kompaktes Kartenkontextlabel und `South African Mining Corp` war lokal abweichend von der Textquelle als 1 Aktion/8 Credits modelliert. Die Karte nutzt jetzt `[A], [A], [A]: Gain [6]`, revalidiert die 3 Aktionen, trasht sich selbst und erscheint am Kartenort als `6 Credits nehmen`; zentrale Listen behalten den Kartennamen. Trash-Kontextaktionen werden am Kartenort weiter generisch als `Trashen` angezeigt, ohne Trash-Kosten zu behaupten. Kein laufender Web-/Serverprozess wurde im Paket neu gestartet; die Ursache ist im Quellcode behoben und durch Tests abgedeckt.
