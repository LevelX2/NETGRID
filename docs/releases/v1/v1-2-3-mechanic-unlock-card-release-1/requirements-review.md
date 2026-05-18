# V1.2.3 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprueft wurden:

- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/plan.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/requirements.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/spec.md`
- `docs/releases/v1/v1-2-3-mechanic-unlock-card-release-1/test-matrix.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements-review.md`
- `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/plan.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

## Ergebnis

`V1_2_3_requirements_freeze_done: true`

`ready_for_implementation_after_V1_2_2: true`

V1.2.3 ist ausreichend geplant, um nach erfolgreichem V1.2.2-Gate umgesetzt zu werden. Die finale Kartenliste bleibt bewusst ein Implementation-Preflight-Ergebnis, weil sie von tatsaechlicher V1.2.2-Coverage und vorhandenen Resolvern abhaengt. Die Freigaberegeln, Artefakte und Tests sind jedoch eingefroren.

## Geklaerte Entscheidungen

- V1.2.3 ist Kartenrelease, kein neues Mechanikgate.
- Maximal 20 Karten werden aufgenommen.
- `deck_legal` setzt `human_playable` voraus.
- `ai_supported` setzt AI-Hints, Szenario und KI-Smoke voraus.
- Runtime-Gate ist allowlist-basiert.
- Zurueckgestellte Karten werden explizit dokumentiert.

## Staerken

- Kartenstatusmodell wird konsequent angewandt.
- No-Auto-Promotion ist mehrfach abgesichert.
- KI-Freigabe ist getrennt von menschlicher Spielbarkeit.
- Batch kann klein bleiben, wenn Mechanik- oder Testabdeckung sonst unsauber waere.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Finale Kartenliste wird zu spaet fachlich geprueft. | Mittel | Implementation-Preflight ist Pflicht. |
| Mechanik-Coverage wird ueberinterpretiert. | Hoch | RequiredMechanics- und ResolverRefs-Tests. |
| AI-supported wird zu breit gesetzt. | Hoch | AI-Hints und KI-Smoke als harte Gates. |
| Nicht freigegebene Karten gelangen ueber lokale Decks in Matches. | Hoch | Matchstart-Revalidierung und Decktests. |
| Neue Karten erzeugen UI-/Payload-Leaks. | Sehr hoch | Leak Scan und Visibility-Tests. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Finale Kartenliste und AI-Hints-Snapshot werden im Umsetzungspreflight konkretisiert.
- Die genaue Batchgroesse darf unter 8 liegen, wenn nur wenige Kandidaten sauber freigabefaehig sind.

## Gate

V1.2.3 ist nach V1.2.2 bereit fuer Umsetzung.
