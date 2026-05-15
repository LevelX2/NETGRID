---
jobId: spotcheck-2026-05-15-hosting-damage-multiaccess
status: ready_for_implementation
createdAt: 2026-05-15T16:20:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_041_microtech-ai-interface
    title: Microtech AI Interface
  - cardId: onr_v1_048_poltergeist
    title: Poltergeist
  - cardId: onr_v1_069_succubus
    title: Succubus
  - cardId: onr_v1_099_mantis-fixer-at-large
    title: "Mantis, Fixer-at-Large"
  - cardId: onr_v1_105_priority-wreck
    title: Priority Wreck
  - cardId: onr_v1_130_lifesaver-nanosurgeons
    title: Lifesaver Nanosurgeons
  - cardId: onr_v1_138_pk-6089a
    title: PK-6089a
  - cardId: onr_v1_234_data-darts
    title: Data Darts
  - cardId: onr_v1_294_new-blood
    title: New Blood
  - cardId: onr_v1_326_holovid-campaign
    title: Holovid Campaign
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-hosting-damage-multiaccess

## Auswahlprüfung

Arbeitsstand: Generatorlauf auf `main`, Queue-Verzeichnisse vorhanden, vorhandener Generator-Lock war `released` und damit inaktiv. Register und Queue wurden als primäre Deduplizierungsquellen gelesen:

- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/derived/originalset-spotcheck-jobs/inbox/*.md`
- `docs/derived/originalset-spotcheck-jobs/in_progress/*.md`
- `docs/derived/originalset-spotcheck-jobs/done/*.md`
- `docs/derived/originalset-spotcheck-jobs/blocked/*.md`

Deduplizierung: 200 Card IDs waren tabu. Die zehn ausgewählten Karten wurden anschließend einzeln gegen alle gelesenen Register-/Queue-Quellen gegengeprüft; keine der zehn IDs kam dort vor.

Auswahlmodus: zufällige Auswahl aus komplexeren, bereits decklegalen O:NR-v1-Karten mit Fokus auf Multiaccess, Hidden-Zone, Hosting, Damage-/Prevention-Fenster, Recurring-/Start-of-turn-Zustände und Replay-/StateHash-Risiken.

## Kartenbefunde

### onr_v1_041_microtech-ai-interface - Microtech AI Interface

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

V1.9.15 markiert die Karte als `human_playable`, `deck_legal` und `ai_supported` mit `run_flow_lock_resolver; access_breach_multiaccess_resolver`. Das ist ein guter Basispfad, aber der Spotcheck sollte die installierte Quelle und die Access-Erweiterung enger prüfen: Mehrfachkopien, Source-Trash während eines Runs, Serverwechsel, Stale-State und Queue-Invalidierung sind die riskanten Stellen. Hidden-Info-seitig darf die Karte nur zusätzliche Access-Optionen und Counts öffentlich machen, nicht kommende HQ-/R&D-Inhalte.

Notwendige Umsetzung

- Ergänze einen fokussierten Engine-Nachtest für mehrere installierte Kopien und source-bound Bonus-Access.
- Revalidiere in `applyAction`, dass die auslösende Installation noch liegt, zur Runner-Seite gehört und die Access-Queue noch zum aktuellen Run gehört.
- Härte PublicEvents so, dass nur Quelle, Server, Access-Anzahl und Entscheidungstyp öffentlich sind.
- Prüfe, ob die KI-Hints die Karte nur aus sichtbarer Run-/Access-Lage bewerten und keine verdeckten Karten einplanen.

Akzeptanzkriterien

- Falsche Seite, falscher Source, stale `stateVersion` und nachträglich getrashte Quelle werden abgewiesen.
- Mehrere Kopien stacken nur nach explizitem lokalen Vertrag oder werden deterministisch begrenzt.
- Replay erzeugt identischen StateHash; PublicPayload enthält keine zukünftigen Access-Karten.

### onr_v1_048_poltergeist - Poltergeist

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

V1.9.22 führt Poltergeist als decklegale Karte, aber der Runtime-Vertrag ist laut Release-Artefakten nur install-only ability-gated. Die lokale Faktenbasis nennt 2 restricted recurring Credits aus der Bank für Node-Trash-Kosten mit Refresh zu Beginn des nächsten Runner-Zugs. Damit ist der wichtigste Effektpfad noch nicht voll nachgetestet: Zahlungsfenster, Zieltyp Node, Trashkostenquelle, Credit-Verbrauch und Refresh.

Notwendige Umsetzung

- Implementiere oder härte den vollständigen Poltergeist-Zahlungspfad für Node-Trashkosten.
- Binde die Recurring-Credits an die installierte Karteninstanz, nicht an die Kartendefinition.
- Revalidiere Zieltyp, Zugriffssituation, Trashkosten und verbleibende Recurring-Credits in `applyAction`.
- Ergänze Start-of-turn-Refresh aus der Bank inklusive Chronik- und Replay-Test.

Akzeptanzkriterien

- Credits dürfen nur für Node-Trashkosten ausgegeben werden, nicht für Assets, Upgrades, Installkosten oder allgemeine Kosten.
- Verbrauch und Refresh erscheinen öffentlich nur als Credit-/Counter-Daten ohne Hidden-Info.
- Mehrere Poltergeist-Kopien, Stale-Action und Source-Trash sind deterministisch abgedeckt.

### onr_v1_069_succubus - Succubus

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Succubus ist ein älterer Hosting-/Daemon-Pfad mit 3 MU Hosted-Program-Kapazität und Host-Trash-Kaskade. Die Kernabdeckung existiert, aber der Spotcheck sollte sie gegen spätere Hosting-, Memory- und Trash-Mechaniken nachhärten. Besonders wichtig sind hostedOn-Konsistenz, nested oder unzulässiges Hosting, Programmtypfilter, MU-Projektion und deterministische Kaskade bei Hostverlust.

Notwendige Umsetzung

- Ergänze einen Regressionstest mit mehreren hosted Programmen, voller Kapazität und abgelehntem Überkapazitäts-Host.
- Revalidiere Host-Eligibility in LegalAction und `applyAction`: installierter Succubus, Runner-Programmziel, verfügbare Host-MU, keine fremde Zone.
- Härte Host-Trash-Kaskade gegen doppelte Trash-Events und gegen überlebende verwaiste `hostedOn`-Referenzen.
- Prüfe AI-Hints/Planung auf sichtbare Hostkapazität und Trash-Risiko.

Akzeptanzkriterien

- Hosted Programme verbrauchen keine normale Runner-MU, solange sie gültig auf Succubus liegen.
- Bei Hostverlust landen alle hosted Programme exakt einmal im Heap und keine Instanz bleibt in der Rig-Liste.
- Replay/StateHash bleibt stabil, auch wenn mehrere hosted Karten gleichzeitig getrasht werden.

### onr_v1_099_mantis-fixer-at-large - Mantis, Fixer-at-Large

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Mantis nutzt den Hidden-Zone-Search/Reveal/Shuffle-Pfad. Die Karte ist riskant, weil sie private Stack-Auswahl, öffentliches Reveal, Shuffle und mögliche kurze Stack-Zustände kombiniert. Der bestehende V1.9.11-Vertrag nennt Search, Reveal, Shuffle und LegalAction-only; ein Spotcheck sollte vor allem Hidden-Info-Redaction, Choice-Revalidation und RandomDrawRecord-/Shuffle-Determinismus prüfen.

Notwendige Umsetzung

- Ergänze Tests für kurze oder leere Stack-Zustände und für ungültig gewordene Choice-IDs.
- Stelle sicher, dass der Runner private Auswahloptionen erhält und die Corp nur Count/Reveal-Ergebnis sieht.
- Revalidiere in `applyAction`, dass die gewählte Karte aus der aktuellen privaten Suchauswahl stammt.
- Dokumentiere im PublicEvent nur revealed Card ID, Search-Count und Shuffle-Event, nicht die nicht gewählten Stackkarten.

Akzeptanzkriterien

- Nicht gewählte Stackkarten tauchen weder in Corp-View, PublicEvents, Reconnect noch Replay-Export auf.
- Shuffle nutzt deterministische Records und reproduziert den StateHash.
- Wrong-side, stale und manipulierte Choice-ID werden abgewiesen.

### onr_v1_105_priority-wreck - Priority Wreck

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Priority Wreck erzeugt eine deterministische Zwei-Karten-R&D-Breach-Queue ohne vorzeitigen Leak späterer Queue-Karten. Das ist genau der richtige Risikofokus, aber der Pfad sollte noch gegen R&D-Veränderung zwischen Queue-Erzeugung und Access, Runner-Abbruch, Ersatzaccess und mehrere aktive Multiaccess-Quellen gehärtet werden.

Notwendige Umsetzung

- Ergänze einen Nachtest, in dem die R&D-Queue während des Runs nicht vorzeitig beide Karten offenlegt.
- Revalidiere jede Access-Action gegen Run-ID, Queue-ID, Queue-Index und aktuelle `stateVersion`.
- Prüfe Interaktion mit anderen installierten Access-Helfern und mit Access-Replacement-Effekten.
- Härte Chronik gegen Titel-Leaks: erst beim tatsächlichen Access darf der jeweilige Kartentitel sichtbar werden.

Akzeptanzkriterien

- Corp- und Public-View sehen vor dem zweiten Access keine zweite R&D-Karte.
- Queue-Abbruch, Stale-Action und fremder Server werden abgewiesen oder sauber bereinigt.
- Replay/StateHash bleibt für beide Access-Schritte deterministisch.

### onr_v1_130_lifesaver-nanosurgeons - Lifesaver Nanosurgeons

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Die Karte liegt im Damage-/Prevention-/Core-Damage-Cluster. Kritisch sind Timing-Fenster, die Quelle der Prevention, Grenzfälle bei mehreren gleichzeitigen Damage-Events und die Frage, ob Prevent/Pass als LegalActions vollständig aus dem aktuellen Damage-Event abgeleitet werden. Hidden-Info entsteht vor allem beim Random-Trash aus Grip und bei Flatline-/Core-Damage-Folgen.

Notwendige Umsetzung

- Ergänze gezielte Tests für Core-Damage-Prevention, Nicht-Core-Damage-Negativfälle und mehrere installierte Kopien.
- Revalidiere `applyAction` gegen laufendes Damage-Event, Quelle, Kosten, verbleibende Prevent-Menge und Side.
- Stelle sicher, dass Random-Grip-Trash nur Counts und öffentlich gewordene Karten preisgibt.
- Prüfe, ob Chronik und PublicPayload Prevention-Quelle und verhinderte Menge nennen, aber keine private Handinformation.

Akzeptanzkriterien

- Prevention ist nur im passenden Damage-Fenster legal und kann nicht später nachgereicht werden.
- Stale Damage-Choices, falsche Source und falsche Damage-Art werden abgewiesen.
- StateHash bleibt über Prevent/Pass und Random-Trash stabil.

### onr_v1_138_pk-6089a - PK-6089a

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

PK-6089a ist als V1.9.22 Hardware-Deck decklegal, aber die Manifest-Spur beschreibt nur die Install-/Memory-Oberfläche. Die lokale Faktenbasis nennt +1 MU, 3 recurring Credits für Link-Erhöhungen und Deck-Einzigartigkeit. Der kritische Nachtest ist deshalb der volle Recurring-Link-Zahlungspfad samt Refresh und Deck-Unique-Verhalten.

Notwendige Umsetzung

- Ergänze vollständige Runtime- und Testabdeckung für 3 restricted recurring Credits, die nur für Link-Erhöhung in Trace-Fenstern gelten.
- Revalidiere Zahlung in `applyAction` gegen Trace-ID, Link-Bid-Fenster, Creditquelle und verfügbare Recurring-Credits.
- Härte Deck-Unique: Deckvalidierung und Runtime-Install dürfen keine zweite Deck-Hardware zulassen, sofern der lokale Vertrag das fordert.
- Prüfe MU-Bonus und Recurring-Pool bei Install, Trash und Reinstall.

Akzeptanzkriterien

- Recurring-Credits können nicht für normale Kosten, Runner-Bids außerhalb des Trace-Fensters oder Corp-Kosten verwendet werden.
- Start-of-turn-Refresh ist public-payload-sicher und replaystabil.
- MU und Deck-Unique bleiben nach Trash/Reinstall konsistent.

### onr_v1_234_data-darts - Data Darts

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Data Darts ist decklegal im Damage-Cluster, aber lokale Quellen weisen auf einen wichtigen Sonderfall hin: Net Damage plus Next-ICE-Break-Restriktion. Die aktuelle Manifest-Spur deckt Damage/Prevention, aber der run-lokale Modifier für das nächste ICE darf nicht verloren gehen. Die Karte ist daher besonders geeignet für einen Implementierungsjob.

Notwendige Umsetzung

- Implementiere oder härte den Next-ICE-Modifier, der Subroutinen des nächsten encountered ICE nicht brechbar macht, sofern der bestätigte lokale Vertrag dies vorsieht.
- Binde den Modifier an Run-ID, Timingpunkt und genau das nächste ICE; bereinige ihn bei Run-Ende, Jack-out oder wenn kein weiteres ICE encountered wird.
- Revalidiere Break-Actions gegen den aktiven Data-Darts-Marker und stelle projektionstreue LegalActions sicher.
- Ergänze Damage-, Prevention-, PublicPayload- und Replay-Tests für den kombinierten Subroutine-/Damage-Pfad.

Akzeptanzkriterien

- Nach Data-Darts-Auflösung sind Break-LegalActions am nächsten ICE korrekt entfernt oder als illegal revalidiert.
- Spätere ICE im selben Run sind wieder normal brechbar, falls der Vertrag nur das nächste ICE betrifft.
- Damage- und Modifier-Chronik leakt keine verdeckten Karten.

### onr_v1_294_new-blood - New Blood

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

New Blood ist nur nach einem sichtbaren Runner-Run-Versuch im letzten Zug legal und erzeugt öffentliche Credit-Pressure. Der zentrale Risikopunkt ist die Run-History: Sie muss turngenau, side-sicher und öffentlich ableitbar sein. Zusätzlich existierten lokale Scan-/Mapping-Hinweise; für diesen Job geht es nicht um Assets, sondern um den Engine-Vertrag.

Notwendige Umsetzung

- Ergänze Grenztests für kein Run, erfolgreicher Run, erfolgloser Run, Bonus-Run und Run im falschen Zugfenster.
- Revalidiere `applyAction`, dass die Operation nur bei sichtbarem Runner-Run-Versuch im unmittelbar vorherigen Runner-Zug legal ist.
- Stelle sicher, dass keine Hidden-Run- oder private Entscheidungsdetails in KI-Input/PublicPayload erscheinen.
- Prüfe Chronik auf klare öffentliche Ursache: letzter sichtbarer Run-Versuch plus öffentlicher Credit-Effekt.

Akzeptanzkriterien

- Current-turn, older-turn, canceled-run und falsche Seite werden abgewiesen.
- PublicPayload nennt nur öffentliche Run-History und Creditänderung.
- Replay/StateHash bleibt stabil, auch bei Bonus-Run- und Jack-out-Verläufen.

### onr_v1_326_holovid-campaign - Holovid Campaign

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Holovid Campaign ist ein rezzed Asset/Node mit hosted bank bits, Start-of-turn-Entnahme und Selbsttrash bei leerem Pool. Das ist ein langlebiger öffentlicher Zustand und berührt Recurring-/Counter-/Trash-Lifecycle. Der Nachtest sollte besonders den letzten Counter, mehrere Kopien, Rezzed-only-Verhalten und Trash-on-access-Interaktion prüfen.

Notwendige Umsetzung

- Ergänze Tests für Rez mit exakt 12 öffentlichen Bits, Start-of-turn-Entnahme und Auto-Trash beim letzten entfernten Bit.
- Revalidiere, dass der Start-of-turn-Pfad nur für gerezzte, installierte Holovid-Instanzen läuft.
- Prüfe mehrere Kopien mit separaten Counterpools und unabhängigen Auto-Trash-Ereignissen.
- Härte Chronik/PublicPayload: Counterstand und Selftrash sind öffentlich, aber keine Remote-Inhalte werden durch Serverposition oder Zugriffskontext geleakt.

Akzeptanzkriterien

- Unrezzed Holovid bekommt keine Start-of-turn-Entnahme und keinen Credit-/Countereffekt.
- Der letzte Counter triggert genau einen Selftrash und bereinigt installierte Instanzen sauber.
- Replay/StateHash bleibt bei mehreren parallelen Holovid-Instanzen stabil.

## Gesamtplan

1. Zuerst die zwei klarsten Vollwirkungslücken schließen: Poltergeist und PK-6089a Recurring-Credit-Zahlungsfenster.
2. Danach Data Darts als kombinierten Damage- und Next-ICE-Modifier umsetzen, weil dort LegalAction-Projektion und `applyAction` besonders eng gekoppelt sind.
3. Anschließend die bestehenden komplexen Pfade nachhärten: Priority Wreck, Microtech AI Interface und Mantis für Hidden-Info/Multiaccess; Succubus und Holovid für Hosting/Counter-Lifecycle; Lifesaver und New Blood für Timing- und Event-Revalidation.
4. Alle Karten bleiben über die Rules Engine führend. UI, Server und KI dürfen keine Sonderlogik erhalten, die nicht aus LegalActions und PlayerViews ableitbar ist.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test -- --runInBand`
- `pnpm --filter @netgrid/catalog test -- --runInBand`
- fokussierte Engine-Smokes für die zehn Karten mit Wrong-Side-, Stale-State-, Hidden-Info- und Replay/StateHash-Fällen
- Leakscan auf PublicEvents, PlayerViews, Reconnect-Payloads und KI-Inputs für alle Hidden-Zone-, Access-Queue- und Damage-Fenster
- Manifest-/AI-Hint-Abgleich nach Umsetzung, aber erst im Implementierungsjob und nicht durch diesen Generatorlauf
