# V1.1.2 Full Archives Access und Matchstart Entry UX Plan

Stand: 2026-05-07
Status: detailliert geplant, Requirements Freeze abgeschlossen

## Kurzentscheidung

V1.1.2 bleibt gemäß langfristiger Roadmap der Mechanik-Slot für `Full Archives Access`. Die zuvor separat skizzierte Matchstart-Entry-UX wird als zweiter, unabhängiger UX-Track in denselben Releaseplan integriert.

Damit besteht V1.1.2 aus zwei klar getrennten Tracks:

- Track A: Full Archives Access als primärer Regel-/Visibility-Gate.
- Track B: Matchstart Entry UX als angehängter Web-UI-Komfortslice.

Track B darf Track A fachlich nicht verwässern: keine Engine-Regeln, keine Serververträge, keine Karten, keine Replay-/StateHash-Änderungen und keine Plattformfunktion durch den Matchstart-Umbau. Wenn die Umsetzung von Track A risikoreicher wird als erwartet, kann Track B ohne fachlichen Verlust in ein späteres reines UX-Zwischenrelease verschoben werden.

## Quellen und Ausgangslage

Verbindliche Vorplanung:

- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`: V1.1.2 ist `Full Archives Access`.
- `docs/derived/V1_1_0_SETUP_GAME_END_M2_DETAILED_PLAN.md`: V1.1.0 hat nur die Archives-facedown-Grundlage gelegt; vollständiger Archives-Access bleibt V1.1.2.
- `docs/derived/V1_1_0_REQUIREMENTS.md`: `V110-MUST-015` schützt die Grundlage, erweitert aber keinen Full-Archives-Access.
- `docs/derived/V1_1_1_DISCARD_HANDLIMIT_CORE_DAMAGE_PLAN.md`: V1.1.1 schließt Discard/Handlimit/Core Damage; Full Archives Access bleibt danach V1.1.2.

Aktuelle Codepfade für Track A:

- `packages/shared/src/index.ts`: `ServerId`, `CardZone`, `BreachState`, `AccessQueueEntry`, PlayerView-Strukturen.
- `packages/engine/src/index.ts`: `visibleCorpArchives`, `buildBreachAccessQueue`, `accessCurrentCard`, `trashAccessedCard`, `sanitizeEventForViewer`, Visibility und State-Invarianten.
- `packages/engine/src/index.test.ts`: bestehende Archives-, Access-, Breach-, Visibility- und Discard-Tests.
- `apps/web/app/page.tsx`: Archives-Anzeige, Serverzählung, Access-Reveal-Modal, Run-/Breach-Darstellung.
- `tests/specs/visibility-contract.test.ts`: Leakschutz über UI-/Payload-Verträge.

Aktuelle Codepfade für Track B:

- `apps/web/app/page.tsx`: Startscreen unter `data-testid="setup-screen"` mit `setupPanel`, `tabs`, `formGrid`, Create-/Join-Flow.
- `apps/web/app/match-start.ts`: UI-zu-technischem Matchstart.
- `apps/web/app/match-start.test.ts`: Ableitungstests.
- `apps/web/app/globals.css`: Startscreen- und Panel-Styling.
- `tests/e2e/helpers/match-flow.ts`: Browser-Flow-Helfer.

## Track A: Full Archives Access

### Ziel

Runner-Zugriffe auf Archives werden vollständig und side-sicher modelliert. Archives können faceup und facedown Korp-Karten enthalten. Die Korp sieht ihre Archives vollständig; der Runner sieht vor dem Zugriff nur erlaubte öffentliche Informationen. Beim erfolgreichen Zugriff auf Archives wird eine deterministische Access-/Breach-Sequenz erzeugt, die verdeckte Karten erst beim tatsächlichen Access offenbart und die richtigen Hidden-Info-Barrieren setzt.

### Muss-Scope

- Archives-Access-Queue enthält alle zugreifbaren Archives-Karten in definierter Reihenfolge.
- Faceup-Karten bleiben für den Runner bereits vor dem Access sichtbar.
- Facedown-Karten bleiben vor dem Access ohne Titel, DefinitionId, Bildpfad oder unterscheidbare Metadaten.
- Beim Access einer facedown Archives-Karte wird genau diese Karte sichtbar gemacht.
- Access-Events sind für Runner informativ, für Korp und öffentliche Payloads side-sicher redigiert, sofern sonst Hidden Info leaken würde.
- Steal/Trash/Decline-Logik bleibt mit bestehendem Access-/Breach-Modell kompatibel.
- Undo wird nach dem Zugriff auf bisher verdeckte Archives-Information korrekt blockiert.
- Replay und StateHash bleiben deterministisch.
- Reconnect und WebSocket-Payloads zeigen laufende Archives-Breaches side-sicher.
- Web UI kann Archives-Breach und einzelne Access-Schritte verständlich darstellen.

### Nicht-Ziele

- Keine Replacement Effects.
- Keine Prevention/Avoid/Interrupts.
- Keine neuen Karten oder breite Kartenfreigabe.
- Keine Runner-Deckout-Siegbedingung.
- Keine offizielle Asset- oder Cardback-Nutzung.
- Keine öffentliche Plattformfunktion.
- Keine manuelle Sortierung von Archives durch Spieler, sofern keine spätere Karte das als eigenes Gate braucht.

### Produkt- und Regelentscheidungen

Offene Detailentscheidungen für Requirements Freeze:

- Reihenfolge der Archives-Access-Queue: Empfehlung ist aktuelle interne Archives-Reihenfolge, solange diese deterministisch und getestet ist.
- Zugriff auf faceup/facedown gemischt: Empfehlung ist eine Queue über alle Archives-Karten; facedown wird erst beim jeweiligen Access enthüllt.
- Access-Zusammenfassung: `BreachState.accessedSummaries` darf keine künftigen facedown Kartentitel enthalten.
- Archives-Serveranzeige: Runner sieht vor dem Access Count plus faceup bekannte Karten, Korp sieht vollständige eigene Archives.

## Track B: Matchstart Entry UX

### Ziel

Der Spiel-Startscreen wird von einer langen gleichrangigen Optionsliste zu einer klareren NETGRID-Startkonsole. Dieser Track ist bewusst reine Web-UI-Arbeit und darf Track A nicht berühren.

### Muss-Scope

- Spielart als Kachelauswahl statt Select:
  - `Privates Duell` für Human-vs-Human per Link.
  - `Gegen KI` für Human-vs-AI.
  - `Simulation` für AI-vs-AI.
- Spielziel als Format-Kacheln:
  - `Regelmatch`: 7 Agendapunkte.
  - `Matchserie`: zwei Spiele mit Seitenwechsel.
- Standard-Human-vs-Human zeigt nur:
  - Name.
  - eigene Runner-/Korp-Decks.
  - Format.
  - Startzusammenfassung.
  - Primärbutton `Lobby erstellen`.
- Erweiterte Optionen enthalten:
  - Seitenzuteilung.
  - Countdown.
  - Seed.
  - Testkonstellation.
  - KI-Sonderoptionen je Modus.
- Beitreten nutzt primär ein `Join-Link`-Feld.
- Manuelle Match-ID-/Token-Eingabe bleibt eingeklappt erreichbar.
- Startzusammenfassung bleibt side-safe und zeigt keine gegnerischen Deckdetails, Deckhashes oder Tokens.
- NETGRID-Optik wird dezent gestärkt, ohne Hero-Landingpage oder offizielle Assets.

### Nicht-Ziele

- Keine Änderung an Engine, LegalActions, PlayerActions oder Matchstart-Serververtrag.
- Keine Änderung an Startbereitschaftslobby, Lobbychat, Ready-Flags oder Countdown-Semantik.
- Keine neuen Karten, Mechaniken, KI-Heuristiken oder Deckvalidierungsregeln.
- Keine offiziellen Artworks, Logos, Card Frames oder Card Backs.

## Kombinierter technischer Schnitt

### Track A betroffene Bereiche

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/action-board-ui.ts`
- `tests/specs/visibility-contract.test.ts`
- `tests/e2e/helpers/match-flow.ts`
- `tests/e2e/netgrid-v1-0-7.spec.ts`

