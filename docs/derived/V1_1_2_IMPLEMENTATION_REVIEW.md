# V1.1.2 Implementation Review - Full Archives Access und Matchstart Entry UX

Stand: 2026-05-07
Status: implemented

## Ergebnis

V1.1.2 ist umgesetzt. Track A erweitert den bestehenden Breach-/Access-Vertrag um vollständigen, deterministischen und side-sicheren Runner-Zugriff auf gemischte Korp-Archives mit faceup und facedown Karten. Track B baut den Matchstart als klarere NETGRID-Startkonsole mit Spielart- und Format-Kacheln, Join-Link-Beitritt, eingeklappten Sonderoptionen und side-sicherer Startzusammenfassung um.

## Umgesetzter Scope

- Archives-Breach-Queue verwendet alle Karten aus `corp.archives` in authoritative Array-Reihenfolge.
- Facedown Archives-Karten werden in der Breach-Queue als `hiddenInfo: true` klassifiziert, bis sie accessed werden.
- Runner-PlayerViews zeigen vor dem Access nur bekannte faceup Archives-Karten plus Discard-Count, keine Titel, DefinitionIds oder Metadaten facedown Karten.
- Korp-PlayerViews sehen eigene Archives weiterhin vollständig.
- `access_card` revealt nur den aktuellen Archives-Queue-Eintrag; künftige facedown Einträge bleiben redigiert.
- `trash_accessed_card` hängt Karten, die bereits aus Archives stammen, nicht erneut an `corp.archives` an.
- Agenda-Steal, Trash, Decline, Queue-Fortschritt, Replay und StateHash bleiben über den bestehenden Breach-Vertrag deterministisch.
- Multiplayer-Reconnect, Submit/Idempotency, Undo-Barriere und side-sichere Payloads sind für Archives-Breach getestet.
- Matchstart nutzt Spielart-Kacheln `Privates Duell`, `Gegen KI`, `Simulation`.
- Matchstart nutzt Format-Kacheln `Regelmatch` und `Matchserie`; `Einzelspiel · Deckziel` bleibt entfernt.
- Erweiterte Optionen enthalten Seitenzuteilung, Countdown, Seed, Testkonstellation und KI-Sonderoptionen.
- Join nutzt primär ein `Join-Link`-Feld mit Parser für `matchId` und `joinToken`; manuelle Eingabe bleibt eingeklappt erreichbar.
- Startzusammenfassung zeigt nur side-safe Modus-, Seiten-, Format- und Deckpolicy-Status ohne Tokens, Deckhashes oder gegnerische Deckdetails.

## Geänderte Hauptmodule

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/match-start.ts`
- `apps/web/app/match-start.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/e2e/helpers/match-flow.ts`
- `tests/specs/visibility-contract.test.ts`

## Architekturentscheidungen

- Full Archives Access nutzt den vorhandenen V0.97-Breach-State statt einen separaten Archives-Sonderpfad einzuführen.
- Die Hidden-Info-Klassifikation ist zonenspezifisch: In Archives ist `faceup === false` Hidden Info, auch wenn die Karte bereits in `corp.archives` liegt.
- Access auf Archives bleibt konservativ eine Hidden-Info-Barriere, weil der bestehende Undo-Vertrag alle `access_card`-Events blockierend behandelt. Diese strengere Regel ist zulässig und dokumentiert.
- Matchstart Entry UX bleibt reine Web-UI-/Helper-Arbeit. `deriveMatchStart`, Server-Create-/Join-Verträge, Engine-State, Replay und StateHash wurden nicht fachlich erweitert.
- Der Join-Link-Parser füllt nur lokale Join-Felder; Tokens werden nicht in Recent Sessions, Summary oder persistente Diagnoseflächen kopiert.

## Test- und Review-Befund

Die V1.1.2-Testmatrix ist durch gezielte Engine-, Server-, Web-, Visibility- und Browser-E2E-Regressionen abgedeckt. Der finale Gate-Lauf ist in `docs/derived/V1_1_2_FINAL_REVIEW.md` dokumentiert.

## Bekannte Grenzen

- Keine Prevention, Avoid, Interrupts oder Replacement Effects.
- Keine neuen Karten oder breite Kartenfreigabe.
- Keine Runner-Deckout-Siegbedingung.
- Keine offiziellen Assets, Card Backs, Card Frames, öffentlichen Plattformfunktionen, Accounts, Matchmaking-, Ranking- oder Turnierfunktionen.
- Der Web-Build zeigt weiterhin die bekannte nicht-blockierende Turbopack-NFT-Warnung in der Next-Konfiguration.
