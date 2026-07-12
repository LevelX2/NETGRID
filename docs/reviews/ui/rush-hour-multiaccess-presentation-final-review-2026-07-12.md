# Final Review: Rush-Hour-Mehrfachzugriff

Datum: 12. Juli 2026  
Match: `match_7bfe82501d0fdcb8`  
Arbeitsbranch: `codex/rush-hour-access-presentation`  
Prozess: `docs/architecture/ui/rush-hour-multiaccess-presentation-process-2026-07-12.md`

## Ergebnis

Die Engine hatte den Rush-Hour-Run korrekt als vier verschiedene
R&D-Karteninstanzen aufgelöst. Die beiden Präsentationsfehler im Webclient sind
behoben:

- Access-Fenster zeigen bei Mehrfachzugriffen den generischen Fortschritt
  `Zugriff N von M` aus den bereits öffentlichen Eventfeldern.
- Öffentliche Access-Events werden nach ihrem Eintreffen bis zur Bestätigung in
  einer lokalen Queue gehalten. Spätere Installations-, Zugende- oder andere
  Events verdrängen sie nicht mehr.
- Matchwechsel leeren Dismiss- und Queue-Zustände. Eine matchlokale Event-ID wie
  `evt_13` aus dem ersten Serienspiel kann deshalb kein gleichnamiges Event im
  zweiten Spiel mehr ausblenden.

## Ursachen-Evidence

Im ersten Spiel der Seitenwechsel-Serie, `match_b0080115bddbce23`, war
`evt_13` ein bestätigter Zugriff auf BBS Whispering Campaign. Im zweiten Spiel
war `evt_13` die dritte Rush-Hour-Karte, eine andere Instanz von Data Wall. Da
der frühere Webzustand `dismissedAccessEventIds` beim Matchwechsel nicht
zurücksetzte, wurde der neue Zugriff als bereits bestätigt behandelt.

Der vierte Zugriff `evt_14` wurde im zweiten Spiel von `evt_15` Broker
installieren und `evt_16` Zug beenden gefolgt. Die frühere Retention ließ einen
Access nicht über `install_card` hinaus bestehen. Die neue Queue koppelt die
Lebensdauer stattdessen an die Bestätigung der konkreten Event-ID.

## Umsetzung

- `apps/web/app/access-presentation-queue.ts` kapselt die side-sichere,
  deduplizierte Queue für öffentliche Karten-Accesses.
- `apps/web/app/page.tsx` setzt Präsentationszustand pro Match zurück, verfolgt
  neue Event-Tail-Einträge und zeigt den ältesten unbestätigten Access.
- Ältere gepufferte Reviews erhalten keine LegalActions des inzwischen neueren
  PlayerView-State.
- `apps/web/features/actions/access-review-derivation.ts` leitet den generischen
  Fortschritt aus `accessIndex` und `effectiveAccessCount` ab.
- `AccessReviewModals.tsx` zeigt diesen Fortschritt als Eyebrow des
  Access-Fensters.

## Hidden-Info- und Regelgrenzen

- Die Queue akzeptiert nur `access_card`-Events, die für den Viewer bereits
  `cardDefinitionId` und `title` enthalten.
- Redigierte Zugriffe werden nicht rekonstruiert oder gepuffert.
- Engine, PublicEvent-Vertrag, LegalActions, Replay, StateHash und Rush Hour
  selbst blieben unverändert.

## Regressionen

Die fokussierte Matrix deckt ab:

- vier Accesses in Eventreihenfolge trotz wiederholter Kartendefinitionen;
- Fortschritt von `1 von 4` bis `4 von 4`;
- Persistenz des vierten Accesses über `install_card` und `end_turn`;
- keine erneute Aufnahme bestätigter Events;
- keine Aufnahme redigierter Accesses;
- Reset von Dismiss- und Queue-Zustand beim Matchwechsel;
- bestehende Access-, Outcome-, Action-Board- und Layering-Verträge.

## Verifikation

- 5 fokussierte Vitest-Dateien: 135 Tests bestanden;
- vollständige Web-Suite: 41 Testdateien mit 559 Tests bestanden;
- `corepack pnpm --filter @netgrid/web typecheck`: erfolgreich;
- `git diff --check`: erfolgreich.

## Grenzen und Nicht-Ziele

- Es wurde kein allgemeines Event-Replay- oder Notification-System eingeführt.
- Beim Einstieg oder Reconnect wird keine alte vollständige Access-Historie neu
  abgespielt.
- Der parallele Arbeitsbranch
  `codex/activities-worktree-20260711-access-outcomes` blieb unangetastet und
  wird erst beim finalen Main-Abgleich semantisch berücksichtigt.

## Integrationsstatus

Paket 3 ist fachlich und technisch zur Integration des aktuellen `main` in den
Arbeitsbranch freigegeben. Main-Merge und Cleanup werden anschließend gemäß
Paketprozess verifiziert.