### Track B betroffene Bereiche

- `apps/web/app/page.tsx`
- `apps/web/app/match-start.ts`
- `apps/web/app/match-start.test.ts`
- `apps/web/app/globals.css`
- `tests/e2e/helpers/match-flow.ts`
- `tests/specs/visibility-contract.test.ts`

### Koordinationsregel

Wenn Track A und Track B beide `apps/web/app/page.tsx` oder E2E-Helfer ändern, ist Track A zuerst zu implementieren. Danach wird Track B auf die aktualisierten E2E-Flows und den aktuellen UI-Zustand gesetzt. Track B darf keine Tests lockern, die Track A für Visibility oder Hidden Info braucht.

## Umsetzungsschritte

### Schritt 1: V1.1.2 Requirements Freeze

Zu erstellen:

- `docs/derived/V1_1_2_REQUIREMENTS.md`
- `docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`
- `docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`
- `docs/derived/V1_1_2_TEST_MATRIX.md`
- `docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md`

Akzeptanz:

- Track A hat Must-Anforderungen für Engine, Visibility, Replay/StateHash, Server, Web und E2E.
- Track B hat Must-Anforderungen für Startscreen, Join-Link, Summary, Responsive QA und Hidden-Info-Grenzen.
- Requirements Review meldet `ready_for_implementation: true`.

