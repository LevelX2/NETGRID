# Release-Dokumentation

Stand: 2026-08-12

`docs/releases/` enthält Release-, Requirement-, Gate- und Planungsartefakte nur solange sie für aktuellen oder absehbar relevanten Projektstand benötigt werden.

## Grundregel

Git-Historie ist der Audit-Trail für abgeschlossene Version-0-Releasearbeit. Requirements, Testmatrizen, Implementation Reviews, Final Reviews und Detailpläne werden nicht allein wegen ihres Dokumenttyps dauerhaft konserviert.

Behalten werden insbesondere:

- aktuelle oder zukünftige Roadmaps und Produktvisionen;
- aktive Release-/Plattformverträge;
- aktuelle Requirements, Specs und Gates, die noch Produktverhalten oder Folgearbeit steuern;
- Final Reviews oder andere Evidence, wenn sie heute noch die einzige relevante Freigabe-, Safety- oder Removal-Condition-Quelle sind.

Entfernt werden nach Referenzprüfung insbesondere:

- abgeschlossene historische Releasefamilien ohne aktuellen Steuerungsnutzen;
- überholte Detailpläne und Zwischenreviews;
- paketweise Implementierungsnachweise, deren Ergebnis bereits in aktuellem Code, Tests, Status oder Verträgen steckt.

## Aktueller Strukturhinweis

- `roadmaps/`: releaseübergreifende Roadmaps und Produktvisionen; auch hier werden alte Bestandsaufnahmen schrittweise entfernt.
- `v2/`: enthält aktuell relevante Plattform-/Account-/Public-Lobby-/Safety-Verträge, ist aber ebenfalls nach Current-State-Nutzen zu prüfen.
- `mvp/`, `v1/`, `ai/`, `classic/`, `proteus/`, `special/` und `backend-ops/`: enthalten überwiegend abgeschlossene oder gemischte historische Familien und sind Kandidaten für separate Cleanup-Wellen.

Die bloße Existenz eines Releaseordners bedeutet keine aktuelle Release- oder Gate-Autorität. Führend sind Wissensbasis, konsolidierte Roadmap, aktuelle Statusdokumente, Code und aktive Verträge.

Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
