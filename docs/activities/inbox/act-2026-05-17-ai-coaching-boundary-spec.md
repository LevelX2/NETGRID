---
activityId: act-2026-05-17-ai-coaching-boundary-spec
status: inbox
kind: concept
area: ai
priority: low
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-input-nested-payload-allowlist
  - act-2026-05-17-decisiondebug-schema-redaction-snapshots
resultArtifacts: []
checks: []
---

# Side-sichere Grenzen für AI-Coaching spezifizieren

## Ziel

Für spätere Lern-, Review- oder Coaching-Funktionen soll ein klarer Sicherheits- und Produktvertrag entstehen: Ein Coach darf erklären und beim Lernen helfen, aber nie Live-Regelautorität, LegalAction-Quelle oder Hidden-Info-Kanal sein.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitte `P2: Side-sicheres AI-Coaching` und `Offene Fragen / nicht belegte Annahmen`.
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

- [ ] Es gibt eine klare Spezifikation mit erlaubten und verbotenen Datenquellen.
- [ ] Die Spezifikation enthält mindestens je ein Runner-, Korp- und Replaysicht-Beispiel.
- [ ] Hidden-Info-Fixtures sind als rote Tests oder künftige Testfälle beschrieben.
- [ ] Der Coach wird ausdrücklich als Erklärungsschicht eingeordnet, nicht als Regel- oder Aktionsautorität.
- [ ] Folgepakete für UI, Server oder LLM werden nur empfohlen, wenn ihre Gates und Redaction-Grenzen benannt sind.

## Umsetzungshinweise

- Dieses Paket kann rein dokumentarisch abgeschlossen werden.
- Es sollte auf AI-Input- und DecisionDebug-Grenzen verweisen, statt eigene Datenkanäle zu erfinden.
- No-Cheat-Gate: Coaching darf keinen Informationsvorteil gegenüber der jeweiligen Spielerperspektive geben.

## Ergebnisnotiz

Noch offen.
