using Microsoft.Win32;
using Netgrid.Windows;

internal static class MsiLeaseTests
{
    public static void Run(RegistryKey fixture, string program, Action<bool, string> assert, Action<Action, string> reject)
    {
        var root = program + "-msi";
        var key = InstallationGate.KeyFor(root);
        var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
        var otherProduct = Guid.NewGuid().ToString("B").ToUpperInvariant();
        var msi = Guid.NewGuid().ToString("N");
        var other = Guid.NewGuid().ToString("N");
        InstallationGate.GateState Read() => InstallationGate.Read(fixture, key)!;
        InstallationLease.BeginMsi(fixture, root, msi, product, "");
        var initial = Read();
        assert(initial.Active && initial.Lease == msi && initial.MsiLease == msi && initial.MsiProductCode == product, "standalone_msi_owns_transaction");
        assert(InstallationLease.RequireMsi(fixture, root, msi, product).Encode() == initial.Encode(), "nested_join_preserves_complete_record");
        reject(() => InstallationLease.RequireMsi(fixture, root, msi, otherProduct), "installation_gate_msi_owner_missing");
        reject(() => InstallationLease.RequireMsi(fixture, root, other, product), "installation_gate_msi_owner_missing");
        reject(() => InstallationLease.BeginMsi(fixture, root, other, product, ""), "installation_gate_already_owned");
        reject(() => InstallationLease.ReleaseOwned(fixture, root, msi), "installation_gate_msi_still_active");
        assert(!InstallationLease.CompleteMsi(fixture, root, other, product), "failed_concurrent_msi_cannot_release_owner");
        assert(!InstallationLease.CompleteMsi(fixture, root, msi, otherProduct), "foreign_product_cannot_complete_msi");
        assert(Read().Encode() == initial.Encode(), "rejected_msi_calls_do_not_mutate");
        assert(InstallationLease.CompleteMsi(fixture, root, msi, product), "standalone_msi_completes");
        assert(!Read().Active && Read().MsiLease == "" && Read().MsiProductCode == "", "standalone_completion_clears_msi_binding");
        assert(!InstallationLease.CompleteMsi(fixture, root, msi, product), "repeated_completion_is_not_new_authority");

        var outer = Guid.NewGuid().ToString("N");
        var parentStart = Math.Max(DateTime.UtcNow.Ticks, Read().CompletedUtcTicks + 1);
        InstallationLease.BeginPreparing(fixture, root, outer, 101, parentStart, 202, parentStart + 1);
        reject(() => InstallationLease.BeginMsi(fixture, root, msi, product, outer), "installation_gate_update_owner_missing");
        InstallationLease.StopPrepared(fixture, root, outer);
        var stopping = Read();
        reject(() => InstallationLease.BeginMsi(fixture, root, msi, product, other), "installation_gate_update_owner_missing");
        InstallationLease.BeginMsi(fixture, root, msi, product, outer);
        var joined = Read();
        assert(joined.Lease == outer && joined.OwnerId == stopping.OwnerId && joined.OwnerStart == stopping.OwnerStart,
            "child_msi_preserves_updater_identity");
        reject(() => InstallationLease.BeginMsi(fixture, root, other, product, outer), "installation_gate_update_owner_missing");
        reject(() => InstallationLease.ReleaseOwned(fixture, root, outer), "installation_gate_msi_still_active");
        assert(InstallationLease.RequireMsi(fixture, root, msi, product).Encode() == joined.Encode(), "nested_upgrade_inside_outer_update_readonly");
        assert(InstallationLease.CompleteMsi(fixture, root, msi, product), "child_msi_completes");
        assert(Read().Encode() == stopping.Encode(), "child_commit_preserves_outer_stopping_lease_exactly");
        assert(InstallationGate.BlocksStart(Read(), DateTime.UtcNow.AddDays(1), 303), "child_commit_does_not_allow_runtime_start");
        InstallationLease.BeginMsi(fixture, root, other, otherProduct, outer);
        assert(!InstallationLease.CompleteMsi(fixture, root, msi, product), "old_msi_rollback_cannot_clear_next_child");
        assert(InstallationLease.CompleteMsi(fixture, root, other, otherProduct), "rollback_child_completes_without_releasing_update");
        assert(Read().Encode() == stopping.Encode(), "child_rollback_keeps_outer_guard");
        assert(InstallationLease.ReleaseOwned(fixture, root, outer), "outer_owner_releases_after_all_children");
        reject(() => InstallationLease.BeginMsi(fixture, root, msi, product, outer), "installation_gate_update_owner_missing");

        using var raw = fixture.OpenSubKey(key, writable: true)!;
        var inconsistentOwner = initial.Encode().Split('|');
        inconsistentOwner[8] = other;
        raw.SetValue("Lease", string.Join('|', inconsistentOwner));
        reject(() => InstallationGate.Read(fixture, key), "installation_gate_msi_owner_invalid");
        foreach (var record in new[] { initial, joined })
        {
            raw.SetValue("Lease", record.Encode());
            assert(Read().Encode() == record.Encode(), "msi_binding_roundtrip");
            foreach (var (field, value, code) in new[] {
                (8, "", "installation_gate_lease_invalid"), (9, "", "installation_gate_product_code_invalid"),
                (9, Guid.Empty.ToString("B"), "installation_gate_product_code_invalid"),
                (2, "preparing", "installation_gate_msi_phase_invalid"),
                (2, "completed", "installation_gate_msi_phase_invalid") })
            {
                var fields = record.Encode().Split('|'); fields[field] = value;
                raw.SetValue("Lease", string.Join('|', fields));
                reject(() => InstallationGate.Read(fixture, key), code);
            }
        }
    }
}
