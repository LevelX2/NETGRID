# Private Replay, Analyse und Lernhilfe 1.5.0 Spec

Stand: 2026-05-08
Status: eingefroren

## Grundsatz

Replay ist Beobachtung und Analyse, nicht Regelautorität.

```txt
Stored Match/EventLog/Snapshots -> ReplayLoader -> RedactedReplayView -> ReplayTimeline
```

## Replay-Metadaten

Zulässig:

- Replay-ID.
- Datum.
- RulesBaseline.
- Formatprofil.
- Matchmodus.
- Seitenrollen.
- Ergebnis.
- finaler StateHash.
- lokale Analysemarker ohne Secrets.

Verboten:

- Tokens.
- Session-IDs.
- Invite-Links.
- private lokale Pfade.
- vollständige private Decklisten in öffentlichen oder side-fremden Perspektiven.
- versteckte Kartenidentitäten außerhalb erlaubter Perspektiven.

## Perspektiven

| Perspektive | Zweck | Hidden-Info-Regel |
| --- | --- | --- |
| Runner | Runner-seitige Replay-Sicht | entspricht Runner PlayerView plus erlaubter Historie |
| Corp | Corp-seitige Replay-Sicht | entspricht Corp PlayerView plus erlaubter Historie |
| Local Analysis | private lokale Diagnose | darf nur lokal sichtbar sein und muss export-/payload-redigiert werden |

## Timeline

Timeline-Schritte zeigen:

- Event-ID.
- StateVersion vorher/nachher.
- TimingPoint.
- Seite.
- sichtbare Beschreibung.
- StateHash-Prüfung.
- Hidden-Info-Barriere, falls relevant.
- RandomDrawRecord-Hinweis, falls relevant.
- DecisionDebug-Referenz, falls vorhanden und erlaubt.

## Event-Rendering

Mindestens abstrahiert renderbar:

- Setup und Mulligan.
- Run, Encounter, Jack-out, Breach, Access.
- Score und Steal.
- Damage, Flatline und Core Damage.
- Trace, Bidding und Tags.
- Resource-Trash.
- Replacement und Prevention-Pilotfälle.
- Special Zones, Ownership und Control.
- AI-DecisionDebug.

## Export

Export muss:

- side-sichere Perspektive wählen,
- Secrets entfernen,
- lokale Pfade entfernen,
- private Sessions entfernen,
- Hidden Info redigieren,
- Version und RulesBaseline enthalten,
- optional Exploit-Kandidaten als Review-Vorschlag markieren.

## Analyse

Analyse darf:

- LegalActions erklären,
- KI-Planwahl kontextualisieren,
- Fallbacks und Timeouts markieren,
- auffällige Sequenzen als QA-Kandidaten markieren.

Analyse darf nicht:

- Live-Spielzüge erzeugen,
- illegale Vorschläge machen,
- verdeckte gegnerische Karten nennen,
- echte Regelentscheidung ersetzen.

## No-Scope

- Kein Public Replay.
- Kein Spectator.
- Kein Cloud-Sync.
- Kein LLM-Live-Coach.
- Keine Karten-/Mechanikfreigabe.
