# V1.9.9 Prep Checklist – Sprintstartpaket

## 1) Scope Freeze

1. Nur diese vier Upgrade-Karten sind im Sprintziel:
1. `onr_v1_349_aardvark`
2. `onr_v1_351_bizarre-encryption-scheme`
3. `onr_v1_352_chester-mix`
4. `onr_v1_353_chimera`
2. Keine zusätzliche Mechanik außer Hook-Refactoring, das direkt für diese vier Karten benötigt wird.
3. `V1.9.9` bleibt ohne V2.x-Funktionserweiterungen.

## 2) Regelinterpretation vor Implementation

1. Pro Karte existiert eine Kurzentscheidung in `docs/releases/v1/v1-9-originalset-completion/v1-9-9-pre-sprint/plan.md`.
2. Trigger, Verantwortlichen (Runner/Corp), Entscheidungsmoment und Endzustand sind je Karte dokumentiert.
3. Edge-Fälle sind vorab festgelegt:
1. Keine weiteren Runs betroffen.
2. Kein Agenda-Score außerhalb der BES-Guard-Regel.
3. Keine Daemon-Auswahl bei leerem Kontext.
4. Keine Kostenuntergrenze unklar bei Chester Mix.

## 3) Resolver-Hygiene

1. Für jede Karte existiert ein Resolver-Familienname und dieser steht in den Planungsartefakten.
2. Resolver-Ausführung ist vollständig deterministic und kann rückgängig gemacht werden.
3. No-Op-Pfade sind explizit definiert (z. B. kein Daemon vorhanden, kein Agenda mehr scorable).

## 4) KI-Enablement

1. Entscheidungspfade mit echter Choice:
1. Aardvark-Rezzen.
2. Daemon-Auswahl.
2. BES verwendet einen verzögerten Score-Marker.
3. Chester Mix fließt in Kostenbewertung ein.
3. Für alle drei Pfade gibt es mindestens einen fallbackbaren Determinismuspfad.

## 5) Daten- und Manifestvorbereitung

1. Zielstatus für die vier Karten:
1. `implemented=true`
2. `playable=true`
3. `deck_legal=true`
4. `resolverFamily` gesetzt
2. Karten bleiben bis Final-Review in `not_implemented_catalog_only` aus der Vorplanung aus.
3. Die Datenstände werden mit den Manifest-/Coverage-/Smoke-Artefakten abgeglichen.

## 6) Testdesign

1. Human-Szenarien:
1. Aardvark-Run mit Worm und Rez-Entscheidung.
2. BES-Access mit nicht sofortigem Scoring.
3. Chester Mix beim ICE-Install auf Zielserver.
4. Chimera-Access mit und ohne Daemon.
2. KI-Szenarien:
1. Aardvark entscheidet korrekterweise bei relevanter Spielsituation.
2. Chimera wählt reproduzierbar einen Daemon.
3. BES-Delay bleibt KI-seitig als State-Marker konsistent.

## 7) Risiko-Register

1. Aardvark löst mehrfach auf demselben Server aus.
2. BES wird durch andere Scoring-Wege vorzeitig abgearbeitet.
3. Daemon-Auswahl ist ungültig, weil kein Daemon installiert ist.
4. Chester-Mix wird auf nicht-servergebundenen ICE-Installationen angewandt.
5. Resolver-Events treten im Undo/Redo falsch erneut auf.

## 8) Rollback-Entscheidungen

1. Wenn ein Resolver-Regressionsfehler entdeckt wird, wird die Karte wieder auf `implemented/playable=false` gesetzt.
2. Die übrigen Karten bleiben unverändert, damit der Scope nicht kollabiert.
3. Nach Korrektur wird die Karte neu auf `SCOPE_REVIEW` zurückgeführt und erneut geprüft.

## 9) Abschluss der Prep

1. `V1_9_9_SPRINT_INITIATION_REVIEW.md` erstellt.
2. Alle Punkte in dieser Checkliste sind auf `done` gesetzt.
3. Start der eigentlichen Implementierung wird freigegeben.
