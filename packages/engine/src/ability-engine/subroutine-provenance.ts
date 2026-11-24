import {
  isSubroutineProvenance,
  type SubroutineDefinition,
  type SubroutineProvenance,
} from "@netgrid/shared";

export function requireSubroutineProvenance(
  subroutine: SubroutineDefinition,
): SubroutineProvenance {
  if (!isSubroutineProvenance(subroutine.provenance))
    throw new Error("runtime_subroutine_provenance_missing");
  return subroutine.provenance;
}

export function subroutineProvenanceKey(
  provenance: SubroutineProvenance,
): string {
  return JSON.stringify(provenance);
}

export function sameSubroutineProvenance(
  left: SubroutineProvenance | undefined,
  right: SubroutineProvenance,
): boolean {
  return (
    left !== undefined &&
    subroutineProvenanceKey(left) === subroutineProvenanceKey(right)
  );
}
