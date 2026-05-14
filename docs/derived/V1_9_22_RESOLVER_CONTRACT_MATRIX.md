# V1.9.22 Resolver Contract Matrix

Stand: 2026-05-14
Status: Vertragsmatrix, keine Runtime-, Catalog- oder AI-Promotion

## Zweck

Diese Matrix zerlegt alle 47 V1.9.22-Zielkarten in konkrete Resolververträge. Sie hält fest, welche lokalen Informationen belastbar bestätigt sind und welche Felder noch fehlen, bevor ein echter Engine-, Catalog- oder AI-Promotion-Schnitt zulässig ist.

Maschinenlesbarer Begleiter: `data/rules/v1922-resolver-contracts.json`.

## Ergebnis

- 47/47 Zielkarten sind erfasst.
- 0/47 Karten sind für neue Resolverimplementierung oder Promotion vollständig bereit.
- 9/47 Runner-Hardwarekarten haben bereits einen eng begrenzten Installationspfad mit LegalAction, Wrong-Side-/Stale-Revalidation, Visibility und Replay/StateHash.
- 37/47 Karten haben aktuell nur No-Promotion-/No-LegalAction-Guards oder Runtime-display-only-Oberflächen.
- Errata 1.70 und die Nutzerklärung vom 2026-05-14 reduzieren mehrere fachliche Lücken. `Newsgroup Filter` ist inhaltlich geklärt: Runner-Programm, Installkosten 5, MU 2, `[A]: Gain 2 Credits`.
- Der aktive Blocker bleibt fachlich korrekt, aber enger: `Newsgroup Filter` hat inzwischen einen nicht-promotenden technischen Runtime-Vertrag für `[A]: Gain 2 Credits`; für weitere verbleibende Karten fehlt kein allgemeiner Kartentext, sondern mindestens ein vollständiger technischer Resolververtrag mit LegalAction-Projektion, `applyAction`-Revalidierung, Visibility, Replay/StateHash und AI-Fallback.

## Quellenbasis

