using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class MsiOperationTests
{
    internal static int Run()
    {
        var checks = 0;
        var fixturePath = @"SOFTWARE\LevelX2\NETGRID.MsiOperation.Tests\" + Guid.NewGuid().ToString("N");
        const string root = @"C:\NETGRID-msi-operation-fixture\program";
        try
        {
            using var fixture = Registry.CurrentUser.CreateSubKey(fixturePath, writable: true)!;
            using var self = Process.GetCurrentProcess();
            var lease = Guid.NewGuid().ToString("N");
            var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            var foreign = Guid.NewGuid().ToString("B").ToUpperInvariant();
            InstallationLease.BeginMsi(fixture, root, lease, product, "");
            Reject(() => InstallationLease.BeginMsiOperation(fixture, root, lease, foreign), "installation_gate_msi_owner_missing");
            Reject(() => InstallationGate.OpenVerificationOwner(fixture, root, lease), "installation_gate_update_owner_missing");
            InstallationLease.BeginMsiOperation(fixture, root, lease, product);
            var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Check(state.OwnerId == self.Id && state.OwnerStart == self.StartTime.ToUniversalTime().Ticks && state.Active, "exact_operation_owner");
            using (var owner = InstallationGate.OpenVerificationOwner(fixture, root, lease)) Check(owner.Id == self.Id, "verification_owner_resolves");
            Reject(() => InstallationGate.OpenUpdateOwner(fixture, root, lease), "installation_gate_update_owner_missing");
            Reject(() => InstallationLease.BeginMsiOperation(fixture, root, lease, product), "installation_gate_msi_operation_already_owned");
            Reject(() => InstallationLease.CompleteMsi(fixture, root, lease, product), "installation_gate_msi_operation_still_active");
            Reject(() => InstallationLease.RollbackMsi(fixture, root, lease, product), "installation_gate_msi_operation_still_active");
            Reject(() => InstallationLease.ReleaseOwned(fixture, root, lease), "installation_gate_msi_still_active");
            Check(InstallationGate.BlocksStart(state, self.StartTime.ToUniversalTime(), self.Id), "helper_is_not_runtime_exception");

            var childId = self.Id == 101 ? 303 : 101;
            var childStarted = DateTime.UtcNow;
            InstallationLease.BeginVerification(fixture, root, lease, childId, childStarted.Ticks);
            state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Check(state.MsiLease == lease && state.MsiProductCode == product, "verification_preserves_msi_binding");
            Check(!InstallationGate.BlocksStart(state, childStarted, childId), "exact_verifier_permitted");
            Check(InstallationGate.BlocksStart(state, childStarted.AddTicks(1), childId), "reused_verifier_blocked");
            Reject(() => InstallationLease.EndMsiOperation(fixture, root, lease, product), "installation_gate_msi_owner_missing");
            Check(!InstallationLease.CompleteMsi(fixture, root, lease, product), "verification_cannot_complete_msi");
            InstallationLease.EndVerification(fixture, root, lease);
            Reject(() => InstallationLease.EndMsiOperation(fixture, root, lease, foreign), "installation_gate_msi_owner_missing");

            // Changing only the start stamp is a different process identity.
            using (var key = fixture.OpenSubKey(InstallationGate.KeyFor(root), writable: true)!)
            {
                state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
                key.SetValue("Lease", new InstallationGate.GateState(lease, state.Phase, state.CompletedUtcTicks,
                    ownerId: self.Id, ownerStart: self.StartTime.ToUniversalTime().Ticks + 1,
                    msiLease: lease, msiProductCode: product).Encode());
                Reject(() => InstallationLease.EndMsiOperation(fixture, root, lease, product), "installation_gate_msi_operation_owner_missing");
                Reject(() => InstallationLease.BeginVerification(fixture, root, lease, childId, childStarted.Ticks), "installation_gate_msi_operation_owner_missing");
                Reject(() => InstallationGate.OpenVerificationOwner(fixture, root, lease), "installation_gate_update_owner_missing");
                key.SetValue("Lease", state.Encode());
            }
            InstallationLease.EndMsiOperation(fixture, root, lease, product);
            state = InstallationGate.Read(fixture, InstallationGate.KeyFor(root))!;
            Check(state.OwnerId == 0 && state.Active && state.MsiLease == lease && state.MsiProductCode == product, "return_keeps_msi_active");
            Reject(() => InstallationLease.EndMsiOperation(fixture, root, lease, product), "installation_gate_msi_operation_owner_missing");
            Check(InstallationLease.CompleteMsi(fixture, root, lease, product), "msi_can_complete_after_operation");

            var outer = Guid.NewGuid().ToString("N");
            InstallationLease.BeginPreparing(fixture, root, outer, childId, DateTime.UtcNow.AddSeconds(1).Ticks, self.Id, self.StartTime.ToUniversalTime().Ticks);
            InstallationLease.StopPrepared(fixture, root, outer);
            Reject(() => InstallationLease.BeginMsi(fixture, root, outer, product, outer), "installation_gate_msi_outer_identity_conflict");
            InstallationLease.BeginMsi(fixture, root, lease, product, outer);
            Reject(() => InstallationLease.BeginMsiOperation(fixture, root, lease, product), "installation_gate_msi_operation_already_owned");
            Reject(() => InstallationGate.OpenVerificationOwner(fixture, root, outer), "installation_gate_update_owner_missing");
            Reject(() => InstallationLease.BeginVerification(fixture, root, outer, childId, childStarted.Ticks), "installation_gate_verification_owner_missing");
            Reject(() => new InstallationGate.GateState(outer, InstallationGate.GateState.Verifying, 0,
                childId, childStarted.Ticks, self.Id, self.StartTime.ToUniversalTime().Ticks, lease, product), "installation_gate_msi_phase_invalid");
            Check(InstallationLease.CompleteMsi(fixture, root, lease, product), "outer_msi_child_still_completes");
            Check(InstallationLease.ReleaseOwned(fixture, root, outer), "fixture_outer_released");
        }
        finally { Registry.CurrentUser.DeleteSubKeyTree(fixturePath, throwOnMissingSubKey: false); }
        using var absent = Registry.CurrentUser.OpenSubKey(fixturePath);
        Check(absent is null, "fixture_removed");
        return checks;
        void Check(bool value, string name) { if (!value) throw new Exception("msi_operation_test_failed:" + name); checks++; }
        void Reject(Action action, string code)
        {
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { checks++; return; }
            throw new Exception("msi_operation_rejection_missing:" + code);
        }
    }
}
