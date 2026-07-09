# Proteus-KI-Release-Reconciliation: Final Review

Status: `implemented_verified`

Datum: 2026-07-09

## Entscheidung

Proteus ist für explizit ausgewählte KI-Decks und für den versionierten Standard-/Zufallspool freigegeben. Die Freigabe bleibt dreistufig und maschinenlesbar: `hint_ready`, `selected_ai_playtest_ready` und `default_pool_ready` stehen in `data/ai/card-set-ai-readiness-v1.json` auf grün.

## Evidence

- 154/154 Proteus-Karten sind technisch `ai_supported` und besitzen aktive sowie kompilierte Hints.
- Das deterministische Inventar klassifiziert 154/154 Karten in elf Familien; alle 114 Karten der vier Pilotdecks besitzen familienbezogene Szenario-Evidence.
- ActionSemanticCandidate projiziert Target/Choice, Run/Access, X/Timing, Random/Bad Publicity sowie Hidden Resource/Virus/Antibody side-safe und ausschließlich aus LegalAction-/sichtbarer Semantik.
- Der feste Pilot umfasst vier Deckpaarungen über vier Seeds, also 16 Spiele und 2647 Entscheidungen: 0 IllegalActions, 0 Replay-Fehler, 0 Redaction-Fehler, 0 % Fallback, 25 % Abschlüsse, 75 % Action-Limit und 12,5 % No-Progress.
- Vier Originalset-Kontrollspiele melden 0 IllegalActions und 0 Replay-Fehler.
- Vier während des ersten Piloten gefundene generische Engine-Lücken wurden behoben: Hidden-Resource-Access-Fortsetzung, On-the-Fast-Track-Legalität, phasenübergreifende Programmtrash-Installationschoice und dominierte Bank-Zahlungsoption.
- KI-Deckpool 1.1.0 enthält genau vier mit dem Pilotbericht qualifizierte Proteus-Snapshots.

## Promotion-Vertrag

- `selected` und `same_as_participant_a` verlangen mindestens `selected_ai_playtest_ready`.
- `fixed` und `seeded_random` verlangen für Proteus `default_pool_ready`.
- Originalset-, Classic- und Proteus-Pools filtern Seeded-Random-Kandidaten strikt auf ihren Erweiterungspool; der kombinierte Pool akzeptiert beide qualifizierten Erweiterungen.
- UI und Matchstart unterscheiden Selected/Pilot und Standardpool sichtbar.

## Restpunkte

Es gibt keinen offenen Legalitäts-, Hidden-Info-, Replay-, StateHash-, Randomness- oder Pool-Promotion-Blocker. Die gemessenen 75 % Action-Limit- und 12,5 % No-Progress-Raten bleiben transparente Play-Strength-Beobachtung für spätere Optimierungen, ohne die erreichten Sicherheits- und Freigabegates zurückzunehmen.

## Abschlussgate

Web-/Browser-Smoke, Katalog-, Deck-, KI-, Server- und Web-Tests, sechs relevante Typechecks, Proteus-Coverage, Readiness-/Inventar-/Szenario-Driftchecks sowie der deterministische 16-Spiel-Pilotcheck sind grün. Der Arbeitsbranch ist damit für den Abgleich mit `main` und die lokale Integration freigegeben.
