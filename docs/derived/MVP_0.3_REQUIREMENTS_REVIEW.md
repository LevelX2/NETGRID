# MVP 0.3 Requirements Review

Status: passed  
Stand: 2026-05-03

## Review-Ergebnis

`ready_for_implementation: true`

## Geprüfte Punkte

- V0.3 erweitert keine Karten und keine neuen offiziellen Mechaniken.
- Jede Must-Anforderung hat eine Test- oder Szenariozuordnung.
- AI-Inputs sind side-neutral und allowlist-basiert beschrieben.
- KI-Erklärungen sind als sichtbasierte, deterministische Kurzbegründungen spezifiziert.
- Simulationen sind durch Seed, Action-Limit, Winner/Limit-Ergebnis und StateHash testbar.
- UI- und Servermodi nutzen weiterhin PlayerView, LegalActions und PublicEvents.

## Scope-Anpassungen

- Hard Difficulty bleibt typisiert, aber echter Lookahead ist kein Gate.
- Längere Soak-Läufe sind reproduzierbar vorbereitet, aber nicht zwingend Teil jedes schnellen Checks.
- V0.4-Kartenpoolthemen bleiben gesperrt, bis `MVP_0.3_done: true` erreicht ist.

## Risiken

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| AI-Orchestrator könnte FullState in Standardpayloads spiegeln | hoch | Summary-/Payload-Tests gegen `cardInstances`, Tokens und verdeckte Titel. |
| KI-Endlosschleifen | mittel | Action-Limit und deterministic fallback. |
| Erklärungen leaken Hidden Info | hoch | Reason-Code-Templates und Visibility-Tests. |
| Server-Autoplay divergiert vom Human-Pfad | mittel | AI-Actions laufen durch `applyAction` und bestehende Event-/StateHash-Pfade. |
