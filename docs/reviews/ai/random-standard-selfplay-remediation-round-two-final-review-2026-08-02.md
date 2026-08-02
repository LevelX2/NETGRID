# Random-Standard-Selfplay-Remediation – Runde 2 – Review

Stand: 2026-08-02

## Ergebnis

Die drei deterministischen, partieblockierenden Choice-Lücken des zweiten
Zufallslaufs sind geschlossen. Die Änderungen erzeugen keine Deck-, Seed-,
Match- oder Karten-ID-Ausnahme. Planowner, Action-ID, Planinstanz und
Step-Capability bleiben bei der Payload-Auflösung erhalten.

Der identische Kontrollseed verbessert sich von einem RuntimeFailure nach 11
Aktionen über Zwischenabbrüche bei 162 und 299 zu einem replay-sicheren Lauf
bis zur Grenze von 500 Aktionen:

- RuntimeFailures: 0
- illegale Aktionen: 0
- Fallbacks: 0
- Timeouts: 0
- Replayfehler: 0
- Endstand am Aktionslimit: Runner 6, Corp 0
- vollständig erfasste Entscheidungen: 500/500
- Why-not für nicht gewählte Alternativen: 3333/3333

Das Aktionslimit und der ausbleibende Corp-Score sind keine technische
Laufzeitstörung. Sie bleiben zusammen mit den mittleren Wiederholungsbefunden
zur gesonderten Verhaltensfreigabe offen.

## Verifikation

- fokussierte Plan-/Resolver-/Live-Runtime-Suite: 420/420 grün
- `@netgrid/ai` Typecheck: grün
- AI-Source-Structure: grün, keine Runtime- oder Type-Zyklen
- Package Boundaries: grün
- Proteus-AI-Readiness: 154/154 konsistent
- DeckDoctrine-Strategieaggregation: grün
- Formatprüfung der geänderten Dateien: grün
- drei AI-Shards: 4531/4531 Tests grün

Der Card-Function-Abstraction-Checker besitzt unabhängig von dieser Änderung
einen bereits vorhandenen Inventardrift in Shell-Traders-Testtext. Die neuen
Runtimepfade erzeugen keinen zusätzlichen Kartenname-Fund; der fremde
generierte Inventardiff wurde nicht übernommen.

## Reviewurteil

Die zwingenden Laufzeitkorrekturen sind integrationsfähig. Die offenen
Langspiel- und Wiederholungsbefunde benötigen vor einer Verhaltensänderung eine
separate Freigabe und konkrete Checkpoints.
