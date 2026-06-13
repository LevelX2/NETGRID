# AI168 Controlled Micro-Flag

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI168 sollte einen streng begrenzten, default-off Opportunity-Micro-Flag einführen, falls AI166 genau einen bewiesenen Kandidaten freigibt. Der Flag durfte nur eine nachgewiesene same-state LegalAction-Auswahl betreffen und musste ohne gesetzten Flag vollständig auf den bisherigen Pfad zurückfallen.

## Entscheidung

Kein Runtime-Flag.

| Voraussetzung | Befund | Entscheidung |
| --- | --- | --- |
| ein einzelner AI166-Kandidat | keiner | blockiert |
| same-state LegalAction-Proof | 0/17 | blockiert |
| Opportunity-State-LegalAction-Snapshots | 0 | blockiert |
| Default-off-Rollout sinnvoll | nein | nicht umgesetzt |

## Begründung

Ein Flag wie `NETGRID_AI_ENDGAME_OPPORTUNITY_CANDIDATE` wäre aktuell nur ein leerer Schalter ohne belegten Zielpfad. Das würde die Konfiguration erweitern, aber keinen kontrollierbaren Testgegenstand schaffen. Der Paketprozess verlangt ausdrücklich, dass nur ein belegter Opportunity-Cutover umgesetzt wird. Da AI166 ein No-Go ist, bleibt AI168 ebenfalls ein No-Go.

## Umgesetzter Umfang

- kein neuer Environment-Flag
- keine Änderung an AI-Runtime-Auswahl
- keine Änderung an Tests oder Fixtures für einen nicht vorhandenen Kandidaten
- keine Änderung an LegalActions, PlayerViews, PublicEvents oder Hidden-Info-Grenzen

## Nächster zulässiger Schritt

Erst nach redaction-sicherer Opportunity-State-Instrumentierung kann ein einzelner Kandidat aus tatsächlichen same-state LegalActions gewählt werden. Dann wäre ein neuer Folgeblock sinnvoll: Kandidat beweisen, Default-off-Flag einführen, fokussierten Fixrun durchführen und erst danach breitere Sweeps vergleichen.

## Verifikation

- AI166 No-Go geprüft
- AI167 `same_state_opportunity_proof_rate = 0/17`
- `git diff --check`