- `docs/derived/V1_9_10_TO_V1_9_XX_CARD_FUNCTION_MATRIX.md`
- `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md`
- `docs/derived/V1_0_5K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_9_22_RUNNER_PROGRAM_READINESS_REVIEW.md`
- `docs/derived/V1_9_22_RUNNER_EVENT_READINESS_REVIEW.md`
- `docs/derived/V1_9_22_CORP_LONGTAIL_READINESS_REVIEW.md`
- `docs/derived/V1_9_22_SOURCE_SCAN_REVIEW.md`
- `docs/derived/V1_9_22_ERRATA_1_70_SOURCE_REVIEW.md`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.test.ts`

## Fehlende Informationen Nach Cluster

| Cluster | Karten | Bestätigt | Fehlt für Promotion |
| --- | ---: | --- | --- |
| Runner-Programme | 14 | Seite, Typ, Programminstallation-/MU-Oberfläche; teils historische Effektkerne; Errata für Noisy, Recurring, Speed Trap und Startup Immolator; Nutzerklärung für Newsgroup Filter | LegalAction-/applyAction-Verträge, Ziel-/Choice-Vertrag, Sichtbarkeit, Replay/StateHash, AI-Fallback; bei Breakern Subroutine-Taxonomie |
| Runner-Events | 10 | Seite, Typ, Event-Oberfläche; teils historische Effektkerne; Runtime-display-only; No-`play_event`-Guard | Playkosten, Timing/CanPlay, Ziele, Choice-Flow, Zonebewegungen, Effektzahlen, Sichtbarkeit, Replay/StateHash, AI-Fallback |
| Runner-Hardware | 9 | Install-LegalAction, WIP-Installkosten 0, Sichtbarkeit, Replay/StateHash für Installation | Per-card Effekt, Deck-/Chip-Einzigartigkeit, konkrete MU-/Link-/Recurring-/Extra-Run-Werte, AI-Fallback |
| Corp-Agendas | 6 | Agenda-Oberfläche; teils Corporate-War-/Political-Overthrow-Kernnotiz; Errata für Data Fort Reclamation und Security Purge | LegalAction-/applyAction-Verträge, Choice-/Sequenzmodell, Sichtbarkeit, Replay/StateHash, AI-Fallback |
| Corp-ICE | 5 | ICE-Oberfläche und grobe Subtyp-Oberfläche; Errata für Haunting Inquisition, Tutor und Viral 15 | LegalAction-/applyAction-Verträge, runweite Zustände, Encounter-Projektion, Sichtbarkeit, Replay/StateHash, AI-Fallback |
| Corp-Operations | 3 | Operation-Oberfläche | Playkosten, Timingbedingung, Zielmenge, Effektbeträge, Zonebewegungen, Sichtbarkeit, Replay/StateHash, AI-Fallback |

## Einzelmatrix

### Runner-Programme

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| False Echo | Programm/MU; erzwungene Corp-Rez-Sequenz nach erfolgreichem Run als Teilnotiz | Installkosten, MU, erfolgreicher-Run-Zeitpunkt, Rez-Zielmenge, Corp-Choice, Kosten/Revalidation, Events, Replay/StateHash, AI |
| Flak | Programm/MU; Breaker-Oberfläche; AP-Subroutine-Ziel als Teilnotiz | Installkosten, MU, Stärke, Pump-/Breakkosten, AP-Kategorie, Encounter-Timing, Zielvalidierung, Events, Replay/StateHash, AI |
| Hammer | Installkosten 2, MU 1, Stärke 2, Break Wall für 0, Pump +1 für 1; Errata: Noisy-Karten brauchen keine Stealth-Karten im Spiel | Wall-/Subroutine-Taxonomie, Stealth-Verlust-Timing/Ziele, LegalAction/applyAction, Events, Replay/StateHash, AI |
| Japanese Water Torture | Programm/MU; Breaker-Oberfläche; Wall-Break; zukünftige Aktionsverweigerung als Teilnotiz | Installkosten, MU, Stärke, Pump-/Breakkosten, Wall-Vertrag, Action-Denial-Dauer/Reset, Events, Replay/StateHash, AI |
| Netspace Inverter | Programm/MU; Fort-ICE-Reihenfolge umkehren als Teilnotiz | Installkosten, MU, Aktivierungstiming, Serverziel, Dauer der Umkehrung, Run-Interaktion, Events, Replay/StateHash, AI |
| Newsgroup Filter | Nutzerklärung 2026-05-14: Installkosten 5, MU 2, Runner-Aktion `[A]: Gain 2 Credits`, keine Ziele/Choices/Hidden-Info; Runtime-WIP mit LegalAction, applyAction-Revalidierung, PublicPayload und Replay/StateHash umgesetzt | AI-Fallback und finale Release-Promotion |
| Poltergeist | Programm/MU; hosted recurring credits für Trash-Kosten als Teilnotiz | Installkosten, MU, Recurring-Betrag, Pool-/Counter-Modell, Zahlungsumfang, Refresh-Timing, Events, Replay/StateHash, AI |
| Rabbit | Programm/MU | Installkosten, MU, Subtypen, Effekttext, Timing, Ziele, Choices, Zone/Status, Events, Replay/StateHash, AI |
| Reflector | Programm/MU; Breaker-Oberfläche; Stun-/Hellbolt-/Knockout-Kategorie als Teilnotiz | Installkosten, MU, Stärke, Pump-/Breakkosten, Zielkategorien, Encounter-Timing, Events, Replay/StateHash, AI |
| Scatter Shot | Installkosten 0, MU 1; Errata: recurring Credit wird zu Beginn des nächsten Runner-Zugs aus der Bank ersetzt | Upgrade-Trash-Zahlungsfenster, Pool-/Counter-Modell, Events, Replay/StateHash, AI |
| Shield | Programm/MU; Damage-Prevention und Turn-Reset als Teilnotiz | Installkosten, MU, Damage-Typ, Prevention-Betrag, Timingfenster, Limit pro Zug, Reset, Events, Replay/StateHash, AI |
| Speed Trap | Installkosten 0, MU 1; Errata: nur nach Rez eines Upgrades/Nodes, nach letztem ICE erfolgreicher Run ohne Access | Rez-Interrupt-Projektion, Successful-without-access-State, Choice-Flow, Events, Replay/StateHash, AI |
| Startup Immolator | Installkosten 0, MU 1; Errata: nur während eines Runs, nach dem Passieren von ICE, wenn alle Subroutinen gebrochen wurden | Tap-State, Broken-all-Subroutines-Tracking, Passed-ICE-Trigger, ICE-Ziel, Events, Replay/StateHash, AI |
| Zetatech Software Installer | MU 1; Errata: 2 recurring Credits aus der Bank für Programminstallation, Refresh zu Beginn des nächsten Runner-Zugs, Overlay-Sonderfall bekannt | Installkosten, Programminstall-Zahlungsfenster, Overlay-Zustandswechsel, Events, Replay/StateHash, AI |

### Runner-Events

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| Anonymous Tip | Event-Oberfläche; Runtime-display-only; No-`play_event`-Guard | Playkosten, CanPlay-Timing, Effektbetrag, Zielmenge, Choice-Flow, Zonebewegung, Events, Replay/StateHash, AI |
| Core Command: Jettison Ice | Successful-HQ-run-Flag und rezzed ICE-Ziel als Teilnotiz | Playkosten, HQ-Erfolgsfenster, Zielmenge rezzed ICE, Effektresultat, Zonebewegung, Choice-Flow, Events, Replay/StateHash, AI |
| Forged Activation Orders | Corp-Choice: rezzen oder trashen als Teilnotiz | Playkosten, Zielmenge, Corp-Choice-Timing, Rez-Kostenregeln, Trash-Resultat, Zonebewegung, Events, Replay/StateHash, AI |
| If You Want It Done Right... | Stack ansehen, Karte wählen, Rest sortieren als Teilnotiz | Playkosten, Stack-Tiefe, Zielkarte-Zielzone, Rest-Reihenfolge, Shuffle ja/nein, Hidden-Info, Events, Replay/StateHash, AI |
| misc.for-sale | Multi-Auswahl aus installierten Karten als Teilnotiz | Playkosten, auswählbare installierte Karten, Auswahlgrenze, Effekt pro Karte, Zonebewegung, Events, Replay/StateHash, AI |
| Open-Ended Mileage Program | Tag-Entfernung plus Rücknahme-Option als Teilnotiz | Playkosten, Tag-Anzahl, Rücknahme-Timing, Rücknahmeziel, Zonebewegung, Events, Replay/StateHash, AI |
| Organ Donor | Multi-Auswahl aus Hand als Teilnotiz | Playkosten, auswählbare Handkarten, Auswahlgrenze, Effekt pro Karte, Zonebewegung, Hidden-Info, Events, Replay/StateHash, AI |
| Security Code WORM Chip | Successful-HQ-run-Flag und unrezzed ICE-Ziel als Teilnotiz | Playkosten, HQ-Erfolgsfenster, Zielmenge unrezzed ICE, Effektresultat, Zonebewegung, Choice-Flow, Events, Replay/StateHash, AI |
| Synchronized Attack on HQ | Event-Oberfläche; HQ-Druck-Oberfläche | Playkosten, HQ-Run-/Access-Bedingung, Zielmenge, Choice-Flow, Zonebewegung, Events, Replay/StateHash, AI |
| Valu-Pak Software Bundle | eingeschränkte Extra-Aktionssequenz als Teilnotiz | Playkosten, erlaubte Extra-Aktionen, Sequenzlimit, Kostenmodifikatoren, Programmscope, Dauer, Events, Replay/StateHash, AI |

### Runner-Hardware

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| Arasaka Portable Prototype | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| Artemis 2020 | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| Bodyweight Data Creche | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| Corolla Speed Chip | Hardware-Chip; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Chip-Einzigartigkeit/Stacking, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| Microtech Backup Drive | Hardware; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Trigger-Timing, Ziele, Zone-/Statusänderungen, Effekt-Events, AI |
| Pandora's Deck | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| Parraline 5750 | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| PK-6089a | Hardware-Deck; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Deck-Einzigartigkeit, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |
| ZZ22 Speed Chip | Hardware-Chip; Install-LegalAction; WIP-Installkosten 0; Install-Visibility und Replay/StateHash | Per-card Effekt, Chip-Einzigartigkeit/Stacking, MU-/Modifier-Wert, hosted/recurring credits, Link/Extra-Run falls relevant, Effekt-Events, AI |

### Corp-Agendas

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| Corporate Retreat | Agenda-Oberfläche; Gray-Ops-Oberfläche | Advancement Requirement, Agenda Points, Subtypen, On-score-/Scored-Ability-Text, Timing, Kosten, Effektwerte, Events, Replay/StateHash, AI |
| Corporate War | Agenda-Oberfläche; Black-Ops; bedingter On-score Credit-Gewinn/-Verlust als Teilnotiz | Advancement Requirement, Agenda Points, On-score-Bedingung, Credit-Gewinn, Credit-Verlust, Timing, Events, Replay/StateHash, AI |
| Data Fort Reclamation | Advancement 4, Punkte 2; Errata: temporäre 9 Credits plus eigene Korp-Credits nutzbar, neues Data Fort entsteht durch Score-Effekt | Private HQ-Auswahl, neue-Remote-Projektion, Install-/Rez-Sequenz, temporäre Creditbuchung, Events, Replay/StateHash, AI |
| Marine Arcology | Agenda-Oberfläche; Economy-Oberfläche | Advancement Requirement, Agenda Points, On-score-/Scored-Ability-Text, Credit-Betrag, Bedingung, Timing, Events, Replay/StateHash, AI |
| Political Overthrow | Agenda-Oberfläche; Black-Ops; scored-agenda Action: gain credits als Teilnotiz | Advancement Requirement, Agenda Points, Action-Kosten, Credit-Gewinn, Nutzungslimit, Timing, Events, Replay/StateHash, AI |
| Security Purge | Advancement 3, Punkte 2; Errata: top 3 R&D oder vorhandene Karten zeigen, ICE wenn möglich installieren/rezzen, nur gedruckte Rez-Kosten gratis, Rest trashen | Serverziel-Projektion, Install-/Rez-Reihenfolge, Zusatzkosten, Reveal-/Trash-Visibility, Events, Replay/StateHash, AI |

### Corp-ICE

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| Haunting Inquisition | Rez 8, Stärke 6; Errata: mehrere Effekte laufen parallel; zählen nur tatsächlich genommene Aktionen; Bonus-Runs ohne Aktion bleiben möglich | Action-Lock-State, Actual-action-Counter, LegalAction/applyAction, Events, Replay/StateHash, AI |
| Tutor | Rez 4, Stärke 5; Errata: modifiziert nicht den aktuellen Tutor-Encounter, nur spätere Encounter im Run | Runweiter Modifier-State, zukünftige Encounter-Projektion, Subroutine-Indexing, Breakbarkeit, Events, Replay/StateHash, AI |
| Viral 15 | Rez 5, Stärke 3; Errata: Runner wählt zu trashende Programme | Jack-out-Tax-State, After-passing-rezzed-ice-Trigger, private Runner-Programmauswahl, Events, Replay/StateHash, AI |
| Virizz | ICE-Oberfläche; Sentry-Oberfläche; MU-/Memory-Oberfläche | Rez-Kosten, Stärke, Subtypen, Subroutinen, Encounter-Timing, MU-/Memory-Effekt, Effektwerte, Events, Replay/StateHash, AI |
| Zombie | ICE-Oberfläche; Sentry-Oberfläche | Rez-Kosten, Stärke, Subtypen, Subroutinen, Encounter-Timing, Effektwerte, Zielvalidierung, Events, Replay/StateHash, AI |

### Corp-Operations

| Karte | Bestätigte Teilbasis | Fehlende Informationen |
| --- | --- | --- |
| Edgerunner, Inc., Temps | Operation mit Soforteffekt | Playkosten, Timingbedingung, Zielmenge, Effektbeträge, Zonebewegungen, Events, Replay/StateHash, AI |
| Off-Site Backups | Operation mit Soforteffekt | Playkosten, Timingbedingung, Zielmenge, Effektbeträge, Zonebewegungen, Events, Replay/StateHash, AI |
| Planning Consultants | Operation mit Soforteffekt; Gray-Ops-Oberfläche | Playkosten, Timingbedingung, Zielmenge, Effektbeträge, Zonebewegungen, Events, Replay/StateHash, AI |

## Nächste Entscheidungsoptionen

1. Für `Security Purge`, `Tutor`, `Speed Trap`, `Startup Immolator`, `Data Fort Reclamation`, `Haunting Inquisition` und `Viral 15` liegen jetzt engere Errata-Hinweise vor; vor Code fehlen aber weiterhin technische LegalAction-/applyAction-, Visibility- und Replay-/StateHash-Verträge.
2. Bis ein solcher technischer Vertrag geschrieben und getestet wird, bleiben weitere Runtime-Schnitte, Catalog-, AI- und Release-Promotion geschlossen.
