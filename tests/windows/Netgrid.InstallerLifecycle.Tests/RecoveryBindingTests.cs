using System.Diagnostics;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class RecoveryBindingTests
{
    internal static int Run()
    {
        var checks = 0;
        var fixturePath = @"SOFTWARE\LevelX2\NETGRID.RecoveryBinding.Tests\" + Guid.NewGuid().ToString("N");
        const string programRoot = @"C:\NETGRID-recovery-binding-fixture\program";
        const string dataRoot = @"C:\NETGRID-recovery-binding-fixture\Daten ä";
        using var user = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64);
        using var owner = Process.GetCurrentProcess();
        try
        {
            using var fixture = user.CreateSubKey(fixturePath, writable: true)!;
            var lease = Guid.NewGuid().ToString("N");
            var id = Guid.NewGuid().ToString("N");
            var record = new UpdateRecoveryBinding(lease, dataRoot, id, new string('a', 64), new string('b', 64));
            Check(UpdateRecoveryBinding.Decode(record.Encode()).Encode() == record.Encode(), "canonical_unicode_roundtrip");
            foreach (var malformed in new[] { "", record.Encode() + "|extra", record.Encode().Replace("1|", "2|", StringComparison.Ordinal),
                "1|" + lease + "|not-base64|" + id + "|" + new string('a', 64) + "|" + new string('b', 64) })
                Reject(() => UpdateRecoveryBinding.Decode(malformed), "installation_gate_recovery_binding_invalid");
            Reject(() => new UpdateRecoveryBinding(lease, dataRoot, id, new string('A', 64), new string('b', 64)), "installation_gate_recovery_binding_invalid");
            Reject(() => new UpdateRecoveryBinding(lease, dataRoot, "../escape", new string('a', 64), new string('b', 64)), "installation_gate_recovery_binding_invalid");
            Reject(() => InstallationLease.BindRecovery(fixture, programRoot, record), "installation_gate_recovery_owner_missing");
            Begin(lease);
            Reject(() => InstallationLease.BindRecovery(fixture, programRoot, record), "installation_gate_recovery_owner_missing");
            InstallationLease.StopPrepared(fixture, programRoot, lease);
            Reject(() => InstallationLease.ReadRecovery(fixture, programRoot, lease), "installation_gate_recovery_binding_missing");
            var state = InstallationGate.Read(fixture, InstallationGate.KeyFor(programRoot))!.Encode();
            InstallationLease.BindRecovery(fixture, programRoot, record);
            InstallationLease.BindRecovery(fixture, programRoot, record);
            Check(InstallationLease.ReadRecovery(fixture, programRoot, lease).Encode() == record.Encode(), "binding_is_exact_and_idempotent");
            Check(InstallationGate.Read(fixture, InstallationGate.KeyFor(programRoot))!.Encode() == state, "binding_changed_lease_authority");
            var altered = new UpdateRecoveryBinding(lease, dataRoot, id, new string('c', 64), new string('b', 64));
            Reject(() => InstallationLease.BindRecovery(fixture, programRoot, altered), "installation_gate_recovery_already_bound");
            Reject(() => InstallationLease.ReadRecovery(fixture, programRoot, Guid.NewGuid().ToString("N")), "installation_gate_recovery_owner_missing");
            var msi = Guid.NewGuid().ToString("N");
            var product = Guid.NewGuid().ToString("B").ToUpperInvariant();
            InstallationLease.BeginMsi(fixture, programRoot, msi, product, lease);
            Reject(() => InstallationLease.BindRecovery(fixture, programRoot, record), "installation_gate_recovery_owner_missing");
            Check(InstallationLease.CompleteMsi(fixture, programRoot, msi, product), "msi_completes_without_losing_binding");
            Check(InstallationLease.ReadRecovery(fixture, programRoot, lease).Encode() == record.Encode(), "msi_replaced_recovery_binding");
            Check(InstallationLease.ReleaseOwned(fixture, programRoot, lease), "fixture_completion");
            Reject(() => InstallationLease.ReadRecovery(fixture, programRoot, lease), "installation_gate_recovery_owner_missing");
            var next = Guid.NewGuid().ToString("N");
            Begin(next);
            InstallationLease.StopPrepared(fixture, programRoot, next);
            Reject(() => InstallationLease.ReadRecovery(fixture, programRoot, next), "installation_gate_recovery_binding_mismatch");
            var nextBinding = new UpdateRecoveryBinding(next, dataRoot, Guid.NewGuid().ToString("N"), new string('c', 64), new string('d', 64));
            InstallationLease.BindRecovery(fixture, programRoot, nextBinding);
            Check(InstallationLease.ReadRecovery(fixture, programRoot, next).Encode() == nextBinding.Encode(), "new_owner_cannot_replace_completed_reference");
            using (var key = fixture.OpenSubKey(InstallationGate.KeyFor(programRoot), writable: true)!) key.SetValue("Recovery", 5, RegistryValueKind.DWord);
            Reject(() => InstallationLease.ReadRecovery(fixture, programRoot, next), "installation_gate_recovery_binding_missing");
            Reject(() => InstallationLease.BindRecovery(fixture, programRoot, nextBinding), "installation_gate_recovery_binding_invalid");
            Check(InstallationGate.Read(fixture, InstallationGate.KeyFor(programRoot))!.Active, "malformed_reference_released_lease");

            void Begin(string value) => InstallationLease.BeginPreparing(fixture, programRoot, value,
                int.MaxValue, DateTime.UtcNow.Ticks, owner.Id, owner.StartTime.ToUniversalTime().Ticks);
        }
        finally { user.DeleteSubKeyTree(fixturePath, throwOnMissingSubKey: false); }
        using (var absent = user.OpenSubKey(fixturePath)) Check(absent is null, "fixture_registry_cleanup");
        return checks;

        void Check(bool value, string name) { checks++; if (!value) throw new Exception("recovery_binding_test_failed:" + name); }
        void Reject(Action action, string code)
        {
            checks++;
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { return; }
            throw new Exception("recovery_binding_test_accepted:" + code);
        }
    }
}
