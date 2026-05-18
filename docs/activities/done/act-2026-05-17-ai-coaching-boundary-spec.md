---
activityId: act-2026-05-17-ai-coaching-boundary-spec
status: done
kind: concept
area: ai
priority: low
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-input-nested-payload-allowlist
  - act-2026-05-17-decisiondebug-schema-redaction-snapshots
resultArtifacts:
  - docs/architecture/ai/coaching-boundary-spec-2026-05-17.md
checks:
  - git diff --check
---

# Side-sichere Grenzen für AI-Coaching spezifizieren

## Ziel

Für spätere Lern-, Review- oder Coaching-Funktionen soll ein klarer Sicherheits- und Produktvertrag entstehen: Ein Coach darf erklären und beim Lernen helfen, aber nie Live-Regelautorität, LegalAction-Quelle oder Hidden-Info-Kanal sein.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P2: Side-sicheres AI-Coaching` und `Offene Fragen / nicht belegte Annahmen`.
- Die Analyse nennt LLM-Coaching als offene Produktidee mit klarer Grenze: kein Live-Regelakteur und keine Hidden-Info-KI.
- Bestehende NETGRID-Prinzipien: Rules Engine ist einzige Regelautorität; UI, Server, menschliche Spieler und KI reichen nur aus LegalActions abgeleitete PlayerActions ein.

## Scope

- Spezifikation unter `docs/derived/` erstellen oder vorbereiten.
- Erlaubte Inputs definieren:
  - PlayerView der jeweiligen Seite,
  - LegalActions der jeweiligen Seite,
  - side-sichere PublicEvents,
  - optional side-sichere DecisionDebug-Auszüge nach eigenem Schema.
- Verbotene Inputs definieren:
  - gegnerische Hidden-Zonen,
  - FullState,
  - gegnerische Decklisten,
  - Replay-PrivatePayload,
  - Tokens/Sessions,
  - freie Regelentscheidung durch LLM.
- Beispielantworten und rote Fixtures beschreiben: Coach schweigt, bleibt allgemein oder verweist auf sichtbare legale Optionen, wenn Hidden-Info fehlen würde.

## Nicht im Scope

- Keine Coach-UI.
- Keine LLM-Integration.
- Keine Live-Aktionsausführung.
- Keine Änderung an AI-Controller, Engine, LegalActions oder Replay.
- Kein Public-Produktfeature ohne späteres Privacy-/Abuse-Gate.

## Akzeptanzkriterien

- [x] Es gibt eine klare Spezifikation mit erlaubten und verbotenen Datenquellen.
- [x] Die Spezifikation enthält mindestens je ein Runner-, Korp- und Replaysicht-Beispiel.
- [x] Hidden-Info-Fixtures sind als rote Tests oder künftige Testfälle beschrieben.
- [x] Der Coach wird ausdrücklich als Erklärungsschicht eingeordnet, nicht als Regel- oder Aktionsautorität.
- [x] Folgepakete für UI, Server oder LLM werden nur empfohlen, wenn ihre Gates und Redaction-Grenzen benannt sind.

## Umsetzungshinweise

- Dieses Paket kann rein dokumentarisch abgeschlossen werden.
- Es sollte auf AI-Input- und DecisionDebug-Grenzen verweisen, statt eigene Datenkanäle zu erfinden.
- No-Cheat-Gate: Coaching darf keinen Informationsvorteil gegenüber der jeweiligen Spielerperspektive geben.

## Ergebnisnotiz

Abgeschlossen. `docs/architecture/ai/coaching-boundary-spec-2026-05-17.md` definiert AI-Coaching als reine Erklärungsschicht ohne Regel-, LegalAction- oder Aktionsautorität. Die Spezifikation grenzt erlaubte Coach-Inputs auf seitengebundene `PlayerView`, aktuelle `LegalActions`, side-sichere `PublicEvents`, eigene Perspektivdaten und optional versionierte, side-sichere `DecisionDebug`-Auszüge ein. Verboten bleiben FullState, gegnerische Hidden-Zonen, gegnerische Decklisten, Replay-PrivatePayload, Tokens/Sessions, unredigiertes `AIInput`/`DecisionDebug` und freie Regelentscheidung durch LLM.

Enthalten sind Runner-, Korp- und Replay-Beispiele, rote Hidden-Info-Fixtures sowie Folgepaket-Empfehlungen mit eigenen Gates für `CoachInputV1`, Response-Contract, UI-Privacy und Replay-Review. Keine UI, keine LLM-Integration und keine Codeänderung wurden vorgenommen.

Checks: `git diff --check`.

Offene Folgepunkte: Nur die benannten späteren Coach-Input-/Response-/UI-/Replay-Gates; keine Umsetzung im Scope dieses Pakets.
