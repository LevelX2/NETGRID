# V1.0.2 Final Review - Gegner-Aktionsdarstellung und Ablauftransparenz

Status: done
Stand: 2026-05-04

## Ergebnis

V1.0.2 ist umgesetzt und lokal verifiziert.

Die Version macht gegnerische Aktionen und KI-Züge nachvollziehbar, ohne die Rules Engine, Replay, StateHash, Kartenpool oder offizielle Mechanikbreite zu verändern. Human-vs-KI startet jetzt beobachtbar im getakteten Modus; die lokale UI zeigt Hinweise, Board-Fokus und optionales Aktionsaudio. Human-vs-Human verwendet dieselbe lokale Cue-Ableitung aus PublicEvents, ohne den Gegenspieler zu blockieren.

## Umgesetzt

- `OpponentActionCue`-Ableitung aus `PublicGameEvent`, `PlayerView` und Chronicle-Kontext.
- Redaction-Regeln für verdeckte Corp-Aktionen mit abstrakten Server-/Zonen-Highlights.
- KI-Erklärtexte als Nutzertext über `aiExplanation`; technische Reason-Codes bleiben nicht als sichtbarer UI-Text exponiert.
- Server-seitiges KI-Pacing mit `fast`, `paced` und `manual`.
- Autorisierter `advance_ai`-Pfad über WebSocket und REST mit State-/Match-Version-Schutz.
- Web-Overlay mit Queue, Auto-Dismiss, manueller Schließen-Aktion und lokaler Entscheidungshervorhebung.
- Board-Highlights für Server, Run, eigene Zonen und LegalActions.
- Opt-in synthetisches Aktionsaudio über die bestehende Audio-Einstellung.
- V1.0.2-App-Label und angepasster Visibility-Vertragstest.

## Checks

- `corepack pnpm --filter @netrunner/web test -- action-cues.test.ts`: pass.
- `corepack pnpm --filter @netrunner/server test -- multiplayer.test.ts`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm test`: pass, 182 Tests.
- `corepack pnpm build`: pass.
- `git diff --check`: pass.
- Web-Smoke: pass, `http://127.0.0.1:3000`.
- Server-Smoke: pass, `http://127.0.0.1:8787/health`.

## Gate

`V1_0_2_implemented: true`

`V1_0_2_verified: true`

`V1_0_2_done: true`

## Offene Punkte

Keine blockerrelevanten offenen Punkte für V1.0.2.

Für spätere Phasen bleiben bewusst offen:

- persistierte persönliche UI-Präferenzen für KI-Takt,
- screenshotbasierte Zwei-Fenster-Smokes,
- weitere Mechanikbreite wie Prevention, Avoid, Interrupt, Replacement, Set Aside, Remove from Game und Ownership-/Control-Wechsel,
- öffentliche Plattformfunktionen wie Accounts, Matchmaking, Rankings und Turnierlogik.