### Schritt 2: Archives-Access-Modell festziehen

Aufgaben:

- `AccessQueueEntry` falls nötig um Archives-spezifische Redaktions-/Visibility-Metadaten ergänzen.
- `buildBreachAccessQueue` für Archives explizit testen.
- `visibleCorpArchives` und PlayerViews gegen faceup/facedown-Kontrakte prüfen.
- Invarianten für Archives-Zonen und Access-Queue ergänzen.

Akzeptanz:

- Runner sieht vor Zugriff keine facedown-Titel.
- Korp sieht eigene Archives vollständig.
- Queue ist deterministisch und replayfähig.

### Schritt 3: Archives-Access ausführen

Aufgaben:

- `access_card` für Archives über die bestehende Breach-Queue führen.
- Facedown-Karte erst beim Access revealen.
- Agenda-Steal, Asset-/Upgrade-Trash und Decline mit Queue-Fortschritt sauber halten.
- Hidden-Info-Barriere setzen, wenn verdeckte Information zugänglich wurde.

Akzeptanz:

- Access auf mehrere Archives-Karten läuft vollständig durch.
- Keine künftige Queue-Information leakt.
- Undo über relevante Access-Schritte blockiert.

### Schritt 4: Server, Reconnect und Visibility

Aufgaben:

- Multiplayer-Payloads bei Archives-Breach prüfen.
- EventTail und Reconnect mit laufendem Archives-Access testen.
- Fehlertexte und ActionReceipts redigieren.

Akzeptanz:

- Runner kann Archives-Breach nach Reconnect fortsetzen.
- Korp und Runner erhalten nur ihre side-sicheren Payloads.
- Token, private Decks und verdeckte Kartendaten bleiben aus Logs und Payloads.

### Schritt 5: Web-UI für Archives-Breach

Aufgaben:

- Archives-Serveranzeige für faceup/facedown verständlich machen.
- Access-Reveal-Modal und Breach-Fortschritt für Archives prüfen.
- Chroniktexte auf `Archives`/`Archive` konsistent und side-sicher halten.

Akzeptanz:

- Runner erkennt laufenden Archives-Breach und nächste Aktion.
- Korp sieht keine falsche öffentliche Enthüllung vor Runner-Access.
- Mobile und Desktop bleiben lesbar.

### Schritt 6: Matchstart Entry UX umsetzen

Aufgaben:

- `match-start.ts` um reine Helper ergänzen:
  - Summary-Builder.
  - Kachel-Labels.
  - Join-Link-Parser.
- Spielart- und Format-Selects durch Kacheln ersetzen.
- Erweiterte Optionen als sichtbares Disclosure bauen.
- Beitreten mit primärem Join-Link-Feld ergänzen.
- Startzusammenfassung side-safe anzeigen.
- Dezente NETGRID-Startscreen-Optik in CSS ergänzen.

Akzeptanz:

- `setup-screen`, `create-match` und `join-match` bleiben teststabil.
- Neue Test-IDs:
  - `play-mode-human-vs-human`
  - `play-mode-human-vs-ai`
  - `play-mode-ai-vs-ai`
  - `match-format-rules-match`
  - `match-format-series`
  - `advanced-match-options`
  - `join-link-input`
  - `manual-join-options`
  - `match-start-summary`
- E2E-Helfer hängen nicht mehr an einem Select mit Label `Spielart`.

### Schritt 7: Kombinierte Verifikation

Pflichtchecks:

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine test -- --run`
- `corepack pnpm --filter @netgrid/server test -- --run`
- `corepack pnpm --filter @netgrid/web test -- --run`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`

Browser-Smokes:

