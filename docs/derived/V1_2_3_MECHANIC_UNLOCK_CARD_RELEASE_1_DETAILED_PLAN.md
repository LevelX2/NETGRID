# V1.2.3 Mechanic Unlock Card Release 1 - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.2.3 ist der erste Karten-Unlock nach V1.2.0, V1.2.1 und V1.2.2. Der Release macht nur Karten spielbar, deren benoetigte Mechaniken tatsaechlich abgedeckt sind. Human-playable und AI-supported bleiben getrennte Status.

V1.2.3 ist ein Kartenrelease, kein neues Mechanikgate. Neue Mechaniken duerfen nur als kleine, kartenlokale Resolver-Ergaenzungen auftreten, wenn sie bereits durch MechanicSupport abgedeckt oder als exakt begrenzter Resolver ohne neue Mechanikfamilie spezifiziert sind.

## Quellenbasis

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/V1_2_0_FINAL_REVIEW.md`
- `docs/derived/V1_2_1_FINAL_REVIEW.md`
- `docs/derived/V1_2_2_REQUIREMENTS_REVIEW.md`
- `data/rules/mechanics-coverage-1.2.1.json`
- spaeterer V1.2.2-MechanicSupport-Stand
- `data/manifests/card-implementation-manifest-1.0.5k.json`
- `data/manifests/card-implementation-manifest-1.0.6k.json`
- `data/manifests/card-implementation-manifest-1.1.2k.json`
- lokale Katalog-/CardDefinition-Daten und bisher zurueckgestellte O:NR-v1-Kandidaten

## Scope

- Reviewbarer Kartenbatch nach Mechanik-Coverage.
- Aufnahme nur mit `requiredMechanics`, Resolver/Ability-Verweis, Manifest, Tests und Smoke.
- Statusmodell `listed`, `engine_supported`, `human_playable`, `ai_supported` anwenden.
- Decklegalitaet serverseitig revalidieren.
- Katalog, Deckeditor und Matchstart konsistent aktualisieren.
- Mindestens ein Batch-Szenario mit finalem StateHash.
- Visibility-, Replay/StateHash-, Multiplayer-, Reconnect-, Undo- und E2E-Smokes.
- AI-Hints nur fuer Karten, die wirklich `ai_supported` werden.
- Final Review mit freigegebenen, zurueckgestellten und AI-supported Karten.

## Nicht-Ziele

- Keine neue Mechanikfamilie.
- Keine automatische Spielbarkeit durch Katalog-, Import- oder Bildstatus.
- Keine offiziellen Assets oder externen Laufzeitdaten.
- Kein breiter Kartenpool.
- Kein Public Deckbuilding, keine offiziellen Formatversprechen, kein Ranked, kein Turnier.
- Keine KI-Deckfreigabe ohne AI-Hints, Szenario und KI-Smoke/Soak.
- Keine Kartentextparser-Autoritaet.

## Batch-Politik

Der Umsetzungsthread muss vor Code eine finale Kartenliste in einem Implementation-Preflight festlegen.

Regeln:

- Zielgroesse: 8 bis 20 Karten.
- Harte Obergrenze: 20 Karten.
- Der Batch darf kleiner sein, wenn Mechanik- oder Testabdeckung sonst unsauber wird.
- Karten mit neuen, nicht gedeckten Mechanikfamilien werden zurueckgestellt.
- Karten mit V1.2.0/V1.2.1/V1.2.2-Mechaniken duerfen nur dann aufgenommen werden, wenn der konkrete Mechaniktyp im MechanicSupport abgedeckt ist.
- Karten mit nur menschlicher Spielbarkeit duerfen `human_playable` werden, bleiben aber aus KI-Decks.
- AI-supported Karten brauchen AI-Hints, DecisionDebug-Abdeckung und KI-Smoke.

## Kandidatenklassifikation

| Klasse | Bedeutung | Behandlung |
| --- | --- | --- |
| A | Nutzt nur bereits freigegebene einfache Resolver/Mechaniken. | Bevorzugt aufnehmen, wenn Tests schnell vollstaendig sind. |
| B | Nutzt neue V1.2.0/V1.2.1/V1.2.2-Mechaniktypen, z. B. Damage Prevention, Damage Replacement, Set Aside oder Control. | Nur aufnehmen, wenn exakt dieser Typ final implementiert und getestet ist. |
| C | Nutzt Mechanikfamilien ausserhalb V1.2.2, z. B. vollstaendige Formatregeln, komplexe Ownership-Ausnahmen, breite Interrupts oder Access-Replacement. | Zurueckstellen. |
| D | Hat unklare Quelle, unklaren Kartentext, offiziellen Assetbedarf oder fehlende lokale Definition. | Zurueckstellen. |
| E | Strategisch fuer KI wertvoll, aber ohne sichere AI-Hints. | Maximal `human_playable`; nicht `ai_supported`. |

## Artefakte der Umsetzung

V1.2.3 soll in der Umsetzung mindestens erzeugen oder aktualisieren:

- `data/manifests/card-implementation-manifest-1.2.3.json`
- `data/scenarios/v123-card-release-smoke.json`
- gegebenenfalls `data/ai/card-role-manifest-1.2.3.json` oder ein versionierter AI-Hints-Snapshot
- Katalog-/Runtime-Gate fuer genau die freigegebenen Karten
- Deckvalidierungsfixtures mit legalem und illegalem V1.2.3-Deck
- Implementation Review und Final Review

## Umsetzungspakete

1. **Preflight und finale Kartenliste**
   - V1.2.2-Final Review und MechanicSupport lesen.
   - Alle Kandidaten gegen Mechanik-Coverage und vorhandene Resolver clustern.
   - Finale Liste mit Statusziel pro Karte festlegen.
   - Zurueckstellungen mit Grund dokumentieren.

2. **CardDefinitions und Resolver**
   - Fehlende CardDefinition-Daten additiv ergaenzen.
   - Resolver nur fuer exakt freigegebene Effekte ergaenzen.
   - Jede Karte bekommt `requiredMechanics` und Resolver-/Ability-Verweis.

3. **Manifest und Runtime-Gate**
   - Manifest mit Quelle, Status, requiredMechanics, Resolver, Tests und AI-Hints-Status.
   - Katalogpromotion nur fuer Karten des V1.2.3-Batches.
   - `deck_legal` nur bei `human_playable`.

4. **Tests und Szenarien**
   - Pro Karte Unit- oder Integrationstest.
   - Batch-Szenario mit finalem StateHash.
   - Visibility- und Replay/StateHash-Test fuer jeden neuen Effektpfad.
   - Multiplayer-, Reconnect-, Undo- und E2E-Smoke mit neuen Decks.

5. **KI**
   - AI-Hints fuer jede `ai_supported` Karte.
   - KI-Deckpool nur um `ai_supported` Karten erweitern.
   - KI-Smoke: Human-vs-KI und KI-vs-KI, soweit Deckpool betroffen.
   - DecisionDebug redigieren.

6. **Review und No-Scope**
   - Freigegebene, human-only, ai-supported und zurueckgestellte Karten getrennt listen.
   - Keine neue Mechanikfamilie, keine offiziellen Assets, keine Public-Funktionen bestaetigen.

## Abhaengigkeiten

| Abhaengigkeit | Bedingung fuer V1.2.3 |
| --- | --- |
| V1.2.2 | Final Review gruen, MechanicSupport fuer Special Zones/Control vorhanden. |
| V1.2.0/V1.2.1 | Foundation-Piloten duerfen nur fuer reale Karten genutzt werden, wenn konkrete Mechaniktypen gruen sind. |
| Kartenstatusmodell | `deck_legal` setzt `human_playable`; `ai_supported` setzt `human_playable` plus AI-Hints voraus. |
| Browser-E2E | V1.0.7-Harness muss V1.2.3-Decks smoken koennen. |
| Deckbibliothek | Persoenliche Decks duerfen unbekannte oder nicht freigegebene Karten nicht in Matches bringen. |

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Kartenbatch wird zu breit. | Hoch | Maximal 20 Karten; kleiner Batch ist erlaubt. |
| Mechanik-Coverage wird mit Kartenstatus verwechselt. | Hoch | Manifestpflicht und Runtime-Gate getrennt. |
| AI-supported wird aus alten KI-Smokes abgeleitet. | Hoch | AI-Hints, DecisionDebug und KI-Smoke sind Pflicht. |
| Neue Karten leaken Hidden Info in UI oder Reconnect. | Sehr hoch | Visibility-, Payload- und E2E-Leaktests. |
| Batch fuehrt heimlich neue Mechanikfamilie ein. | Hoch | Candidate-Klasse C blockiert. |

## Offene Fragen

Keine blockierende offene Frage.

Nicht blockierend:

- Die finale Kartenliste wird erst im Umsetzungspreflight festgelegt, weil sie von der tatsaechlichen V1.2.2-Implementierung und den vorhandenen Resolvern abhaengt.
- Die konkrete Form des AI-Hints-Snapshots darf der Umsetzungsthread an vorhandene AI-Datenstrukturen anpassen.

## Gate

`V1_2_3_requirements_freeze_done: true`

`ready_for_implementation_after_V1_2_2: true`