- Archives-Breach mit faceup/facedown Korp-Archives.
- Reconnect während Archives-Access.
- Hidden-Info-Leak-Scan nach Archives-Access.
- Desktop/Tablet/schmaler Startscreen mit neuen Kacheln.
- Human-vs-Human Lobby erstellen.
- Human-vs-KI starten.
- KI-vs-KI Simulation starten.
- Beitritt per Join-Link und manuell.

## Hidden-Info- und Sicherheitsgrenzen

Track A darf nicht leaken:

- facedown Archives-Titel vor Access.
- künftige Archives-Queue-Titel.
- HQ-/R&D-Zugriffsdaten durch Redaktionsregression.
- private Payloads in PublicEvents, WebSocket, Reconnect, Undo, Logs oder UI-Diagnostik.

Track B darf nicht leaken:

- Join-, Session- oder Reconnect-Tokens in Recent Sessions, Summary, Notice oder Logs.
- gegnerische Decklisten, Decknamen, Deckhashes oder Karteninhalte.
- Full GameState oder Engine-State.

## Risiken und Gegenmaßnahmen

| Risiko | Einschätzung | Gegenmaßnahme |
| --- | --- | --- |
| Zwei Tracks machen V1.1.2 zu breit. | Mittel | Track A ist primär. Track B kann bei Risiko in späteren UX-Release verschoben werden. |
| Archives-Access leakt facedown Karten vorzeitig. | Hoch | Queue-/PlayerView-/PublicEvent-Redaktion mit Engine-, Server- und E2E-Leaktests. |
| Undo/Replays werden durch Archives-Breach inkonsistent. | Mittel | Hidden-Info-Barriere und Replay/StateHash-Tests als Gate. |
| Startscreen-E2E bricht durch neue Kacheln. | Mittel | Test-IDs einführen und Helper gezielt aktualisieren. |
| `page.tsx`-Konflikte zwischen Track A und B. | Mittel | Track A zuerst, Track B danach auf aktuellem Web-Stand. |
| Matchstart-Zusammenfassung zeigt zu viel. | Niedrig | Summary ohne gegnerische Deckdetails oder Tokens; Visibility-Contract erweitern. |

## Done-Kriterien

V1.1.2 ist done, wenn:

- Archives-Access für faceup/facedown Korp-Archives vollständig, deterministisch und side-sicher funktioniert.
- Runner sieht facedown Archives-Karten erst beim tatsächlichen Access.
- Korp- und öffentliche Payloads leaken keine verdeckten Archives-Informationen.
- Undo, Reconnect, Replay und StateHash bleiben korrekt.
- Web UI zeigt Archives-Breach verständlich.
- Matchstart wirkt nicht mehr wie eine lange Optionsliste, sondern wie eine klare NETGRID-Startkonsole.
- Spielart und Spielziel werden über Kacheln gewählt.
- Erweiterte Optionen halten alle bisherigen Sonderfälle erreichbar.
- Beitreten per Join-Link funktioniert, manuelle Eingabe bleibt erreichbar.
- Pflichtchecks und Browser-E2E grün sind.
- Keine Prevention/Avoid/Interrupt/Replacement-, Kartenpool-, offizielle Asset- oder Plattform-Scope-Erweiterung erfolgt.

## Ergebnis des Detailplans

Der Requirements Freeze liegt vor:

- `docs/derived/V1_1_2_REQUIREMENTS.md`
- `docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`
- `docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`
- `docs/derived/V1_1_2_TEST_MATRIX.md`
- `docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md`

Gate-Ergebnis:

`V1_1_2_requirements_freeze_done: true`

`ready_for_implementation: true`

## Beauftragbarer Folgeprompt

```text
Bereite V1.1.2 Full Archives Access und Matchstart Entry UX als kombinierten Release vor.

Lies zuerst:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md
- docs/derived/V1_1_0_FINAL_REVIEW.md
- docs/derived/V1_1_1_REQUIREMENTS.md
- docs/derived/V1_1_2_FULL_ARCHIVES_AND_MATCHSTART_ENTRY_UX_PLAN.md

Aufgabe:
Erstelle den Requirements Freeze für V1.1.2 mit zwei getrennten Tracks:
Track A: Full Archives Access.
Track B: Matchstart Entry UX.

Erstelle:
- docs/derived/V1_1_2_REQUIREMENTS.md
- docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md
- docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md
- docs/derived/V1_1_2_TEST_MATRIX.md
- docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md

Nicht implementieren, bis das Requirements Review ready_for_implementation: true meldet.
```
